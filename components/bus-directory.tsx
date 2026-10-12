"use client";
import { useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { MdOutlineDirectionsBus } from "react-icons/md";
import { RouteCard } from "./ui";

type BusItem = {
  id: number;
  slug: string;
  bus: string;
  routeStops: string[];
};

function normalize(s: string) {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[০-৯]/g, (c) => String(c.charCodeAt(0) - 2534))
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function BusDirectory({ buses }: { buses: BusItem[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = normalize(q);
    if (!n) return buses;
    return buses.filter(
      (b) =>
        normalize(b.bus).includes(n) ||
        b.routeStops.some((s) => normalize(s).includes(n)),
    );
  }, [buses, q]);

  return (
    <div className="bus-directory">
      <form
        className="bus-search"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="bus-directory-q" className="sr-only">
          Search buses by name or stop
        </label>
        <div className="bus-search-field">
          <MdOutlineDirectionsBus
            aria-hidden
            className="bus-search-icon"
            size={20}
          />
          <input
            id="bus-directory-q"
            value={q}
            placeholder="Search bus name or stop…"
            autoComplete="off"
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button
              type="button"
              className="bus-search-clear"
              aria-label="Clear search"
              onClick={() => setQ("")}
            >
              <FiX aria-hidden size={16} />
            </button>
          ) : (
            <FiSearch aria-hidden className="bus-search-hint" size={18} />
          )}
        </div>
        <p className="bus-search-meta" aria-live="polite">
          {q
            ? `${filtered.length} of ${buses.length} buses`
            : `${buses.length} buses listed`}
        </p>
      </form>

      {filtered.length ? (
        <div className="grid">
          {filtered.map((b) => (
            <RouteCard key={b.id} bus={b} />
          ))}
        </div>
      ) : (
        <p className="bus-search-empty" role="status">
          No buses match “{q}”. Try another name or stop.
        </p>
      )}
    </div>
  );
}
