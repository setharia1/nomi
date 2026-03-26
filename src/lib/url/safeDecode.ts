/**
 * decodeURIComponent wrapper that never throws on malformed escape sequences.
 */
export function safeDecodeURIComponent(value: string, fallback = value): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
}
