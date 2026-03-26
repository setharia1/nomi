"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";
import { buildPersonalizationSignals, buildTopicHits } from "@/lib/search/engine";
import { creators, posts as seedPosts } from "@/lib/mock-data";
import { useContentMemoryStore, sortPostsForProfileGrid } from "@/lib/content/contentMemoryStore";
import { ME_ID, useInteractionsStore } from "@/lib/interactions/store";
import { computeFollowerCounts } from "@/lib/social/followGraph";
import { CURATED_TOPIC_SLUGS } from "@/lib/search/constants";
import { ME_CREATOR_ID } from "@/lib/profile/meCreator";
import { rankForYouFeed } from "@/lib/feed/forYouRanking";

export function ExploreDiscoveryHub() {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);

  const hydrated = useInteractionsStore((s) => s.hydrated);
  const followingByUserId = useInteractionsStore((s) => s.followingByUserId);
  const likedPostIds = useInteractionsStore((s) => s.likedPostIds);
  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const savedCreatorIds = useInteractionsStore((s) => s.savedCreatorIds);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const catalog = useMemo(() => {
    const merged = useContentMemoryStore.getState().mergeWithSeed(seedPosts);
    return { posts: merged, creators };
  }, [userPosts]);

  const meFollowing = followingByUserId[ME_ID] ?? [];

  const sig = useMemo(
    () =>
      buildPersonalizationSignals(
        {
          followedCreatorIds: hydrated ? meFollowing : [],
          likedPostIds: hydrated ? likedPostIds : [],
          savedPostIds: hydrated ? savedPostIds : [],
          savedCreatorIds: hydrated ? savedCreatorIds : [],
          recentQueries: [],
          followerCounts: computeFollowerCounts(followingByUserId),
        },
        catalog.posts,
      ),
    [
      hydrated,
      meFollowing,
      likedPostIds,
      savedPostIds,
      savedCreatorIds,
      followingByUserId,
      catalog.posts,
    ],
  );

  const topicHits = useMemo(() => buildTopicHits(catalog.posts, catalog.creators), [catalog]);
  const latest = useMemo(() => sortPostsForProfileGrid(catalog.posts).slice(0, 12), [catalog.posts]);
  const forYouExplore = useMemo(() => {
    const others = catalog.posts.filter((p) => p.creatorId !== ME_CREATOR_ID);
    if (!others.length) return [];
    return rankForYouFeed(others, sig).slice(0, 8);
  }, [catalog.posts, sig]);

  if (!catalog.posts.length) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-10 text-center sm:px-8 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(139, 92, 246, 0.1), transparent 60%)",
          }}
          aria-hidden
        />
        <Sparkles className="mx-auto h-8 w-8 text-cyan-200/80" strokeWidth={1.5} />
        <h2 className="mt-4 font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
          Discovery is quiet — for now
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
          Publish your first signal and Nomi will index topics, tags, and grids from real work — no placeholder tiles.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500/88 to-cyan-500/40 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.2)]"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--nomi-section-gap)]">
      {topicHits.length ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-300/90" strokeWidth={2} />
            <h2 className="nomi-section-title">From your network</h2>
          </div>
          <p className="text-xs text-white/45">Topic tags indexed from published posts only.</p>
          <div className="flex flex-wrap gap-2">
            {topicHits.slice(0, 12).map((t, i) => (
              <motion.div
                key={t.slug}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/explore/topic/${encodeURIComponent(t.slug)}`}
                  className="inline-flex rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/78 transition-colors hover:border-violet-400/28"
                >
                  #{t.label}
                  <span className="ml-1.5 text-white/35">{t.postCount}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="nomi-section-title">Latest signals</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {latest.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.04, 0.2) }}
            >
              <Link
                href={`/post/${p.id}`}
                className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-white/10 tap-highlight-none"
              >
                <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="200px" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-[11px] font-medium text-white">{p.caption}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {forYouExplore.length ? (
        <section className="space-y-3">
          <h2 className="nomi-section-title">For you</h2>
          <p className="text-xs text-white/45">Other creators’ posts across the network, ranked from real signals only.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {forYouExplore.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="relative aspect-square overflow-hidden rounded-xl border border-white/10 tap-highlight-none"
              >
                <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="120px" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {CURATED_TOPIC_SLUGS.length ? (
        <section className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.05] via-transparent to-cyan-400/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Editorial hubs</p>
          <p className="mt-1 text-xs text-white/45">Curated topic pages — they fill in as real posts tag in.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CURATED_TOPIC_SLUGS.slice(0, 6).map((c) => (
              <Link
                key={c.slug}
                href={`/explore/topic/${encodeURIComponent(c.slug)}`}
                className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-white/80 hover:border-cyan-400/35"
              >
                #{c.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
