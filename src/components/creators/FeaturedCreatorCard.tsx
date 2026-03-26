"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreatorBadge } from "@/components/badges/CreatorBadge";
import { GlowButton } from "@/components/ui/GlowButton";
import type { Creator } from "@/lib/types";
import { useInteractionsStore, ME_ID } from "@/lib/interactions/store";
import { useHydrationSafeCreator } from "@/lib/profile/useHydrationSafeCreator";

export function FeaturedCreatorCard({ creator: creatorProp }: { creator: Creator }) {
  const creator = useHydrationSafeCreator(creatorProp);
  const isFollowing = useInteractionsStore((s) => s.isFollowing(creator.id));
  const toggleFollow = useInteractionsStore((s) => s.toggleFollow);
  const followerCount = useInteractionsStore((s) => s.getFollowerCount(creator.id));

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
      <div className="nomi-surface-card border-violet-400/14 p-3.5 transition-colors hover:border-violet-400/26">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/profile/${encodeURIComponent(creator.username)}`}
            className="flex min-w-0 items-center gap-3 tap-highlight-none"
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/12">
              <Image src={creator.avatarUrl} alt="" fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white truncate">{creator.displayName}</span>
                <CreatorBadge verified={creator.isVerified} premium={creator.isPremium} />
              </div>
              <p className="text-xs text-white/50 mt-0.5">@{creator.username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-white/65">
                  {creator.creatorCategory}
                </span>
                <span className="text-[10px] text-white/40">{followerCount.toLocaleString()} followers</span>
              </div>
            </div>
          </Link>
          {creator.id !== ME_ID ? (
            <div className="shrink-0 pt-1">
              <GlowButton
                type="button"
                variant={isFollowing ? "primary" : "ghost"}
                className="px-4"
                onClick={() => toggleFollow(creator.id)}
              >
                {isFollowing ? "Following" : "Follow"}
              </GlowButton>
            </div>
          ) : null}
        </div>
        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-white/60">{creator.bio}</p>
      </div>
    </motion.div>
  );
}
