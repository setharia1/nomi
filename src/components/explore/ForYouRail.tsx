"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { posts as seedPosts } from "@/lib/mock-data";
import { mergePostsForFeed, useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { buildForYouStream } from "@/lib/feed/forYouRanking";
import { buildPersonalizationSignals } from "@/lib/search/engine";
import { useMeId } from "@/lib/auth/meId";
import { useInteractionsStore } from "@/lib/interactions/store";
import { computeFollowerCounts } from "@/lib/social/followGraph";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";

export function ForYouRail() {
  const meId = useMeId();
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  const catalogPosts = useFeedCatalogStore((s) => s.posts);

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

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const merged = useMemo(
    () => mergePostsForFeed(seedPosts, catalogPosts, userPosts),
    [userPosts, catalogPosts],
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
        merged,
      ),
    [
      intHydrated,
      meFollowing,
      likedPostIds,
      savedPostIds,
      savedCreatorIds,
      followerCounts,
      merged,
    ],
  );

  const mergedKey = useMemo(
    () =>
      [...merged]
        .map((p) => p.id)
        .sort()
        .join(","),
    [merged],
  );
  const [streamSalt, setStreamSalt] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  useEffect(() => {
    queueMicrotask(() => setStreamSalt((n) => n + 1));
  }, [mergedKey]);

  const list = useMemo(() => {
    if (!merged.length) return [];
    return buildForYouStream(merged, sig, streamSalt).slice(0, 12);
  }, [merged, sig, streamSalt]);

  if (!list.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">For you</h2>
          <p className="mt-0.5 text-xs text-white/45">
            Your media and the network’s—personalized, with fresh uploads mixed into the stream
          </p>
        </div>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {list.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="w-[72%] max-w-[280px] flex-shrink-0 snap-start"
          >
            <Link href={`/post/${post.id}`} className="group block tap-highlight-none">
              <GlassPanel className="overflow-hidden border-white/[0.08] p-0 shadow-[0_0_24px_rgba(56,189,248,0.06)] transition-colors hover:border-cyan-400/35">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-semibold text-white line-clamp-2">{post.caption}</p>
                  </div>
                </div>
              </GlassPanel>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
