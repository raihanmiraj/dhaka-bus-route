import { NextResponse } from "next/server";
import { actor, mutationOrigin } from "@/lib/auth";
import { createApiKey, listApiKeys } from "@/lib/api-keys";
import { failure, json } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
};
export async function GET(req: Request) {
  try {
    return NextResponse.json(await listApiKeys(await actor(req.headers)), {
      headers,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const a = await actor(req.headers);
    mutationOrigin(req, a);
    return NextResponse.json(await createApiKey(a, await json(req)), {
      status: 201,
      headers,
    });
  } catch (e) {
    return failure(e);
  }
}
