import { NextResponse } from "next/server";
import { actor, mutationOrigin } from "@/lib/auth";
import { revokeApiKey } from "@/lib/api-keys";
import { failure } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const a = await actor(req.headers);
    mutationOrigin(req, a);
    return NextResponse.json(await revokeApiKey(a, (await params).id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
