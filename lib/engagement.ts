import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { authSecret } from "./config";

export const commentSchema = z.object({
  slug: z.string().min(1).max(160),
  name: z.string().trim().min(2).max(60),
  body: z.string().trim().min(4).max(1000),
  website: z.string().max(0).optional().default(""),
});

export async function engagementCollections() {
  const d = await db();
  return {
    likes: d.collection<{
      _id: string;
      slug: string;
      count: number;
      voters: string[];
    }>("post_likes"),
    comments: d.collection<{
      _id?: unknown;
      slug: string;
      name: string;
      body: string;
      createdAt: Date;
      status: "public";
    }>("post_comments"),
  };
}

export function voterKey(req: Request, slug: string) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "ua";
  return createHmac("sha256", authSecret())
    .update(`like:${slug}:${ip}:${ua.slice(0, 80)}`)
    .digest("hex");
}

export async function getEngagement(slug: string, voter?: string) {
  const { likes, comments } = await engagementCollections();
  const likeDoc = await likes.findOne({ _id: slug });
  const commentItems = await comments
    .find({ slug, status: "public" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return {
    likes: likeDoc?.count ?? 0,
    liked: voter ? (likeDoc?.voters.includes(voter) ?? false) : false,
    comments: commentItems.map((c) => ({
      id: String(c._id),
      name: c.name,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
