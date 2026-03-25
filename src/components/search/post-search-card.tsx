"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Clapperboard, Heart, ImageIcon, Sparkles, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { feedTabLabels } from "@/lib/mock-data";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { slugifyTag } from "@/lib/search/slug";
import { useInteractionsStore } from "@/lib/interactions/store";
import type { Post } from "@/lib/types";

function fmtLikes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function contentLabel(p: Post) {
  if (p.isConceptDrop) return "Concept drop";
  if (p.feedTab === "ai-videos") return feedTabLabels["ai-videos"];
  if (p.feedTab === "ai-photos") return feedTabLabels["ai-photos"];
  return feedTabLabels["real-life"];
}

function ContentGlyph({ post }: { post: Post }) {
  if (post.isConceptDrop) return <Sparkles className="h-3.5 w-3.5 text-violet-300" strokeWidth={2} />;
  if (post.feedTab === "ai-videos") return <Video className="h-3.5 w-3.5 text-cyan-300" strokeWidth={2} />;
  if (post.feedTab === "ai-photos") return <ImageIcon className="h-3.5 w-3.5 text-fuchsia-200" strokeWidth={2} />;
  return <Clapperboard className="h-3.5 w-3.5 text-amber-200" strokeWidth={2} />;
}

export function PostSearchCard({
  post,
  reason,
  className,
}: {
  post: Post;
  reason?: string;
  className?: string;
}) {
  const creator = getCreatorByIdResolved(post.creatorId)!;
  const isSaved = useInteractionsStore((s) => s.isSaved(post.id));
  const toggleSave = useInteractionsStore((s) => s.toggleSave);
  const isLiked = useInteractionsStore((s) => s.isLiked(post.id));

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.03] shadow-[0_0_0_1px_rgba(56,189,248,0.05)] backdrop-blur-sm transition-colors hover:border-cyan-400/25",
        className,
      )}
    >
      <Link href={`/post/${post.id}`} className="block tap-highlight-none">
        <div className="relative aspect-[4/5]">
          <Image src={post.imageUrl} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="200px" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
            <ContentGlyph post={post} />
            <span>{contentLabel(post)}</span>
          </div>
          {post.prompt ? (
            <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white/70 backdrop-blur-md line-clamp-2">
              Prompt · {post.prompt.slice(0, 72)}
              {post.prompt.length > 72 ? "…" : ""}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/profile/${encodeURIComponent(creator.username)}`} className="min-w-0 tap-highlight-none">
            <p className="truncate text-xs font-semibold text-white">{creator.displayName}</p>
            <p className="truncate text-[10px] text-white/45">@{creator.username}</p>
          </Link>
          <button
            type="button"
            onClick={() => toggleSave(post.id)}
            className={cn(
              "tap-highlight-none rounded-lg p-1.5 transition-colors",
              isSaved ? "text-violet-300" : "text-white/40 hover:text-white/70",
            )}
            aria-label={isSaved ? "Unsave" : "Save"}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} strokeWidth={2} />
          </button>
        </div>
        <Link href={`/post/${post.id}`} className="block">
          <p className="line-clamp-2 text-sm leading-snug text-white/80">{post.caption}</p>
        </Link>
        {reason ? <p className="text-[11px] font-medium text-cyan-200/75">{reason}</p> : null}
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 4).map((t) => (
            <Link
              key={t}
              href={`/explore/topic/${encodeURIComponent(slugifyTag(t))}`}
              className="rounded-md border border-white/10 bg-black/35 px-1.5 py-0.5 text-[10px] text-white/55 hover:border-violet-400/30 hover:text-white/80"
              onClick={(e) => e.stopPropagation()}
            >
              #{t}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-white/40">
          <span className="flex items-center gap-0.5">
            <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-rose-400/80 text-rose-300")} strokeWidth={2} />
            {fmtLikes(post.likes)}
          </span>
          <span>{post.views} views</span>
          {post.isConceptDrop ? <span className="text-violet-300/90">Remix-ready</span> : null}
        </div>
      </div>
    </motion.article>
  );
}
