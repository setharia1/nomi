/**
 * For You stream: all real posts in the tab (including yours), ranked for the viewer with
 * light randomness so order varies and new publishes fold into the mix naturally.
 * Following uses `sortFollowingFeed` only — relationship-ordered, not this model.
 */
import type { Post } from "@/lib/types";
import type { PersonalizationSignals } from "@/lib/search/types";
import { slugifyTag } from "@/lib/search/slug";

function parseViews(v: string): number {
  const s = v.trim().toUpperCase();
  const num = Number(s.replace(/[^\d.]/g, ""));
  if (s.endsWith("M")) return num * 1_000_000;
  if (s.endsWith("K")) return num * 1_000;
  return Number.isFinite(num) ? num : 0;
}

function engagementScore(p: Post): number {
  return p.likes + p.comments * 2 + p.saves * 2.5 + parseViews(p.views) / 8000;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Small tie-breaker so the stream isn’t identical every time; bumps when `streamSalt` changes. */
function streamJitter(postId: string, streamSalt: number): number {
  const rand = mulberry32(hashString(`${postId}:${streamSalt}`) >>> 0);
  return rand() * 18;
}

export function forYouScoreBase(p: Post, sig: PersonalizationSignals): number {
  let s = 0;
  const pub = p.publishedAt ?? 0;
  const ageHours = pub > 0 ? Math.max(0, (Date.now() - pub) / 3_600_000) : 168;
  s += Math.max(0, 96 - ageHours) * 2.2;
  s += engagementScore(p) * 0.12;
  s += (p.likes + p.saves * 2) * 0.06;

  if (sig.followedCreatorIds.includes(p.creatorId)) s += 38;
  if (sig.likedPostIds.includes(p.id)) s += 52;
  if (sig.savedPostIds.includes(p.id)) s += 46;
  if (sig.affinityCreatorIds.includes(p.creatorId)) s += 24;
  for (const tag of p.tags) {
    if (sig.affinityTagSlugs.includes(slugifyTag(tag))) s += 14;
  }
  return s;
}

/** Prefer not to stack many consecutive cards from the same author when scores are close. */
function diversifyByCreator(sorted: Post[]): Post[] {
  const pool = [...sorted];
  const out: Post[] = [];
  let last: string | null = null;
  while (pool.length) {
    let pick = pool.findIndex((p) => p.creatorId !== last);
    if (pick < 0) pick = 0;
    const [next] = pool.splice(pick, 1);
    out.push(next);
    last = next.creatorId;
  }
  return out;
}

/**
 * Full For You ordering: personalization + freshness, jittered so refreshes / new posts reshuffle the stream.
 */
export function buildForYouStream(
  posts: Post[],
  sig: PersonalizationSignals,
  streamSalt: number,
): Post[] {
  if (posts.length <= 1) return posts.slice();
  const sorted = posts
    .map((p) => ({
      p,
      score: forYouScoreBase(p, sig) + streamJitter(p.id, streamSalt),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.p.publishedAt ?? 0) - (a.p.publishedAt ?? 0) ||
        a.p.id.localeCompare(b.p.id),
    )
    .map((x) => x.p);
  return diversifyByCreator(sorted);
}

/** Deterministic ranking (no stream jitter) — use when salt must be stable. */
export function rankForYouFeed(posts: Post[], sig: PersonalizationSignals): Post[] {
  return buildForYouStream(posts, sig, 0);
}

/** Following: newest first, predictable relationship feed. */
export function sortFollowingFeed(posts: Post[]): Post[] {
  return posts.slice().sort((a, b) => {
    const ta = a.publishedAt ?? 0;
    const tb = b.publishedAt ?? 0;
    if (tb !== ta) return tb - ta;
    return b.id.localeCompare(a.id);
  });
}
