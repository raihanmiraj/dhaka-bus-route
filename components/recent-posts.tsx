import Link from "next/link";
import { publicPosts } from "@/lib/cms";
import { PostCard } from "./ui";
export async function RecentPosts() {
  try {
    const { items } = await publicPosts({}, 1, 3);
    return (
      <section style={{ marginTop: 36 }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">From the blog</p>
            <h2>Latest articles</h2>
          </div>
          <Link href="/blog">All guides →</Link>
        </div>
        {items.length ? (
          <div className="grid">
            {items.map((p) => (
              <PostCard key={String(p._id)} post={p.published!} />
            ))}
          </div>
        ) : (
          <p>No articles have been published yet.</p>
        )}
      </section>
    );
  } catch {
    return (
      <section style={{ marginTop: 36 }}>
        <h2>Latest articles</h2>
        <p>
          Articles are temporarily unavailable. Route search is still available.
        </p>
      </section>
    );
  }
}
