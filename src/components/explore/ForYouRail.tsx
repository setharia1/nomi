"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { posts as seedPosts } from "@/lib/mock-data";
import { useContentMemoryStore, sortPostsForProfileGrid } from "@/lib/content/contentMemoryStore";

export function ForYouRail() {
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPosts = useContentMemoryStore((s) => s.userPosts);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const list = useMemo(() => {
    const merged = useContentMemoryStore.getState().mergeWithSeed(seedPosts);
    return sortPostsForProfileGrid(merged).slice(0, 12);
  }, [userPosts]);

  if (!list.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">For you</h2>
          <p className="mt-0.5 text-xs text-white/45">Fresh posts from the network, newest first</p>
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
