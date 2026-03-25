"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { Signal } from "@/lib/types";

const typeLabel: Record<Signal["type"], string> = {
  drop: "Drop",
  board: "Board",
  series: "Series",
};

export function SignalsRow({ signals }: { signals: Signal[] }) {
  if (!signals.length) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {signals.map((s, i) => (
        <motion.button
          key={s.id}
          type="button"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="flex-shrink-0 flex flex-col items-center gap-2 tap-highlight-none"
        >
          <GlassPanel className="relative w-20 h-20 rounded-2xl overflow-hidden p-0 border-violet-400/20 hover:border-violet-400/45 hover:shadow-[0_0_24px_rgba(139,92,246,0.2)] transition-all">
            <Image src={s.coverUrl} alt="" fill className="object-cover" sizes="80px" />
            <div className="absolute inset-0 ring-2 ring-transparent hover:ring-violet-400/30 transition-all rounded-2xl" />
          </GlassPanel>
          <span className="text-[10px] font-semibold text-white/70 max-w-[5rem] truncate">{s.label}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/35 -mt-1">
            {typeLabel[s.type]}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
