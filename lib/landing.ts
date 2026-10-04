import { buses, curatedJourneys, journeys, resolveStop, stops } from "./routes";

const candidatePairs: [string, string][] = [
  ["Mirpur 10", "Farmgate"],
  ["Farmgate", "Motijheel"],
  ["Mirpur 10", "Motijheel"],
  ["Gabtoli", "Sayedabad"],
  ["Uttara", "Farmgate"],
  ["Mohammadpur", "Motijheel"],
  ["Airport", "Shahbag"],
  ["Mirpur 1", "Gulistan"],
];

export type JourneyHighlight = {
  from: string;
  to: string;
  href: string;
  buses: number;
  fewestStops: number;
};

function highlight([from, to]: [string, string]): JourneyHighlight | null {
  try {
    const a = resolveStop(from),
      b = resolveStop(to);
    const matches = journeys(a.id, b.id);
    if (!matches.length) return null;
    const curated = curatedJourneys.find((j) => j.from === a.id && j.to === b.id);
    return {
      from: a.name,
      to: b.name,
      href: curated
        ? `/routes/${curated.slug}`
        : `/?from=${encodeURIComponent(a.name)}&to=${encodeURIComponent(b.name)}#search`,
      buses: matches.length,
      fewestStops: matches[0].segment.length,
    };
  } catch {
    return null;
  }
}

export const journeyHighlights = candidatePairs
  .map(highlight)
  .filter((j): j is JourneyHighlight => !!j)
  .slice(0, 6);

const stopNames = new Set(stops.map((s) => s.name));
const frequency = new Map<string, number>();
for (const b of buses)
  for (const s of new Set(b.routeStops))
    if (stopNames.has(s)) frequency.set(s, (frequency.get(s) ?? 0) + 1);

export const popularStops = [...frequency.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 8)
  .map(([name]) => name);

const previewMatches = (() => {
  try {
    return journeys("mirpur-10", "farmgate");
  } catch {
    return [];
  }
})();

export const routePreview = previewMatches.length
  ? {
      from: "Mirpur 10",
      to: "Farmgate",
      buses: previewMatches.length,
      bus: previewMatches[0].bus.bus.split(" Bus Route")[0],
      stops: previewMatches[0].segment,
    }
  : null;

export const coverage = {
  routes: buses.length,
  stops: stops.length,
};
