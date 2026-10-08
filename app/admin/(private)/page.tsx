import Link from "next/link";
import {
  FiFileText,
  FiCheckCircle,
  FiEdit3,
  FiImage,
  FiArrowRight,
} from "react-icons/fi";
import { pageActor } from "@/lib/auth";
import { db } from "@/lib/db";
import { Corrections } from "@/components/admin-panels";
export default async function Page() {
  const a = await pageActor(),
    d = await db();
  const [total, published, drafts, media, recent] = await Promise.all([
    d.collection("posts").countDocuments(),
    d.collection("posts").countDocuments({ status: "published" }),
    d.collection("posts").countDocuments({ status: "draft" }),
    d.collection("media").countDocuments({ state: "ready" }),
    d
      .collection("posts")
      .find(
        {},
        { projection: { "working.title": 1, status: 1, modifiedAt: 1 } },
      )
      .sort({ modifiedAt: -1 })
      .limit(5)
      .toArray(),
  ]);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">YOUR EDITORIAL WORKSPACE</p>
          <h1>Editorial overview</h1>
          <p>Welcome back, {a.name}. Let’s make the next journey easier.</p>
        </div>
      </div>
      <div className="admin-stats">
        {[
          {
            label: "Total posts",
            value: total,
            icon: FiFileText,
            href: "/admin/posts",
          },
          {
            label: "Published",
            value: published,
            icon: FiCheckCircle,
            href: "/admin/posts?status=published",
          },
          {
            label: "Drafts",
            value: drafts,
            icon: FiEdit3,
            href: "/admin/posts?status=draft",
          },
          {
            label: "Library images",
            value: media,
            icon: FiImage,
            href: "/admin/media",
          },
        ].map((s) => (
          <Link className="admin-stat" href={s.href} key={s.label}>
            <span className="admin-stat-icon">
              <s.icon aria-hidden />
            </span>
            <span>
              {s.label}
              <strong>{s.value.toLocaleString()}</strong>
            </span>
          </Link>
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="card admin-recent">
          <div className="admin-section-heading">
            <h2>Recent posts</h2>
            <Link href="/admin/posts">
              View all <FiArrowRight aria-hidden />
            </Link>
          </div>
          {recent.length ? (
            recent.map((p) => (
              <Link
                className="admin-recent-row"
                key={String(p._id)}
                href={`/admin/posts/${p._id}/edit`}
              >
                <span>
                  <strong>{p.working?.title || "Untitled draft"}</strong>
                  <small>
                    Updated{" "}
                    {new Date(p.modifiedAt).toLocaleDateString("en-GB", {
                      timeZone: "Asia/Dhaka",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </span>
                <span className={`admin-status status-${p.status}`}>
                  {p.status}
                </span>
              </Link>
            ))
          ) : (
            <p>No posts yet. Write your first article to get started.</p>
          )}
        </section>
        <section className="card admin-write-card">
          <span className="admin-stat-icon">
            <FiEdit3 aria-hidden />
          </span>
          <h2>A useful story starts here.</h2>
          <p>
            Write a travel guide, add a featured image, and review it before
            publishing.
          </p>
          <Link className="button" href="/admin/posts/new">
            Write an article <FiArrowRight aria-hidden />
          </Link>
          {a.role === "admin" && (
            <Link className="admin-integration-link" href="/admin/api-keys">
              Connect your publishing tools →
            </Link>
          )}
        </section>
      </div>
      {a.role === "admin" && (
        <section className="admin-corrections">
          <Corrections />
        </section>
      )}
    </>
  );
}
