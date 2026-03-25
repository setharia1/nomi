import { creators } from "@/lib/mock-data";
import type { Post } from "@/lib/types";
import { TRENDING_SEARCHES } from "./constants";
import { buildTopicHits } from "./engine";
import type { PersonalizationSignals } from "./types";
import { slugifyTag } from "./slug";

export type SuggestionKind = "creator" | "topic" | "phrase" | "trend" | "recent";

export type SearchSuggestion = {
  id: string;
  kind: SuggestionKind;
  label: string;
  subtitle?: string;
  slug?: string;
  username?: string;
};

function matchHaystack(hay: string, prefix: string): boolean {
  return hay.includes(prefix);
}

export function getAutocompleteSuggestions(args: {
  prefix: string;
  sig: PersonalizationSignals;
  recents: string[];
  postsCatalog: Post[];
  limit?: number;
}): SearchSuggestion[] {
  const limit = args.limit ?? 8;
  const p = args.prefix.trim().toLowerCase();
  const out: SearchSuggestion[] = [];

  if (!p) {
    for (const q of args.recents.slice(0, 3)) {
      out.push({ id: `r-${q}`, kind: "recent", label: q, subtitle: "Recent" });
    }
    for (const q of TRENDING_SEARCHES.slice(0, 4)) {
      if (out.length >= limit) break;
      out.push({ id: `t-${q}`, kind: "trend", label: q, subtitle: "Trending" });
    }
    const followed = creators.filter((c) => args.sig.followedCreatorIds.includes(c.id)).slice(0, 2);
    for (const c of followed) {
      if (out.length >= limit) break;
      out.push({
        id: `fc-${c.id}`,
        kind: "creator",
        label: c.displayName,
        subtitle: `@${c.username}`,
        username: c.username,
      });
    }
    return out.slice(0, limit);
  }

  for (const q of args.recents) {
    if (out.length >= limit) break;
    if (q.toLowerCase().includes(p)) {
      out.push({ id: `r-${q}`, kind: "recent", label: q, subtitle: "Recent" });
    }
  }

  for (const c of creators) {
    if (out.length >= limit) break;
    const hay = `${c.displayName} ${c.username} ${c.bio}`.toLowerCase();
    if (!matchHaystack(hay, p)) continue;
    const boost = args.sig.followedCreatorIds.includes(c.id) ? "Following" : "Creator";
    out.push({
      id: `c-${c.id}`,
      kind: "creator",
      label: c.displayName,
      subtitle: `@${c.username} · ${boost}`,
      username: c.username,
    });
  }

  const topics = buildTopicHits(args.postsCatalog, creators);
  for (const t of topics) {
    if (out.length >= limit) break;
    const blob = `${t.label} ${t.slug}`.toLowerCase();
    if (!blob.includes(p)) continue;
    out.push({
      id: `topic-${t.slug}`,
      kind: "topic",
      label: t.label,
      subtitle: `${t.postCount} signals · topic`,
      slug: t.slug,
    });
  }

  for (const post of args.postsCatalog) {
    if (out.length >= limit) break;
    const tagHit = post.tags.find((tag) => slugifyTag(tag).includes(p) || tag.toLowerCase().includes(p));
    if (!tagHit) continue;
    out.push({
      id: `tag-${post.id}-${tagHit}`,
      kind: "phrase",
      label: `#${tagHit}`,
      subtitle: "From the network",
    });
  }

  for (const phrase of TRENDING_SEARCHES) {
    if (out.length >= limit) break;
    if (!phrase.toLowerCase().includes(p)) continue;
    if (out.some((x) => x.kind === "trend" && x.label === phrase)) continue;
    out.push({ id: `tr-${phrase}`, kind: "trend", label: phrase, subtitle: "Trending" });
  }

  return out
    .filter((x, i, a) => a.findIndex((y) => y.label.toLowerCase() === x.label.toLowerCase() && y.kind === x.kind) === i)
    .slice(0, limit);
}
