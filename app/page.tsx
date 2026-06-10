"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  FaBus,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt,
  FaGithub,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaRoute,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import { routeData as busData } from "@/server/busroute";

interface BusRoute {
  id: number;
  bus: string;
  route: string;
  routeStops: string[];
  time?: string;
  service?: string;
  sources?: string[];
}

interface SearchResult {
  route: BusRoute;
  fromStop: string;
  toStop: string;
  score: number;
}

interface StopMatch {
  stop: string;
  index: number;
  score: number;
}

interface SuggestionsState {
  from: boolean;
  to: boolean;
}

type SearchField = keyof SuggestionsState;

const routes = busData as BusRoute[];
const SUGGESTION_LIMIT = 8;
const RESULT_LIMIT = 24;
const PREVIEW_STOP_LIMIT = 10;

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stopFrequency = routes.reduce<Map<string, number>>((acc, route) => {
  route.routeStops?.forEach((stop) => {
    acc.set(stop, (acc.get(stop) ?? 0) + 1);
  });

  return acc;
}, new Map<string, number>());

const locations = Array.from(stopFrequency.keys()).sort((a, b) =>
  a.localeCompare(b)
);

const popularStops = Array.from(stopFrequency.entries())
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, SUGGESTION_LIMIT)
  .map(([stop]) => stop);

const getStopMatch = (stops: string[], query: string): StopMatch | null => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return null;
  }

  let bestMatch: StopMatch | null = null;

  for (let index = 0; index < stops.length; index += 1) {
    const stop = stops[index];
    const normalizedStop = normalize(stop);
    let score: number | null = null;

    if (normalizedStop === normalizedQuery) {
      score = 0;
    } else if (normalizedStop.startsWith(normalizedQuery)) {
      score = 1;
    } else if (normalizedStop.includes(normalizedQuery)) {
      score = 2;
    }

    if (score !== null && (!bestMatch || score < bestMatch.score)) {
      bestMatch = { stop, index, score };
    }
  }

  return bestMatch;
};

const searchRoutes = (from: string, to: string) =>
  routes
    .map((route) => {
      const fromMatch = getStopMatch(route.routeStops, from);
      const toMatch = getStopMatch(route.routeStops, to);

      if (!fromMatch || !toMatch) {
        return null;
      }

      const stopDistance = Math.abs(fromMatch.index - toMatch.index);
      const score =
        fromMatch.score +
        toMatch.score +
        stopDistance / Math.max(route.routeStops.length, 1);

      return {
        route,
        fromStop: fromMatch.stop,
        toStop: toMatch.stop,
        score,
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.route.routeStops.length - b.route.routeStops.length ||
        a.route.bus.localeCompare(b.route.bus)
    );

const getSuggestions = (query: string) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return popularStops;
  }

  return locations
    .filter((location) => {
      const normalizedLocation = normalize(location);

      return (
        normalizedLocation !== normalizedQuery &&
        normalizedLocation.includes(normalizedQuery)
      );
    })
    .sort((a, b) => {
      const aNormalized = normalize(a);
      const bNormalized = normalize(b);
      const aStarts = aNormalized.startsWith(normalizedQuery);
      const bStarts = bNormalized.startsWith(normalizedQuery);

      if (aStarts !== bStarts) {
        return aStarts ? -1 : 1;
      }

      return (stopFrequency.get(b) ?? 0) - (stopFrequency.get(a) ?? 0);
    })
    .slice(0, SUGGESTION_LIMIT);
};

