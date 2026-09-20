"use client";
import { useEffect } from "react";
import { track } from "./search";
export function RouteOpened({ id }: { id: string }) {
  useEffect(() => {
    track("route_open", { route_id: id });
  }, [id]);
  return null;
}
export function ArticleTracking() {
  useEffect(() => {
    const f = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (a && /^\/(buses|routes|stops)\//.test(a.getAttribute("href") ?? ""))
        track("article_to_route", { path: a.getAttribute("href")! });
    };
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, []);
  return null;
}
