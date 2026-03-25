"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { MoodBoard } from "@/lib/types";

export function MoodBoardCard({ board }: { board: MoodBoard }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
      <GlassPanel className="p-3 border-white/10 hover:border-violet-400/30 transition-colors">
        <div className="flex gap-1 rounded-xl overflow-hidden h-24">
          {board.coverUrls.slice(0, 3).map((url, i) => (
            <div key={i} className="relative flex-1 min-w-0 h-full">
              <Image src={url} alt="" fill className="object-cover" sizes="120px" />
            </div>
          ))}
        </div>
        <p className="mt-3 font-semibold text-white text-sm">{board.title}</p>
        <p className="text-xs text-white/45 mt-0.5">{board.itemCount} references</p>
      </GlassPanel>
    </motion.div>
  );
}
