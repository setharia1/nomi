"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreatorBadge } from "@/components/badges/CreatorBadge";
import { GlowButton } from "@/components/ui/GlowButton";
import { cn } from "@/lib/cn";
import { useMeId } from "@/lib/auth/meId";
import { useInteractionsStore } from "@/lib/interactions/store";
import { useHydrationSafeCreator } from "@/lib/profile/useHydrationSafeCreator";
import type { Creator } from "@/lib/types";

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function CreatorSearchRow({
  creator,
  reason,
  previewTags,
  className,
}: {
  creator: Creator;
  reason?: string;
  previewTags?: string[];
  className?: string;
}) {
  const meId = useMeId();
  const displayCreator = useHydrationSafeCreator(creator);
  const isFollowing = useInteractionsStore((s) => s.isFollowing(creator.id));
  const toggleFollow = useInteractionsStore((s) => s.toggleFollow);
  const followerCount = useInteractionsStore((s) => s.getFollowerCount(creator.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group rounded-2xl border border-white/[0.09] bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(139,92,246,0.04)] backdrop-blur-sm transition-all hover:border-violet-400/25 hover:shadow-[0_0_32px_rgba(139,92,246,0.12)]",
        className,
      )}
    >
      <div className="flex gap-3 items-start">
        <Link
          href={`/profile/${encodeURIComponent(displayCreator.username)}`}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 ring-1 ring-white/5 tap-highlight-none"
        >
          <Image src={displayCreator.avatarUrl} alt="" fill className="object-cover" sizes="56px" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${encodeURIComponent(displayCreator.username)}`} className="tap-highlight-none">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-semibold text-white">{displayCreator.displayName}</span>
              <CreatorBadge verified={displayCreator.isVerified} premium={displayCreator.isPremium} />
            </div>
            <p className="truncate text-xs text-white/45">@{displayCreator.username}</p>
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/70">
              {displayCreator.creatorCategory}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              {formatFollowers(followerCount)} followers
            </span>
            {displayCreator.tags[0] ? (
              <span className="rounded-lg bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200/90">
                {displayCreator.tags[0]}
              </span>
            ) : null}
          </div>
          {reason ? (
            <p className="mt-1 text-[11px] font-medium text-violet-200/80">{reason}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{displayCreator.bio}</p>
          {previewTags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {previewTags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-white/50"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {creator.id !== meId ? (
          <GlowButton
            type="button"
            variant={isFollowing ? "primary" : "ghost"}
            className="shrink-0 px-3 py-2 text-xs"
            onClick={() => toggleFollow(creator.id)}
          >
            {isFollowing ? "Following" : "Follow"}
          </GlowButton>
        ) : null}
      </div>
    </motion.div>
  );
}
