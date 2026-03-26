"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreatorBadge } from "@/components/badges/CreatorBadge";
import { GlowButton } from "@/components/ui/GlowButton";
import type { Creator } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelfProfileOverrides } from "@/lib/profile/selfProfileStorage";
import { CreatorLabelChips } from "./CreatorLabelChips";
import { useInteractionsStore } from "@/lib/interactions/store";
import { RelationshipListSheet } from "@/components/social/RelationshipListSheet";
import {
  selectPostsForCreatorMerged,
  selectPostsForCreatorSeed,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { loadArchivedPostIds } from "@/lib/profile/archiveStorage";
import { isDataUrlAvatar } from "@/lib/profile/avatarUpload";
import { cloneFollowingGraph, countFollowers } from "@/lib/social/followGraph";
import { cn } from "@/lib/cn";

const SEED_FOLLOW_GRAPH = cloneFollowingGraph();

function seedFollowerCount(creatorId: string) {
  return countFollowers(creatorId, SEED_FOLLOW_GRAPH);
}

function seedFollowingCount(creatorId: string) {
  return (SEED_FOLLOW_GRAPH[creatorId] ?? []).length;
}

function MetricCell({
  value,
  label,
  onClick,
  className,
}: {
  value: string;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      <p className="text-xl font-semibold leading-none tracking-tight text-white tabular-nums sm:text-2xl sm:font-semibold">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">{label}</p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center px-1 py-0.5 transition-colors hover:bg-white/[0.025] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 rounded-xl tap-highlight-none sm:px-2",
          className,
        )}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col items-center px-1 py-0.5 sm:px-2", className)}>
      {inner}
    </div>
  );
}

