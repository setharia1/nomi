"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ExploreFilter } from "@/lib/mock-data";
import { exploreFilters } from "@/lib/mock-data";

export function FilterChips({
  active,
  onChange,
}: {
  active: ExploreFilter;
  onChange: (f: ExploreFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {exploreFilters.map((f) => {
        const isOn = f === active;
        return (
          <motion.button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex-shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-wide transition-colors",
              isOn
                ? "border-transparent text-white"
                : "border-white/[0.08] bg-white/[0.025] text-white/48 hover:border-white/[0.12] hover:text-white/75",
            )}
          >
            {isOn ? (
              <motion.span
                layoutId="filter-glow"
                className="absolute inset-0 rounded-full border border-white/[0.12] bg-gradient-to-r from-violet-600/45 to-cyan-500/30 shadow-[0_0_18px_rgba(139,92,246,0.2)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{f}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
