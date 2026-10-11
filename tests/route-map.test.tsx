import React from "react";
import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RouteMap } from "../components/route-map";

vi.mock("leaflet/dist/leaflet.css", () => ({}));

it("renders the map container before effects initialize Leaflet", () => {
  const html = renderToStaticMarkup(
    <RouteMap stops={["Mirpur 10", "Farmgate"]} title="Test bus" />,
  );
  expect(html).toContain('class="route-map-canvas"');
  expect(html).toContain("2 of 2 stops plotted");
  expect(html).toContain("Loading map…");
  expect(html).not.toContain("We could not place this route");
});

it("keeps the fallback when no stops have coordinates", () => {
  const html = renderToStaticMarkup(
    <RouteMap stops={["Unknown landmark"]} title="Unknown bus" />,
  );
  expect(html).toContain("We could not place this route");
  expect(html).not.toContain('class="route-map-canvas"');
});
