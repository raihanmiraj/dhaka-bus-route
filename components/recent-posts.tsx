import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { publicPosts } from "@/lib/cms";
import { PostCard } from "./ui";
export async function RecentPosts() {
  let items: Awaited<ReturnType<typeof publicPosts>>["items"] | null = null;
  try {
    items = (await publicPosts({}, 1, 3)).items;
  } catch {}
  return (
    <section className="home-section" aria-labelledby="posts-title">
      <div className="section-intro section-intro-row">
        <div>
          <p className="eyebrow">From the blog</p>
          <h2 id="posts-title">Latest travel guides</h2>
        </div>
        <Link className="section-link" href="/blog">
          All guides <FiArrowRight aria-hidden />
        </Link>
      </div>
      {items === null ? (
        <p>
          Articles are temporarily unavailable. Route search is still available.
        </p>
      ) : items.length ? (
        <div className="post-grid">
          {items.map((p) => (
            <PostCard key={String(p._id)} post={p.published!} />
          ))}
        </div>
      ) : (
        <p>No articles have been published yet.</p>
      )}
    </section>
  );
}
