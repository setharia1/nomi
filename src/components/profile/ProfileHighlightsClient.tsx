"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  mergePostsForFeed,
  selectPostsForCreatorFromMerged,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { posts as seedPosts } from "@/lib/mock-data";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";

export function ProfileHighlightsClient({
  creatorId,
}: {
  creatorId: string;
}) {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  const catalogPosts = useFeedCatalogStore((s) => s.posts);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const topPosts = useMemo(() => {
    const merged = mergePostsForFeed(seedPosts, catalogPosts, userPosts);
    return selectPostsForCreatorFromMerged(merged, creatorId, userPosts)
      .slice()
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 4);
  }, [creatorId, userPosts, catalogPosts]);

  if (!topPosts.length) {
    return <p className="mt-2 text-sm text-white/45">Publish posts to see engagement-ranked highlights.</p>;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {topPosts.map((p) => (
        <Link
          key={p.id}
          href={`/post/${p.id}`}
          className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/25 transition-colors hover:border-violet-400/35"
        >
          <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="120px" />
        </Link>
      ))}
    </div>
  );
}
