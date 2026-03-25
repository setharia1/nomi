const KEY = "nomi-recent-searches-v1";
const MAX = 18;

export function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]).filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentSearches(entries: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // ignore
  }
}

export function pushRecentSearch(query: string): string[] {
  const q = query.trim();
  if (!q) return loadRecentSearches();
  const cur = loadRecentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase());
  const next = [q, ...cur].slice(0, MAX);
  saveRecentSearches(next);
  return next;
}

export function removeRecentSearch(query: string): string[] {
  const next = loadRecentSearches().filter((x) => x.toLowerCase() !== query.toLowerCase());
  saveRecentSearches(next);
  return next;
}

export function clearRecentSearches() {
  saveRecentSearches([]);
}
