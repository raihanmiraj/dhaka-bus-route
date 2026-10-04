"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { FiArrowRight, FiRepeat, FiSearch, FiX } from "react-icons/fi";
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
  placeholder,
  marker,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  marker?: "start" | "end";
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
      <div className={`field${marker ? ` field-${marker}` : ""}`}>
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
          placeholder={placeholder}
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
      </div>
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
export default function Search({
  intro,
  aside,
  popular = [],
}: {
  intro?: ReactNode;
  aside?: ReactNode;
  popular?: string[];
}) {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [items, setItems] = useState<Result[]>([]),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const request = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const reset = () => {
    request.current++;
    setItems([]);
    setTotal(0);
    setMessage("");
    setLoading(false);
    setPage(1);
  };
  async function search(n = 1, f = from, t = to) {
    const seq = ++request.current;
    setLoading(true);
    setMessage("");
    try {
      const r = await fetch(
        `/api/search?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}&page=${n}`,
      );
      const d = await r.json();
      if (seq !== request.current) return;
      if (!r.ok) throw new Error(d.error);
      setItems((prev) => (n === 1 ? d.items : [...prev, ...d.items]));
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
      if (n === 1)
        requestAnimationFrame(() =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        );
    } catch (e) {
      if (seq === request.current)
        setMessage(
          e instanceof Error ? e.message : "Search unavailable. Try again.",
        );
    } finally {
      if (seq === request.current) setLoading(false);
    }
  }
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const f = p.get("from") ?? "",
      t = p.get("to") ?? "";
    setFrom(f);
    setTo(t);
    if (f && t) void search(1, f, t);
    else if (location.hash === "#search")
      formRef.current?.querySelector("input")?.focus();
  }, []);
  const pick = (name: string) => {
    reset();
    if (!from || (from && to)) {
      setFrom(name);
      if (from && to) setTo("");
    } else if (name !== from) setTo(name);
  };
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title" id="search">
        <div className="home-hero-copy">{intro}</div>
        {aside}
        <form
          ref={formRef}
          className="finder"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className="finder-grid">
            <Combobox
              label="Boarding stop"
              value={from}
              marker="start"
              placeholder="e.g. Mirpur 10"
              onChange={(v) => {
                reset();
                setFrom(v);
              }}
            />
            <button
              type="button"
              className="swap-btn"
              onClick={() => {
                reset();
                setFrom(to);
                setTo(from);
              }}
              aria-label="Swap stops"
            >
              <FiRepeat aria-hidden size={18} />
            </button>
            <Combobox
              label="Destination stop"
              value={to}
              marker="end"
              placeholder="e.g. Farmgate"
              onChange={(v) => {
                reset();
                setTo(v);
              }}
            />
            <Button className="finder-submit" disabled={loading || !from || !to}>
              <FiSearch aria-hidden size={18} />
              {loading ? "Searching…" : "Find buses"}
            </Button>
          </div>
          <div className="finder-foot">
            {popular.length > 0 && (
              <div className="quick-picks" aria-label="Popular stops">
                <span>Popular:</span>
                {popular.map((s) => (
                  <button type="button" key={s} onClick={() => pick(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {(from || to) && (
              <button
                type="button"
                className="finder-clear"
                onClick={() => {
                  reset();
                  setFrom("");
                  setTo("");
                  history.replaceState(null, "", "/");
                }}
              >
                <FiX aria-hidden /> Clear
              </button>
            )}
          </div>
        </form>
      </section>
      <div className="results" ref={resultsRef}>
        {message && <Alert>{message}</Alert>}
        {items.length > 0 && (
          <div className="results-head">
            <h2>Matching buses</h2>
            <p className="muted">
              {from} <FiArrowRight aria-hidden /> {to}
            </p>
          </div>
        )}
        <div className="results-grid" aria-live="polite" aria-busy={loading}>
          {items.map((x) => (
            <RouteCard key={x.bus.slug} bus={x.bus} segment={x.segment} />
          ))}
        </div>
        {items.length < total && (
          <Button
            className="secondary"
            disabled={loading}
            onClick={() => search(page + 1)}
          >
            Load more routes
          </Button>
        )}
      </div>
    </>
  );
}
