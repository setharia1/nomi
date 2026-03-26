"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Creator, MoodBoard, Post } from "@/lib/types";
import { Archive, Bookmark, Heart, Layers, Sparkles, Trash2, Clapperboard } from "lucide-react";
import { loadArchivedPostIds, saveArchivedPostIds } from "@/lib/profile/archiveStorage";
import { feedTabLabels } from "@/lib/mock-data";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import {
  selectAllPostsMerged,
  selectPostByIdMerged,
  selectPostsForCreatorMerged,
  selectPostsForCreatorSeed,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { useDraftsStore } from "@/lib/create/draftsStore";
import { useVideoJobsStore } from "@/lib/generation/videoJobsStore";
import { MoodBoardCard } from "@/components/collections/MoodBoardCard";
import { ConceptDropCard } from "@/components/collections/ConceptDropCard";
import { useInteractionsStore } from "@/lib/interactions/store";
import { GlowButton } from "@/components/ui/GlowButton";
import { formatEngagementCount } from "@/lib/format/count";
import { getTotalPostViews } from "@/lib/views/parsePostViews";
import { usePostViewsStore } from "@/lib/views/postViewsStore";

const baseTabs = ["Posts", "AI Videos", "AI Photos", "Real Life", "Mood Boards", "Concept Drops"] as const;
const selfTabs = ["Saved", "Drafts", "Archived"] as const;

type Tab = (typeof baseTabs)[number] | (typeof selfTabs)[number];

/** Short labels for narrow screens — full label shows sm+ */
const TAB_SHORT: Record<Tab, string> = {
  Posts: "Posts",
  "AI Videos": "Videos",
  "AI Photos": "Photos",
  "Real Life": "IRL",
  "Mood Boards": "Boards",
  "Concept Drops": "Concepts",
  Saved: "Saved",
  Drafts: "Drafts",
  Archived: "Archive",
};

function mediaBadgeFor(tab: Tab) {
  if (tab === "AI Videos") return "AI Videos";
  if (tab === "AI Photos") return "AI Photos";
  if (tab === "Real Life") return "Real Life";
  if (tab === "Concept Drops") return "Concept Drops";
  return null;
}

export function ProfileTabs({
  creator,
  moodBoards,
  isSelf,
}: {
  creator: Creator;
  moodBoards: MoodBoard[];
  isSelf: boolean;
}) {
  const tabs: Tab[] = useMemo(() => {
    return isSelf ? ([...baseTabs, ...selfTabs] as Tab[]) : ([...baseTabs] as Tab[]);
  }, [isSelf]);

  const [tab, setTab] = useState<Tab>("Posts");

  const hydrateContent = useContentMemoryStore((s) => s.hydrate);
  const userPostsBump = useContentMemoryStore((s) => s.userPosts);

  const [archivedPostIds, setArchivedPostIds] = useState<string[]>([]);
  /** After sync, use merged posts + real archive ids so client matches SSR first paint. */
  const [tabsContentSynced, setTabsContentSynced] = useState(false);

  useEffect(() => {
    hydrateContent();
    usePostViewsStore.getState().hydrate();
    useDraftsStore.getState().hydrate();
    const syncArchive = () => setArchivedPostIds(loadArchivedPostIds());
    syncArchive();
    queueMicrotask(() => setTabsContentSynced(true));
    window.addEventListener("nomi-archive-changed", syncArchive);
    return () => window.removeEventListener("nomi-archive-changed", syncArchive);
  }, [hydrateContent]);

  const mergedCreatorPosts = useMemo(
    () => selectPostsForCreatorMerged(creator.id),
    [creator.id, userPostsBump],
  );
  const seedCreatorPosts = useMemo(() => selectPostsForCreatorSeed(creator.id), [creator.id]);
  const posts = tabsContentSynced ? mergedCreatorPosts : seedCreatorPosts;

  const visiblePosts = useMemo(
    () => (isSelf ? posts.filter((p) => !archivedPostIds.includes(p.id)) : posts),
    [posts, isSelf, archivedPostIds],
  );

  const aiVideos = useMemo(
    () => visiblePosts.filter((p) => p.mediaType === "video" && p.feedTab === "ai-videos"),
    [visiblePosts],
  );
  const aiPhotos = useMemo(
    () => visiblePosts.filter((p) => p.mediaType === "image" && p.feedTab === "ai-photos"),
    [visiblePosts],
  );
  const realLife = useMemo(() => visiblePosts.filter((p) => p.feedTab === "real-life"), [visiblePosts]);
  const conceptDrops = useMemo(() => visiblePosts.filter((p) => p.isConceptDrop), [visiblePosts]);

  const draftList = useDraftsStore((s) => s.list);
  const removeDraft = useDraftsStore((s) => s.remove);
  const videoJobs = useVideoJobsStore((s) => s.jobs);
  const readyVideoJobs = useMemo(
    () => videoJobs.filter((j) => j.phase === "ready"),
    [videoJobs],
  );

  const allMerged = useMemo(() => selectAllPostsMerged(), [userPostsBump]);
  const archivedPosts = useMemo(
    () => allMerged.filter((p) => archivedPostIds.includes(p.id)),
    [allMerged, archivedPostIds],
  );

  const toggleArchive = (postId: string) => {
    const currentlyArchived = archivedPostIds.includes(postId);
    const next = currentlyArchived ? archivedPostIds.filter((id) => id !== postId) : [postId, ...archivedPostIds];
    setArchivedPostIds(next);
    saveArchivedPostIds(next);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("nomi-archive-changed"));
  };

  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const savedCreatorIds = useInteractionsStore((s) => s.savedCreatorIds);
  const savedMoodBoardIds = useInteractionsStore((s) => s.savedMoodBoardIds);

  const allBoards = useMemo<MoodBoard[]>(() => [], []);
  const savedPosts = useMemo(
    () =>
      savedPostIds
        .map((id) => selectPostByIdMerged(id))
        .filter((p): p is Post => Boolean(p)),
    [savedPostIds, userPostsBump],
  );
  const savedBoards = useMemo(() => allBoards.filter((b) => savedMoodBoardIds.includes(b.id)), [allBoards, savedMoodBoardIds]);

  const savedCreators = useMemo(() => {
    return savedCreatorIds.map((id) => getCreatorByIdResolved(id)).filter(Boolean) as Creator[];
  }, [savedCreatorIds]);

  const featuredBadge = mediaBadgeFor(tab);

  const tabPanel = (
    <>
      {featuredBadge ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{featuredBadge}</p>
      ) : null}

      {tab === "Posts" ? (
        <PostGrid
          posts={visiblePosts}
          onToggleArchive={isSelf ? toggleArchive : null}
          archivedIds={archivedPostIds}
          enableSave={!isSelf}
          showViewCounts
          emptyTitle="No posts yet"
          emptyBody="Your first post will land here the moment you publish — build your wall from Create."
          emptyCtaHref="/create"
          emptyCtaLabel="Start creating"
        />
      ) : null}
      {tab === "AI Videos" ? (
        <PostGrid
          posts={aiVideos}
          onToggleArchive={isSelf ? toggleArchive : null}
          archivedIds={archivedPostIds}
          enableSave={!isSelf}
          showViewCounts
          emptyTitle="No AI videos yet"
          emptyBody="Publish a cinematic AI clip — motion reads louder here than anywhere else."
          emptyCtaHref="/create"
          emptyCtaLabel="Create AI video"
        />
      ) : null}
      {tab === "AI Photos" ? (
        <PostGrid
          posts={aiPhotos}
          onToggleArchive={isSelf ? toggleArchive : null}
          archivedIds={archivedPostIds}
          enableSave={!isSelf}
          showViewCounts
          emptyTitle="No AI photos yet"
          emptyBody="Stills with intent — grade, glow, and prompt lineage belong on this wall."
          emptyCtaHref="/create"
          emptyCtaLabel="Create AI photo"
        />
      ) : null}
      {tab === "Real Life" ? (
        <PostGrid
          posts={realLife}
          onToggleArchive={isSelf ? toggleArchive : null}
          archivedIds={archivedPostIds}
          enableSave={!isSelf}
          showViewCounts
          emptyTitle="No real-life moments yet"
          emptyBody="Capture what’s in front of the lens — Nomi keeps IRL as first-class."
          emptyCtaHref="/create"
          emptyCtaLabel="Create"
        />
      ) : null}

      {tab === "Mood Boards" ? (
        moodBoards.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {moodBoards.map((b) => (
              <MoodBoardCard key={b.id} board={b} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="layers"
            title="No mood boards yet"
            body="Collect references like a studio wall — color, texture, and mood in one luminous grid."
            ctaHref="/explore"
            ctaLabel="Explore for inspiration"
          />
        )
      ) : null}

      {tab === "Concept Drops" ? (
        conceptDrops.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {conceptDrops.map((p) => (
              <ConceptDropCard key={p.id} title={p.caption.slice(0, 48) + "…"} subtitle={p.category} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="sparkles"
            title="No concept drops yet"
            body="Ship the rough version — a title, a line of thought, an open remix invitation. Ideas belong in the feed, not in drafts alone."
            ctaHref="/create"
            ctaLabel="Open studio"
            secondaryCtaHref="/create?path=concept-drop"
            secondaryCtaLabel="Concept drop"
          />
        )
      ) : null}

      {isSelf && tab === "Saved" ? (
        <div className="space-y-8">
          {savedPosts.length || savedBoards.length ? (
            <>
              <section className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/32">Saved posts</p>
                  <span className="text-[10px] font-medium text-white/38">{savedPosts.length}</span>
                </div>
                {savedPosts.length ? (
                  <PostGrid
                    posts={savedPosts}
                    compact
                    onToggleArchive={null}
                    archivedIds={archivedPostIds}
                    showViewCounts
                  />
                ) : null}
              </section>
              <section className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/32">Saved mood boards</p>
                  <span className="text-[10px] font-medium text-white/38">{savedBoards.length}</span>
                </div>
                {savedBoards.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {savedBoards.map((b) => (
                      <MoodBoardCard key={b.id} board={b} />
                    ))}
                  </div>
                ) : null}
              </section>
              {savedCreators.length ? (
                <section className="space-y-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/32">Saved creators</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {savedCreators.map((c) => (
                      <Link
                        key={c.id}
                        href={`/profile/${encodeURIComponent(c.username)}`}
                        className="block rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 transition-all hover:border-violet-400/35 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10">
                            <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="40px" />
                          </span>
                          <span className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white/90">{c.displayName}</p>
                            <p className="truncate text-[11px] text-white/45">@{c.username}</p>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon="sparkles"
              title="Your library is quiet"
              body="Save posts, boards, and creators you want to study — Nomi turns saves into a premium archive, not a junk drawer."
              ctaHref="/home"
              ctaLabel="Browse the feed"
              secondaryCtaHref="/saved"
              secondaryCtaLabel="Open saved hub"
            />
          )}
        </div>
      ) : null}

      {isSelf && tab === "Drafts" ? (
        <div className="space-y-5">
          {readyVideoJobs.length ? (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200/65">
                Ready to post
              </p>
              <div className="space-y-2">
                {readyVideoJobs.map((j) => (
                  <Link
                    key={j.id}
                    href={`/create/ready/${encodeURIComponent(j.id)}`}
                    className="block rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4 transition-all hover:border-emerald-400/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-black/35">
                        <Clapperboard className="h-5 w-5 text-emerald-200" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">AI video ready</p>
                        <p className="truncate text-[11px] text-white/45">
                          {j.prompt.length > 64 ? `${j.prompt.slice(0, 64)}…` : j.prompt}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-200/90">Finish</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {draftList.length ? (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/32">Studio drafts</p>
              {draftList.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 transition-all hover:border-violet-400/30 sm:gap-3 sm:p-4"
                >
                  <Link
                    href={`/create?draft=${encodeURIComponent(d.id)}`}
                    className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black sm:h-16 sm:w-16">
                      {d.mediaDataUrl ? (
                        d.mediaType === "video" ? (
                          <video src={d.mediaDataUrl} className="h-full w-full object-cover" muted />
                        ) : (
                          <Image src={d.mediaDataUrl} alt="" fill className="object-cover" unoptimized sizes="64px" />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/35">
                          {d.workflowStatus === "rendering" ? "◌" : d.path === "record" ? "REC" : d.path.slice(0, 3)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white/90">
                        {d.title || d.caption || "Untitled draft"}
                      </p>
                      <p className="mt-1 text-[11px] text-white/45">
                        {d.workflowStatus === "rendering"
                          ? "Rendering…"
                          : d.workflowStatus === "ready_to_post"
                            ? "Ready"
                            : `${feedTabLabels[d.feedTab]} · ${d.path.replace(/-/g, " ")}`}{" "}
                        ·{" "}
                        {new Date(d.updatedAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-cyan-200/90">Open</span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete draft"
                    onClick={() => removeDraft(d.id)}
                    className="shrink-0 rounded-xl border border-white/10 p-2.5 text-white/40 transition-colors hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {!draftList.length && !readyVideoJobs.length ? (
            <EmptyState
              icon="layers"
              title="No drafts waiting"
              body="Pause anytime in the studio — unfinished work stays synced here until you publish."
              ctaHref="/create"
              ctaLabel="Start creating"
            />
          ) : null}
        </div>
      ) : null}

      {isSelf && tab === "Archived" ? (
        <div className="space-y-3">
          {archivedPosts.length ? (
            <PostGrid
              posts={archivedPosts}
              compact
              onToggleArchive={isSelf ? toggleArchive : null}
              archivedIds={archivedPostIds}
              enableSave={false}
              showViewCounts
            />
          ) : (
            <EmptyState
              icon="layers"
              title="Archive is clear"
              body="Hide finished or sensitive drops without deleting them — your public profile stays intentional."
              ctaHref="/home"
              ctaLabel="Back to feed"
            />
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="min-w-0">
      <div className="relative -mx-0.5">
        <div
          className="flex snap-x snap-mandatory gap-0 overflow-x-auto overscroll-x-contain scroll-pl-1 scroll-pr-8 border-b border-white/[0.06] [-ms-overflow-style:none] [scrollbar-width:none] sm:scroll-px-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Profile content"
        >
          {tabs.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={cn(
                  "relative shrink-0 snap-start px-2.5 pb-2.5 pt-1.5 text-[11px] font-medium tracking-wide transition-colors tap-highlight-none sm:px-3 sm:pb-2.5 sm:pt-1.5 sm:text-[12px]",
                  active ? "text-white" : "text-white/40 hover:text-white/62",
                )}
              >
                <span className="relative z-10 block whitespace-nowrap">
                  <span className="sm:hidden">{TAB_SHORT[t]}</span>
                  <span className="hidden sm:inline">{t}</span>
                </span>
                {active ? (
                  <motion.span
                    layoutId="nomi-profile-tab-underline"
                    className="absolute inset-x-0.5 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-violet-400/85 via-white/45 to-cyan-400/80"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--nomi-bg-deep)] via-[var(--nomi-bg-deep)]/75 to-transparent sm:hidden"
          aria-hidden
        />
      </div>

      <div className="pt-4 sm:pt-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {tabPanel}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function GridViewCount({ post }: { post: Post }) {
  usePostViewsStore((s) => s.bonusVersion);
  const bonus = usePostViewsStore.getState().getBonus(post.id);
  const n = formatEngagementCount(getTotalPostViews(post, bonus));
  return (
    <span className="pointer-events-none absolute bottom-1 right-1 rounded-md bg-black/55 px-1 py-px text-[9px] font-semibold tabular-nums text-white/92 ring-1 ring-white/12 backdrop-blur-md sm:bottom-1.5 sm:right-1.5 sm:text-[10px]">
      {n}
    </span>
  );
}

/** Profile grid only: show the real opening frame of the clip; tap opens full post video. */
function ProfileGridThumbnail({ post }: { post: Post }) {
  if (post.mediaType === "video" && post.videoUrl) {
    return (
      <video
        aria-hidden
        src={post.videoUrl}
        poster={post.imageUrl}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
        onLoadedMetadata={(e) => {
          try {
            const v = e.currentTarget;
            const d = v.duration;
            if (Number.isFinite(d) && d > 0) {
              v.currentTime = Math.min(0.15, Math.max(0.01, d * 0.02));
            }
          } catch {
            /* keep poster */
          }
        }}
      />
    );
  }
  return (
    <Image
      src={post.imageUrl}
      alt=""
      fill
      className="object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
      sizes="(max-width:640px) 33vw, 200px"
      unoptimized={post.imageUrl.startsWith("data:")}
    />
  );
}

function PostGrid({
  posts,
  compact,
  enableSave = true,
  showViewCounts = false,
  onToggleArchive,
  archivedIds,
  emptyTitle = "Nothing here yet",
  emptyBody = "This rail will populate as you create drops.",
  emptyCtaHref,
  emptyCtaLabel,
}: {
  posts: Post[];
  compact?: boolean;
  enableSave?: boolean;
  showViewCounts?: boolean;
  onToggleArchive?: ((postId: string) => void) | null;
  archivedIds?: string[];
  emptyTitle?: string;
  emptyBody?: string;
  emptyCtaHref?: string;
  emptyCtaLabel?: string;
}) {
  const likedPostIds = useInteractionsStore((s) => s.likedPostIds);
  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const toggleSave = useInteractionsStore((s) => s.toggleSave);

  if (posts.length === 0) {
    if (!emptyTitle && !emptyBody) {
      return null;
    }
    return (
      <EmptyState
        icon="layers"
        title={emptyTitle}
        body={emptyBody}
        ctaHref={emptyCtaHref}
        ctaLabel={emptyCtaLabel}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-0.5 sm:gap-1",
        compact ? "gap-1 sm:gap-1.5" : "",
      )}
    >
      {posts.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02 }}
        >
          <div
            className={cn(
              "group relative aspect-square overflow-hidden rounded-md transition-[box-shadow,transform] duration-300",
              "ring-1 ring-white/[0.06] hover:ring-white/[0.11] active:scale-[0.99]",
              "sm:rounded-lg",
            )}
          >
            <Link href={`/post/${p.id}`} className="relative block h-full w-full">
              <ProfileGridThumbnail post={p} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
              {p.mediaType === "video" ? (
                <span
                  className={cn(
                    "absolute top-1 rounded-md bg-black/45 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/88 ring-1 ring-white/10 backdrop-blur-md sm:top-1.5 sm:text-[9px]",
                    onToggleArchive ? "right-1 left-auto sm:right-1.5" : "left-1 sm:left-1.5",
                  )}
                >
                  Video
                </span>
              ) : null}
              {likedPostIds.includes(p.id) ? (
                <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full border border-rose-400/22 bg-rose-500/[0.12] px-1 py-0.5 text-[8px] font-semibold text-rose-100/95 ring-1 ring-white/[0.06] backdrop-blur-md sm:bottom-1.5 sm:left-1.5 sm:text-[9px]">
                  <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="currentColor" />
                </span>
              ) : null}
              {showViewCounts ? <GridViewCount post={p} /> : null}
            </Link>

            {enableSave ? (
              <button
                type="button"
                aria-label={savedPostIds.includes(p.id) ? "Unsave" : "Save"}
                className="absolute right-1 top-1 z-10 inline-flex items-center justify-center rounded-md border border-white/[0.12] bg-black/40 px-1.5 py-1.5 text-white/85 ring-1 ring-white/[0.06] backdrop-blur-md transition-colors hover:border-violet-400/35 hover:text-white tap-highlight-none sm:right-1.5 sm:top-1.5 sm:rounded-lg sm:px-2 sm:py-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSave(p.id);
                }}
              >
                <Bookmark
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill={savedPostIds.includes(p.id) ? "currentColor" : "none"}
                  strokeWidth={1.75}
                />
              </button>
            ) : null}

            {onToggleArchive ? (
              <button
                type="button"
                aria-label={archivedIds?.includes(p.id) ? "Unarchive" : "Archive"}
                className="absolute left-1 top-1 z-10 inline-flex items-center justify-center rounded-md border border-white/[0.12] bg-black/40 px-1.5 py-1.5 text-white/85 ring-1 ring-white/[0.06] backdrop-blur-md transition-colors hover:border-cyan-400/30 hover:text-white tap-highlight-none sm:left-1.5 sm:top-1 sm:rounded-lg sm:px-2 sm:py-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleArchive(p.id);
                }}
              >
                <Archive
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill={archivedIds?.includes(p.id) ? "currentColor" : "none"}
                  strokeWidth={1.75}
                />
              </button>
            ) : null}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  icon = "sparkles",
  ctaHref,
  ctaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
}: {
  title: string;
  body: string;
  icon?: "sparkles" | "layers";
  ctaHref?: string;
  ctaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
}) {
  const router = useRouter();
  const Icon = icon === "layers" ? Layers : Sparkles;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(139, 92, 246, 0.1), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative px-5 py-9 text-center sm:px-8 sm:py-10">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-cyan-100/85">
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-white sm:text-lg">
          {title}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/45 sm:text-[14px]">{body}</p>
        {(ctaHref && ctaLabel) || (secondaryCtaHref && secondaryCtaLabel) ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            {ctaHref && ctaLabel ? (
              <GlowButton
                type="button"
                className="w-full min-w-[11rem] justify-center sm:w-auto"
                onClick={() => router.push(ctaHref)}
              >
                {ctaLabel}
              </GlowButton>
            ) : null}
            {secondaryCtaHref && secondaryCtaLabel ? (
              <GlowButton
                type="button"
                variant="ghost"
                className="w-full min-w-[11rem] justify-center border-white/12 sm:w-auto"
                onClick={() => router.push(secondaryCtaHref)}
              >
                {secondaryCtaLabel}
              </GlowButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
