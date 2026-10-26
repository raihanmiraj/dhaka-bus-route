/** Lightweight stop/bus name normalization — safe for client bundles. */
export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[০-৯]/g, (c) => String(c.charCodeAt(0) - 2534))
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const slugify = (s: string) => normalize(s).replace(/\s+/g, "-");
