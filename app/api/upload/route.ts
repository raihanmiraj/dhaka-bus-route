import { throttle } from "@/lib/abuse";
import { NextResponse } from "next/server";
import { actor, mutationOrigin, HttpError } from "@/lib/auth";
import { failure, boundedBody } from "@/lib/http";
import { upload } from "@/lib/storage";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const a = await actor(req.headers);
    mutationOrigin(req, a);
    await throttle(req, "upload", 30);
    if (Number(req.headers.get("content-length") ?? 0) > 3300000)
      throw new HttpError(413, "Upload limit is 3 MB");
    const bytes = await boundedBody(req, 3300000);
    const form = await new Response(bytes, {
      headers: { "Content-Type": req.headers.get("content-type") ?? "" },
    }).formData();
    const f = form.get("image");
    if (!(f instanceof File)) throw new HttpError(400, "Choose an image");
    const m = await upload(a, f);
    return NextResponse.json(
      {
        success: 1,
        file: {
          url: m.url,
          mediaId: m._id.toHexString(),
          width: m.width,
          height: m.height,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