export function ProfileHeader({
  creator,
  isSelf,
  postCount: postCountProp,
}: {
  creator: Creator;
  isSelf?: boolean;
  postCount?: number;
}) {
  const router = useRouter();

  const [profileEpoch, setProfileEpoch] = useState(0);
  useEffect(() => {
    const onProfile = () => setProfileEpoch((n) => n + 1);
    window.addEventListener("nomi-self-profile-changed", onProfile);
    return () => window.removeEventListener("nomi-self-profile-changed", onProfile);
  }, []);

  const overrides = useMemo(() => {
    if (!isSelf) return null;
    void profileEpoch;
    return getSelfProfileOverrides();
  }, [isSelf, profileEpoch]);

  const effective = useMemo(() => {
    if (!isSelf || !overrides) return creator;
    return {
      ...creator,
      displayName: overrides.displayName ?? creator.displayName,
      username: overrides.username ?? creator.username,
      bio: overrides.bio ?? creator.bio,
      avatarUrl: overrides.avatarUrl ?? creator.avatarUrl,
    };
  }, [creator, isSelf, overrides]);

  const isFollowing = useInteractionsStore((s) => s.isFollowing(creator.id));
  const toggleFollow = useInteractionsStore((s) => s.toggleFollow);
  const followerCountLive = useInteractionsStore((s) => s.getFollowerCount(creator.id));
  const followingCountLive = useInteractionsStore((s) => s.getFollowingCount(creator.id));
  const isSavedCreator = useInteractionsStore((s) => s.savedCreatorIds.includes(creator.id));
  const saveCreator = useInteractionsStore((s) => s.saveCreator);
  const unsaveCreator = useInteractionsStore((s) => s.unsaveCreator);

  const [socialStatsMounted, setSocialStatsMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setSocialStatsMounted(true));
  }, []);

  const followerCount = socialStatsMounted ? followerCountLive : seedFollowerCount(creator.id);
  const followingCount = socialStatsMounted ? followingCountLive : seedFollowingCount(creator.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"followers" | "following">("followers");

  const hydrateContent = useContentMemoryStore((s) => s.hydrate);
  const userPostsBump = useContentMemoryStore((s) => s.userPosts);

  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  /** False until local user posts + archive ids are read — avoids SSR/client hydration mismatch. */
  const [profileMetricsSynced, setProfileMetricsSynced] = useState(false);

  useEffect(() => {
    hydrateContent();
    const syncArchive = () => setArchivedIds(loadArchivedPostIds());
    syncArchive();
    queueMicrotask(() => setProfileMetricsSynced(true));
    window.addEventListener("nomi-archive-changed", syncArchive);
    return () => window.removeEventListener("nomi-archive-changed", syncArchive);
  }, [hydrateContent]);

  const livePostCount = useMemo(() => {
    const all = selectPostsForCreatorMerged(creator.id);
    if (!isSelf) return all.length;
    return all.filter((p) => !archivedIds.includes(p.id)).length;
  }, [creator.id, userPostsBump, isSelf, archivedIds]);

  const seedPostCount = useMemo(() => {
    const seed = selectPostsForCreatorSeed(creator.id);
    if (!isSelf) return seed.length;
    return seed.filter((p) => !archivedIds.includes(p.id)).length;
  }, [creator.id, isSelf, archivedIds]);

  const postCount =
    postCountProp ?? (profileMetricsSynced ? livePostCount : seedPostCount);

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] sm:rounded-[var(--nomi-radius)]">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-500/[0.07] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-14 bottom-0 h-48 w-48 rounded-full bg-cyan-400/[0.06] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 95% 50% at 50% -20%, rgba(139, 92, 246, 0.12), transparent 55%), radial-gradient(ellipse 65% 40% at 100% 90%, rgba(56, 189, 248, 0.05), transparent 50%)",
          }}
          aria-hidden
        />

        <div className="relative px-1 pb-7 pt-8 sm:px-2 sm:pb-8 sm:pt-9">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8 sm:text-left">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0"
            >
              <div className="relative h-[6.75rem] w-[6.75rem] overflow-hidden rounded-xl border border-white/[0.08] sm:h-[7.75rem] sm:w-[7.75rem]">
                <Image
                  src={effective.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="132px"
                  priority
                  unoptimized={isDataUrlAvatar(effective.avatarUrl)}
                />
              </div>
            </motion.div>

            <div className="min-w-0 flex-1 text-center sm:pt-1 sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
                <h1 className="font-[family-name:var(--font-syne)] text-[1.5rem] font-bold leading-[1.08] tracking-tight text-white sm:text-[1.85rem]">
                  {effective.displayName}
                </h1>
                <CreatorBadge verified={creator.isVerified} premium={creator.isPremium} />
              </div>
              <p className="mt-1 text-[0.8125rem] font-normal tracking-wide text-white/32">@{effective.username}</p>

              <div className="mt-3 flex justify-center sm:justify-start">
                <CreatorLabelChips creator={creator} overridesLabel={overrides?.creatorLabel} />
              </div>

              {isSelf && overrides ? (
                <div className="mt-2.5 flex flex-wrap justify-center gap-x-3 gap-y-0.5 sm:justify-start">
                  {overrides.location ? (
                    <span className="text-[11px] text-white/38">{overrides.location}</span>
                  ) : null}
                  {overrides.website ? (
                    <a
                      href={overrides.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-200/65 underline decoration-cyan-400/20 underline-offset-[5px] hover:text-cyan-100/90"
                    >
                      {overrides.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-center text-[0.875rem] leading-[1.6] text-white/50 sm:mx-0 sm:mt-7 sm:text-left sm:text-[0.9375rem]">
            {effective.bio}
          </p>

          {creator.tags.length ? (
            <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-x-3 gap-y-1.5 sm:mx-0 sm:justify-start">
              {creator.tags.slice(0, 6).map((t) => (
                <span key={t} className="text-[11px] font-medium tracking-wide text-white/36">
                  #{t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-7 sm:mt-8">
            <div className="flex items-start justify-between gap-2 sm:justify-start sm:gap-10 sm:px-1">
              <MetricCell
                value={followerCount.toLocaleString()}
                label="Followers"
                onClick={() => {
                  setSheetTab("followers");
                  setSheetOpen(true);
                }}
              />
              <MetricCell
                value={followingCount.toLocaleString()}
                label="Following"
                onClick={() => {
                  setSheetTab("following");
                  setSheetOpen(true);
                }}
              />
              <MetricCell value={postCount.toLocaleString()} label="Posts" />
            </div>
          </div>

          {isSelf ? (
            <div className="mt-6 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/profile/edit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-violet-500/88 to-cyan-500/40 px-6 text-[13px] font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.2)] transition-[transform,box-shadow] hover:shadow-[0_6px_28px_rgba(139,92,246,0.26)] active:scale-[0.99] sm:h-10 sm:flex-none sm:min-w-[8.5rem]"
              >
                Edit profile
              </Link>
              <Link
                href="/settings"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/[0.08] bg-transparent px-6 text-[13px] font-medium text-white/55 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-white/78 active:scale-[0.99] sm:h-10 sm:flex-none sm:px-5"
              >
                Settings
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-7 sm:flex sm:flex-wrap sm:justify-start sm:gap-2">
              <GlowButton
                type="button"
                className="min-h-[2.5rem] rounded-full px-3 text-[13px] font-semibold sm:min-w-[5.5rem]"
                onClick={() => toggleFollow(creator.id)}
              >
                {isFollowing ? "Following" : "Follow"}
              </GlowButton>
              <GlowButton
                type="button"
                variant="ghost"
                className="min-h-[2.5rem] rounded-full border-white/[0.07] px-2.5 text-[13px] font-medium text-white/72"
                onClick={() => router.push(`/messages?participant=${encodeURIComponent(creator.id)}`)}
              >
                Message
              </GlowButton>
              <GlowButton
                type="button"
                variant="ghost"
                className="min-h-[2.5rem] rounded-full border-white/[0.07] px-2.5 text-[13px] font-medium text-white/72"
                onClick={() => {
                  if (isSavedCreator) unsaveCreator(creator.id);
                  else saveCreator(creator.id);
                }}
              >
                {isSavedCreator ? "Saved" : "Save"}
              </GlowButton>
            </div>
          )}
        </div>
      </div>

      {sheetOpen ? (
        <RelationshipListSheet
          key={`${creator.id}-${sheetTab}`}
          subjectCreatorId={creator.id}
          initialTab={sheetTab}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </div>
  );
}
