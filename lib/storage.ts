import "server-only";
import { GridFSBucket, ObjectId } from "mongodb";
import sharp from "sharp";
import { Readable } from "node:stream";
import { db, client } from "./db";
import { HttpError, type Actor, administrator } from "./auth";
import { oid, collections } from "./cms";
export interface ImageStorage {
  put(bytes: Buffer, name: string): Promise<ObjectId>;
  read(id: ObjectId): Promise<Buffer>;
  remove(id: ObjectId): Promise<void>;
}
export const storage: ImageStorage = {
  async put(bytes, name) {
    const bucket = new GridFSBucket(await db());
    const stream = bucket.openUploadStream(name, {
      metadata: { contentType: "image/webp" },
    });
    await new Promise<void>((resolve, reject) => {
      Readable.from(bytes)
        .pipe(stream)
        .on("finish", resolve)
        .on("error", reject);
    });
    return stream.id;
  },
  async read(id) {
    const stream = new GridFSBucket(await db()).openDownloadStream(id);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  },
  async remove(id) {
    await new GridFSBucket(await db()).delete(id);
  },
};
export async function upload(a: Actor, file: File) {
  if (file.size > 3 * 1024 * 1024 || file.size < 12)
    throw new HttpError(413, "Use an image between 12 bytes and 3 MB.");
  const raw = Buffer.from(await file.arrayBuffer());
  const jpeg = raw[0] === 255 && raw[1] === 216 && raw[2] === 255,
    png = raw
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    webp =
      raw.toString("ascii", 0, 4) === "RIFF" &&
      raw.toString("ascii", 8, 12) === "WEBP";
  if (!jpeg && !png && !webp)
    throw new HttpError(415, "Only JPEG, PNG and WebP are accepted.");
  let result;
  try {
    result = await sharp(raw, { limitInputPixels: 24000000, animated: false })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new HttpError(400, "Image could not be safely decoded.");
  }
  const fileId = await storage.put(result.data, "image.webp");
  const doc = {
    _id: new ObjectId(),
    fileId,
    state: "ready",
    width: result.info.width,
    height: result.info.height,
    mime: "image/webp",
    bytes: result.data.length,
    alt: "",
    caption: "",
    uploader: a.id,
    createdAt: new Date(),
  };
  try {
    await (await db()).collection("media").insertOne(doc);
  } catch (e) {
    await storage.remove(fileId);
    throw e;
  }
  return { ...doc, url: `/media/${doc._id}` };
}
export async function deleteMedia(a: Actor, id: string) {
  administrator(a);
  const session = (await client()).startSession();
  let fileId: ObjectId | undefined;
  try {
    await session.withTransaction(async () => {
      const d = await db();
      const media = await d
        .collection("media")
        .findOneAndUpdate(
          { _id: oid(id), state: "ready" },
          { $set: { state: "deleting" } },
          { session },
        );
      if (!media) throw new HttpError(404, "Image not found");
      const c = await collections();
      const refs = ["working", "published"].flatMap((prefix) => [
        { [`${prefix}.featuredImage.mediaId`]: id },
        { [`${prefix}.socialImageId`]: id },
        { [`${prefix}.content.blocks.data.file.mediaId`]: id },
      ]);
      if (
        (await c.posts.findOne({ $or: refs }, { session })) ||
        (await d.collection("revisions").findOne(
          {
            $or: [
              { "content.featuredImage.mediaId": id },
              { "content.socialImageId": id },
              { "content.content.blocks.data.file.mediaId": id },
              { "published.featuredImage.mediaId": id },
              { "published.socialImageId": id },
              { "published.content.blocks.data.file.mediaId": id },
            ],
          },
          { session },
        ))
      )
        throw new HttpError(
          409,
          "Image is referenced by a post or retained revision.",
        );
      fileId = media.fileId as ObjectId;
    });
    if (fileId) {
      await storage.remove(fileId);
      await (await db()).collection("media").deleteOne({ _id: oid(id) });
    }
  } finally {
    await session.endSession();
  }
}
