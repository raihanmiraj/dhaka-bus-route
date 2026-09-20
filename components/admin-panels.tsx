"use client";
import { useEffect, useState } from "react";
import { api } from "./admin-api";
import { Button, Alert, Badge } from "./ui";
type Term = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  locale: string;
  indexable: boolean;
};
export function TaxonomyPanel({
  kind,
  admin,
}: {
  kind: "categories" | "tags";
  admin: boolean;
}) {
  const [items, setItems] = useState<Term[]>([]),
    [current, setCurrent] = useState<Partial<Term>>({}),
    [error, setError] = useState("");
  const load = () =>
    api(kind)
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, [kind]);
  return (
    <>
      <h1>{kind === "categories" ? "Categories" : "Tags"}</h1>
      {error && <Alert>{error}</Alert>}
      <div className="stack">
        {items.map((t) => (
          <div className="card" key={t._id}>
            <h2>{t.name}</h2>
            <p>{t.description}</p>
            <Badge>
              {t.indexable ? "Editorially approved for indexing" : "Noindex"}
            </Badge>
            {admin && (
              <div className="row">
                <Button onClick={() => setCurrent(t)}>Edit</Button>
                <Button
                  className="secondary"
                  onClick={async () => {
                    try {
                      await api(`${kind}/${t._id}`, "DELETE", {});
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Delete unused term
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {admin && (
        <form
          className="card"
          key={current._id ?? "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api(
                `${kind}${current._id ? `/${current._id}` : ""}`,
                "POST",
                {
                  name: f.get("name"),
                  slug: f.get("slug"),
                  description: f.get("description"),
                  seoTitle: f.get("seoTitle"),
                  seoDescription: f.get("seoDescription"),
                  locale: f.get("locale"),
                  indexable: f.get("indexable") === "on",
                },
              );
              setCurrent({});
              setError("Saved.");
              await load();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <h2>{current._id ? "Edit term" : "Create term"}</h2>
          {["name", "slug", "description", "seoTitle", "seoDescription"].map(
            (k) => (
              <label key={k}>
                {k}
                <input
                  name={k}
                  defaultValue={String(current[k as keyof Term] ?? "")}
                  required={k === "name" || k === "slug"}
                />
              </label>
            ),
          )}
          <label>
            Language
            <select name="locale" defaultValue={current.locale ?? "en"}>
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              name="indexable"
              defaultChecked={current.indexable}
            />
            Approve indexing when useful introduction and published articles
            exist
          </label>
          <p>
            At least 80 characters of unique introductory content is required.
            Tags default to noindex.
          </p>
          <div className="row">
            <Button>Save term</Button>
            <Button
              type="button"
              className="secondary"
              onClick={() => setCurrent({})}
            >
              New term
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
export type Media = {
  _id: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  bytes: number;
};
export function MediaPanel({
  onSelect,
  admin = false,
}: {
  onSelect?: (m: Media) => void;
  admin?: boolean;
}) {
  const [items, setItems] = useState<Media[]>([]),
    [message, setMessage] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [query, setQuery] = useState("");
  const load = () =>
    api(`media?page=${page}&q=${encodeURIComponent(query)}`)
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    void load();
  }, [page, query]);
  return (
    <>
      <label>
        Search image alt text
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <label>
        Upload JPEG, PNG or WebP (up to 3 MB)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const data = new FormData();
            data.set("image", f);
            try {
              const r = await fetch("/api/upload", {
                method: "POST",
                body: data,
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setMessage("Image uploaded. Add alt text when placing it.");
              await load();
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        />
      </label>
      {message && <Alert>{message}</Alert>}
      <div className="grid">
        {items.map((m) => (
          <div className="card" key={m._id}>
            <img
              className="media-img"
              src={`/media/${m._id}`}
              width={m.width}
              height={m.height}
              alt={m.alt || "Library image preview"}
            />
            <p>
              {m.width} × {m.height} · {Math.ceil(m.bytes / 1024)} KB
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api(
                    `media/${m._id}`,
                    "PATCH",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                  setMessage(
                    "Image metadata saved. Existing article text is unchanged until edited and published.",
                  );
                  await load();
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              <label>
                Image alt text
                <input name="alt" defaultValue={m.alt} />
              </label>
              <label>
                Library caption
                <input name="caption" defaultValue={m.caption} />
              </label>
              <Button>Save image details</Button>
            </form>
            {onSelect && (
              <Button onClick={() => onSelect(m)}>Select image</Button>
            )}
            {admin && (
              <Button
                className="secondary"
                onClick={async () => {
                  try {
                    const r = await fetch(`/media/${m._id}`, {
                      method: "DELETE",
                    });
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error);
                    await load();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Delete unreferenced image
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="row">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous images
        </Button>
        <span>Page {page}</span>
        <Button
          disabled={page * 24 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next images
        </Button>
      </div>
    </>
  );
}
export function SettingsPanel() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<{
    name: string;
    slug: string;
    bio: string;
    locale: string;
  } | null>(null);
  useEffect(() => {
    api("settings")
      .then((d) => setProfile(d.profile))
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <form
      className="card"
      key={profile?.slug ?? "new"}
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api(
            "settings",
            "POST",
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          setMessage(
            "Author profile saved. Existing article bylines change only when republished.",
          );
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <h1>Author profile</h1>
      <p>
        Use your real name and supplied biography. The profile belongs to your
        authenticated account.
      </p>
      <label>
        Name
        <input name="name" required defaultValue={profile?.name} />
      </label>
      <label>
        Profile slug
        <input
          name="slug"
          pattern="[a-z0-9-]+"
          required
          defaultValue={profile?.slug}
        />
      </label>
      <label>
        Biography
        <textarea name="bio" defaultValue={profile?.bio} />
      </label>
      <label>
        Language
        <select name="locale" defaultValue={profile?.locale ?? "en"}>
          <option value="en">English</option>
          <option value="bn">বাংলা</option>
        </select>
      </label>
      <Button>Save profile</Button>
      {message && <Alert>{message}</Alert>}
    </form>
  );
}
export function Corrections() {
  const [items, setItems] = useState<
      {
        _id: string;
        routeId: number;
        message: string;
        source: string;
        status: string;
      }[]
    >([]),
    [message, setMessage] = useState("");
  const load = () =>
    api("corrections")
      .then(setItems)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <h2>Correction review queue</h2>
      {message && <Alert>{message}</Alert>}
      {items.map((i) => (
        <div className="card" key={i._id}>
          <Badge>{i.status}</Badge>
          <p>
            Route {i.routeId}: {i.message}
          </p>
          <p>Source: {i.source}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api(
                  `corrections/${i._id}`,
                  "PATCH",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                await load();
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            <label>
              Review note
              <textarea name="note" />
            </label>
            <label>
              Decision
              <select name="status">
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </label>
            <Button>Record review</Button>
          </form>
        </div>
      ))}
      {!items.length && <p>No submitted corrections.</p>}
      <p>Reviewing a report does not automatically alter public route data.</p>
    </>
  );
}
