"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function ConceptDropCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <GlassPanel className="p-4 border-dashed border-cyan-400/30 bg-cyan-500/[0.03] hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(56,189,248,0.12)]">
        <div className="flex items-center gap-2 text-cyan-100/95">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Concept drop</span>
        </div>
        <p className="mt-2 font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-white/50 mt-1 leading-relaxed">{subtitle}</p>
      </GlassPanel>
    </motion.div>
  );
}
