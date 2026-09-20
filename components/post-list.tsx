"use client";
import { useEffect, useState } from "react";
import { api } from "./admin-api";
import { Alert, Badge, Button } from "./ui";
export function PostList() {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [category, setCategory] = useState(""),
    [page, setPage] = useState(1),
    [items, setItems] = useState<
      {
        _id: string;
        working: { title: string; slug: string };
        status: string;
      }[]
    >([]),
    [terms, setTerms] = useState<{ _id: string; name: string }[]>([]),
    [total, setTotal] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    api("categories")
      .then(setTerms)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        api(
          `posts?q=${encodeURIComponent(q)}&status=${status}&category=${category}&page=${page}`,
        )
          .then((d) => {
            setItems(d.items);
            setTotal(d.total);
          })
          .catch((e) => setError(e.message)),
      150,
    );
    return () => clearTimeout(timer);
  }, [q, status, category, page]);
  return (
    <>
      <div className="row">
        <h1>Posts</h1>
        <a className="button" href="/admin/posts/new">
          New article
        </a>
      </div>
      <div className="grid">
        <label>
          Search titles
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {["draft", "published", "archived"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>
                  <a href={`/admin/posts/${p._id}/edit`}>
                    {p.working.title || "Untitled draft"}
                  </a>
                </td>
                <td>
                  <Badge>{p.status}</Badge>
                </td>
                <td>
                  <Button
                    className="secondary"
                    onClick={async () => {
                      try {
                        const d = await api(
                          `posts/${p._id}/duplicate`,
                          "POST",
                          {},
                        );
                        location.href = `/admin/posts/${d._id}/edit`;
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Duplicate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && <p>No matching posts.</p>}
      <div className="row">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          disabled={page * 20 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}
