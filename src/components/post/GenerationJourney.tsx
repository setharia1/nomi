"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { GenerationStep } from "@/lib/types";

export function GenerationJourney({ steps }: { steps: GenerationStep[] }) {
  return (
    <GlassPanel className="p-4 overflow-hidden">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 mb-4">
        Generation journey
      </p>
      <div className="relative">
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-violet-500/50 via-cyan-400/30 to-transparent" />
        <ul className="space-y-5">
          {steps.map((step, i) => (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-4 items-start relative"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full border border-cyan-400/30 bg-[var(--nomi-bg)] shadow-[0_0_16px_rgba(56,189,248,0.2)] flex items-center justify-center text-xs font-bold text-white/90 z-10">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-semibold text-white text-sm">{step.label}</p>
                <p className="text-white/55 text-sm mt-0.5 leading-snug">{step.detail}</p>
                {step.thumbnailUrl ? (
                  <div className="relative mt-3 aspect-video max-w-[200px] rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={step.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ) : null}
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </GlassPanel>
  );
}
