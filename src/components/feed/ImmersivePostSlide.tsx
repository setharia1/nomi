"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Bookmark,
  Copy,
  ExternalLink,
  Flag,
  GitBranch,
  Heart,
  LayoutGrid,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Share2,
  Sparkles,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PromptRevealModal } from "@/components/modals/PromptRevealModal";
import { RemixModal } from "@/components/modals/RemixModal";
import { CommentDrawer } from "@/components/drawers/CommentDrawer";
import { CreatorBadge } from "@/components/badges/CreatorBadge";
import { cn } from "@/lib/cn";
import { useAccountRegistryStore } from "@/lib/accounts/registryStore";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import type { Creator, Post } from "@/lib/types";

function fallbackCreator(id: string): Creator {
  return {
    id,
    username: "unknown",
    displayName: "Unknown creator",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80",
    bio: "",
    creatorCategory: "Creator",
    tags: [],
    isVerified: false,
  };
}
import { useMeId } from "@/lib/auth/meId";
import { useInteractionsStore } from "@/lib/interactions/store";
import { cloneFollowingGraph } from "@/lib/social/followGraph";
import { ShareSheet } from "@/components/interactions/ShareSheet";
import { formatEngagementCount } from "@/lib/format/count";
import { formatViewLabel, getTotalPostViews } from "@/lib/views/parsePostViews";
import { usePostViewsStore } from "@/lib/views/postViewsStore";
import { useFeedPlaybackStore } from "@/lib/media/feedPlaybackStore";

