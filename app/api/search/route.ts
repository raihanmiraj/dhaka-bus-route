import { NextRequest, NextResponse } from "next/server";
import { suggestions, journeys, resolveStop, stops, normalize } from "@/lib/routes";
import { nearestStop } from "@/lib/stop-coordinates";
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  try {
    if ([...p.values()].some((v) => v.length > 120))
      throw new Error("Search is too long.");
    if (p.get("kind") === "stops")
      return NextResponse.json({ items: suggestions(p.get("q") ?? "") });
    if (p.get("kind") === "nearest") {
      const lat = Number(p.get("lat"));
      const lng = Number(p.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng))
        throw new Error("Location coordinates are required.");
      const match = nearestStop(lat, lng, stops);
      if (!match)
        throw new Error(
          "No listed bus stop was found near you. Try searching by stop name.",
        );
      return NextResponse.json({
        stop: { id: match.id, name: match.name },
        meters: Math.round(match.meters),
      });
    }
    const page = Number(p.get("page") || 1);
    if (!Number.isInteger(page) || page < 1 || page > 100)
      throw new Error("Invalid page.");
    const from = resolveStop(p.get("from") ?? ""),
      to = resolveStop(p.get("to") ?? "");
    const busQ = normalize(p.get("bus") ?? "");
    let results = journeys(from.id, to.id);
    if (busQ)
      results = results.filter((r) => normalize(r.bus.bus).includes(busQ));
    return NextResponse.json({
      items: results.slice((page - 1) * 12, page * 12),
      total: results.length,
      from: from.id,
      to: to.id,
      fromName: from.name,
      toName: to.name,
      bus: busQ || undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid search" },
      { status: 400 },
    );
  }
}
