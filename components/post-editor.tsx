"use client";
import dynamic from "next/dynamic";
import { Dialog } from "./interactive-ui";
import { useEffect, useRef, useState } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import { blankDraft, publicationIssues, type Draft } from "@/lib/content";
import { api } from "./admin-api";
import { Button, Alert } from "./ui";
import { MediaPanel, type Media } from "./admin-panels";
const Canvas = dynamic(() => import("./editor-canvas"), {
  ssr: false,
  loading: () => <p>Loading writing tools…</p>,
});
type Term = { _id: string; name: string };
type Post = { _id: string; working: Draft; version: number; status: string };
export function PostEditor({
  initial,
  role,
}: {
  initial?: Post;
  role: string;
}) {
  const [post, setPost] = useState<Post | undefined>(initial),
    [draft, setDraft] = useState<Draft>(
      initial?.working ?? blankDraft("untitled"),
    ),
    [dirty, setDirty] = useState(!initial),
    [state, setState] = useState(initial ? "Saved" : "New article"),
    [error, setError] = useState(""),
    [categories, setCategories] = useState<Term[]>([]),
    [tags, setTags] = useState<Term[]>([]),
    [query, setQuery] = useState(""),
    [revisions, setRevisions] = useState<
      { _id: string; version: number; action: string }[]
    >([]),
    [generation, setGeneration] = useState(0),
    [busy, setBusy] = useState(false),
    [links, setLinks] = useState<{ label: string; href: string }[]>([]),
    [linkQuery, setLinkQuery] = useState("");
  const editor = useRef<EditorJS | null>(null),
    saving = useRef(false),
    dirtyRef = useRef(dirty),
    revision = useRef(0),
    current = useRef(draft),
    postRef = useRef(post),
    dialog = useRef<HTMLDialogElement>(null);
  dirtyRef.current = dirty;
  current.current = draft;
  postRef.current = post;
  useEffect(() => {
    api("categories")
      .then(setCategories)
      .catch((e) => setError(e.message));
    api("tags")
      .then(setTags)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (
        dirtyRef.current &&
        a &&
        a.target !== "_blank" &&
        !a.hash &&
        !confirm("Leave with unsaved changes?")
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", f);
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("beforeunload", f);
      document.removeEventListener("click", click);
    };
  }, []);
  function change(update: Partial<Draft>) {
    revision.current++;
    setDraft((d) => ({ ...d, ...update }));
    setDirty(true);
    setState("Unsaved changes");
  }
  async function save() {
    if (saving.current || !editor.current) return null;
    saving.current = true;
    setBusy(true);
    setState("Saving…");
    const rev = revision.current;
    try {
      const content = await editor.current.save();
      const working = { ...current.current, content };
      let p = postRef.current;
      if (!p) {
        p = await api("posts", "POST", {});
        setPost(p);
        postRef.current = p;
      }
      const updated = await api(`posts/${p!._id}/save`, "POST", {
        version: p!.version,
        working,
      });
      setPost(updated);
      postRef.current = updated;
      if (rev === revision.current) {
        setDraft(updated.working);
        setDirty(false);
        setState("Saved");
      } else setState("Unsaved changes");
      setError("");
      return updated as Post;
    } catch (e) {
      setState("Not saved");
      setError((e as Error).message);
      return null;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!dirty || error) return;
    const t = setTimeout(() => {
      void save();
    }, 1600);
    return () => clearTimeout(t);
  }, [draft, dirty, error]);
  async function action(name: string) {
    const p = dirty ? await save() : post;
    if (!p) return;
    setBusy(true);
    try {
      const updated = await api(`posts/${p._id}/${name}`, "POST", {
        version: p.version,
      });
      setPost(updated);
      setState(name === "publish" ? "Published" : "Saved");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const selectMedia = (m: Media) => {
    change({
      featuredImage: { mediaId: m._id, alt: m.alt, caption: m.caption },
    });
    dialog.current?.close();
  };
  const issues = publicationIssues(draft);
  return (
    <div className="stack">
      <div className="row">
        <h1>{initial ? "Edit article" : "New article"}</h1>
        <span role="status">{state}</span>
      </div>
      {error && (
        <Alert>
          {error}{" "}
          <Button
            className="secondary"
            onClick={() => {
              setError("");
              void save();
            }}
          >
            Retry save
          </Button>{" "}
          <Button
            className="secondary"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify(current.current, null, 2)],
                { type: "application/json" },
              );
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "unsaved-article.json";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download local draft
          </Button>
          <p>
            For an editing conflict, download your local draft before reloading.
          </p>
        </Alert>
      )}
      <div className="row">
        <Button disabled={busy} onClick={() => save()}>
          Save draft
        </Button>
        {post && (
          <a
            className="button secondary"
            target="_blank"
            href={`/admin/preview/${post._id}`}
          >
            Preview saved draft
          </a>
        )}
        {role === "admin" && (
          <>
            <Button
              disabled={busy || issues.length > 0}
              onClick={() => action("publish")}
            >
              {post?.status === "published" ? "Publish update" : "Publish"}
            </Button>
            {post?.status === "published" && (
              <Button
                className="secondary"
                disabled={busy}
                onClick={() => action("unpublish")}
              >
                Unpublish
              </Button>
            )}
            <Button
              className="secondary"
              disabled={busy || !post}
              onClick={() => action("archive")}
            >
              Archive
            </Button>
          </>
        )}
      </div>
      <label>
        Article title
        <input
          value={draft.title}
          onChange={(e) => change({ title: e.target.value })}
        />
      </label>
      <label>
        Excerpt
        <textarea
          value={draft.excerpt}
          onChange={(e) => change({ excerpt: e.target.value })}
        />
      </label>
      <Canvas
        key={generation}
        initial={draft.content as OutputData}
        onReady={(e) => {
          editor.current = e;
        }}
        onChange={() => {
          revision.current++;
          setDirty(true);
          setState("Unsaved changes");
          void editor.current
            ?.save()
            .then((content) =>
              setDraft((d) => ({ ...d, content: content as Draft["content"] })),
            );
        }}
      />
      <details open>
        <summary>Categories & tags</summary>
        <label>
          Filter terms
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {(["categoryIds", "tagIds"] as const).map((field) => (
          <fieldset key={field}>
            <legend>{field === "categoryIds" ? "Categories" : "Tags"}</legend>
            <div className="taxonomy-options">
              {(field === "categoryIds" ? categories : tags)
                .filter((t) =>
                  t.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((t) => (
                  <label key={t._id}>
                    <input
                      type="checkbox"
                      checked={draft[field].includes(t._id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...draft[field], t._id]
                          : draft[field].filter((id) => id !== t._id);
                        change({
                          [field]: ids,
                          ...(field === "categoryIds" &&
                          !ids.includes(draft.primaryCategoryId ?? "")
                            ? { primaryCategoryId: null }
                            : {}),
                        });
                      }}
                    />
                    {t.name}
                  </label>
                ))}
            </div>
          </fieldset>
        ))}
        <label>
          Primary category
          <select
            value={draft.primaryCategoryId ?? ""}
            onChange={(e) =>
              change({ primaryCategoryId: e.target.value || null })
            }
          >
            <option value="">Choose a primary category</option>
            {categories
              .filter((t) => draft.categoryIds.includes(t._id))
              .map((t) => (
                <option value={t._id} key={t._id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        {role === "admin" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form),
                kind = String(f.get("kind"));
              try {
                await api(kind, "POST", {
                  name: f.get("name"),
                  slug: f.get("slug"),
                  description: "",
                  seoTitle: "",
                  seoDescription: "",
                  locale: draft.locale,
                  indexable: false,
                });
                setCategories(await api("categories"));
                setTags(await api("tags"));
                form.reset();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <div className="grid">
              <label>
                New term name
                <input name="name" required />
              </label>
              <label>
                Slug
                <input name="slug" required />
              </label>
              <label>
                Type
                <select name="kind">
                  <option value="categories">Category</option>
                  <option value="tags">Tag</option>
                </select>
              </label>
            </div>
            <Button>Add term</Button>
          </form>
        )}
      </details>
      <details>
        <summary>Images</summary>
        <Button
          className="secondary"
          onClick={() => dialog.current?.showModal()}
        >
          Choose featured image
        </Button>
        {draft.featuredImage && (
          <>
            <img
              className="media-img"
              src={`/media/${draft.featuredImage.mediaId}`}
              alt={draft.featuredImage.alt}
            />
            <label>
              Featured image alt text
              <input
                value={draft.featuredImage.alt}
                onChange={(e) =>
                  change({
                    featuredImage: {
                      ...draft.featuredImage!,
                      alt: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Caption
              <input
                value={draft.featuredImage.caption}
                onChange={(e) =>
                  change({
                    featuredImage: {
                      ...draft.featuredImage!,
                      caption: e.target.value,
                    },
                  })
                }
              />
            </label>
            <Button
              className="secondary"
              onClick={() =>
                change({ socialImageId: draft.featuredImage!.mediaId })
              }
            >
              Use as social image
            </Button>
            <Button
              className="secondary"
              onClick={() => change({ featuredImage: null })}
            >
              Remove featured image
            </Button>
          </>
        )}
        <p>
          Social image:{" "}
          {draft.socialImageId ? "Selected" : "Uses featured image"}
        </p>
      </details>
      <Dialog ref={dialog} title="Choose featured image">
        <Button className="secondary" onClick={() => dialog.current?.close()}>
          Close media library
        </Button>
        <MediaPanel onSelect={selectMedia} />
      </Dialog>
      <details>
        <summary>SEO & language</summary>
        <label>
          Slug
          <input
            value={draft.slug}
            onChange={(e) => change({ slug: e.target.value })}
          />
        </label>
        <p>
          Changing a published slug creates a permanent redirect on publication.
        </p>
        <label>
          SEO title
          <input
            value={draft.seoTitle}
            onChange={(e) => change({ seoTitle: e.target.value })}
          />
        </label>
        <label>
          Meta description
          <textarea
            value={draft.seoDescription}
            onChange={(e) => change({ seoDescription: e.target.value })}
          />
        </label>
        <p>
          Keep titles and descriptions clear and useful. Length is editorial
          guidance, not a ranking score.
        </p>
        <label>
          Article language
          <select
            value={draft.locale}
            onChange={(e) => change({ locale: e.target.value as "en" | "bn" })}
          >
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
          </select>
        </label>
        <label>
          Translation group (only for real translations)
          <input
            value={draft.translationGroup ?? ""}
            onChange={(e) =>
              change({ translationGroup: e.target.value || null })
            }
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.indexable}
            onChange={(e) => change({ indexable: e.target.checked })}
          />
          Allow indexing when published
        </label>
      </details>
      <details>
        <summary>Sources & contextual links</summary>
        {draft.sources.map((s, i) => (
          <div className="grid" key={i}>
            <label>
              Source label
              <input
                value={s.label}
                onChange={(e) =>
                  change({
                    sources: draft.sources.map((v, j) =>
                      j === i ? { ...v, label: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              Source URL
              <input
                value={s.url}
                onChange={(e) =>
                  change({
                    sources: draft.sources.map((v, j) =>
                      j === i ? { ...v, url: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <Button
              className="secondary"
              onClick={() =>
                change({ sources: draft.sources.filter((_, j) => j !== i) })
              }
            >
              Remove source
            </Button>
          </div>
        ))}
        <Button
          className="secondary"
          onClick={() =>
            change({ sources: [...draft.sources, { label: "", url: "" }] })
          }
        >
          Add source
        </Button>
        <label>
          Find a route, bus or stop
          <input
            value={linkQuery}
            onChange={(e) => {
              setLinkQuery(e.target.value);
              api(`links?q=${encodeURIComponent(e.target.value)}`)
                .then(setLinks)
                .catch((e) => setError(e.message));
            }}
          />
        </label>
        {links.map((l) => (
          <Button
            key={l.href}
            className="secondary"
            onClick={() =>
              change({
                routeLinks: [...new Set([...draft.routeLinks, l.href])],
              })
            }
          >
            {l.label}
          </Button>
        ))}
        <ul>
          {draft.routeLinks.map((h) => (
            <li key={h}>
              {h}{" "}
              <Button
                className="secondary"
                onClick={() =>
                  change({
                    routeLinks: draft.routeLinks.filter((x) => x !== h),
                  })
                }
              >
                Remove link
              </Button>
            </li>
          ))}
        </ul>
      </details>
      <section className="card">
        <h2>Before publication</h2>
        {issues.length ? (
          <ul>
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        ) : (
          <p>
            Required fields are filled. Publishing also validates references,
            content blocks, author and slug uniqueness on the server.
          </p>
        )}
        <p>
          Review factual claims and source reliability. Saving is not route
          verification.
        </p>
      </section>
      {post && (
        <details>
          <summary
            onClick={() =>
              api(`posts/${post._id}/revisions`)
                .then(setRevisions)
                .catch((e) => setError(e.message))
            }
          >
            Revision history
          </summary>
          {revisions.map((r) => (
            <div className="row" key={r._id}>
              <span>
                Version {r.version} · {r.action}
              </span>
              <Button
                className="secondary"
                disabled={busy || dirty}
                onClick={async () => {
                  try {
                    const p = await api(`posts/${post._id}/restore`, "POST", {
                      version: post.version,
                      revisionId: r._id,
                    });
                    setPost(p);
                    setDraft(p.working);
                    editor.current = null;
                    setGeneration((g) => g + 1);
                    setState("Restored as working draft");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Restore to draft
              </Button>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