export function ImmersivePostSlide({ post }: { post: Post }) {
  const meId = useMeId();
  const seedMeFollowingIds = useMemo(
    () => (meId ? cloneFollowingGraph()[meId] ?? [] : []),
    [meId],
  );
  const isFollowingFromSeed = (creatorId: string) => seedMeFollowingIds.includes(creatorId);

  const router = useRouter();
  const registrySig = useAccountRegistryStore((s) => {
    const c = s.byId[post.creatorId];
    return c ? `${c.username}\0${c.displayName}\0${c.avatarUrl}` : "";
  });
  const creator = useMemo(() => {
    return getCreatorByIdResolved(post.creatorId) ?? fallbackCreator(post.creatorId);
  }, [post.creatorId, registrySig]);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(rootRef, { amount: 0.55 });
  const [promptOpen, setPromptOpen] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [holdPauseUi, setHoldPauseUi] = useState(false);
  const [muteFlash, setMuteFlash] = useState<"muted" | "sound" | null>(null);
  const muteFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPromptTools = post.feedTab !== "real-life" || Boolean(post.prompt);
  const captionNeedsToggle = post.caption.trim().length > 90;

  /** Match SSR/first paint to seed graph & empty local overlays — then apply persisted interactions. */
  const [socialMounted, setSocialMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setSocialMounted(true));
  }, []);

  const likedLive = useInteractionsStore((s) => s.likedPostIds.includes(post.id));
  const savedLive = useInteractionsStore((s) => s.savedPostIds.includes(post.id));
  const followingLive = useInteractionsStore((s) => s.isFollowing(post.creatorId));
  const shareDeltaLive = useInteractionsStore((s) => s.shareCountsByPostId[post.id] ?? 0);
  const commentsTotal = useInteractionsStore((s) => s.commentsByPostId[post.id]?.length ?? 0);

  const liked = socialMounted ? likedLive : false;
  const saved = socialMounted ? savedLive : false;
  const following = socialMounted ? followingLive : isFollowingFromSeed(post.creatorId);
  const shareDelta = socialMounted ? shareDeltaLive : 0;

  const toggleFollow = useInteractionsStore((s) => s.toggleFollow);
  const toggleLike = useInteractionsStore((s) => s.toggleLike);
  const toggleSave = useInteractionsStore((s) => s.toggleSave);
  const sharePost = useInteractionsStore((s) => s.sharePost);

  const feedMuted = useFeedPlaybackStore((s) => s.muted);
  const toggleFeedMuted = useFeedPlaybackStore((s) => s.toggleMuted);
  const viewBonus = usePostViewsStore((s) => s.bonusByPostId[post.id] ?? 0);

  const HOLD_MS = 380;
  const TAP_MAX_MS = 450;
  const MOVE_PX = 18;
  const videoGestureRef = useRef({
    startT: 0,
    startX: 0,
    startY: 0,
    holdTimer: null as ReturnType<typeof setTimeout> | null,
    heldPause: false,
    moved: false,
  });

  const onVideoPointerDown = (e: React.PointerEvent<HTMLVideoElement>) => {
    if (!inView || post.mediaType !== "video") return;
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* unsupported */
    }
    const g = videoGestureRef.current;
    g.startT = Date.now();
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.moved = false;
    g.heldPause = false;
    setHoldPauseUi(false);
    if (muteFlashTimerRef.current) {
      clearTimeout(muteFlashTimerRef.current);
      muteFlashTimerRef.current = null;
    }
    setMuteFlash(null);
    if (g.holdTimer) {
      clearTimeout(g.holdTimer);
      g.holdTimer = null;
    }
    g.holdTimer = setTimeout(() => {
      const v = videoRef.current;
      if (!v || g.moved) return;
      v.pause();
      g.heldPause = true;
      g.holdTimer = null;
      setHoldPauseUi(true);
    }, HOLD_MS);
  };

  const onVideoPointerMove = (e: React.PointerEvent<HTMLVideoElement>) => {
    const g = videoGestureRef.current;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) {
      g.moved = true;
      if (g.holdTimer) {
        clearTimeout(g.holdTimer);
        g.holdTimer = null;
      }
    }
  };

  const onVideoPointerEnd = (e?: React.PointerEvent<HTMLVideoElement>) => {
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
    }
    const g = videoGestureRef.current;
    if (g.holdTimer) {
      clearTimeout(g.holdTimer);
      g.holdTimer = null;
    }
    const v = videoRef.current;
    if (g.heldPause && v) {
      setHoldPauseUi(false);
      if (inView) v.play().catch(() => {});
      g.heldPause = false;
      return;
    }
    const elapsed = Date.now() - g.startT;
    if (elapsed < TAP_MAX_MS && !g.moved) {
      toggleFeedMuted();
      if (muteFlashTimerRef.current) {
        clearTimeout(muteFlashTimerRef.current);
        muteFlashTimerRef.current = null;
      }
      const mutedNow = useFeedPlaybackStore.getState().muted;
      setMuteFlash(mutedNow ? "muted" : "sound");
      muteFlashTimerRef.current = setTimeout(() => {
        setMuteFlash(null);
        muteFlashTimerRef.current = null;
      }, 900);
    }
  };

  useEffect(() => {
    useFeedPlaybackStore.getState().hydrate();
    usePostViewsStore.getState().hydrate();
  }, []);

  useEffect(() => {
    queueMicrotask(() => setCaptionExpanded(false));
  }, [post.id]);

  useEffect(() => {
    if (!inView) {
      const g = videoGestureRef.current;
      if (g.holdTimer) {
        clearTimeout(g.holdTimer);
        g.holdTimer = null;
      }
      g.heldPause = false;
      queueMicrotask(() => {
        setHoldPauseUi(false);
        setMuteFlash(null);
      });
      if (muteFlashTimerRef.current) {
        clearTimeout(muteFlashTimerRef.current);
        muteFlashTimerRef.current = null;
      }
    }
  }, [inView]);

  const effectiveMuted = !inView || feedMuted;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || post.mediaType !== "video") return;
    if (inView) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView, post.mediaType]);

  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!inView) {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
      return;
    }
    const ms = post.mediaType === "video" ? 1200 : 900;
    dwellTimerRef.current = setTimeout(() => {
      usePostViewsStore.getState().recordQualifiedView(post.id);
      dwellTimerRef.current = null;
    }, ms);
    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [inView, post.id, post.mediaType]);

  const likeCount = post.likes + (liked ? 1 : 0);
  const saveCount = post.saves + (saved ? 1 : 0);
  const sharesBase = post.shares ?? Math.floor(post.likes * 0.02);
  const sharesTotal = sharesBase + shareDelta;
  const commentCountDisplay = Math.max(post.comments, commentsTotal);
  const viewDisplay = formatViewLabel(getTotalPostViews(post, viewBonus));

  useEffect(() => {
    if (!overflowOpen) return;
    const close = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [overflowOpen]);

  return (
    <>
      <section
        ref={rootRef}
        className="relative h-[100dvh] w-full snap-start snap-always flex-shrink-0 bg-black"
      >
        <div className="absolute inset-0 flex justify-center bg-[var(--nomi-bg-deep)]">
          <div className="relative h-full w-full max-w-[min(100%,26rem)] overflow-hidden md:mx-auto md:max-w-md md:rounded-2xl md:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_64px_rgba(0,0,0,0.65)]">
            {post.mediaType === "video" && post.videoUrl ? (
              <video
                ref={videoRef}
                src={post.videoUrl}
                poster={post.imageUrl}
                className="absolute inset-0 h-full w-full object-cover touch-manipulation select-none"
                muted={effectiveMuted}
                loop
                playsInline
                preload="metadata"
                onPointerDown={onVideoPointerDown}
                onPointerMove={onVideoPointerMove}
                onPointerUp={onVideoPointerEnd}
                onPointerCancel={onVideoPointerEnd}
              />
            ) : (
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={inView ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{
                  duration: 18,
                  repeat: inView ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={post.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={false}
                />
              </motion.div>
            )}

            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/35"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/75 to-transparent"
              aria-hidden
            />

            {post.mediaType === "video" && post.videoUrl ? (
              <div
                className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center"
                aria-hidden
              >
                <AnimatePresence mode="wait">
                  {holdPauseUi ? (
                    <motion.div
                      key="pause-hold"
                      role="status"
                      aria-label="Paused"
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-black/45 shadow-lg backdrop-blur-md"
                    >
                      <Pause className="h-8 w-8 text-white" strokeWidth={1.75} />
                    </motion.div>
                  ) : muteFlash ? (
                    <motion.div
                      key={muteFlash}
                      role="status"
                      aria-label={muteFlash === "muted" ? "Muted" : "Sound on"}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 480, damping: 32 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-black/45 shadow-lg backdrop-blur-md"
                    >
                      {muteFlash === "muted" ? (
                        <VolumeX className="h-7 w-7 text-white" strokeWidth={1.75} />
                      ) : (
                        <Volume2 className="h-7 w-7 text-white" strokeWidth={1.75} />
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}

            {/* Bottom-left metadata — calm, content-first */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 max-w-[min(100%,26rem)] px-3 pb-[calc(var(--nomi-rail-pad)+env(safe-area-inset-bottom))] md:max-w-md">
              <div className="pointer-events-auto max-w-[20rem] space-y-2 pr-11 sm:pr-12">
                <Link
                  href={`/profile/${encodeURIComponent(creator.username)}`}
                  className="inline-flex max-w-full items-start gap-2.5 tap-highlight-none"
                >
                  <motion.div whileTap={{ scale: 0.97 }} className="relative shrink-0">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-black/30">
                      <Image src={creator.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
                    </div>
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="truncate text-[13px] font-semibold tracking-tight text-white/95">
                        @{creator.username}
                      </span>
                      <CreatorBadge verified={creator.isVerified} premium={creator.isPremium} />
                    </div>
                    <p className="truncate text-[11px] text-white/42">{creator.displayName}</p>
                  </div>
                </Link>

                {post.audioLabel ? (
                  <div className="flex max-w-[95%] items-center gap-1.5 text-[10px] text-white/55">
                    <Volume2 className="h-3 w-3 shrink-0 text-cyan-200/55" strokeWidth={1.5} />
                    <span className="truncate">{post.audioLabel}</span>
                  </div>
                ) : null}

                <div>
                  <p
                    className={cn(
                      "text-[13px] leading-snug text-white/88",
                      !captionExpanded && captionNeedsToggle && "line-clamp-2",
                    )}
                  >
                    {post.caption}
                  </p>
                  {captionNeedsToggle ? (
                    <button
                      type="button"
                      onClick={() => setCaptionExpanded((v) => !v)}
                      className="mt-0.5 text-[11px] font-medium text-cyan-200/65 transition-colors hover:text-cyan-100/90 tap-highlight-none"
                    >
                      {captionExpanded ? "Show less" : "more"}
                    </button>
                  ) : null}
                </div>

                {post.tags.length ? (
                  <p className="text-[10px] leading-relaxed text-white/38">
                    {post.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-white/36">
                  <span>{viewDisplay}</span>
                  <span aria-hidden className="text-white/22">
                    ·
                  </span>
                  <span>{formatEngagementCount(likeCount)} likes</span>
                  <span aria-hidden className="text-white/22">
                    ·
                  </span>
                  <Link href={`/post/${post.id}`} className="text-cyan-200/55 hover:text-cyan-100/85">
                    Detail
                  </Link>
                </div>

                {post.isConceptDrop ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
                    <Sparkles className="h-2.5 w-2.5" strokeWidth={1.75} />
                    Concept
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right rail — primary stack + compact overflow */}
            <div className="absolute right-1 z-20 flex max-h-[min(62dvh,440px)] flex-col items-center gap-1 sm:right-1.5 bottom-[calc(var(--nomi-rail-pad)+env(safe-area-inset-bottom))] md:right-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => toggleFollow(creator.id)}
                className={cn(
                  "flex h-[2.65rem] w-9 flex-col items-center justify-center rounded-[0.65rem] border backdrop-blur-md transition-colors tap-highlight-none",
                  following
                    ? "border-cyan-400/28 bg-cyan-500/[0.09] text-cyan-50/95"
                    : "border-white/[0.09] bg-black/35 text-white/90 hover:border-white/[0.14]",
                )}
              >
                {following ? (
                  <span className="text-xs font-bold leading-none">✓</span>
                ) : (
                  <UserPlus className="h-[15px] w-[15px]" strokeWidth={2} />
                )}
                <span className="mt-0.5 max-w-[2.5rem] truncate text-[7px] font-semibold uppercase tracking-wide text-white/60">
                  {following ? "Following" : "Follow"}
                </span>
              </motion.button>

              <RailIconButton
                active={liked}
                onClick={() => toggleLike(post.id)}
                label={formatEngagementCount(likeCount)}
                ariaLabel="Like"
              >
                <Heart className="h-[17px] w-[17px]" fill={liked ? "currentColor" : "none"} strokeWidth={1.85} />
              </RailIconButton>

              <RailIconButton
                onClick={() => setCommentsOpen(true)}
                label={formatEngagementCount(commentCountDisplay)}
                ariaLabel="Comments"
              >
                <MessageCircle className="h-[17px] w-[17px]" strokeWidth={1.85} />
              </RailIconButton>

              <RailIconButton
                onClick={() => setShareOpen(true)}
                label={formatEngagementCount(sharesTotal)}
                ariaLabel="Share"
              >
                <Share2 className="h-[17px] w-[17px]" strokeWidth={1.85} />
              </RailIconButton>

              <div className="relative pt-0.5" ref={overflowRef}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setOverflowOpen((o) => !o)}
                  aria-label="More actions"
                  aria-expanded={overflowOpen}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[0.65rem] border border-white/[0.09] bg-black/35 text-white/82 backdrop-blur-md transition-colors tap-highlight-none",
                    overflowOpen && "border-violet-400/35 bg-violet-500/[0.12] text-violet-50",
                  )}
                >
                  <MoreHorizontal className="h-[17px] w-[17px]" strokeWidth={2} />
                </motion.button>

                <AnimatePresence>
                  {overflowOpen ? (
                    <motion.div
                      initial={{ opacity: 0, x: 6, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 4, scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 460, damping: 36 }}
                      className="absolute bottom-0 right-full z-30 mr-1.5 w-[10.25rem] overflow-hidden rounded-xl border border-white/[0.08] bg-black/55 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                    >
                      <OverflowRow
                        icon={Bookmark}
                        label={saved ? "Saved" : "Save"}
                        sub={formatEngagementCount(saveCount)}
                        onClick={() => {
                          toggleSave(post.id);
                          setOverflowOpen(false);
                        }}
                        active={saved}
                      />
                      {showPromptTools ? (
                        <>
                          <OverflowRow
                            icon={GitBranch}
                            label="Remix"
                            onClick={() => {
                              setRemixOpen(true);
                              setOverflowOpen(false);
                            }}
                          />
                          <OverflowRow
                            icon={Sparkles}
                            label="Prompt"
                            onClick={() => {
                              setPromptOpen(true);
                              setOverflowOpen(false);
                            }}
                          />
                        </>
                      ) : null}
                      <OverflowRow
                        icon={LayoutGrid}
                        label="Add to mood board"
                        onClick={() => {
                          setOverflowOpen(false);
                          setShareOpen(true);
                        }}
                      />
                      <OverflowRow
                        icon={ExternalLink}
                        label="View details"
                        onClick={() => {
                          setOverflowOpen(false);
                          router.push(`/post/${post.id}`);
                        }}
                      />
                      <OverflowRow
                        icon={Copy}
                        label="Copy link"
                        onClick={() => {
                          void navigator.clipboard?.writeText(
                            typeof window !== "undefined"
                              ? `${window.location.origin}/post/${post.id}`
                              : "",
                          );
                          sharePost(post.id);
                          setOverflowOpen(false);
                        }}
                      />
                      <OverflowRow
                        icon={Flag}
                        label="Report"
                        danger
                        onClick={() => setOverflowOpen(false)}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PromptRevealModal post={post} open={promptOpen} onClose={() => setPromptOpen(false)} />
      <RemixModal post={post} open={remixOpen} onClose={() => setRemixOpen(false)} />
      {commentsOpen ? (
        <CommentDrawer post={post} open onClose={() => setCommentsOpen(false)} />
      ) : null}
      <ShareSheet post={post} open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}

function RailIconButton({
  children,
  label,
  onClick,
  active,
  ariaLabel,
  accent,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  ariaLabel: string;
  accent?: "violet" | "cyan";
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={`${ariaLabel}: ${label}`}
      className={cn(
        "flex flex-col items-center gap-0 tap-highlight-none",
        active && "text-rose-300",
        !active && accent === "cyan" && "text-cyan-100/95",
        !active && accent === "violet" && "text-violet-100/95",
        !active && !accent && "text-white/92",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[0.65rem] border backdrop-blur-md transition-colors",
          "border-white/[0.09] bg-black/35",
          active && "border-rose-400/35 bg-rose-500/[0.1]",
          !active && accent === "cyan" && "hover:border-cyan-400/25",
          !active && accent === "violet" && "hover:border-violet-400/25",
          !active && !accent && "hover:border-white/[0.14]",
        )}
      >
        {children}
      </span>
      <span className="max-w-[2.85rem] truncate pt-0.5 text-center text-[7px] font-semibold leading-none text-white/58 min-h-[10px]">
        {label}
      </span>
    </motion.button>
  );
}

function OverflowRow({
  icon: Icon,
  label,
  sub,
  onClick,
  active,
  danger,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  sub?: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors tap-highlight-none hover:bg-white/[0.05]",
        danger && "text-rose-200/85 hover:bg-rose-500/[0.08]",
        active && !danger && "bg-violet-500/[0.08] text-violet-100/95",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" strokeWidth={1.85} />
      <span className="min-w-0 flex-1 text-[12px] font-medium text-white/85">{label}</span>
      {sub ? <span className="text-[10px] tabular-nums text-white/38">{sub}</span> : null}
    </button>
  );
}
