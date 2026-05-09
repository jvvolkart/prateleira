/**
 * Base URL of this API as reachable by browsers (for absolute links in chat / OpenAI tool payloads).
 * Example: http://localhost:4000 or https://api.example.com
 */
export function getPublicApiBase(): string {
  const raw =
    process.env.PUBLIC_API_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

/** Turn stored paths (/uploads/...) or absolute URLs into a browser-loadable URL. */
export function resolvePublicAssetUrl(imageUrl: string): string {
  const u = imageUrl?.trim() || "";
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = getPublicApiBase();
  if (!base) return u;
  return u.startsWith("/") ? `${base}${u}` : `${base}/${u}`;
}
