"use client";
import { useEffect, useState, type FormEvent } from "react";
import { FiHeart, FiMessageCircle, FiSend } from "react-icons/fi";
import { Button } from "./ui";

type Comment = { id: string; name: string; body: string; createdAt: string };
type State = { likes: number; liked: boolean; comments: Comment[] };

export function BlogEngagement({ slug }: { slug: string }) {
  const [data, setData] = useState<State>({
    likes: 0,
    liked: false,
    comments: [],
  });
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/blog/engagement?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  async function toggleLike() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/blog/engagement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "like", slug }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not update like.");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update like.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/blog/engagement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "comment", slug, name, body, website }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not post comment.");
      setData(d);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="engagement" aria-label="Likes and comments">
      <div className="engagement-bar">
        <button
          type="button"
          className={`like-btn${data.liked ? " is-liked" : ""}`}
          onClick={() => void toggleLike()}
          disabled={busy || !loaded}
          aria-pressed={data.liked}
        >
          <FiHeart aria-hidden size={18} />
          <span>
            {data.likes} {data.likes === 1 ? "like" : "likes"}
          </span>
        </button>
        <span className="engagement-meta">
          <FiMessageCircle aria-hidden size={18} />
          {data.comments.length}{" "}
          {data.comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <form className="card engagement-form" onSubmit={submitComment}>
        <h2>Join the conversation</h2>
        <p className="muted">
          Share a tip or ask a question about this guide. Keep it respectful and
          useful for fellow passengers.
        </p>
        <label htmlFor="comment-name">Display name</label>
        <input
          id="comment-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          autoComplete="nickname"
          placeholder="Your name"
        />
        <label htmlFor="comment-body">Comment</label>
        <textarea
          id="comment-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={1000}
          placeholder="What helped you on this journey?"
        />
        <input
          className="hp"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-hidden="true"
        />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <Button disabled={busy || !name.trim() || !body.trim()}>
          <FiSend aria-hidden style={{ marginRight: 8 }} />
          {busy ? "Posting…" : "Post comment"}
        </Button>
      </form>

      <div className="comment-list" aria-live="polite">
        {data.comments.map((c) => (
          <article className="comment-card" key={c.id}>
            <header>
              <strong>{c.name}</strong>
              <time dateTime={c.createdAt}>
                {new Date(c.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Asia/Dhaka",
                })}
              </time>
            </header>
            <p>{c.body}</p>
          </article>
        ))}
        {loaded && !data.comments.length && (
          <p className="muted">Be the first to comment on this article.</p>
        )}
      </div>
    </section>
  );
}
