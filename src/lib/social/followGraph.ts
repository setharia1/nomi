import { creators } from "@/lib/mock-data";
import { INITIAL_FOLLOWING_BY_USER } from "./followSeed";

const extraKnownIds = new Set<string>();

/** Call when the account registry loads so follow rows exist for every real user. */
export function registerKnownCreatorIds(ids: string[]) {
  for (const id of ids) {
    if (id) extraKnownIds.add(id);
  }
}

function allCreatorIds(): string[] {
  return [...new Set([...creators.map((c) => c.id), ...extraKnownIds])];
}

function validIds(): Set<string> {
  return new Set(allCreatorIds());
}

export function cloneFollowingGraph(
  source: Record<string, string[]> = INITIAL_FOLLOWING_BY_USER,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of allCreatorIds()) {
    out[id] = [...(source[id] ?? [])];
  }
  return normalizeFollowingGraph(out);
}

export function normalizeFollowingGraph(raw: Record<string, string[]>): Record<string, string[]> {
  const valid = validIds();
  const out: Record<string, string[]> = {};
  for (const id of allCreatorIds()) {
    const list = raw[id] ?? [];
    out[id] = [...new Set(list.filter((fid) => valid.has(fid) && fid !== id))];
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
  return allCreatorIds()
    .filter((id) => id !== targetId && (graph[id] ?? []).includes(targetId))
    .sort();
}

export function computeFollowerCounts(graph: Record<string, string[]>): Record<string, number> {
  const m: Record<string, number> = {};
  for (const id of allCreatorIds()) m[id] = countFollowers(id, graph);
  return m;
}

export function mergeLegacyMeFollowing(
  graph: Record<string, string[]>,
  meId: string,
  legacyFollowedIds: string[],
): Record<string, string[]> {
  const valid = validIds();
  const next = { ...graph, [meId]: [...(graph[meId] ?? [])] };
  const set = new Set(next[meId]);
  for (const id of legacyFollowedIds) {
    if (valid.has(id) && id !== meId) set.add(id);
  }
  next[meId] = [...set];
  return normalizeFollowingGraph(next);
}
