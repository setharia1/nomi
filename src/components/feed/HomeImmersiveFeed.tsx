"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeedTab } from "@/lib/types";
import { FeedTabBar } from "./FeedTabBar";
import { ImmersivePostSlide } from "./ImmersivePostSlide";
import {
  selectHomeFeedPostsSeed,
  selectHomeFeedPostsShuffled,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { useFeedPlaybackStore } from "@/lib/media/feedPlaybackStore";
import Link from "next/link";
import { GlowButton } from "@/components/ui/GlowButton";

export function HomeImmersiveFeed() {
  const [tab, setTab] = useState<FeedTab>("ai-videos");
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  /** Avoid hydration mismatch: SSR has no local user posts until after mount. */
  const [feedMergedSynced, setFeedMergedSynced] = useState(false);
  /** Bumps when tab changes so the home order re-shuffles (new random sequence). */
  const [shuffleGen, setShuffleGen] = useState(0);

  useEffect(() => {
    hydrate();
    useFeedPlaybackStore.getState().hydrate();
    setFeedMergedSynced(true);
  }, [hydrate]);

  useEffect(() => {
    setShuffleGen((g) => g + 1);
  }, [tab, feedMergedSynced]);

  const list = useMemo(() => {
    if (!feedMergedSynced) return selectHomeFeedPostsSeed(tab);
    return selectHomeFeedPostsShuffled(tab, shuffleGen);
  }, [tab, userPosts, feedMergedSynced, shuffleGen]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col w-full">
      <div className="pointer-events-none absolute left-0 right-0 z-30 top-[calc(env(safe-area-inset-top)+3.5rem)] flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto w-full max-w-md px-2 sm:px-3 md:max-w-lg"
        >
          <FeedTabBar value={tab} onChange={setTab} />
        </motion.div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-scroll scroll-smooth snap-y snap-mandatory overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-nomi-feed-scroll
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0.001 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.001 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-col"
          >
            {list.length === 0 ? (
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
                    Waiting on the network
                  </p>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/48">
                    Your home feed only shows other creators — nothing from your account. When more people publish in
                    this tab, new drops will appear here in a fresh random order.
                  </p>
                  <div className="relative mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                    <Link href="/explore" className="sm:min-w-[11rem]">
                      <GlowButton type="button" className="w-full justify-center">
                        Explore creators
                      </GlowButton>
                    </Link>
                    <Link href={`/profile/${encodeURIComponent("you")}`} className="sm:min-w-[11rem]">
                      <GlowButton type="button" variant="ghost" className="w-full justify-center border-white/12">
                        Your profile
                      </GlowButton>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              list.map((post) => <ImmersivePostSlide key={`${tab}-${post.id}`} post={post} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
