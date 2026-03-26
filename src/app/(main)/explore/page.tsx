"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { ExploreGrid } from "@/components/explore/ExploreGrid";
import { FilterChips } from "@/components/explore/FilterChips";
import { ForYouRail } from "@/components/explore/ForYouRail";
import { ExploreDiscoveryHub } from "@/components/explore/ExploreDiscoveryHub";
import type { ExploreFilter } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ExplorePage() {
  const [filter, setFilter] = useState<ExploreFilter>("Trending");

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-4">
      <PageHeader
        kicker="Discovery"
        title="Explore the network"
        description="Everything here is from real publishes in your app — no demo accounts or placeholder media."
      />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <Link
          href="/search"
          className="group relative flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-3.5 pr-3.5 text-left transition-colors hover:border-violet-400/28 hover:bg-white/[0.045] tap-highlight-none"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-400/22 bg-violet-500/[0.08] text-violet-200/95">
            <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              Open Nomi Search
              <Sparkles className="h-3.5 w-3.5 text-cyan-300/90" strokeWidth={2} />
            </p>
            <p className="truncate text-xs text-white/45">Creators, prompts, topics, concept drops, mood boards</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/48 transition group-hover:border-cyan-400/28 group-hover:text-cyan-100/85">
            Search
          </span>
        </Link>
      </motion.div>

      <ExploreDiscoveryHub />

      <ForYouRail />

      <div className="space-y-3">
        <h2 className="nomi-section-title">Catalog</h2>
        <FilterChips active={filter} onChange={setFilter} />
      </div>

      <ExploreGrid activeFilter={filter} />
    </div>
  );
}
