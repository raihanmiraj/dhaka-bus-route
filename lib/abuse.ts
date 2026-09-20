import "server-only";
import { createHmac } from "node:crypto";
import { db } from "./db";
import { authSecret } from "./config";
import { HttpError } from "./auth";
export async function throttle(req: Request, scope: string, max = 5) {
  const bucket = Math.floor(Date.now() / 3600000); // Proxy must overwrite x-forwarded-for; see deployment notes.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const key = createHmac("sha256", authSecret())
    .update(`${scope}:${ip}:${bucket}`)
    .digest("hex");
  const c = (await db()).collection("abuse");
  await c.updateOne(
    { _id: key as never },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 2) * 3600000) },
    },
    { upsert: true },
  );
  const r = await c.findOne({ _id: key as never });
  if ((r?.count ?? 0) > max)
    throw new HttpError(429, "Too many submissions. Try again later.");
}
