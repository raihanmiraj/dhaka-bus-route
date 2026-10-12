import { buses, curatedJourneys, journeys, resolveStop, stops } from "./routes";

/** Popular A→B pairs from Search Console + common Dhaka trips. */
const candidatePairs: [string, string][] = [
  ["Mirpur 10", "Farmgate"],
  ["Farmgate", "Banani"],
  ["Farmgate", "Motijheel"],
  ["Farmgate", "Gulshan 2"],
  ["Mirpur 1", "Gulistan"],
  ["Gabtoli", "Sayedabad"],
  ["Uttara", "Farmgate"],
  ["Gulistan", "Gulshan 1"],
  ["Airport", "Shahbag"],
  ["Mohammadpur", "Motijheel"],
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
  .slice(0, 8);

const stopNames = new Set(stops.map((s) => s.name));
const frequency = new Map<string, number>();
for (const b of buses)
  for (const s of new Set(b.routeStops))
    if (stopNames.has(s)) frequency.set(s, (frequency.get(s) ?? 0) + 1);

export const popularStops = [...frequency.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 8)
  .map(([name]) => name);

export const coverage = {
  routes: buses.length,
  stops: stops.length,
};

/** FAQ answers targeting high-impression GSC / Semrush queries. */
export const seoFaqs = [
  {
    q: "How do I find a Dhaka bus route?",
    a: "Enter your boarding stop and destination above. Dhaka Bus Routes matches direct local buses that serve both stops in order, then ranks them by fewest listed stops.",
  },
  {
    q: "Can I search from my current location?",
    a: "Yes. Tap Use Current Location to auto-select the nearest listed stop (for example Mirpur 1), then choose where you are going.",
  },
  {
    q: "Do you cover local city buses only?",
    a: `We index ${buses.length} listed Dhaka city bus routes and ${stops.length} stops. Long-distance coach tickets (Cox's Bazar, Sylhet, etc.) are outside this finder.`,
  },
  {
    q: "Are fares and live bus times available?",
    a: "Fares, live GPS and exact departure times are not in the source lists. Confirm boarding details on the road before you travel.",
  },
];
