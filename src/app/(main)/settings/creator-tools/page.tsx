"use client";

import Link from "next/link";
import Image from "next/image";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlowButton } from "@/components/ui/GlowButton";
import { creators, posts as seedPosts } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Sparkles, TrendingUp } from "lucide-react";
import type { Post } from "@/lib/types";
import { useEffect, useMemo, type ComponentType } from "react";
import { useInteractionsStore } from "@/lib/interactions/store";
import { mergePostsForFeed, useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";
import { useDraftsStore } from "@/lib/create/draftsStore";
import { useVideoJobsStore } from "@/lib/generation/videoJobsStore";

import { getTotalPostViews } from "@/lib/views/parsePostViews";
import { usePostViewsStore } from "@/lib/views/postViewsStore";
import { ProfileHighlightsClient } from "@/components/profile/ProfileHighlightsClient";

export default function CreatorToolsPage() {
  const me = creators[0]!;
  const hydrateContent = useContentMemoryStore((s) => s.hydrate);
  const userPostsBump = useContentMemoryStore((s) => s.userPosts);
  const catalogPosts = useFeedCatalogStore((s) => s.posts);
  const mergedPosts = useMemo(
    () => mergePostsForFeed(seedPosts, catalogPosts, userPostsBump),
    [userPostsBump, catalogPosts],
  );
  const myPosts = useMemo(
    () => mergedPosts.filter((p) => p.creatorId === me.id),
    [mergedPosts, me.id],
  );
  const draftCount = useDraftsStore((s) => s.list.length);
  const hydrateDrafts = useDraftsStore((s) => s.hydrate);
  const videoJobs = useVideoJobsStore((s) => s.jobs);
  const readyVideoCount = useMemo(
    () => videoJobs.filter((j) => j.phase === "ready").length,
    [videoJobs],
  );

  useEffect(() => {
    hydrateContent();
    useVideoJobsStore.getState().hydrate();
    usePostViewsStore.getState().hydrate();
  }, [hydrateContent]);

  const viewBonusVersion = usePostViewsStore((s) => s.bonusVersion);

  const likedPostIds = useInteractionsStore((s) => s.likedPostIds);
  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const commentsByPostId = useInteractionsStore((s) => s.commentsByPostId);
  const myFollowerCount = useInteractionsStore((s) => s.getFollowerCount(me.id));

  const analytics = useMemo(() => {
    void viewBonusVersion;
    const getBonus = usePostViewsStore.getState().getBonus;
    const totalViews = myPosts.reduce(
      (acc, p) => acc + getTotalPostViews(p, getBonus(p.id)),
      0,
    );
    const totalLikes = myPosts.reduce(
      (acc, p) => acc + p.likes + (likedPostIds.includes(p.id) ? 1 : 0),
      0,
    );
    const totalComments = myPosts.reduce((acc, p) => {
      const threadLen = (commentsByPostId[p.id] ?? []).length;
      return acc + Math.max(p.comments, threadLen);
    }, 0);
    const totalSaves = myPosts.reduce(
      (acc, p) => acc + p.saves + (savedPostIds.includes(p.id) ? 1 : 0),
      0,
    );

    const topPost = myPosts
      .slice()
      .sort((a, b) => {
        const aLike = a.likes + (likedPostIds.includes(a.id) ? 1 : 0);
        const bLike = b.likes + (likedPostIds.includes(b.id) ? 1 : 0);
        return bLike - aLike;
      })[0] as Post | undefined;
    const topPostLikeCount = topPost ? topPost.likes + (likedPostIds.includes(topPost.id) ? 1 : 0) : 0;
    const remixable = myPosts.filter((p) => p.isConceptDrop);
    const promptEngagement = myPosts.filter((p) => p.prompt.trim().length > 0);

    const followerBarH = Math.min(104, Math.max(24, 28 + myFollowerCount * 14));
    const followerGrowth = Array.from({ length: 6 }, () => followerBarH);

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalSaves,
      topPost,
      topPostLikeCount,
      remixableCount: remixable.length,
      promptEngagementCount: promptEngagement.length,
      followerGrowth,
    };
  }, [myPosts, likedPostIds, savedPostIds, commentsByPostId, myFollowerCount, viewBonusVersion]);

  const libraryPreview = useMemo(() => myPosts.slice(0, 8), [myPosts]);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Creator tools"
        title="Creator insights"
        description="Lightweight analytics — premium signals, not a cluttered dashboard."
      />

      <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total views" value={Math.round(analytics.totalViews).toLocaleString()} icon={Sparkles} />
        <StatCard title="Likes" value={analytics.totalLikes.toLocaleString()} icon={TrendingUp} />
        <StatCard title="Comments" value={analytics.totalComments.toLocaleString()} icon={TrendingUp} />
        <StatCard title="Saves" value={analytics.totalSaves.toLocaleString()} icon={Sparkles} />
      </section>

      <div className="grid gap-2.5 lg:grid-cols-3">
        <GlassPanel className="space-y-3 border-white/[0.07] p-3.5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="nomi-section-label">Follower growth</p>
              <p className="mt-1 text-sm text-white/48">
                Snapshot from your current follower count — no synthetic history.
              </p>
            </div>
            <GlowButton type="button" variant="ghost" onClick={() => hydrateDrafts()}>
              Refresh
            </GlowButton>
          </div>
          <div className="flex items-end gap-2 h-28">
            {analytics.followerGrowth.map((n, idx) => (
              <motion.div
                key={idx}
                initial={{ height: 0, opacity: 0.6 }}
                animate={{ height: Math.max(18, n), opacity: 1 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="flex-1 rounded-xl bg-gradient-to-t from-violet-500/60 to-cyan-400/20 border border-white/[0.08]"
              />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-3 border-white/[0.07] p-3.5">
          <p className="nomi-section-label">Top performing</p>
          {analytics.topPost ? (
            <>
              <Link
                href={`/post/${analytics.topPost.id}`}
                className="block overflow-hidden rounded-xl border border-white/[0.08] bg-black"
              >
                <div className="relative aspect-[4/5]">
                  <Image src={analytics.topPost.imageUrl} alt="" fill className="object-cover" sizes="320px" />
                </div>
              </Link>
              <p className="text-sm font-semibold text-white/90 line-clamp-2">{analytics.topPost.caption}</p>
              <p className="text-[11px] text-white/45">Likes {analytics.topPostLikeCount.toLocaleString()}</p>
            </>
          ) : (
            <p className="text-sm text-white/45">No posts yet.</p>
          )}
        </GlassPanel>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <GlassPanel className="space-y-3 border-white/[0.07] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="nomi-section-label">Remixable activity</p>
            <span className="text-[11px] text-white/45">{analytics.remixableCount} concept drops</span>
          </div>
          <p className="text-sm text-white/55">
            Concept drops are designed to invite remix. Keep posting rough — refinement follows.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <GlowButton type="button" variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              View insights
            </GlowButton>
            <Link href="/create/drafts" className="block">
              <GlowButton type="button" className="w-full">
                Drafts ({draftCount})
                <ArrowRight className="ml-2 h-4 w-4" />
              </GlowButton>
            </Link>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-3 border-white/[0.07] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="nomi-section-label">Prompt reveal engagement</p>
            <span className="text-[11px] text-white/45">{analytics.promptEngagementCount} AI posts</span>
          </div>
          <p className="text-sm text-white/55">
            Prompt-rich AI drops tend to generate more remix and lineage interest.
          </p>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <p className="text-sm font-semibold text-white/90">Create</p>
            <p className="mt-1 text-sm text-white/45">
              One studio for capture, AI video, captions, and publish — drafts stay synced.
            </p>
            <Link href="/create" className="mt-3 block">
              <GlowButton type="button" className="w-full">
                Open Create Studio
                <ArrowRight className="ml-2 h-4 w-4" />
              </GlowButton>
            </Link>
          </div>
        </GlassPanel>
      </div>

      <section className="space-y-3">
        <GlassPanel className="space-y-2 border-white/[0.07] p-3.5">
          <p className="nomi-section-label">Engagement highlights</p>
          <p className="text-sm text-white/50">
            Top-performing published posts by likes — moved here so your profile stays content-first.
          </p>
          <ProfileHighlightsClient creatorId={me.id} />
        </GlassPanel>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="nomi-kicker text-violet-200/55">Library</p>
            <h2 className="nomi-section-title mt-1 sm:text-xl">Content management</h2>
            <p className="nomi-page-desc mt-1 max-w-md">
              Published posts, drafts, and ready AI clips — all tied to the same memory layer as your profile and
              feed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="nomi-surface-card flex items-center gap-2 px-3 py-2 text-sm text-white/78">
              <Layers className="h-4 w-4 text-cyan-200/75" />
              <span>
                <span className="font-semibold text-white">{myPosts.length}</span> published
              </span>
            </div>
            <div className="nomi-surface-card flex items-center gap-2 px-3 py-2 text-sm text-white/78">
              <span>
                <span className="font-semibold text-white">{draftCount}</span> drafts
              </span>
            </div>
            <div className="nomi-surface-card flex items-center gap-2 px-3 py-2 text-sm text-white/78">
              <span>
                <span className="font-semibold text-emerald-200/95">{readyVideoCount}</span> ready
              </span>
            </div>
          </div>
        </div>

        <GlassPanel className="space-y-3 border-white/[0.07] p-3.5">
          {libraryPreview.length ? (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-8">
              {libraryPreview.map((p) => (
                <Link
                  key={p.id}
                  href={`/post/${p.id}`}
                  className="relative aspect-square overflow-hidden rounded-lg border border-white/[0.08] bg-black transition-colors hover:border-violet-400/28"
                >
                  <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                  {p.mediaType === "video" ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-px text-[8px] font-bold text-white/90">
                      VID
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/45">No published posts yet — ship a drop from Create to see it here.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href="/create" className="block flex-1 min-w-[10rem]">
              <GlowButton type="button" className="w-full">
                Create
                <ArrowRight className="ml-2 h-4 w-4" />
              </GlowButton>
            </Link>
            <Link href="/create/drafts" className="block flex-1 min-w-[10rem]">
              <GlowButton type="button" variant="ghost" className="w-full border-white/12">
                Drafts ({draftCount})
              </GlowButton>
            </Link>
            <Link href={`/profile/${encodeURIComponent(me.username)}`} className="block flex-1 min-w-[10rem]">
              <GlowButton type="button" variant="ghost" className="w-full border-white/12">
                View profile
              </GlowButton>
            </Link>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="nomi-surface-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="nomi-section-label">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-violet-200/70" />
      </div>
    </div>
  );
}

