import { creators } from "@/lib/mock-data";
import { INITIAL_FOLLOWING_BY_USER } from "./followSeed";

const VALID_IDS = new Set(creators.map((c) => c.id));

export function cloneFollowingGraph(
  source: Record<string, string[]> = INITIAL_FOLLOWING_BY_USER,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of creators) {
    out[c.id] = [...(source[c.id] ?? [])];
  }
  return normalizeFollowingGraph(out);
}

export function normalizeFollowingGraph(raw: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of creators) {
    const list = raw[c.id] ?? [];
    out[c.id] = [...new Set(list.filter((id) => VALID_IDS.has(id) && id !== c.id))];
  }
  return out;
}

export function countFollowers(targetId: string, graph: Record<string, string[]>): number {
  let n = 0;
  for (const list of Object.values(graph)) {
    if (list.includes(targetId)) n++;
  }
  return n;
}

/** Sorted by id for stable UI */
export function listFollowerIds(targetId: string, graph: Record<string, string[]>): string[] {
  return creators
    .map((c) => c.id)
    .filter((id) => id !== targetId && (graph[id] ?? []).includes(targetId));
}

export function computeFollowerCounts(graph: Record<string, string[]>): Record<string, number> {
  const m: Record<string, number> = {};
  for (const c of creators) m[c.id] = countFollowers(c.id, graph);
  return m;
}

export function mergeLegacyMeFollowing(
  graph: Record<string, string[]>,
  meId: string,
  legacyFollowedIds: string[],
): Record<string, string[]> {
  const next = { ...graph, [meId]: [...(graph[meId] ?? [])] };
  const set = new Set(next[meId]);
  for (const id of legacyFollowedIds) {
    if (VALID_IDS.has(id) && id !== meId) set.add(id);
  }
  next[meId] = [...set];
  return normalizeFollowingGraph(next);
}
