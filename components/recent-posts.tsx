import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";
import { publicPosts } from "@/lib/cms";

function readingMinutes(excerpt: string) {
  const words = excerpt.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 40) + 2);
}

export async function RecentPosts() {
  let items: Awaited<ReturnType<typeof publicPosts>>["items"] | null = null;
  try {
    items = (await publicPosts({}, 1, 4)).items;
  } catch {}
  return (
    <section className="home-section blog-strip" aria-labelledby="posts-title">
      <div className="section-intro section-intro-row">
        <div>
          <p className="eyebrow">Guides</p>
          <h2 id="posts-title">Easy reading for Dhaka trips</h2>
          <p className="section-lead">
            Short practical articles — fares, corridors and how to plan common
            journeys.
          </p>
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
        <div className="blog-read-grid">
          {items.map((p) => {
            const post = p.published!;
            return (
              <article key={String(p._id)} className="blog-read-card" lang={post.locale}>
                <span className="post-kicker">Guide</span>
                <h3>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p>{post.excerpt}</p>
                <div className="blog-read-meta">
                  <span>
                    <FiClock aria-hidden size={14} /> ~
                    {readingMinutes(post.excerpt)} min read
                  </span>
                  <Link className="read-more" href={`/blog/${post.slug}`}>
                    Read <FiArrowRight aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p>No articles have been published yet.</p>
      )}
    </section>
  );
}