export default function BusRouteFinder() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState<SuggestionsState>({
    from: false,
    to: false,
  });
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const filteredFromSuggestions = useMemo(() => getSuggestions(from), [from]);
  const filteredToSuggestions = useMemo(() => getSuggestions(to), [to]);
  const canSearch = normalize(from).length > 0 && normalize(to).length > 0;

  const handleSearch = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const fromQuery = normalize(from);
    const toQuery = normalize(to);

    if (!fromQuery || !toQuery) {
      setSearchMessage("Add both starting point and destination to search.");
      setHasSearched(false);
      return;
    }

    if (fromQuery === toQuery) {
      setSearchMessage("Choose two different stops for a route search.");
      setResults([]);
      setTotalMatches(0);
      setHasSearched(true);
      return;
    }

    const matchedRoutes = searchRoutes(from, to);

    setResults(matchedRoutes.slice(0, RESULT_LIMIT));
    setTotalMatches(matchedRoutes.length);
    setExpandedCard(null);
    setHasSearched(true);
    setSearchMessage(
      matchedRoutes.length > RESULT_LIMIT
        ? `Showing the best ${RESULT_LIMIT} of ${matchedRoutes.length} matching routes.`
        : ""
    );

    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setSearchMessage("");
  };

  const handleClear = () => {
    setFrom("");
    setTo("");
    setResults([]);
    setTotalMatches(0);
    setHasSearched(false);
    setSearchMessage("");
    setExpandedCard(null);
  };

  const handleSelectSuggestion = (value: string, field: SearchField) => {
    if (field === "from") {
      setFrom(value);
    } else {
      setTo(value);
    }

    setShowSuggestions((current) => ({ ...current, [field]: false }));
    setSearchMessage("");
  };

  const toggleCardExpand = (id: number) => {
    setExpandedCard((current) => (current === id ? null : id));
  };

  const renderSuggestionList = (
    field: SearchField,
    suggestions: string[],
    query: string
  ) => {
    if (!showSuggestions[field] || suggestions.length === 0) {
      return null;
    }

    return (
      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {normalize(query) ? "Matching stops" : "Popular stops"} - max{" "}
          {SUGGESTION_LIMIT}
        </div>
        {suggestions.map((location) => (
          <button
            key={`${field}-${location}`}
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-800"
            onMouseDown={() => handleSelectSuggestion(location, field)}
          >
            <FaMapMarkerAlt className="text-xs text-blue-500" />
            <span>{location}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderRouteStops = (result: SearchResult, expanded: boolean) => {
    const stops = result.route.routeStops;
    const visibleStops = expanded ? stops : stops.slice(0, PREVIEW_STOP_LIMIT);
    const hiddenStops = Math.max(stops.length - visibleStops.length, 0);

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleStops.map((stop, index) => {
          const isFrom = stop === result.fromStop;
          const isTo = stop === result.toStop;
          const stopClass = isFrom
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : isTo
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-600";

          return (
            <span
              key={`${result.route.id}-${stop}-${index}`}
              className={`rounded-md border px-2 py-1 text-xs leading-5 ${stopClass}`}
            >
              {stop}
            </span>
          );
        })}
        {hiddenStops > 0 && (
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs leading-5 text-slate-500">
            +{hiddenStops} more stops
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="border-b border-blue-900 bg-blue-800 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* <Image
              src="/images/dhaka-bus-route-icon-transparent-blue-header-48.png"
              alt="Dhaka Bus Route icon"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded"
            /> */}
            {/* <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-100">
                Dhaka public transport
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight">
                Dhaka Bus Route Finder
              </h1>
            </div> */}
              <Image
              src="/images/dhaka-bus-route-logo-transparent-blue-header.svg"
              alt="Dhaka Bus Route logo"
              width={280}
              height={100}
              className="h-auto w-52"
            />
          </div>
          <div className="hidden items-center gap-2 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-blue-50 sm:flex">
            <FaCheckCircle className="text-emerald-300" />
            {routes.length} routes indexed
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <div className="mb-5 flex justify-center lg:justify-start">
              {/* <Image
                src="/images/dhaka-bus-route-logo-transparent-blue-header.png"
                alt="Dhaka Bus Route"
                width={420}
                height={126}
                priority
                className="h-auto w-full max-w-sm"
              /> */}
            </div>
         <div className="flex flex-col gap-2 md:flex-row">
             <h1>Dhaka Bus Route Finder. Find Bus Routes in Dhaka, Bangladesh</h1>
         </div>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Search Dhaka bus routes by starting stop and destination.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Search across {routes.length} Dhaka bus routes and {locations.length}{" "}
              indexed stops. Suggestions are limited to the best {SUGGESTION_LIMIT}{" "}
              matches, and route results show the best {RESULT_LIMIT} matches first.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
                <div>
                  <label
                    htmlFor="from"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    From
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-500" />
                    <input
                      id="from"
                      type="search"
                      value={from}
                      onChange={(event) => {
                        setFrom(event.target.value);
                        setShowSuggestions({ from: true, to: false });
                        setSearchMessage("");
                      }}
                      onFocus={() => setShowSuggestions({ from: true, to: false })}
                      onBlur={() =>
                        window.setTimeout(
                          () =>
                            setShowSuggestions((current) => ({
                              ...current,
                              from: false,
                            })),
                          180
                        )
                      }
                      placeholder="Gabtoli, Mirpur 10, Farmgate..."
                      className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      autoComplete="off"
                    />
                    {renderSuggestionList("from", filteredFromSuggestions, from)}
                  </div>
                </div>

                <div className="flex justify-center md:pb-1">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    aria-label="Swap starting point and destination"
                    title="Swap stops"
                  >
                    <FaExchangeAlt className="text-sm" />
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="to"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    To
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600" />
                    <input
                      id="to"
                      type="search"
                      value={to}
                      onChange={(event) => {
                        setTo(event.target.value);
                        setShowSuggestions({ from: false, to: true });
                        setSearchMessage("");
                      }}
                      onFocus={() => setShowSuggestions({ from: false, to: true })}
                      onBlur={() =>
                        window.setTimeout(
                          () =>
                            setShowSuggestions((current) => ({
                              ...current,
                              to: false,
                            })),
                          180
                        )
                      }
                      placeholder="Motijheel, Uttara, Sadarghat..."
                      className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      autoComplete="off"
                    />
                    {renderSuggestionList("to", filteredToSuggestions, to)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={!canSearch}
                  className="flex h-11 flex-1 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 py-2 cursor-pointer"
                >
                  <FaSearch className="mr-2 text-xs" />
                  Search routes
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <FaTimes className="mr-2 text-xs" />
                  Clear
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {popularStops.map((stop) => (
                  <button
                    key={`popular-${stop}`}
                    type="button"
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      if (!from) {
                        setFrom(stop);
                      } else {
                        setTo(stop);
                      }
                    }}
                  >
                    {stop}
                  </button>
                ))}
              </div>

              {searchMessage && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {searchMessage}
                </p>
              )}
            </form>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Route index
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-bold text-blue-700">{routes.length}</p>
                <p className="mt-1 text-xs text-slate-500">Routes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {locations.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">Stops</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {RESULT_LIMIT}
                </p>
                <p className="mt-1 text-xs text-slate-500">Result cap</p>
              </div>
            </div>
            <div className="mt-5 rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Best search behavior
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Exact stop names rank first, followed by prefix and partial matches.
                This keeps short searches useful while avoiding unlimited result lists.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-8" ref={resultsRef}>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Available Bus Routes
              </h2>
              <p className="text-sm text-slate-500">
                {hasSearched
                  ? `${totalMatches} route${totalMatches === 1 ? "" : "s"} found for ${from || "your start"} to ${to || "your destination"}`
                  : "Run a search to see matching buses."}
              </p>
            </div>
            {hasSearched && totalMatches > 0 && (
              <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Showing {results.length} of {totalMatches}
              </span>
            )}
          </div>

          {!hasSearched ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <FaRoute className="mx-auto text-3xl text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">
                Choose two stops to begin
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                The search reads from the updated route data and highlights the
                matching stops inside each route.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <FaBus className="mx-auto text-4xl text-slate-300" />
              <h3 className="mt-3 text-lg font-semibold text-slate-800">
                No buses found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a nearby stop, shorter spelling, or one of the popular stops.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {results.map((result) => {
                const bus = result.route;
                const isExpanded = expandedCard === bus.id;

                return (
                  <article
                    key={bus.id}
                    className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${
                      isExpanded
                        ? "border-blue-300 shadow-md"
                        : "border-slate-200 hover:border-blue-200"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900">
                            {bus.bus}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">
                              {bus.service || "Local bus service"}
                            </span>
                            {bus.time && (
                              <span className="flex items-center rounded-md bg-slate-50 px-2 py-1 text-slate-600">
                                <FaClock className="mr-1 text-slate-400" />
                                {bus.time}
                              </span>
                            )}
                            <span className="rounded-md bg-slate-50 px-2 py-1 text-slate-600">
                              {bus.routeStops.length} stops
                            </span>
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <span className="font-semibold text-blue-700">
                            {result.fromStop}
                          </span>{" "}
                          to{" "}
                          <span className="font-semibold text-emerald-700">
                            {result.toStop}
                          </span>
                        </div>
                      </div>

                      {renderRouteStops(result, isExpanded)}
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleCardExpand(bus.id)}
                        className="flex w-full items-center justify-center text-sm font-semibold text-blue-700 transition hover:text-blue-900 cursor-pointer"
                      >
                        <FaInfoCircle className="mr-2 text-xs" />
                        {isExpanded ? "Show fewer stops" : "Show full route"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-slate-950">
            Dhaka City Bus Routes Information
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Search coverage
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The app uses the updated 2026 route dataset Google collected from public sources,
                including bus names, stop lists, service types, and public sources.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Popular corridors
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Common Dhaka corridors include Mirpur, Farmgate, Motijheel,
                Gulshan, Uttara, Sadarghat, Gabtoli, Badda, and Jatrabari.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Data note
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Route availability can change in Dhaka traffic conditions. Confirm
                final boarding details locally before travel.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Image
              src="/images/dhaka-bus-route-logo-transparent-blue-header.svg"
              alt="Dhaka Bus Route logo"
              width={280}
              height={100}
              className="h-auto w-52"
            />
            <p className="mt-3 max-w-md text-sm text-slate-400">
              Efficient public transportation search for Dhaka city bus routes.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm md:items-end">
            <a
              href="https://github.com/raihanmiraj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
            >
              <FaGithub />
              GitHub
            </a>
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Dhaka Bus Route Finder. Data sourced
              from public route listings.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
