import "server-only";
import { collections, publicPosts } from "./cms";
import { notFound } from "next/navigation";
export async function archive(kind: "categories" | "tags", slug: string) {
  const t = await (await collections())[kind].findOne({ slug });
  if (!t) notFound();
  const filter = {
    [`published.${kind === "categories" ? "categoryIds" : "tagIds"}`]: String(
      t._id,
    ),
  };
  const { total } = await publicPosts(filter, 1, 1);
  return {
    t,
    filter,
    index: t.indexable && t.description.trim().length >= 80 && total > 0,
  };
}
