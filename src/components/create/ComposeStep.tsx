"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { CreationPath, PostDraft, PostMood } from "@/lib/create/types";
import { feedTabLabels, feedTabOrder } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

const moods: { id: PostMood; label: string }[] = [
  { id: "cinematic", label: "Cinematic" },
  { id: "playful", label: "Playful" },
  { id: "minimal", label: "Minimal" },
  { id: "experimental", label: "Experimental" },
  { id: "intimate", label: "Intimate" },
];

function JourneyEditor({
  draft,
  setDraft,
}: {
  draft: PostDraft;
  setDraft: React.Dispatch<React.SetStateAction<PostDraft>>;
}) {
  return (
    <div className="space-y-2">
      {draft.journey.map((step, idx) => (
        <div key={step.id} className="flex gap-2">
          <input
            value={step.label}
            onChange={(e) => {
              const j = [...draft.journey];
              j[idx] = { ...step, label: e.target.value };
              setDraft((d) => ({ ...d, journey: j }));
            }}
            placeholder="Stage"
            className="flex-1 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-white placeholder:text-white/30"
          />
          <input
            value={step.detail}
            onChange={(e) => {
              const j = [...draft.journey];
              j[idx] = { ...step, detail: e.target.value };
              setDraft((d) => ({ ...d, journey: j }));
            }}
            placeholder="Detail"
            className="flex-[2] rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-white placeholder:text-white/30"
          />
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 text-white/45 hover:text-rose-300"
            onClick={() =>
              setDraft((d) => ({ ...d, journey: d.journey.filter((_, i) => i !== idx) }))
            }
            aria-label="Remove step"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setDraft((d) => ({
            ...d,
            journey: [
              ...d.journey,
              { id: `s-${Date.now()}`, label: "", detail: "" },
            ],
          }))
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2 text-xs font-semibold text-white/55 hover:border-cyan-400/35 hover:text-white"
      >
        <Plus className="h-4 w-4" />
        Add journey beat
      </button>
    </div>
  );
}

export function ComposeStep({
  path,
  draft,
  setDraft,
  onBack,
  onNext,
  onSaveDraft,
}: {
  path: CreationPath;
  draft: PostDraft;
  setDraft: React.Dispatch<React.SetStateAction<PostDraft>>;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(
    path === "ai-post" || path === "ai-photo" || path === "concept-drop",
  );
  const aiHeavy =
    path === "ai-post" ||
    path === "ai-photo" ||
    draft.feedTab === "ai-videos" ||
    draft.feedTab === "ai-photos";
  const real = path === "record" || draft.feedTab === "real-life";
  const concept = path === "concept-drop" || draft.isConceptDrop;

  return (
    <div className="space-y-5 pb-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Shape</p>
        <h2 className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Make it yours
        </h2>
        <p className="mt-1 text-sm text-white/48">
          {concept
            ? "Concept drops stay lighter — lead with mood and invitation."
            : aiHeavy
              ? "We surfaced AI controls first — caption still wins the scroll."
              : "Fast caption + tags. Power lives one tap away."}
        </p>
      </div>

      <GlassPanel className="space-y-4 border-white/[0.07] p-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Caption
          </label>
          <textarea
            value={draft.caption}
            onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
            rows={3}
            placeholder="The line everyone sees first"
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus focus:border-violet-400/35"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Tags
          </label>
          <input
            value={draft.tags}
            onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
            placeholder="comma, separated, vibes"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus"
          />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Post mood</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {moods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, mood: m.id }))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all tap-highlight-none",
                  draft.mood === m.id
                    ? "border-cyan-400/45 bg-cyan-500/15 text-white shadow-[0_0_16px_rgba(56,189,248,0.18)]"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {!concept ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Feed tab</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {feedTabOrder.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, feedTab: tab }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    draft.feedTab === tab
                      ? "border-violet-400/45 bg-violet-500/15 text-white"
                      : "border-white/10 text-white/50 hover:border-white/18 hover:text-white/78",
                  )}
                >
                  {feedTabLabels[tab]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Category</label>
            <input
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white glow-focus"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Audience</label>
            <select
              value={draft.audience}
              onChange={(e) =>
                setDraft((d) => ({ ...d, audience: e.target.value as PostDraft["audience"] }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white glow-focus"
            >
              <option value="public">Public</option>
              <option value="followers">Followers</option>
            </select>
          </div>
        </div>
      </GlassPanel>

      {(aiHeavy || !real) && !concept ? (
        <GlassPanel className="space-y-4 border-cyan-400/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100/85">AI surface</p>
          <div>
            <label className="text-xs font-semibold text-white/50">Prompt reveal</label>
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, promptRevealPublic: !d.promptRevealPublic }))}
              className={cn(
                "mt-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                draft.promptRevealPublic
                  ? "border-cyan-400/35 bg-cyan-500/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55",
              )}
            >
              <span className="text-sm font-medium">Share the prompt?</span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200/90">
                {draft.promptRevealPublic ? "Public" : "Hidden"}
              </span>
            </button>
            <p className="mt-1 text-[11px] text-white/35">
              Hidden still keeps lineage private to you — great for client work.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, allowRemix: !d.allowRemix }))}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                draft.allowRemix
                  ? "border-violet-400/35 bg-violet-500/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55",
              )}
            >
              <span className="text-sm font-medium">Allow remix</span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-100/90">
                {draft.allowRemix ? "On" : "Off"}
              </span>
            </button>
          </div>
        </GlassPanel>
      ) : null}

      <GlassPanel muted className="space-y-3 border-white/[0.06] p-4">
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={draft.allowComments}
              onChange={(e) => setDraft((d) => ({ ...d, allowComments: e.target.checked }))}
              className="h-4 w-4 accent-cyan-400"
            />
            Allow comments
          </label>
        </div>
      </GlassPanel>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/75 hover:border-violet-400/25"
      >
        Advanced craft
        <motion.span animate={{ rotate: advancedOpen ? 180 : 0 }}>
          <ChevronDown className="h-5 w-5 text-white/45" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {advancedOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <GlassPanel className="space-y-4 border-white/[0.07] p-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Title / series label
                </label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Prompt
                </label>
                <textarea
                  value={draft.prompt}
                  onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs text-white glow-focus"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Process notes
                </label>
                <textarea
                  value={draft.processNotes}
                  onChange={(e) => setDraft((d) => ({ ...d, processNotes: e.target.value }))}
                  rows={2}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Tools</label>
                  <input
                    value={draft.toolsUsed}
                    onChange={(e) => setDraft((d) => ({ ...d, toolsUsed: e.target.value }))}
                    placeholder="e.g. Comfy, AE"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Model</label>
                  <input
                    value={draft.modelUsed}
                    onChange={(e) => setDraft((d) => ({ ...d, modelUsed: e.target.value }))}
                    placeholder="e.g. custom SDXL"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Inspiration / refs
                </label>
                <input
                  value={draft.inspiration}
                  onChange={(e) => setDraft((d) => ({ ...d, inspiration: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Generation journey
                </p>
                <div className="mt-2">
                  <JourneyEditor draft={draft} setDraft={setDraft} />
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-col gap-2 sm:flex-row">
        <GlowButton type="button" variant="ghost" className="sm:flex-1" onClick={onBack}>
          Back
        </GlowButton>
        <GlowButton type="button" variant="ghost" className="sm:flex-1" onClick={onSaveDraft}>
          Save draft
        </GlowButton>
        <GlowButton type="button" className="sm:flex-[2]" onClick={onNext}>
          Preview
        </GlowButton>
      </div>
    </div>
  );
}
