import { NextRequest, NextResponse } from "next/server";
import { suggestions, journeys, resolveStop } from "@/lib/routes";
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  try {
    if ([...p.values()].some((v) => v.length > 120))
      throw new Error("Search is too long.");
    if (p.get("kind") === "stops")
      return NextResponse.json({ items: suggestions(p.get("q") ?? "") });
    const page = Number(p.get("page") || 1);
    if (!Number.isInteger(page) || page < 1 || page > 100)
      throw new Error("Invalid page.");
    const from = resolveStop(p.get("from") ?? ""),
      to = resolveStop(p.get("to") ?? "");
    const results = journeys(from.id, to.id);
    return NextResponse.json({
      items: results.slice((page - 1) * 12, page * 12),
      total: results.length,
      from: from.id,
      to: to.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid search" },
      { status: 400 },
    );
  }
}
