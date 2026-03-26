import { creators, posts } from "@/lib/mock-data";
import { resolveCreator } from "@/lib/accounts/resolveCreator";
import type { Creator, Post } from "@/lib/types";
import type { BoardHit, PersonalizationSignals, SearchSnapshot, SearchTab, TopicHit } from "./types";
import { slugifyTag } from "./slug";
import { allMoodBoardsWithCreators, searchMoodBoards } from "./moodBoards";

function parseViews(v: string): number {
  const s = v.trim().toUpperCase();
  const num = Number(s.replace(/[^\d.]/g, ""));
  if (s.endsWith("M")) return num * 1_000_000;
  if (s.endsWith("K")) return num * 1_000;
  return Number.isFinite(num) ? num : 0;
}

function engagementPost(p: Post): number {
  return p.likes + p.comments * 2 + p.saves * 2.5 + parseViews(p.views) / 8000;
}

export function tokensFromQuery(q: string): string[] {
  return q
    .toLowerCase()
    .trim()
    .replace(/[#,]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export type SearchCatalog = { posts: Post[]; creators: Creator[] };

export function buildPersonalizationSignals(
  args: {
    followedCreatorIds: string[];
    likedPostIds: string[];
    savedPostIds: string[];
    savedCreatorIds: string[];
    recentQueries: string[];
    followerCounts: Record<string, number>;
  },
  postsCatalog: Post[],
): PersonalizationSignals {
  const affinityTagSlugs = new Set<string>();
  const affinityCreatorIds = new Set<string>();
  for (const id of args.likedPostIds) {
    const p = postsCatalog.find((x) => x.id === id);
    if (p) {
      p.tags.forEach((t) => affinityTagSlugs.add(slugifyTag(t)));
      affinityCreatorIds.add(p.creatorId);
    }
  }
  for (const id of args.savedPostIds) {
    const p = postsCatalog.find((x) => x.id === id);
    if (p) {
      p.tags.forEach((t) => affinityTagSlugs.add(slugifyTag(t)));
      affinityCreatorIds.add(p.creatorId);
    }
  }
  for (const id of args.savedCreatorIds) {
    const c = resolveCreator(id);
    if (c) {
      c.tags.forEach((t) => affinityTagSlugs.add(slugifyTag(t)));
      affinityCreatorIds.add(c.id);
    }
  }
  return {
    followedCreatorIds: args.followedCreatorIds,
    likedPostIds: args.likedPostIds,
    savedPostIds: args.savedPostIds,
    savedCreatorIds: args.savedCreatorIds,
    followerCounts: args.followerCounts,
    affinityTagSlugs: [...affinityTagSlugs],
    affinityCreatorIds: [...affinityCreatorIds],
    recentQueries: args.recentQueries.slice(0, 12),
  };
}

function creatorTextScore(c: Creator, tokens: string[]): number {
  if (!tokens.length) return 0;
  const blob = `${c.username} ${c.displayName} ${c.bio} ${c.tags.join(" ")}`.toLowerCase();
  let s = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (c.username.toLowerCase().includes(t)) s += 12;
    else if (c.displayName.toLowerCase().includes(t)) s += 9;
    else if (blob.includes(t)) s += 5;
  }
  return s;
}

function postTextScore(p: Post, tokens: string[]): number {
  if (!tokens.length) return 0;
  const blob = `${p.caption} ${p.prompt} ${p.processNotes} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
  let s = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (p.prompt.toLowerCase().includes(t)) s += 8;
    else if (blob.includes(t)) s += 5;
  }
  return s;
}

function personalizedCreatorBoost(c: Creator, sig: PersonalizationSignals): { add: number; reason?: string } {
  if (sig.followedCreatorIds.includes(c.id)) return { add: 32, reason: "You follow" };
  if (sig.savedCreatorIds.includes(c.id)) return { add: 14, reason: "Saved creator" };
  if (sig.affinityCreatorIds.includes(c.id)) return { add: 18, reason: "Matches your taste" };
  if (c.tags.some((t) => sig.affinityTagSlugs.includes(slugifyTag(t)))) {
    return { add: 11, reason: "Similar to creators you engage with" };
  }
  return { add: 0 };
}

function personalizedPostBoost(p: Post, sig: PersonalizationSignals): { add: number; reason?: string } {
  if (sig.likedPostIds.includes(p.id)) return { add: 45, reason: "You liked this" };
  if (sig.savedPostIds.includes(p.id)) return { add: 40, reason: "In your saves" };
  if (sig.followedCreatorIds.includes(p.creatorId)) return { add: 24, reason: "From someone you follow" };
  if (p.tags.some((t) => sig.affinityTagSlugs.includes(slugifyTag(t)))) {
    return { add: 16, reason: "Because you engage with this aesthetic" };
  }
  return { add: 0 };
}

function popularityCreator(c: Creator, sig: PersonalizationSignals) {
  const fc = sig.followerCounts[c.id] ?? 0;
  return Math.log10(fc + 12) * 4.2;
}

function scoreCreator(c: Creator, tokens: string[], sig: PersonalizationSignals) {
  const text = creatorTextScore(c, tokens);
  const pop = popularityCreator(c, sig);
  const { add, reason } = personalizedCreatorBoost(c, sig);
  const freshness = tokens.length ? text * 7 : 0;
  const score = freshness + pop + add + (tokens.length ? 0 : add * 0.5);
  const showReason = tokens.length ? (text > 0 ? reason : add ? reason : undefined) : reason;
  const relevant = !tokens.length || text > 0 || add >= 12;
  return { creator: c, score, reason: showReason, relevant };
}

function scorePost(p: Post, tokens: string[], sig: PersonalizationSignals) {
  const text = postTextScore(p, tokens);
  const eng = engagementPost(p);
  const { add, reason } = personalizedPostBoost(p, sig);
  const freshnessBoost = parseViews(p.views) / 12000;
  const score = (tokens.length ? text * 6 : 0) + eng * 0.35 + add + freshnessBoost;
  const relevant = !tokens.length || text > 0 || add >= 14;
  return { post: p, score, reason: tokens.length ? (text > 0 || add ? reason : undefined) : reason, relevant };
}

export function buildTopicHits(postsList: Post[], creatorsList: Creator[]): TopicHit[] {
  const map = new Map<string, { label: string; posts: Post[]; creators: Set<string> }>();
  for (const p of postsList) {
    for (const tag of p.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;
      const cur = map.get(slug) ?? { label: tag, posts: [], creators: new Set<string>() };
      cur.posts.push(p);
      cur.creators.add(p.creatorId);
      if (!cur.label) cur.label = tag;
      map.set(slug, cur);
    }
  }
  for (const c of creatorsList) {
    for (const tag of c.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;
      const cur = map.get(slug) ?? { label: tag, posts: [], creators: new Set<string>() };
      cur.creators.add(c.id);
      map.set(slug, cur);
    }
  }

  const out: TopicHit[] = [];
  for (const [slug, v] of map) {
    const trendScore = v.posts.reduce((a, p) => a + engagementPost(p), 0);
    out.push({
      slug,
      label: v.label,
      postCount: v.posts.length,
      creatorCount: v.creators.size,
      trendScore,
    });
  }
  return out.sort((a, b) => b.trendScore - a.trendScore);
}

/** Topic index from seed catalog only — prefer `buildTopicHits` with merged posts in client flows. */
export function getTopicIndex(): TopicHit[] {
  return buildTopicHits(posts, creators);
}

function scoreTopics(tokens: string[], hits: TopicHit[]): TopicHit[] {
  if (!tokens.length) return [...hits].sort((a, b) => b.trendScore - a.trendScore);
  return hits
    .map((h) => {
      const blob = `${h.label} ${h.slug}`.toLowerCase();
      let match = 0;
      for (const t of tokens) {
        if (h.slug.includes(t) || blob.includes(t)) match += 10;
      }
      return { hit: h, sortKey: h.trendScore + match * 500000 };
    })
    .filter((x) => tokens.some((t) => x.hit.slug.includes(t) || `${x.hit.label} ${x.hit.slug}`.toLowerCase().includes(t)))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((x) => x.hit);
}

function filterPostsByTab(list: { post: Post; score: number; reason?: string; relevant: boolean }[], tab: SearchTab) {
  const rel = list.filter((x) => x.relevant);
  if (tab === "top" || tab === "posts") return rel;
  return rel.filter((x) => {
    const p = x.post;
    if (tab === "ai-videos") return p.feedTab === "ai-videos" && p.mediaType === "video";
    if (tab === "ai-photos") return p.feedTab === "ai-photos";
    if (tab === "real-life") return p.feedTab === "real-life";
    if (tab === "concept-drops") return Boolean(p.isConceptDrop);
    return true;
  });
}

function engagementAggregateForCreator(creatorId: string, catalogPosts: Post[]): number {
  return catalogPosts.filter((p) => p.creatorId === creatorId).reduce((a, p) => a + engagementPost(p), 0);
}

export function runSearch(
  query: string,
  tab: SearchTab,
  sig: PersonalizationSignals,
  catalog?: SearchCatalog,
): SearchSnapshot {
  const P = catalog?.posts ?? posts;
  const C = catalog?.creators ?? creators;
  const tokens = tokensFromQuery(query);
  const normalized = query.trim();
  const topicHits = buildTopicHits(P, C);

  const creatorRows = C
    .map((c) => scoreCreator(c, tokens, sig))
    .filter((r) => r.relevant)
    .sort((a, b) => b.score - a.score)
    .map(({ creator, score, reason }) => ({
      creator,
      score,
      reason,
    }));

  const postScored = P
    .map((p) => {
      const r = scorePost(p, tokens, sig);
      return { post: p, score: r.score, reason: r.reason, relevant: r.relevant };
    })
    .sort((a, b) => b.score - a.score);

  const postsForTab = filterPostsByTab(postScored, tab).map(({ post, score, reason }) => ({ post, score, reason }));

  const topicsRanked = tokens.length ? scoreTopics(tokens, topicHits) : [...topicHits].sort((a, b) => b.trendScore - a.trendScore);

  const boardsRaw = allMoodBoardsWithCreators();
  const boardsRanked: BoardHit[] =
    normalized.length > 0
      ? searchMoodBoards(normalized, boardsRaw).slice(0, 24)
      : [...boardsRaw]
          .map((b) => ({
            ...b,
            score: engagementAggregateForCreator(b.creator.id, P),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 16);

  let personalizedHint: string | undefined;
  if (sig.followedCreatorIds.length) {
    const c = resolveCreator(sig.followedCreatorIds[0]!);
    personalizedHint = c ? `Because you follow ${c.displayName}` : undefined;
  } else if (sig.affinityTagSlugs.length) {
    personalizedHint = `Because you engage with ${sig.affinityTagSlugs.slice(0, 2).join(" · ")} aesthetics`;
  } else if (sig.savedPostIds.length) {
    personalizedHint = "Based on your saved library";
  }

  const base: SearchSnapshot = {
    query: normalized,
    normalized: normalized.toLowerCase(),
    tokens,
    creators: creatorRows,
    posts: postScored.filter((x) => x.relevant).map(({ post, score, reason }) => ({ post, score, reason })),
    topics: topicsRanked.slice(0, 36),
    boards: boardsRanked,
    personalizedHint,
  };

  if (tab === "top") return base;
  if (tab === "creators") return { ...base, posts: [], topics: [], boards: [] };
  if (tab === "topics") return { ...base, creators: [], posts: [], boards: [] };
  if (tab === "boards") return { ...base, creators: [], posts: [], topics: [] };
  return {
    ...base,
    creators: [],
    topics: [],
    boards: [],
    posts: postsForTab,
  };
}
