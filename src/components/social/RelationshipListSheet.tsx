"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import type { Creator } from "@/lib/types";
import { GlowButton } from "@/components/ui/GlowButton";
import { listFollowerIds } from "@/lib/social/followGraph";
import { ME_ID, useInteractionsStore } from "@/lib/interactions/store";

type Tab = "followers" | "following";

function rowMatchesQuery(c: Creator, q: string) {
  if (!q.trim()) return true;
  const n = q.toLowerCase();
  return (
    c.displayName.toLowerCase().includes(n) ||
    c.username.toLowerCase().includes(n) ||
    c.bio.toLowerCase().includes(n) ||
    c.creatorCategory.toLowerCase().includes(n)
  );
}

export function RelationshipListSheet({
  subjectCreatorId,
  initialTab,
  onClose,
}: {
  subjectCreatorId: string;
  initialTab: Tab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");

  const followingByUserId = useInteractionsStore((s) => s.followingByUserId);
  const toggleFollow = useInteractionsStore((s) => s.toggleFollow);

  const followerIds = useMemo(
    () => listFollowerIds(subjectCreatorId, followingByUserId),
    [subjectCreatorId, followingByUserId],
  );
  const followingIds = useMemo(() => followingByUserId[subjectCreatorId] ?? [], [
    followingByUserId,
    subjectCreatorId,
  ]);

  const activeIds = tab === "followers" ? followerIds : followingIds;

  const rows = useMemo(() => {
    const out: Creator[] = [];
    for (const id of activeIds) {
      const c = getCreatorByIdResolved(id);
      if (c && rowMatchesQuery(c, query)) out.push(c);
    }
    return out;
  }, [activeIds, query]);

  const sheet = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative z-10 flex max-h-[min(88dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[var(--nomi-bg-deep)] shadow-[0_-20px_80px_rgba(0,0,0,0.55)] sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex flex-1 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            {(
              [
                ["followers", "Followers"],
                ["following", "Following"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-semibold transition",
                  tab === id ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75",
                )}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative border-b border-white/10 px-3 py-2">
          <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:border-violet-400/35 focus:outline-none"
          />
        </div>

        <ul className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
            {rows.map((c) => {
              const iFollow = (followingByUserId[ME_ID] ?? []).includes(c.id);
              const theyFollowMe = (followingByUserId[c.id] ?? []).includes(ME_ID);
              const showMutual = iFollow && theyFollowMe && c.id !== ME_ID;
              const followsYou = theyFollowMe && subjectCreatorId === ME_ID && c.id !== ME_ID;

              return (
                <li
                  key={c.id}
                  className="border-b border-white/[0.06] last:border-0"
                >
                  <div className="flex items-center gap-3 py-3">
                    <Link
                      href={`/profile/${encodeURIComponent(c.username)}`}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/12 tap-highlight-none"
                      onClick={onClose}
                    >
                      <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
                    </Link>
                    <Link
                      href={`/profile/${encodeURIComponent(c.username)}`}
                      className="min-w-0 flex-1 tap-highlight-none"
                      onClick={onClose}
                    >
                      <p className="truncate font-semibold text-white">{c.displayName}</p>
                      <p className="truncate text-xs text-white/45">@{c.username}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-white/40">{c.creatorCategory}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {followsYou ? (
                          <span className="rounded-md bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200/90">
                            Follows you
                          </span>
                        ) : null}
                        {showMutual ? (
                          <span className="rounded-md bg-violet-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200/90">
                            Mutual
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    {c.id !== ME_ID ? (
                      <GlowButton
                        type="button"
                        variant={iFollow ? "primary" : "ghost"}
                        className="shrink-0 px-3 py-2 text-xs"
                        onClick={() => toggleFollow(c.id)}
                      >
                        {iFollow ? "Following" : "Follow"}
                      </GlowButton>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">You</span>
                    )}
                  </div>
                </li>
              );
            })}
          {rows.length === 0 ? (
            <li className="py-12 text-center text-sm text-white/45">
              {query.trim() ? "No people match that search." : "No one here yet."}
            </li>
          ) : null}
        </ul>
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
