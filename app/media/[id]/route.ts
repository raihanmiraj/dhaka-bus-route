import { NextResponse } from "next/server";
import { actor, sameOrigin, HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { oid, liveMedia } from "@/lib/cms";
import { storage, deleteMedia } from "@/lib/storage";
import { failure } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const m = await (
      await db()
    )
      .collection("media")
      .findOne({ _id: oid(id), state: "ready" });
    if (!m) throw new HttpError(404, "Image not found");
    const publicImage = await liveMedia(id);
    if (!publicImage) await actor(req.headers);
    const bytes = await storage.read(m.fileId);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'inline; filename="image.webp"',
        "X-Robots-Tag": publicImage ? "index" : "noindex",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const a = await actor(req.headers);
    sameOrigin(req);
    await deleteMedia(a, (await params).id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
