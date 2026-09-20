import { publicPosts } from "@/lib/cms";
import { PostCard } from "./ui";
export async function RecentPosts() {
  try {
    const { items } = await publicPosts({}, 1, 3);
    return (
      <section>
        <h2>Latest articles</h2>
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
      <section>
        <h2>Latest articles</h2>
        <p>
          Articles are temporarily unavailable. Route search is still available.
        </p>
      </section>
    );
  }
}
