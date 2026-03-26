"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { posts as seedPosts } from "@/lib/mock-data";
import type { ExploreFilter } from "@/lib/mock-data";
import type { Post } from "@/lib/types";
import {
  mergePostsForFeed,
  sortPostsForProfileGridWithUser,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";
import { cn } from "@/lib/cn";

function filterPosts(all: Post[], f: ExploreFilter) {
  if (f === "Trending")
    return all.slice().sort((a, b) => b.likes + b.saves * 2 - (a.likes + a.saves * 2));
  const key = f.toLowerCase();
  return all.filter(
    (p) =>
      p.category.toLowerCase() === key ||
      p.tags.some((t) => t.toLowerCase() === key) ||
      (f === "Animation" && p.tags.some((t) => t.toLowerCase() === "animation")),
  );
}

export function ExploreGrid({ activeFilter }: { activeFilter: ExploreFilter }) {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  const catalogPosts = useFeedCatalogStore((s) => s.posts);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const merged = useMemo(() => {
    const base = mergePostsForFeed(seedPosts, catalogPosts, userPosts);
    return sortPostsForProfileGridWithUser(base, userPosts);
  }, [userPosts, catalogPosts]);

  const list = useMemo(() => filterPosts(merged, activeFilter), [merged, activeFilter]);

  if (!merged.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-14 text-center">
        <p className="text-sm font-medium text-white/88">Nothing in the catalog yet</p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-white/45">
          When you and others publish, category filters and trending sort use real engagement only.
        </p>
        <Link
          href="/create"
          className="mt-5 inline-block text-sm font-semibold text-cyan-200/90 hover:text-cyan-100"
        >
          Create a post
        </Link>
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-sm text-white/55">No posts match this category yet.</p>
        <p className="mt-1 text-xs text-white/38">Try Trending or publish with matching tags.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
      {list.map((post, i) => {
        const hero = i === 0;
        const wide = !hero && i % 5 === 2;

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-24px" }}
            transition={{
              delay: Math.min(i * 0.035, 0.35),
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(hero && "col-span-2 md:col-span-3", wide && "col-span-2")}
          >
            <Link href={`/post/${post.id}`} className="tap-highlight-none block">
              <div
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                  "border-white/[0.08] hover:border-violet-400/35 hover:shadow-[0_0_28px_rgba(139,92,246,0.14)]",
                  hero ? "aspect-[4/3] md:aspect-[21/9]" : wide ? "aspect-[5/3]" : "aspect-[3/4]",
                )}
              >
                <Image
                  src={post.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.06] group-hover:brightness-110"
                  sizes={hero ? "(max-width:768px)100vw,80vw" : "(max-width:768px)45vw,25vw"}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_75%_18%,rgba(139,92,246,0.22),transparent_48%)]" />
                <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                  {post.mediaType === "video" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
                      <Play className="h-2.5 w-2.5 fill-current" />
                      Video
                    </span>
                  ) : null}
                  <span className="rounded-md border border-white/10 bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/55 backdrop-blur-md">
                    {post.feedTab === "real-life" ? "IRL" : "AI"}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  {hero ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/90">Latest</p>
                  ) : null}
                  <p className={cn("mt-1 line-clamp-2 text-sm font-medium text-white", hero && "md:text-base")}>
                    {post.caption}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
