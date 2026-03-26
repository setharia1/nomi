"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type FeedScope = "for-you" | "following";

const SCOPES: { id: FeedScope; label: string }[] = [
  { id: "for-you", label: "For you" },
  { id: "following", label: "Following" },
];

export function FeedScopeBar({
  value,
  onChange,
  className,
}: {
  value: FeedScope;
  onChange: (s: FeedScope) => void;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-auto flex justify-center px-2", className)}>
      <div className="flex w-full max-w-md gap-px rounded-full border border-white/[0.06] bg-black/35 p-0.5 backdrop-blur-md sm:max-w-lg">
        {SCOPES.map(({ id, label }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "relative min-w-0 flex-1 rounded-full py-2 text-[11px] font-semibold tracking-wide transition-colors tap-highlight-none sm:text-xs",
                active ? "text-white" : "text-white/42 hover:text-white/70",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="feed-scope-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/40 to-cyan-500/25"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
