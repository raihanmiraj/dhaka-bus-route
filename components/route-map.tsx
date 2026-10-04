"use client";
import { useEffect, useId, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { routeMapPoints } from "@/lib/stop-coordinates";

type Props = {
  stops: string[];
  title: string;
};

export function RouteMap({ stops, title }: Props) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [covered, setCovered] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      const points = routeMapPoints(stops);
      setCovered(points.length);
      if (!containerRef.current || points.length < 1) {
        setReady(true);
        return;
      }
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      const line = L.polyline(latlngs, {
        color: "#1d4ed8",
        weight: 5,
        opacity: 0.85,
        lineJoin: "round",
      }).addTo(map);
      points.forEach((p, i) => {
        const isEnd = i === 0 || i === points.length - 1;
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: isEnd ? 8 : 5,
          color: "#0f172a",
          weight: 2,
          fillColor: i === 0 ? "#0f766e" : i === points.length - 1 ? "#b45309" : "#1d4ed8",
          fillOpacity: 1,
        }).addTo(map);
        marker.bindPopup(
          `<strong>${i === 0 ? "Start · " : i === points.length - 1 ? "End · " : `Stop ${p.index + 1} · `}</strong>${p.name}`,
        );
      });
      map.fitBounds(line.getBounds(), { padding: [36, 36], maxZoom: 13 });
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    }
    void mount();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [stops]);

  const mapped = covered;
  const total = stops.length;

  return (
    <section className="route-map-card" aria-label={`Map for ${title}`}>
      <div className="route-map-head">
        <div>
          <p className="eyebrow">OpenStreetMap</p>
          <h2>Route on the map</h2>
          <p className="muted">
            {mapped
              ? `${mapped} of ${total} stops plotted from known Dhaka landmarks. Positions are approximate — confirm boarding locally.`
              : "Map coordinates are not yet available for these stops."}
          </p>
        </div>
        {mapped > 0 && (
          <div className="route-map-legend" aria-hidden="true">
            <span>
              <i className="dot start" /> Start
            </span>
            <span>
              <i className="dot mid" /> Stops
            </span>
            <span>
              <i className="dot end" /> End
            </span>
          </div>
        )}
      </div>
      {mapped > 0 ? (
        <div
          ref={containerRef}
          id={`map-${mapId}`}
          className="route-map-canvas"
          role="img"
          aria-label={`OpenStreetMap showing ${title}`}
        />
      ) : (
        <div className="empty">
          We could not place this route on the map yet. The stop list below is
          still available.
        </div>
      )}
      {!ready && mapped > 0 && <p className="muted">Loading map…</p>}
    </section>
  );
}
