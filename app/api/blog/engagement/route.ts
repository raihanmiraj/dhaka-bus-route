import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin, HttpError } from "@/lib/auth";
import { json, failure } from "@/lib/http";
import { throttle } from "@/lib/abuse";
import {
  commentSchema,
  engagementCollections,
  getEngagement,
  voterKey,
} from "@/lib/engagement";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("slug")?.trim();
    if (!slug) throw new HttpError(400, "Missing article slug.");
    const voter = voterKey(req, slug);
    return NextResponse.json(await getEngagement(slug, voter));
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const body = await json(req);
    const action = z.enum(["like", "comment"]).parse(body.action);

    if (action === "like") {
      await throttle(req, "blog-like", 30);
      const slug = z.string().min(1).max(160).parse(body.slug);
      const voter = voterKey(req, slug);
      const { likes } = await engagementCollections();
      const existing = await likes.findOne({ _id: slug });
      const already = existing?.voters.includes(voter);
      if (already) {
        await likes.updateOne(
          { _id: slug, count: { $gt: 0 } },
          { $inc: { count: -1 }, $pull: { voters: voter } },
        );
      } else {
        await likes.updateOne(
          { _id: slug },
          {
            $inc: { count: 1 },
            $addToSet: { voters: voter },
            $setOnInsert: { slug },
          },
          { upsert: true },
        );
      }
      const next = await getEngagement(slug, voter);
      return NextResponse.json(next);
    }

    await throttle(req, "blog-comment", 8);
    const value = commentSchema.parse(body);
    if (value.website) throw new HttpError(400, "Rejected.");
    const { comments } = await engagementCollections();
    await comments.insertOne({
      slug: value.slug,
      name: value.name,
      body: value.body,
      createdAt: new Date(),
      status: "public",
    });
    const voter = voterKey(req, value.slug);
    return NextResponse.json(await getEngagement(value.slug, voter), {
      status: 201,
    });
  } catch (e) {
    return failure(e);
  }
}
