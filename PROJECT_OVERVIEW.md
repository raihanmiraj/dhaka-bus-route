# Dhaka Bus Route Finder - Project Overview

## Purpose

Dhaka Bus Route Finder is a Next.js app for searching Dhaka city bus routes by starting stop and destination. The main experience lives in `app/page.tsx` and reads route data from `server/busroute.ts`.

## Current Data Source

- `server/busroute.ts` exports `routeData`.
- The dataset currently contains 184 routes.
- The route stop index currently contains 320 unique stops.
- Each route generally includes:
  - `id`: route identifier.
  - `bus`: bus/operator name, often with Bangla text.
  - `route`: human-readable route string.
  - `routeStops`: structured stop list used by search.
  - `time`: optional timing detail, often empty.
  - `service`: optional service type.
  - `sources`: public references for the route.

## Search Behavior

The homepage derives all search stops from `routeData` instead of using a hard-coded location list. Search is intentionally limited for usability:

- Suggestions are capped at 8 stops.
- Results are capped at the best 24 matching routes.
- Popular suggestions are calculated from stop frequency across all routes.
- Exact stop matches rank first.
- Prefix matches rank ahead of partial matches.
- Shorter and more direct routes rank higher when text relevance is similar.

## UI Behavior

- The search form includes separate From and To inputs.
- The swap button exchanges From and To.
- The clear button resets input, messages, and results.
- Route cards show service type, stop count, matched From/To stops, and a limited stop preview.
- Users can expand a card to see the full route stop list.
- Empty time and fare fields are not shown, because the current dataset usually has empty `time` values and no `fare` field.

## Branding And Social Assets

All branding assets are in `public/images/`.

- Favicon: `/images/favicon-transparent-blue-header.ico`
- App icons: `/images/dhaka-bus-route-icon-transparent-blue-header-*.png`
- Header logo: `/images/dhaka-bus-route-logo-transparent-blue-header.png`
- Footer logo: `/images/dhaka-bus-route-logo-blue-bg-preview.png`
- Social sharing image: `/images/featured-image.png`

The App Router metadata in `app/layout.tsx` uses `/images/featured-image.png` as the Open Graph and Twitter image, so shared links should use it as the featured image.

## Main Files

- `app/page.tsx`: client-side route finder UI and search behavior.
- `app/layout.tsx`: app metadata, favicon, social card image, fonts, and root layout.
- `app/globals.css`: Tailwind CSS entry and small utility definitions.
- `server/busroute.ts`: TypeScript route dataset used by the UI.
- `server/dhaka_bus_routes_updated_2026-06-09.json`: JSON route dataset snapshot.
- `public/images/`: favicon, logo, app icon, and featured social image assets.

## Recommended Next Improvements

- Add route detail pages for individual bus operators.
- Add aliases for common spelling variations, such as "Mouchak" and "Mochak".
- Add source freshness labels if route update dates become available.
- Add tests for exact, prefix, partial, and no-result search cases.
- Add structured data for SEO if route detail pages are introduced.
