"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Compass } from "lucide-react";
import { CURATED_TOPIC_SLUGS } from "@/lib/search/constants";
import { topicSlugFromPathSegment, slugifyTag } from "@/lib/search/slug";
import { creators, posts as seedPosts } from "@/lib/mock-data";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Creator, Post } from "@/lib/types";
import { buildTopicHits } from "@/lib/search/engine";
import { useContentMemoryStore } from "@/lib/content/contentMemoryStore";

function relatedTags(topicPosts: Post[], excludeSlug: string, take = 12) {
  const counts = new Map<string, number>();
  for (const p of topicPosts) {
    for (const t of p.tags) {
      const s = slugifyTag(t);
      if (!s || s === excludeSlug) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([slug]) => slug);
}

function creatorsForTopic(topicPosts: Post[]) {
  const byCreator = new Map<string, Post[]>();
  for (const p of topicPosts) {
    const list = byCreator.get(p.creatorId) ?? [];
    list.push(p);
    byCreator.set(p.creatorId, list);
  }
  return [...byCreator.entries()]
    .map(([id, list]) => {
      const c = getCreatorByIdResolved(id);
      if (!c) return null;
      const heat = list.reduce((a, p) => a + p.likes, 0);
      return { creator: c, heat, topPost: list.slice().sort((a, b) => b.likes - a.likes)[0] };
    })
    .filter(Boolean) as { creator: Creator; heat: number; topPost: Post }[];
}

export function TopicHubClient({ slug: raw }: { slug: string }) {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const catalogPosts = useMemo(() => useContentMemoryStore.getState().mergeWithSeed(seedPosts), [userPosts]);

  const key = topicSlugFromPathSegment(raw);
  const curated = CURATED_TOPIC_SLUGS.find((c) => c.slug === key);
  const topicHit = useMemo(() => buildTopicHits(catalogPosts, creators).find((t) => t.slug === key), [catalogPosts, key]);
  const topicPosts = useMemo(
    () => catalogPosts.filter((p) => p.tags.some((tag) => slugifyTag(tag) === key)),
    [catalogPosts, key],
  );

  if (!topicHit && topicPosts.length === 0 && !curated) {
    notFound();
  }

  const label =
    topicHit?.label ??
    curated?.label ??
    key
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  const blurb = curated?.blurb;
  const rankedCreators = creatorsForTopic(topicPosts);
  const related = relatedTags(topicPosts, key);
  const topPosts = topicPosts.slice().sort((a, b) => b.likes - a.likes);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <div className="flex items-start gap-3">
        <Link
          href="/search"
          className="mt-0.5 rounded-lg border border-white/[0.09] bg-white/[0.03] p-2 text-white/65 transition-colors hover:border-violet-400/25 hover:text-white"
          aria-label="Back to search"
        >
          <ArrowLeft className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1">
          <PageHeader kicker="Topic hub" title={`#${label}`} description={blurb ?? undefined} />
          {topicHit || topicPosts.length > 0 ? (
            <p className="mt-2 text-xs text-white/42">
              {topicHit?.postCount ?? topicPosts.length} posts · {topicHit?.creatorCount ?? rankedCreators.length}{" "}
              creators
            </p>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.05] via-transparent to-cyan-400/[0.04] p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          <Compass className="h-4 w-4 text-cyan-300/90" strokeWidth={2} />
          Search next
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {related.length > 0
            ? related.slice(0, 5).map((slug) => (
                <Link
                  key={slug}
                  href={`/explore/topic/${encodeURIComponent(slug)}`}
                  className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-white/80 hover:border-cyan-400/35"
                >
                  #{slug.replace(/-/g, " ")}
                </Link>
              ))
            : null}
          {!related.length ? (
            <Link
              href="/search"
              className="rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 hover:border-violet-400/45"
            >
              Open search
            </Link>
          ) : null}
        </div>
      </section>

      {rankedCreators.length ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">Creators</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rankedCreators.slice(0, 8).map(({ creator, topPost }) => (
              <Link
                key={creator.id}
                href={`/profile/${encodeURIComponent(creator.username)}`}
                className="w-40 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] tap-highlight-none"
              >
                <div className="relative aspect-square">
                  <Image src={topPost.imageUrl} alt="" fill className="object-cover" sizes="160px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="truncate text-xs font-semibold text-white">{creator.displayName}</p>
                    <p className="truncate text-[10px] text-white/55">@{creator.username}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">Related tags</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((s) => (
              <Link
                key={s}
                href={`/explore/topic/${encodeURIComponent(s)}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 hover:border-violet-400/35"
              >
                #{s.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">Top posts</h2>
        {topPosts.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {topPosts.map((p) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 tap-highlight-none"
              >
                <Image
                  src={p.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="200px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="line-clamp-2 text-[11px] font-medium text-white">{p.caption}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-white/45">
            No posts with this tag yet. Try a{" "}
            <Link href="/search" className="text-violet-300 hover:underline">
              search
            </Link>{" "}
            or publish with this tag from Create.
          </div>
        )}
      </section>

      {creators.filter((c) => c.tags.some((t) => slugifyTag(t) === key)).length ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">Profiles</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {creators
              .filter((c) => c.tags.some((t) => slugifyTag(t) === key))
              .slice(0, 6)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/profile/${encodeURIComponent(c.username)}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 hover:border-violet-400/25"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10">
                    <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{c.displayName}</p>
                    <p className="truncate text-xs text-white/45">@{c.username}</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
