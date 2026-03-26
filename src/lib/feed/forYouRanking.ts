/**
 * For You ranking: network-wide posts from other accounts, scored for personalization.
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

function forYouScore(p: Post, sig: PersonalizationSignals): number {
  let s = 0;
  const pub = p.publishedAt ?? 0;
  const ageHours = pub > 0 ? Math.max(0, (Date.now() - pub) / 3_600_000) : 168;
  s += Math.max(0, 96 - ageHours) * 1.8;
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

/** For You: posts from other accounts, ranked for this viewer. */
export function rankForYouFeed(posts: Post[], sig: PersonalizationSignals): Post[] {
  if (posts.length <= 1) return posts.slice();
  const sorted = posts
    .map((p) => ({ p, score: forYouScore(p, sig) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.p.publishedAt ?? 0) - (a.p.publishedAt ?? 0) ||
        a.p.id.localeCompare(b.p.id),
    )
    .map((x) => x.p);
  return diversifyByCreator(sorted);
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
