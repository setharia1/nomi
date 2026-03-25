"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import type { BoardHit } from "@/lib/search/types";
import { cn } from "@/lib/cn";

export function BoardSearchCard({ hit, className }: { hit: BoardHit; className?: string }) {
  const { board, creator } = hit;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.05] to-transparent p-3 backdrop-blur-sm transition-all hover:border-violet-400/30 hover:shadow-[0_0_28px_rgba(139,92,246,0.15)]",
        className,
      )}
    >
      <Link
        href={`/profile/${encodeURIComponent(creator.username)}`}
        className="flex gap-3 tap-highlight-none"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
          <Image src={board.coverUrls[0]} alt="" fill className="object-cover" sizes="64px" />
          <div className="absolute inset-0 bg-violet-500/10" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <LayoutGrid className="h-3 w-3" strokeWidth={2} />
            Mood board
          </div>
          <p className="mt-1 truncate font-semibold text-white">{board.title}</p>
          <p className="truncate text-xs text-white/45">
            {creator.displayName} · {board.itemCount} refs
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
