"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, GitBranch, Heart, MessageCircle, Play, Share2, Sparkles } from "lucide-react";
import { CreatorBadge } from "@/components/badges/CreatorBadge";
import { CommentDrawer } from "@/components/drawers/CommentDrawer";
import { PromptRevealModal } from "@/components/modals/PromptRevealModal";
import { RemixModal } from "@/components/modals/RemixModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import type { Post } from "@/lib/types";
import { ShareSheet } from "@/components/interactions/ShareSheet";
import { useInteractionsStore } from "@/lib/interactions/store";
import { formatEngagementCount } from "@/lib/format/count";
import { formatViewLabel, getTotalPostViews } from "@/lib/views/parsePostViews";
import { usePostViewsStore } from "@/lib/views/postViewsStore";

export function PostCard({ post, featured }: { post: Post; featured?: boolean }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const creator = getCreatorByIdResolved(post.creatorId)!;
  const hasPrompt = Boolean(post.prompt?.trim());
  const showAiActions = post.feedTab !== "real-life" || hasPrompt;

  const liked = useInteractionsStore((s) => s.likedPostIds.includes(post.id));
  const saved = useInteractionsStore((s) => s.savedPostIds.includes(post.id));
  const shareDelta = useInteractionsStore((s) => s.shareCountsByPostId[post.id] ?? 0);
  const commentsTotal = useInteractionsStore((s) => s.commentsByPostId[post.id]?.length ?? 0);
  const toggleLike = useInteractionsStore((s) => s.toggleLike);
  const toggleSave = useInteractionsStore((s) => s.toggleSave);

  const likeCount = post.likes + (liked ? 1 : 0);
  const sharesBase = post.shares ?? Math.floor(post.likes * 0.02);
  const sharesTotal = sharesBase + shareDelta;
  const commentCountDisplay = Math.max(post.comments, commentsTotal);
  const viewBonus = usePostViewsStore((s) => s.bonusByPostId[post.id] ?? 0);
  const viewDisplay = formatViewLabel(getTotalPostViews(post, viewBonus));

  useEffect(() => {
    usePostViewsStore.getState().hydrate();
  }, []);

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.01 }}
        className={[
          "rounded-[1.35rem] overflow-hidden border transition-shadow duration-300",
          featured
            ? "border-cyan-400/35 bg-white/[0.04] shadow-[0_0_40px_rgba(56,189,248,0.12)]"
            : "border-white/[0.08] bg-white/[0.02] hover:border-violet-400/25 hover:shadow-[0_0_32px_rgba(139,92,246,0.12)]",
        ].join(" ")}
      >
        <div className="p-4 flex items-start justify-between gap-3">
          <Link
            href={`/profile/${encodeURIComponent(creator.username)}`}
            className="flex items-center gap-3 min-w-0 tap-highlight-none"
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-violet-500/60 to-cyan-400/40 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
            >
              <div className="relative w-full h-full rounded-full overflow-hidden border border-black/40">
                <Image
                  src={creator.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white truncate">{creator.displayName}</span>
                <CreatorBadge verified={creator.isVerified} premium={creator.isPremium} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-white/45">@{creator.username}</span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-white/45">{post.createdAt}</span>
              </div>
            </div>
          </Link>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/65 max-w-[7rem] truncate">
            {creator.creatorCategory}
          </span>
        </div>

        <div className="relative aspect-[4/5] mx-3 rounded-2xl overflow-hidden group">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
            sizes="(max-width:768px)100vw,32rem"
            priority={featured}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_50%_80%,rgba(139,92,246,0.2),transparent_55%)]" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {post.mediaType === "video" ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
                <Play className="h-3 w-3 fill-current" />
                Clip
              </span>
            ) : null}
            <span className="rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/60 backdrop-blur-md">
              {post.feedTab === "ai-videos"
                ? "AI Video"
                : post.feedTab === "ai-photos"
                  ? "AI Photo"
                  : "Real"}
            </span>
          </div>
          {post.isConceptDrop ? (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-cyan-400/35 text-cyan-100">
                <Sparkles className="w-3 h-3" />
                Concept drop
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleLike(post.id)}
                className={`p-2.5 rounded-xl transition-colors ${liked ? "text-rose-400 glow-subtle" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                aria-label="Like"
              >
                <Heart className="w-6 h-6" fill={liked ? "currentColor" : "none"} strokeWidth={1.75} />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setCommentsOpen(true)}
                className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5"
                aria-label="Comment"
              >
                <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5"
                aria-label="Share"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="w-6 h-6" strokeWidth={1.75} />
              </motion.button>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleSave(post.id)}
              className={`p-2.5 rounded-xl transition-colors ${saved ? "text-cyan-300" : "text-white/70 hover:text-white"}`}
              aria-label="Save"
            >
              <Bookmark className="w-6 h-6" fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
            </motion.button>
          </div>

          <p className="text-[11px] font-semibold tabular-nums text-white/50">
            {formatEngagementCount(likeCount)} likes · {formatEngagementCount(commentCountDisplay)} comments ·{" "}
            {formatEngagementCount(sharesTotal)} shares
            {saved ? <span className="text-cyan-200/80"> · Saved</span> : null}
          </p>

          <p className="text-xs text-white/40 font-medium">
            {viewDisplay} · {post.category}
          </p>
          <p className="text-sm text-white/85 leading-relaxed">
            <Link href={`/profile/${encodeURIComponent(creator.username)}`} className="font-semibold text-white mr-1">
              @{creator.username}
            </Link>
            {post.caption}
          </p>
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-white/55 border border-white/10"
              >
                #{t}
              </span>
            ))}
          </div>

          {showAiActions ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <GlowButton
                type="button"
                variant="ghost"
                className="text-xs py-2.5 border-violet-400/20 hover:border-violet-400/40"
                onClick={() => setPromptOpen(true)}
              >
                Reveal prompt
              </GlowButton>
              <GlowButton
                type="button"
                variant="ghost"
                className="text-xs flex items-center justify-center gap-2 border-cyan-400/25 py-2.5 hover:border-cyan-400/45"
                onClick={() => setRemixOpen(true)}
              >
                <GitBranch className="h-4 w-4" />
                Remix
              </GlowButton>
            </div>
          ) : null}

          <Link href={`/post/${post.id}`} className="block">
            <GlassPanel muted className="px-3 py-2 text-center text-xs text-white/50 hover:text-white/70 transition-colors">
              Open immersive view
            </GlassPanel>
          </Link>
        </div>
      </motion.article>

      <PromptRevealModal post={post} open={promptOpen} onClose={() => setPromptOpen(false)} />
      <RemixModal post={post} open={remixOpen} onClose={() => setRemixOpen(false)} />
      {commentsOpen ? (
        <CommentDrawer post={post} open onClose={() => setCommentsOpen(false)} />
      ) : null}
      <ShareSheet post={post} open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
