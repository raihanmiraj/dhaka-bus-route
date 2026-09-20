export function pageNumber(value: unknown) {
  if (value === undefined) return 1;
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value) ||
    Number(value) < 1 ||
    Number(value) > 10000
  )
    throw new Error("Invalid page");
  return Number(value);
}
export const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
