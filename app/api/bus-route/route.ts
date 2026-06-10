import { NextResponse } from "next/server";

import { routeData } from "@/server/busroute";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const dynamic = "force-static";

export async function GET() {
  try {
    if (!Array.isArray(routeData)) {
      return NextResponse.json(
        { error: "Bus route data is not available." },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(routeData, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to load bus route data", error);

    return NextResponse.json(
      { error: "Failed to load bus route data." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
