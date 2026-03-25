"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { FeedTab } from "@/lib/types";
import { feedTabLabels, feedTabOrder } from "@/lib/mock-data";

export function FeedTabBar({
  value,
  onChange,
  className,
}: {
  value: FeedTab;
  onChange: (t: FeedTab) => void;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-auto flex justify-center px-2", className)}>
      <div className="flex gap-px rounded-full border border-white/[0.06] bg-black/40 p-0.5 backdrop-blur-md">
        {feedTabOrder.map((tab) => {
          const active = tab === value;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={cn(
                "relative min-w-0 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wide transition-colors tap-highlight-none sm:px-3.5 sm:py-1.5 sm:text-[11px]",
                active ? "text-white" : "text-white/40 hover:text-white/68",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="feed-tab-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/35 to-cyan-500/22"
                  transition={{ type: "spring", stiffness: 460, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10 whitespace-nowrap">{feedTabLabels[tab]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
