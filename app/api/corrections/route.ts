import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin, HttpError } from "@/lib/auth";
import { json, failure } from "@/lib/http";
import { db } from "@/lib/db";
import { throttle } from "@/lib/abuse";
import { buses } from "@/lib/routes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await throttle(req, "correction");
    const value = z
      .object({
        routeId: z.coerce.number().int(),
        message: z.string().min(20).max(3000),
        source: z.string().max(500),
        website: z.string().max(0),
      })
      .parse(await json(req));
    if (!buses.some((b) => b.id === value.routeId))
      throw new HttpError(400, "Choose a listed route");
    await (
      await db()
    )
      .collection("corrections")
      .insertOne({ ...value, status: "pending", createdAt: new Date() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
