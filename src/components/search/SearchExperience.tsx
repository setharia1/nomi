"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { AESTHETIC_VIBES, CURATED_TOPIC_SLUGS, TRENDING_SEARCHES } from "@/lib/search/constants";
import { buildPersonalizationSignals, runSearch } from "@/lib/search/engine";
import {
  clearRecentSearches,
  loadRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
} from "@/lib/search/recentSearches";
import { getAutocompleteSuggestions, type SearchSuggestion } from "@/lib/search/suggestions";
import { parseSearchTab, SEARCH_TAB_LABELS, SEARCH_TAB_ORDER } from "@/lib/search/tabs";
import type { SearchTab } from "@/lib/search/types";
import { computeFollowerCounts } from "@/lib/social/followGraph";
import { useMeId } from "@/lib/auth/meId";
import { useInteractionsStore } from "@/lib/interactions/store";
import type { Creator } from "@/lib/types";
import { creators, posts as seedPosts } from "@/lib/mock-data";
import { useAccountRegistryStore } from "@/lib/accounts/registryStore";
import { useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { cn } from "@/lib/cn";
import { CreatorSearchRow } from "./creator-search-row";
import { PostSearchCard } from "./post-search-card";
import { BoardSearchCard } from "./board-search-card";
import { PageHeader } from "@/components/layout/PageHeader";

function tabHasResults(tab: SearchTab, s: ReturnType<typeof runSearch>): boolean {
  switch (tab) {
    case "top":
      return s.creators.length + s.posts.length + s.topics.length + s.boards.length > 0;
    case "creators":
      return s.creators.length > 0;
    case "posts":
    case "ai-videos":
    case "ai-photos":
    case "real-life":
    case "concept-drops":
      return s.posts.length > 0;
    case "topics":
      return s.topics.length > 0;
    case "boards":
      return s.boards.length > 0;
    default:
      return false;
  }
}

export function SearchExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qCommitted = searchParams.get("q") ?? "";
  const tab = parseSearchTab(searchParams.get("tab"));
  const meId = useMeId();

  const hydrated = useInteractionsStore((s) => s.hydrated);
  const followingByUserId = useInteractionsStore((s) => s.followingByUserId);
  const likedPostIds = useInteractionsStore((s) => s.likedPostIds);
  const savedPostIds = useInteractionsStore((s) => s.savedPostIds);
  const savedCreatorIds = useInteractionsStore((s) => s.savedCreatorIds);
  const userPosts = useContentMemoryStore((s) => s.userPosts);
  const registryById = useAccountRegistryStore((s) => s.byId);

  const searchCatalog = useMemo(() => {
    const merged = useContentMemoryStore.getState().mergeWithSeed(seedPosts);
    const byId = new Map<string, Creator>();
    for (const c of creators) byId.set(c.id, c);
    for (const c of Object.values(registryById)) byId.set(c.id, c);
    return { posts: merged, creators: Array.from(byId.values()) };
  }, [userPosts, registryById]);

  const meFollowingSlice = followingByUserId[meId ?? ""];
  const meFollowing = useMemo(() => meFollowingSlice ?? [], [meFollowingSlice]);
  const followerCounts = useMemo(() => computeFollowerCounts(followingByUserId), [followingByUserId]);

  const [input, setInput] = useState(qCommitted);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    useContentMemoryStore.getState().hydrate();
    setRecent(loadRecentSearches());
  }, []);

  useEffect(() => {
    setInput(qCommitted);
  }, [qCommitted]);

  useEffect(() => {
    const q = input.trim().toLowerCase();
    if (q.length < 1) return;
    const t = window.setTimeout(() => {
      void (async () => {
        const r = await fetch(`/api/nomi/accounts/search?q=${encodeURIComponent(q)}`);
        if (!r.ok) return;
        const data = (await r.json()) as { creators: Creator[] };
        const upsert = useAccountRegistryStore.getState().upsert;
        for (const c of data.creators ?? []) upsert(c);
      })();
    }, 220);
    return () => window.clearTimeout(t);
  }, [input]);

  const sig = useMemo(
    () =>
      buildPersonalizationSignals(
        {
          followedCreatorIds: hydrated ? meFollowing : [],
          likedPostIds: hydrated ? likedPostIds : [],
          savedPostIds: hydrated ? savedPostIds : [],
          savedCreatorIds: hydrated ? savedCreatorIds : [],
          recentQueries: recent,
          followerCounts,
        },
        searchCatalog.posts,
      ),
    [
      hydrated,
      meFollowing,
      likedPostIds,
      savedPostIds,
      savedCreatorIds,
      recent,
      followerCounts,
      searchCatalog.posts,
    ],
  );

  const snapshot = useMemo(
    () => runSearch(qCommitted, tab, sig, searchCatalog),
    [qCommitted, tab, sig, searchCatalog],
  );

  const suggestions = useMemo(
    () =>
      getAutocompleteSuggestions({
        prefix: input,
        sig,
        recents: recent,
        postsCatalog: searchCatalog.posts,
        limit: 8,
      }),
    [input, sig, recent, searchCatalog.posts],
  );

  const preQuerySnapshot = useMemo(() => runSearch("", "top", sig, searchCatalog), [sig, searchCatalog]);

  const commitQuery = useCallback(
    (nextRaw: string, nextTab: SearchTab = tab) => {
      const trimmed = nextRaw.trim();
      const qs = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        qs.set("q", trimmed);
        pushRecentSearch(trimmed);
        setRecent(loadRecentSearches());
      } else {
        qs.delete("q");
      }
      qs.set("tab", nextTab);
      router.push(`/search?${qs.toString()}`);
      setFocused(false);
    },
    [router, searchParams, tab],
  );

  const setTab = useCallback(
    (nextTab: SearchTab) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (qCommitted.trim()) qs.set("q", qCommitted.trim());
      else qs.delete("q");
      qs.set("tab", nextTab);
      router.replace(`/search?${qs.toString()}`);
    },
    [router, searchParams, qCommitted],
  );

  const applySuggestion = useCallback(
    (s: SearchSuggestion) => {
      if (s.kind === "topic" && s.slug) {
        pushRecentSearch(s.label);
        setRecent(loadRecentSearches());
        router.push(`/explore/topic/${encodeURIComponent(s.slug)}`);
        setFocused(false);
        return;
      }
      if (s.kind === "creator" && s.username) {
        pushRecentSearch(s.label);
        setRecent(loadRecentSearches());
        router.push(`/profile/${encodeURIComponent(s.username)}`);
        setFocused(false);
        return;
      }
      commitQuery(s.label);
    },
    [router, commitQuery],
  );

  const hasCommittedQuery = qCommitted.trim().length > 0;
  const showDropdown = focused && (input.trim().length > 0 || recent.length > 0);
  const hasResults = tabHasResults(tab, snapshot);

  const personalizedLine = useMemo(() => {
    if (sig.followedCreatorIds.length) return "Creators similar to people you follow";
    if (sig.affinityTagSlugs.length) return `Signals that echo your ${sig.affinityTagSlugs.slice(0, 2).join(" · ")} taste`;
    if (sig.savedPostIds.length) return "Picked from saves, likes, and latent taste";
    return "Editorial discovery tuned to Nomi’s graph";
  }, [sig]);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/explore"
          className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-white/70 transition hover:border-violet-400/30 hover:text-white tap-highlight-none"
          aria-label="Back to explore"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Discovery</p>
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white md:text-2xl">
            Search the network
          </h1>
        </div>
      </div>

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          commitQuery(input);
        }}
      >
        <motion.div
          layout
          className={cn(
            "relative rounded-xl border transition-all duration-300",
            focused
              ? "border-violet-400/32 bg-white/[0.05] shadow-[0_0_28px_rgba(139,92,246,0.12)]"
              : "border-white/[0.08] bg-white/[0.03]",
          )}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder="Creators, prompts, aesthetics, tags…"
            className="w-full rounded-xl bg-transparent py-3 pl-12 pr-12 text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          {input ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setInput("")}
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </motion.div>

        <AnimatePresence>
          {showDropdown ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-white/[0.1] bg-black/78 shadow-[0_20px_56px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            >
              <ul className="max-h-[min(60vh,360px)] overflow-y-auto py-1" role="listbox">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.06]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(s)}
                    >
                      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                        {s.kind === "creator"
                          ? "Creator"
                          : s.kind === "topic"
                            ? "Topic"
                            : s.kind === "recent"
                              ? "Recent"
                              : s.kind === "trend"
                                ? "Trend"
                                : "Tag"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{s.label}</span>
                        {s.subtitle ? (
                          <span className="block truncate text-xs text-white/45">{s.subtitle}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-white/45">Keep typing — we’ll surface matches.</li>
                ) : null}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>

      {!hasCommittedQuery ? (
        <div className="space-y-8">
          <section className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.06] via-transparent to-cyan-400/[0.05] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-2 text-violet-200">
                <Sparkles className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">Creative search, not a filter</p>
                <p className="mt-1 text-sm text-white/55">{personalizedLine}</p>
              </div>
            </div>
          </section>

          {TRENDING_SEARCHES.length ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">Trending now</h2>
                <TrendingUp className="h-4 w-4 text-cyan-300/80" />
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-cyan-400/35 hover:text-white"
                    onClick={() => commitQuery(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">Recent</h2>
              {recent.length ? (
                <button
                  type="button"
                  className="text-[11px] font-semibold text-violet-300/90 hover:text-violet-200"
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  Clear all
                </button>
              ) : null}
            </div>
            {recent.length ? (
              <ul className="space-y-2">
                {recent.slice(0, 8).map((r) => (
                  <li
                    key={r}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-sm text-white/85"
                      onClick={() => commitQuery(r)}
                    >
                      {r}
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white"
                      aria-label={`Remove ${r}`}
                      onClick={() => {
                        removeRecentSearch(r);
                        setRecent(loadRecentSearches());
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">
                No recents yet — your searches will appear here.
              </p>
            )}
          </section>

          {CURATED_TOPIC_SLUGS.length ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">Curated hubs</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CURATED_TOPIC_SLUGS.map((hub) => (
                  <Link
                    key={hub.slug}
                    href={`/explore/topic/${encodeURIComponent(hub.slug)}`}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition-colors hover:border-violet-400/28 tap-highlight-none"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{hub.label}</p>
                    <p className="mt-2 text-sm text-white/70">{hub.blurb}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {AESTHETIC_VIBES.length ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">Search by vibe</h2>
              <div className="flex flex-wrap gap-2">
                {AESTHETIC_VIBES.map((v) => (
                  <button
                    key={v.slug}
                    type="button"
                    onClick={() => commitQuery(v.label)}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-100/90 hover:border-cyan-400/40"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {preQuerySnapshot.creators.length ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">On Nomi</h2>
              <div className="space-y-2">
                {preQuerySnapshot.creators.slice(0, 5).map(({ creator, reason }) => (
                  <CreatorSearchRow
                    key={creator.id}
                    creator={creator}
                    reason={reason}
                    previewTags={creator.tags}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {preQuerySnapshot.posts.length ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">From posts</h2>
              <div className="grid grid-cols-2 gap-2">
                {preQuerySnapshot.posts.slice(0, 6).map(({ post, reason }) => (
                  <PostSearchCard key={post.id} post={post} reason={reason} />
                ))}
              </div>
            </section>
          ) : null}

          {preQuerySnapshot.boards.length ? (
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">Mood boards</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {preQuerySnapshot.boards.slice(0, 4).map((b) => (
                  <BoardSearchCard key={`${b.creator.id}-${b.board.id}`} hit={b} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="sticky top-[calc(var(--nomi-header-h)+0.5rem)] z-20 -mx-1 bg-gradient-to-b from-black/80 via-black/70 to-transparent pb-2 pt-1 backdrop-blur-xl">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SEARCH_TAB_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                    tab === id
                      ? "border-violet-400/50 bg-violet-500/20 text-white shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white/80",
                  )}
                >
                  {SEARCH_TAB_LABELS[id]}
                </button>
              ))}
            </div>
          </div>

          {snapshot.personalizedHint ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
              {snapshot.personalizedHint}
            </p>
          ) : null}

          {!hasResults ? (
            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 text-center">
              <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">No matches in this lane</p>
              <p className="text-sm text-white/55">
                Try a broader tab, a vibe tag, or explore what&apos;s trending across the network.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/85"
                  onClick={() => setTab("top")}
                >
                  Open Top mix
                </button>
                {TRENDING_SEARCHES.slice(0, 3).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100"
                    onClick={() => commitQuery(t, "top")}
                  >
                    {t}
                  </button>
                ))}
                {!TRENDING_SEARCHES.length ? (
                  <button
                    type="button"
                    className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100"
                    onClick={() => router.push("/explore")}
                  >
                    Explore
                  </button>
                ) : null}
              </div>
            </div>
          ) : tab === "top" ? (
            <div className="space-y-8">
              {snapshot.creators.length ? (
                <section className="space-y-3">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Creators</h2>
                  <div className="space-y-2">
                    {snapshot.creators.slice(0, 5).map(({ creator, reason }) => (
                      <CreatorSearchRow key={creator.id} creator={creator} reason={reason} previewTags={creator.tags} />
                    ))}
                  </div>
                </section>
              ) : null}
              {snapshot.posts.length ? (
                <section className="space-y-3">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Content</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {snapshot.posts.slice(0, 8).map(({ post, reason }) => (
                      <PostSearchCard key={post.id} post={post} reason={reason} />
                    ))}
                  </div>
                </section>
              ) : null}
              {snapshot.topics.length ? (
                <section className="space-y-3">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Topics & tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.topics.slice(0, 16).map((t) => (
                      <Link
                        key={t.slug}
                        href={`/explore/topic/${encodeURIComponent(t.slug)}`}
                        className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/80 hover:border-violet-400/35"
                      >
                        #{t.label}{" "}
                        <span className="text-white/40">
                          · {t.postCount}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
              {snapshot.posts.filter((x) => x.post.isConceptDrop).length ? (
                <section className="space-y-3">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Concept drops</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {snapshot.posts
                      .filter((x) => x.post.isConceptDrop)
                      .slice(0, 4)
                      .map(({ post, reason }) => (
                        <PostSearchCard key={post.id} post={post} reason={reason} />
                      ))}
                  </div>
                </section>
              ) : null}
              {snapshot.boards.length ? (
                <section className="space-y-3">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Mood boards</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {snapshot.boards.slice(0, 4).map((b) => (
                      <BoardSearchCard key={`${b.creator.id}-${b.board.id}`} hit={b} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : tab === "creators" ? (
            <div className="space-y-2">
              {snapshot.creators.map(({ creator, reason }) => (
                <CreatorSearchRow key={creator.id} creator={creator} reason={reason} previewTags={creator.tags} />
              ))}
            </div>
          ) : tab === "topics" ? (
            <div className="flex flex-wrap gap-2">
              {snapshot.topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/explore/topic/${encodeURIComponent(t.slug)}`}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:border-cyan-400/28"
                >
                  <p className="text-sm font-semibold text-white">#{t.label}</p>
                  <p className="text-[11px] text-white/45">
                    {t.postCount} posts · {t.creatorCount} creators
                  </p>
                </Link>
              ))}
            </div>
          ) : tab === "boards" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {snapshot.boards.map((b) => (
                <BoardSearchCard key={`${b.creator.id}-${b.board.id}`} hit={b} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {snapshot.posts.map(({ post, reason }) => (
                <PostSearchCard key={post.id} post={post} reason={reason} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
