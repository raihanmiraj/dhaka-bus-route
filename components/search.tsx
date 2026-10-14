"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  FiArrowRight,
  FiChevronDown,
  FiMapPin,
  FiNavigation,
  FiRepeat,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { Button, Alert, RouteCard } from "./ui";
import { currentLocation, locationErrorMessage } from "@/lib/geolocation";
type Stop = { id: string; name: string; aliases?: string[] };
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
  const bangla = (s: Stop) =>
    s.aliases?.find((a) => /[\u0980-\u09FF]/.test(a)) ?? "";
  return (
    <div className={`combobox stop-picker${open ? " is-open" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field stop-field">
        <FiMapPin aria-hidden className="stop-field-icon" size={18} />
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
        {value ? (
          <button
            type="button"
            className="stop-field-clear"
            aria-label={`Reset ${label}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <FiX aria-hidden size={16} />
          </button>
        ) : (
          <FiChevronDown aria-hidden className="stop-field-chevron" size={16} />
        )}
      </div>
      {open && (
        <div role="listbox" id={`${id}-list`} className="suggestions">
          {items.map((s, i) => {
            const bn = bangla(s);
            return (
              <div
                id={`${id}-${i}`}
                role="option"
                aria-selected={active === i}
                key={s.id}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
              >
                <span className="stop-name">{s.name}</span>
                {bn ? <span className="stop-bn"> ({bn})</span> : null}
              </div>
            );
          })}
          {!items.length && <p>No matching stop. Try another spelling.</p>}
        </div>
      )}
    </div>
  );
}
export default function Search({
  intro,
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
    [locating, setLocating] = useState(false),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const request = useRef(0);
  const locationInFlight = useRef(false);
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
      const params = new URLSearchParams({
        from: f,
        to: t,
        page: String(n),
      });
      const r = await fetch(`/api/search?${params}`);
      const d = await r.json();
      if (seq !== request.current) return;
      if (!r.ok) throw new Error(d.error);
      setItems((prev) => (n === 1 ? d.items : [...prev, ...d.items]));
      setTotal(d.total);
      setPage(n);
      if (d.fromName) setFrom(d.fromName);
      if (d.toName) setTo(d.toName);
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
  async function locateNearestStop() {
    if (locationInFlight.current) return;
    if (!navigator.geolocation) {
      setMessage(
        "Location is not supported in this browser. Choose your origin manually.",
      );
      return;
    }
    locationInFlight.current = true;
    reset();
    const seq = request.current;
    setLocating(true);
    try {
      const pos = await currentLocation(navigator.geolocation);
      if (seq !== request.current) return;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const r = await fetch(
          `/api/search?${new URLSearchParams({ kind: "nearest", lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) })}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const d = await r.json();
        if (seq !== request.current) return;
        if (!r.ok)
          throw new Error(
            d.error ||
              "Could not find a nearby stop. Choose your origin manually.",
          );
        setFrom(d.stop.name);
        setMessage(
          `${d.stop.name} selected as your origin. Nearest listed stop, about ${d.meters}m in a straight line (location accuracy ±${Math.round(pos.coords.accuracy)}m). Choose your destination.`,
        );
        track("current_location_success", {
          stop: d.stop.id,
          meters: d.meters,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      if (seq !== request.current) return;
      setMessage(
        error instanceof Error && error.name === "AbortError"
          ? "Finding a nearby stop timed out. Try again, or choose your origin manually."
          : locationErrorMessage(error),
      );
      track("current_location_error");
    } finally {
      locationInFlight.current = false;
      setLocating(false);
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
    return () => {
      request.current++;
    };
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
              label="From (Origin)"
              value={from}
              placeholder="From (Origin)"
              onChange={(v) => {
                reset();
                setFrom(v);
              }}
            />
            <button
              type="button"
              className="swap-btn"
              aria-label="Swap stops"
              title="Swap origin and destination"
              onClick={() => {
                reset();
                setFrom(to);
                setTo(from);
                if (from && to) {
                  void search(1, to, from);
                }
              }}
            >
              <FiRepeat aria-hidden size={18} />
            </button>
            <Combobox
              label="To (Destination)"
              value={to}
              placeholder="To (Destination)"
              onChange={(v) => {
                reset();
                setTo(v);
              }}
            />
            <div className="finder-actions">
              <Button
                className="finder-submit"
                disabled={loading || !from || !to}
              >
                <FiSearch aria-hidden size={18} />
                {loading ? "Searching…" : "Search Routes"}
              </Button>
              <button
                type="button"
                className="finder-locate"
                disabled={locating}
                onClick={() => void locateNearestStop()}
              >
                <FiNavigation aria-hidden size={16} />
                {locating ? "Finding nearest…" : "Use Current Location"}
              </button>
            </div>
          </div>
          <div className="finder-foot">
            {popular.length > 0 && (
              <div className="quick-picks" aria-label="Popular stops">
                <span>Quick picks:</span>
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
            <h2>Matching Dhaka bus routes</h2>
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
