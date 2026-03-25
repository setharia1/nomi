"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, ChevronDown, GitBranch, Heart, Play, Share2, UserPlus } from "lucide-react";
import { CreatorBadge } from "@/components/badges/CreatorBadge";
import { CommentDrawer } from "@/components/drawers/CommentDrawer";
import { GenerationJourney } from "@/components/post/GenerationJourney";
import { PromptRevealModal } from "@/components/modals/PromptRevealModal";
import { RemixModal } from "@/components/modals/RemixModal";
import { GlowButton } from "@/components/ui/GlowButton";
import { PostCard } from "@/components/feed/PostCard";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { selectAllPostsMerged, useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ShareSheet } from "@/components/interactions/ShareSheet";
import { useInteractionsStore } from "@/lib/interactions/store";

import { formatEngagementCount } from "@/lib/format/count";
import { formatViewLabel, getTotalPostViews } from "@/lib/views/parsePostViews";
import { usePostViewsStore } from "@/lib/views/postViewsStore";

export function PostDetailClient({ post }: { post: Post }) {
  const creator = getCreatorByIdResolved(post.creatorId)!;
  const hydrate = useContentMemoryStore((s) => s.hydrate);
  const userPostsBump = useContentMemoryStore((s) => s.userPosts);

  useEffect(() => {
    hydrate();
    usePostViewsStore.getState().hydrate();
  }, [hydrate]);

  const viewBonus = usePostViewsStore((s) => s.bonusByPostId[post.id] ?? 0);
  useEffect(() => {
    const t = setTimeout(() => {
      usePostViewsStore.getState().recordQualifiedView(post.id);
    }, 850);
    return () => clearTimeout(t);
  }, [post.id]);

  const merged = useMemo(() => selectAllPostsMerged(), [userPostsBump]);
  const related = useMemo(
    () => merged.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3),
    [merged, post.id, post.category],
  );
  const fallback = useMemo(
    () => merged.filter((p) => p.id !== post.id).slice(0, 3),
    [merged, post.id],
  );
  const showRelated = related.length ? related : fallback;

  const [promptOpen, setPromptOpen] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasPrompt = Boolean(post.prompt?.trim());
  const showAiTools = post.feedTab !== "real-life" || hasPrompt;
  const journey = post.generationJourney?.length ? post.generationJourney : [];

  const liked = useInteractionsStore((s) => s.likedPostIds.includes(post.id));
  const saved = useInteractionsStore((s) => s.savedPostIds.includes(post.id));
  const following = useInteractionsStore((s) => s.isFollowing(creator.id));
  const shareDelta = useInteractionsStore((s) => s.shareCountsByPostId[post.id] ?? 0);
  const commentsTotal = useInteractionsStore((s) => s.commentsByPostId[post.id]?.length ?? 0);

  const toggleLike = useInteractionsStore((s) => s.toggleLike);
  const toggleSave = useInteractionsStore((s) => s.toggleSave);
  const toggleFollow = useInteractionsStore((s) => s.toggleFollow);

  const likeCount = post.likes + (liked ? 1 : 0);
  const sharesBase = post.shares ?? Math.floor(post.likes * 0.02);
  const sharesTotal = sharesBase + shareDelta;
  const commentCountDisplay = Math.max(post.comments, commentsTotal);
  const viewDisplay = formatViewLabel(getTotalPostViews(post, viewBonus));

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-4">
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] shadow-[0_20px_48px_rgba(0,0,0,0.42)]">
        <div className="relative aspect-[4/5] w-full bg-black">
          {post.mediaType === "video" && post.videoUrl ? (
            <video
              src={post.videoUrl}
              poster={post.imageUrl}
              className="h-full w-full object-cover transition duration-700 group-hover:brightness-110"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={post.imageUrl}
              alt=""
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
              priority
              sizes="100vw"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_65%,rgba(139,92,246,0.15),transparent_55%)]" />
        </div>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md",
              post.feedTab === "real-life"
                ? "border-white/15 bg-black/50 text-white/80"
                : "border-cyan-400/35 bg-black/45 text-cyan-100",
            )}
          >
            {post.feedTab === "ai-videos"
              ? "AI Video"
              : post.feedTab === "ai-photos"
                ? "AI Photo"
                : "Real Life"}
          </span>
          {post.mediaType === "video" ? (
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-semibold text-white/75 backdrop-blur-md">
              <Play className="h-3 w-3 fill-current" />
              Video
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <Link href={`/profile/${encodeURIComponent(creator.username)}`} className="flex min-w-0 gap-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/12">
            <Image src={creator.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white">{creator.displayName}</span>
              <CreatorBadge verified={creator.isVerified} premium={creator.isPremium} />
            </div>
            <p className="text-sm text-white/45">@{creator.username}</p>
          </div>
        </Link>
        <span className="shrink-0 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/72">
          {creator.creatorCategory}
        </span>
      </div>

      <p className="text-base leading-relaxed text-white/85">{post.caption}</p>
      <p className="text-xs text-white/40">
        {viewDisplay} · {post.category}
      </p>

      <div className="flex flex-wrap gap-2">
        {hasPrompt || post.feedTab !== "real-life" ? (
          <GlowButton type="button" variant="ghost" className="text-sm" onClick={() => setPromptOpen(true)}>
            Reveal prompt
          </GlowButton>
        ) : null}
        {showAiTools ? (
          <GlowButton
            type="button"
            variant="ghost"
            className="flex items-center gap-2 border-cyan-400/25 text-sm"
            onClick={() => setRemixOpen(true)}
          >
            <GitBranch className="h-4 w-4" />
            Remix with AI
          </GlowButton>
        ) : null}
        <GlowButton
          type="button"
          variant="ghost"
          className="text-sm"
          onClick={() => toggleFollow(creator.id)}
        >
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {following ? "Following" : "Follow"}
          </span>
        </GlowButton>
        <GlowButton
          type="button"
          variant="ghost"
          className="text-sm"
          onClick={() => toggleLike(post.id)}
        >
          <span className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
            {liked ? "Liked" : "Like"} · {formatEngagementCount(likeCount)}
          </span>
        </GlowButton>
        <GlowButton
          type="button"
          variant="ghost"
          className="text-sm"
          onClick={() => toggleSave(post.id)}
        >
          <span className="inline-flex items-center gap-2">
            <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </span>
        </GlowButton>
        <GlowButton type="button" variant="ghost" className="text-sm" onClick={() => setShareOpen(true)}>
          <span className="inline-flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share · {formatEngagementCount(sharesTotal)}
          </span>
        </GlowButton>
        <GlowButton type="button" variant="ghost" className="text-sm" onClick={() => setCommentsOpen(true)}>
          Comments · {formatEngagementCount(commentCountDisplay)}
        </GlowButton>
      </div>

      {(hasPrompt || post.processNotes) && (
        <div className="nomi-surface-card overflow-hidden border-violet-400/12">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="glow-focus flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-white/[0.025]"
          >
            <span className="font-[family-name:var(--font-syne)] text-sm font-bold text-gradient-nomi">
              Prompt & process
            </span>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.28 }}>
              <ChevronDown className="h-5 w-5 text-white/50" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 border-t border-white/[0.07] px-3.5 pb-3.5 pt-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Prompt</p>
                  <p className="text-sm leading-relaxed text-white/90">
                    {post.prompt?.trim() ? post.prompt : "No generative prompt — captured in-camera / IRL."}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Notes</p>
                  <p className="text-sm leading-relaxed text-white/70">{post.processNotes}</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {journey.length ? <GenerationJourney steps={journey} /> : null}

      <section className="space-y-3">
        <h2 className="nomi-section-title">Related signals</h2>
        <div className="space-y-6">
          {showRelated.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      <PromptRevealModal post={post} open={promptOpen} onClose={() => setPromptOpen(false)} />
      <RemixModal post={post} open={remixOpen} onClose={() => setRemixOpen(false)} />
      {commentsOpen ? (
        <CommentDrawer post={post} open onClose={() => setCommentsOpen(false)} />
      ) : null}
      <ShareSheet post={post} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
