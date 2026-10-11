// Next.js dynamic params can contain percent-encoded non-ASCII characters.
// Decode once, without allowing an encoded separator to become another path.
export function decodeSlug(value: string): string | null {
  try {
    const slug = decodeURIComponent(value);
    return slug && !/[\/\\\u0000-\u001f\u007f]/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}
