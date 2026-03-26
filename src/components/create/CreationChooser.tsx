"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Droplets,
  FileUp,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ChevronRight,
  LayoutList,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { CreationPath } from "@/lib/create/types";
import { cn } from "@/lib/cn";

const modes: {
  path: CreationPath;
  title: string;
  subtitle: string;
  icon: typeof Clapperboard;
  accent: string;
}[] = [
  {
    path: "record",
    title: "Record",
    subtitle: "Capture real life in a calm, full-screen camera.",
    icon: Clapperboard,
    accent: "from-cyan-500/30 to-sky-600/10 border-cyan-400/30",
  },
  {
    path: "upload",
    title: "Upload",
    subtitle: "AI or camera — drop video or stills, we route the rest.",
    icon: FileUp,
    accent: "from-violet-500/25 to-fuchsia-600/10 border-violet-400/28",
  },
  {
    path: "ai-photo",
    title: "AI Photo",
    subtitle: "Prompt Imagen stills for the AI Photos feed — then caption and publish.",
    icon: ImageIcon,
    accent: "from-fuchsia-600/30 to-amber-500/15 border-fuchsia-400/35",
  },
  {
    path: "ai-post",
    title: "AI Post",
    subtitle: "Prompt + Google Veo video, or upload — then compose & publish.",
    icon: Sparkles,
    accent: "from-violet-600/35 to-cyan-500/15 border-cyan-400/35",
  },
  {
    path: "concept-drop",
    title: "Concept Drop",
    subtitle: "Rough frames & ideas — built for fast creative ping-pong.",
    icon: Droplets,
    accent: "from-teal-500/25 to-violet-600/10 border-teal-400/30",
  },
];

const pathShortcuts = [
  { label: "AI photo", path: "ai-photo" as CreationPath },
  { label: "AI video", path: "ai-post" as CreationPath },
  { label: "Concept", path: "concept-drop" as CreationPath },
  { label: "Record now", path: "record" as CreationPath },
];

export function CreationChooser({
  draftCount,
  onSelect,
}: {
  draftCount: number;
  onSelect: (p: CreationPath) => void;
}) {
  return (
    <div className="space-y-8 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-200/85">
            Creation studio
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-[2.1rem]">
            What are we making?
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/52">
            Choose a door. Nomi keeps the steps light — capture, shape, preview, publish — with power
            tucked behind glass when you need it.
          </p>
        </div>
        <Link
          href="/create/drafts"
          className="glass-panel-muted flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-violet-400/35 hover:text-white tap-highlight-none"
        >
          <LayoutList className="h-4 w-4 text-violet-200" />
          Drafts
          {draftCount > 0 ? (
            <span className="rounded-md bg-violet-500/25 px-2 py-0.5 text-[11px] font-bold text-violet-100">
              {draftCount}
            </span>
          ) : null}
        </Link>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
          <Layers className="h-4 w-4" />
          Shortcuts
        </div>
        <div className="flex flex-wrap gap-2">
          {pathShortcuts.map((q) => (
            <motion.button
              key={q.label}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(q.path)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-cyan-400/35 hover:text-white tap-highlight-none"
            >
              {q.label}
            </motion.button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((m, i) => (
          <motion.button
            key={m.path}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(m.path)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 text-left shadow-lg transition-shadow hover:shadow-[0_0_36px_rgba(139,92,246,0.12)] tap-highlight-none",
              m.accent,
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-white backdrop-blur-md">
                <m.icon className="h-6 w-6" strokeWidth={1.65} />
              </span>
              <ChevronRight className="h-5 w-5 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
            </div>
            <p className="relative mt-4 font-[family-name:var(--font-syne)] text-lg font-bold text-white">
              {m.title}
            </p>
            <p className="relative mt-1 text-sm leading-relaxed text-white/58">{m.subtitle}</p>
          </motion.button>
        ))}
      </div>

      <GlassPanel muted className="border-white/[0.06] p-4 text-center text-sm text-white/50">
        Drafts autosave lightly — heavy videos may ask you to reattach when you resume.
      </GlassPanel>
    </div>
  );
}
