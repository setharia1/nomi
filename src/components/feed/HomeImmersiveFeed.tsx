"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeedTab } from "@/lib/types";
import { FeedScopeBar, type FeedScope } from "./FeedScopeBar";
import { FeedTabBar } from "./FeedTabBar";
import { ImmersivePostSlide } from "./ImmersivePostSlide";
import {
  mergePostsForFeed,
  selectFollowingPoolFromMerged,
  selectForYouPoolFromMerged,
  selectHomeFeedPostsSeed,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { useFeedPlaybackStore } from "@/lib/media/feedPlaybackStore";
import Link from "next/link";
import { GlowButton } from "@/components/ui/GlowButton";
import { useMeId } from "@/lib/auth/meId";
import { useInteractionsStore } from "@/lib/interactions/store";
import { computeFollowerCounts } from "@/lib/social/followGraph";
import { buildPersonalizationSignals } from "@/lib/search/engine";
import { feedTabLabels, posts as seedPosts } from "@/lib/mock-data";
import { buildForYouStream, sortFollowingFeed } from "@/lib/feed/forYouRanking";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";

export function HomeImmersiveFeed() {
  const meId = useMeId();
  const catalogPosts = useFeedCatalogStore((s) => s.posts);
  const [scope, setScope] = useState<FeedScope>("for-you");
  const [tab, setTab] = useState<FeedTab>("ai-videos");
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  const [feedMergedSynced, setFeedMergedSynced] = useState(false);
  /** Bumps when your publishes change or you switch tab/scope so the For You order reshuffles. */
  const [streamSalt, setStreamSalt] = useState(() => Math.floor(Math.random() * 1_000_000_000));

  const intHydrated = useInteractionsStore((s) => s.hydrated);
  const followingByUserId = useInteractionsStore((s) => s.followingByUserId);
  const likedPostIds = useInteractionsStore((s) => s.likedPostIds);
  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const savedCreatorIds = useInteractionsStore((s) => s.savedCreatorIds);

  const meFollowing = useMemo(
    () => followingByUserId[meId ?? ""] ?? [],
    [followingByUserId, meId],
  );
  const followerCounts = useMemo(() => computeFollowerCounts(followingByUserId), [followingByUserId]);

  const mergedPosts = useMemo(
    () => mergePostsForFeed(seedPosts, catalogPosts, userPosts),
    [catalogPosts, userPosts],
  );

  const sig = useMemo(
    () =>
      buildPersonalizationSignals(
        {
          followedCreatorIds: intHydrated ? meFollowing : [],
          likedPostIds: intHydrated ? likedPostIds : [],
          savedPostIds: intHydrated ? savedPostIds : [],
          savedCreatorIds: intHydrated ? savedCreatorIds : [],
          recentQueries: [],
          followerCounts,
        },
        mergedPosts,
      ),
    [
      intHydrated,
      meFollowing,
      likedPostIds,
      savedPostIds,
      savedCreatorIds,
      followerCounts,
      mergedPosts,
    ],
  );

  const userPostSignature = useMemo(
    () => userPosts.map((p) => `${p.id}:${p.publishedAt ?? 0}`).join("|"),
    [userPosts],
  );

  useEffect(() => {
    hydrate();
    useFeedPlaybackStore.getState().hydrate();
    queueMicrotask(() => setFeedMergedSynced(true));
  }, [hydrate]);

  useEffect(() => {
    queueMicrotask(() => setStreamSalt((n) => n + 1));
  }, [tab, scope, userPostSignature]);

  const list = useMemo(() => {
    if (!feedMergedSynced) return selectHomeFeedPostsSeed();
    if (scope === "for-you") {
      const pool = selectForYouPoolFromMerged(mergedPosts, tab);
      return buildForYouStream(pool, sig, streamSalt);
    }
    const pool = selectFollowingPoolFromMerged(mergedPosts, tab, meFollowing);
    return sortFollowingFeed(pool);
  }, [feedMergedSynced, scope, tab, mergedPosts, meFollowing, sig, streamSalt]);

  const emptyForYou = scope === "for-you" && list.length === 0;
  const emptyFollowing = scope === "following" && list.length === 0;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col w-full">
      <div className="pointer-events-none absolute left-0 right-0 z-30 top-[calc(env(safe-area-inset-top)+3.5rem)] flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto flex w-full max-w-md flex-col gap-2 px-2 sm:px-3 md:max-w-lg"
        >
          <FeedScopeBar value={scope} onChange={setScope} />
          <FeedTabBar value={tab} onChange={setTab} />
        </motion.div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-scroll scroll-smooth snap-y snap-mandatory overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-nomi-feed-scroll
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${scope}-${tab}`}
            initial={{ opacity: 0.001 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.001 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-col"
          >
            {emptyForYou ? (
              <div className="flex h-[100dvh] snap-start flex-col items-center justify-center px-6 text-center nomi-ambient-soft">
                <div className="relative max-w-md overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-10 sm:px-10 sm:py-12">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                      background:
                        "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(139, 92, 246, 0.12), transparent 60%)",
                    }}
                    aria-hidden
                  />
                  <p className="relative font-[family-name:var(--font-syne)] text-xl font-bold text-white sm:text-2xl">
                    Nothing in {feedTabLabels[tab]} yet
                  </p>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/48">
                    For you brings every real publish in this category into one stream—with fresh uploads and new
                    generations mixed in automatically. Publish a clip or photo here and it will show up in this tab.
                  </p>
                  <div className="relative mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                    <Link href="/explore" className="sm:min-w-[11rem]">
                      <GlowButton type="button" className="w-full justify-center">
                        Explore the network
                      </GlowButton>
                    </Link>
                    <Link href="/create" className="sm:min-w-[11rem]">
                      <GlowButton type="button" variant="ghost" className="w-full justify-center border-white/12">
                        Publish a signal
                      </GlowButton>
                    </Link>
                  </div>
                </div>
              </div>
            ) : emptyFollowing ? (
              <div className="flex h-[100dvh] snap-start flex-col items-center justify-center px-6 text-center nomi-ambient-soft">
                <div className="relative max-w-md overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-10 sm:px-10 sm:py-12">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                      background:
                        "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(56, 189, 248, 0.1), transparent 60%)",
                    }}
                    aria-hidden
                  />
                  <p className="relative font-[family-name:var(--font-syne)] text-xl font-bold text-white sm:text-2xl">
                    Following is quiet
                  </p>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/48">
                    This tab only shows posts from people you follow — in order of what’s newest. Follow more creators
                    (or wait until they publish in this format) to fill this feed.
                  </p>
                  <div className="relative mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                    <Link href="/search" className="sm:min-w-[11rem]">
                      <GlowButton type="button" className="w-full justify-center">
                        Find people
                      </GlowButton>
                    </Link>
                    <GlowButton
                      type="button"
                      variant="ghost"
                      className="w-full justify-center border-white/12 sm:min-w-[11rem]"
                      onClick={() => setScope("for-you")}
                    >
                      Back to For you
                    </GlowButton>
                  </div>
                </div>
              </div>
            ) : (
              list.map((post) => <ImmersivePostSlide key={`${scope}-${tab}-${post.id}`} post={post} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
