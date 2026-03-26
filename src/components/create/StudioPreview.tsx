"use client";

import Image from "next/image";
import {
  Bookmark,
  GitBranch,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import type { PostDraft } from "@/lib/create/types";
import { feedTabLabels } from "@/lib/mock-data";
import { useMeId } from "@/lib/auth/meId";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { creators } from "@/lib/mock-data";
import { isDataUrlAvatar } from "@/lib/profile/avatarUpload";
import { cn } from "@/lib/cn";

export function StudioPreview({
  draft,
  mediaUrl,
  onBack,
  onPublish,
  onSaveDraft,
}: {
  draft: PostDraft;
  mediaUrl: string | null;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  const meId = useMeId();
  const me = (meId ? getCreatorByIdResolved(meId) : undefined) ?? creators[0]!;
  const tags = draft.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const placeholderGradient =
    "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(56,189,248,0.2), rgba(244,114,182,0.15))";

  return (
    <div className="space-y-4 pb-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Reveal</p>
        <h2 className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Feed preview
        </h2>
        <p className="mt-1 text-sm text-white/48">How your signal lands in the immersive rail.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-[min(100%,22rem)] overflow-hidden rounded-[1.35rem] border border-white/12 shadow-[0_0_50px_rgba(0,0,0,0.65)]"
      >
        <div className="relative aspect-[4/5] w-full bg-black">
          {mediaUrl ? (
            draft.mediaType === "video" ? (
              <video src={mediaUrl} className="h-full w-full object-cover" playsInline muted loop autoPlay />
            ) : (
              <Image src={mediaUrl} alt="" fill className="object-cover" unoptimized sizes="400px" />
            )
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center"
              style={{ background: placeholderGradient }}
            >
              <Sparkles className="h-8 w-8 text-white/70" />
              <p className="text-sm font-semibold text-white/85">Concept-only drop</p>
              <p className="text-xs text-white/55">Your idea still posts — add media anytime.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/40" />
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-md">
              {feedTabLabels[draft.feedTab]}
            </span>
            {draft.isConceptDrop ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/35 bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-100 backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                Concept
              </span>
            ) : null}
            {!draft.promptRevealPublic && draft.prompt ? (
              <span className="rounded-md border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/45 backdrop-blur">
                Prompt hidden
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-16 pr-14">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/15">
                <Image
                  src={me.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={isDataUrlAvatar(me.avatarUrl)}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{me.displayName}</p>
                <p className="truncate text-[11px] text-white/50">@{me.username}</p>
                <p className="truncate text-[11px] text-white/45">{draft.title || "Untitled signal"}</p>
              </div>
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/90">
              {draft.caption || "Your caption paints the scroll — add one before publish."}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-24 right-2 z-20 flex flex-col items-center gap-3">
            <Rail icon={UserPlus} label="Follow" />
            <Rail icon={Heart} label="Like" />
            <Rail icon={MessageCircle} label="Chat" />
            <Rail icon={Share2} label="Send" />
            <Rail icon={Bookmark} label="Save" />
            {draft.allowRemix ? <Rail icon={GitBranch} label="Remix" accent /> : null}
            {draft.prompt && draft.promptRevealPublic ? (
              <Rail icon={Sparkles} label="Prompt" accent="violet" />
            ) : null}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <GlowButton type="button" variant="ghost" className="sm:flex-1" onClick={onBack}>
          Edit
        </GlowButton>
        <GlowButton type="button" variant="ghost" className="sm:flex-1" onClick={onSaveDraft}>
          Save draft
        </GlowButton>
        <GlowButton type="button" className="sm:flex-[2]" onClick={onPublish}>
          Publish
        </GlowButton>
      </div>
    </div>
  );
}

function Rail({
  icon: Icon,
  label,
  accent,
}: {
  icon: typeof Heart;
  label: string;
  accent?: boolean | "violet";
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-white/90 backdrop-blur-xl shadow-lg",
          accent === true && "border-cyan-400/35 text-cyan-50",
          accent === "violet" && "border-violet-400/35 text-violet-50",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="text-[9px] font-semibold text-white/70">{label}</span>
    </div>
  );
}
