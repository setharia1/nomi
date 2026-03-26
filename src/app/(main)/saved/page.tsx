"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlowButton } from "@/components/ui/GlowButton";
import type { Creator, MoodBoard, Post } from "@/lib/types";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { useInteractionsStore } from "@/lib/interactions/store";
import { findMergedPostById, useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";

export default function SavedPage() {
  const hydrateContent = useContentMemoryStore((s) => s.hydrate);
  const userPostsBump = useContentMemoryStore((s) => s.userPosts);
  const catalogPosts = useFeedCatalogStore((s) => s.posts);

  useEffect(() => {
    hydrateContent();
  }, [hydrateContent]);

  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const savedCreatorIds = useInteractionsStore((s) => s.savedCreatorIds);
  const savedMoodBoardIds = useInteractionsStore((s) => s.savedMoodBoardIds);
  const unsaveMoodBoard = useInteractionsStore((s) => s.unsaveMoodBoard);
  const unsaveCreator = useInteractionsStore((s) => s.unsaveCreator);

  const savedPosts = useMemo(
    () =>
      savedPostIds
        .map((id) => findMergedPostById(id, catalogPosts, userPostsBump))
        .filter((p): p is Post => Boolean(p)),
    [savedPostIds, userPostsBump, catalogPosts],
  );
  const savedCreators = useMemo(
    () => savedCreatorIds.map((id) => getCreatorByIdResolved(id)).filter(Boolean) as Creator[],
    [savedCreatorIds],
  );
  const savedBoards = useMemo<MoodBoard[]>(() => {
    void savedMoodBoardIds;
    return [];
  }, [savedMoodBoardIds]);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Collections"
        title="Saved library"
        description="Posts, creators, and mood boards you want to keep close — calm, premium archive."
      />

      {savedPosts.length || savedBoards.length ? (
        <section className="space-y-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="nomi-surface-card p-3.5">
              <p className="nomi-section-label">Saved posts</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{savedPosts.length}</p>
            </div>
            <div className="nomi-surface-card p-3.5">
              <p className="nomi-section-label">Mood boards</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{savedBoards.length}</p>
            </div>
            <div className="nomi-surface-card p-3.5">
              <p className="nomi-section-label">Saved creators</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{savedCreators.length}</p>
            </div>
          </div>
        </section>
      ) : null}

      {savedPosts.length ? (
        <section className="space-y-3">
          <h2 className="nomi-section-label px-0.5">Saved posts</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {savedPosts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link
                  href={`/post/${p.id}`}
                  className="group relative block aspect-square overflow-hidden rounded-lg border border-white/[0.08] bg-black hover:border-violet-400/28"
                >
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
                    sizes="120px"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      {savedBoards.length ? (
        <section className="space-y-3">
          <h2 className="nomi-section-label px-0.5">Mood boards</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedBoards.map((b: MoodBoard) => (
              <div key={b.id} className="nomi-surface-card hover:border-violet-400/22 p-3 transition-colors">
                <div className="flex gap-1 rounded-xl overflow-hidden h-24">
                  {b.coverUrls.slice(0, 3).map((u, idx) => (
                    <div key={idx} className="relative flex-1 min-w-0 h-full">
                      <Image src={u} alt="" fill className="object-cover" sizes="120px" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-semibold text-white/90">{b.title}</p>
                <p className="text-xs text-white/45 mt-0.5">{b.itemCount} references</p>
                <div className="mt-3">
                  <GlowButton
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      unsaveMoodBoard(b.id);
                    }}
                  >
                    Remove
                  </GlowButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {savedCreators.length ? (
        <section className="space-y-3">
          <h2 className="nomi-section-label px-0.5">Saved creators</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {savedCreators.map((c) => (
              <div key={c.id} className="nomi-surface-card p-3">
                <Link href={`/profile/${encodeURIComponent(c.username)}`}>
                  <div className="flex items-center gap-3">
                    <span className="relative h-11 w-11 overflow-hidden rounded-lg border border-white/[0.08] bg-black">
                      <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/90">{c.displayName}</p>
                      <p className="truncate text-[11px] text-white/45">@{c.username}</p>
                    </span>
                  </div>
                </Link>
                <div className="mt-3">
                  <GlowButton
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      unsaveCreator(c.id);
                    }}
                  >
                    Unsave
                  </GlowButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!(savedPosts.length || savedBoards.length || savedCreators.length) ? (
        <div className="nomi-surface-card px-6 py-10 text-center">
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">No saved signals yet</p>
          <p className="mt-2 text-sm text-white/50">
            Save posts, creators, and mood boards — your library fills in as you browse.
          </p>
          <div className="mt-5">
            <Link href="/home">
              <GlowButton type="button">Explore now</GlowButton>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

