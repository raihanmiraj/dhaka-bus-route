import { routeData } from "@/server/busroute";
export type Bus = {
  id: number;
  bus: string;
  route: string;
  routeStops: string[];
  time?: string;
  service?: string;
  sources?: string[];
};
export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[০-৯]/g, (c) => String(c.charCodeAt(0) - 2534))
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
export const slugify = (s: string) => normalize(s).replace(/\s+/g, "-");
export const buses = (routeData as Bus[]).map((b) => ({
  ...b,
  slug: `${slugify(b.bus.split(" Bus Route")[0])}-${b.id}`,
}));
const aliases: Record<string, string[]> = {
  "Mirpur 1": ["মিরপুর ১"],
  "Mirpur 10": ["মিরপুর ১০"],
  "Mirpur 11": ["মিরপুর ১১"],
  Farmgate: ["ফার্মগেট", "Farm Gate"],
  Gabtoli: ["গাবতলী", "Gabtali"],
  Motijheel: ["মতিঝিল"],
  Shahbag: ["শাহবাগ", "Shahbagh"],
  Mouchak: ["মৌচাক", "Mochak"],
  "Dhanmondi 27": ["ধানমন্ডি ২৭"],
  "Dhanmondi 32": ["ধানমন্ডি ৩২"],
};
// Reviewed casing-only variants. Raw route records are untouched.
const stopSpellings: Record<string, string> = {
  "Asad gate": "Asad Gate",
  "Ring road": "Ring Road",
  "Sony CInema Hall": "Sony Cinema Hall",
};
export const stops = [
  ...new Set(
    buses.flatMap((b) =>
      b.routeStops.map((name) => stopSpellings[name] ?? name),
    ),
  ),
]
  .sort()
  .map((name) => ({ id: slugify(name), name, aliases: aliases[name] ?? [] }));
export function suggestions(q: string) {
  const n = normalize(q)
    .replace(/^মিরপুর/, "mirpur")
    .replace(/^ধানমন্ডি/, "dhanmondi");
  const scored = stops.map((s) => ({
    s,
    score: Math.min(
      ...[s.name, ...s.aliases].map((a) => {
        const v = normalize(a);
        return v === n ? 0 : v.startsWith(n + " ") ? 1 : v.includes(n) ? 2 : 9;
      }),
    ),
  }));
  return scored
    .filter((x) => x.score < 9)
    .sort((a, b) => a.score - b.score || a.s.name.localeCompare(b.s.name))
    .slice(0, 12)
    .map((x) => x.s);
}
export function resolveStop(q: string) {
  const exact = stops.find(
    (s) =>
      s.id === q ||
      [s.name, ...s.aliases].some((a) => normalize(a) === normalize(q)),
  );
  if (exact) return exact;
  throw new Error("Choose a specific stop from the suggestions.");
}
export function journeys(from: string, to: string) {
  const a = resolveStop(from),
    b = resolveStop(to);
  if (a.id === b.id) throw new Error("Choose two different stops.");
  return buses
    .flatMap((bus) => {
      const i = bus.routeStops.findIndex((s) => slugify(s) === a.id),
        j = bus.routeStops.findIndex((s) => slugify(s) === b.id); // Source order only; separator alone is not proof of reverse operation.
      return i >= 0 && j > i
        ? [{ bus, segment: bus.routeStops.slice(i, j + 1), stops: j - i }]
        : [];
    })
    .sort((a, b) => a.stops - b.stops || a.bus.id - b.bus.id);
}
export const curatedJourneys = [
  { slug: "mirpur-10-to-farmgate", from: "mirpur-10", to: "farmgate" },
  { slug: "farmgate-to-motijheel", from: "farmgate", to: "motijheel" },
].filter((j) => journeys(j.from, j.to).length);
