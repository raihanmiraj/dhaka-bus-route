"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Alert, RouteCard } from "./ui";
type Stop = { id: string; name: string };
type Result = {
  bus: { slug: string; bus: string; routeStops: string[] };
  segment: string[];
};
export function track(
  event: string,
  properties: Record<string, string | number> = {},
) {
  sendGAEvent("event", event, properties);
}
export function Combobox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [items, setItems] = useState<Stop[]>([]),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  useEffect(() => {
    const c = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?kind=stops&q=${encodeURIComponent(value)}`, {
        signal: c.signal,
      })
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []))
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [value]);
  const select = (s: Stop) => {
    onChange(s.name);
    setOpen(false);
    setActive(-1);
  };
  return (
    <div className="combobox">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          open && active >= 0 ? `${id}-${active}` : undefined
        }
        autoComplete="off"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 160)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, items.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          }
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && open && active >= 0 && items[active]) {
            e.preventDefault();
            select(items[active]);
          }
        }}
      />
      {open && (
        <div role="listbox" id={`${id}-list`} className="suggestions">
          {items.map((s, i) => (
            <div
              id={`${id}-${i}`}
              role="option"
              aria-selected={active === i}
              key={s.id}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => select(s)}
            >
              {s.name}
            </div>
          ))}
          {!items.length && <p>No matching stop. Try another spelling.</p>}
        </div>
      )}
    </div>
  );
}
export default function Search() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [items, setItems] = useState<Result[]>([]),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const request = useRef(0);
  const reset = () => {
    request.current++;
    setItems([]);
    setTotal(0);
    setMessage("");
    setLoading(false);
    setPage(1);
  };
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setFrom(p.get("from") ?? "");
    setTo(p.get("to") ?? "");
  }, []);
  async function search(n = 1) {
    const seq = ++request.current;
    setLoading(true);
    setMessage("");
    try {
      const r = await fetch(
        `/api/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page=${n}`,
      );
      const d = await r.json();
      if (seq !== request.current) return;
      if (!r.ok) throw new Error(d.error);
      setItems(n === 1 ? d.items : [...items, ...d.items]);
      setTotal(d.total);
      setPage(n);
      setMessage(
        d.total
          ? `${d.total} matches, ordered by fewest listed stops. Travel times are unknown.`
          : "No matching direct route was found in the current data. This does not mean no bus exists.",
      );
      history.replaceState(null, "", `/?from=${d.from}&to=${d.to}`);
      track(d.total ? "route_search_success" : "route_search_zero", {
        from: d.from,
        to: d.to,
        count: d.total,
      });
    } catch (e) {
      if (seq === request.current)
        setMessage(
          e instanceof Error ? e.message : "Search unavailable. Try again.",
        );
    } finally {
      if (seq === request.current) setLoading(false);
    }
  }
  return (
    <div className="stack">
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <div className="search-grid">
          <Combobox
            label="Boarding stop"
            value={from}
            onChange={(v) => {
              reset();
              setFrom(v);
            }}
          />
          <Button
            type="button"
            className="secondary"
            onClick={() => {
              reset();
              setFrom(to);
              setTo(from);
            }}
            aria-label="Swap stops"
          >
            ⇄ Swap
          </Button>
          <Combobox
            label="Destination stop"
            value={to}
            onChange={(v) => {
              reset();
              setTo(v);
            }}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <Button disabled={loading || !from || !to}>
            {loading ? "Searching…" : "Find buses →"}
          </Button>
          <Button
            type="button"
            className="secondary"
            onClick={() => {
              reset();
              setFrom("");
              setTo("");
              history.replaceState(null, "", "/");
            }}
          >
            Clear
          </Button>
        </div>
        <p className="muted">
          English or বাংলা · Choose a specific stop, such as Mirpur 10.
        </p>
      </form>
      {message && <Alert>{message}</Alert>}
      <div className="stack" aria-live="polite" aria-busy={loading}>
        {items.map((x) => (
          <RouteCard key={x.bus.slug} bus={x.bus} segment={x.segment} />
        ))}
      </div>
      {items.length < total && (
        <Button disabled={loading} onClick={() => search(page + 1)}>
          Load more routes
        </Button>
      )}
    </div>
  );
}
