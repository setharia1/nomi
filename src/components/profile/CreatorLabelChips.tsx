"use client";

import type { Creator } from "@/lib/types";

const labelByTag: { tag: string; label: string }[] = [
  { tag: "cinematic", label: "AI Filmmaker" },
  { tag: "worldbuild", label: "World Architect" },
  { tag: "fashion", label: "Visual Experimenter" },
  { tag: "portrait", label: "Prompt Designer" },
  { tag: "characters", label: "Concept Artist" },
  { tag: "concept-drop", label: "Concept Artist" },
  { tag: "experimental", label: "Signal Explorer" },
  { tag: "animation", label: "Motion Sculptor" },
  { tag: "lifestyle", label: "Real-life Composer" },
];

function deriveLabels(creator: Creator): string[] {
  const set = new Set<string>();
  set.add(creator.creatorCategory);
  for (const t of creator.tags) {
    const hit = labelByTag.find((x) => x.tag === t);
    if (hit) set.add(hit.label);
  }
  return Array.from(set).slice(0, 3);
}

export function CreatorLabelChips({ creator, overridesLabel }: { creator: Creator; overridesLabel?: string }) {
  const labels = overridesLabel ? [overridesLabel] : deriveLabels(creator);
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 sm:justify-start">
      {labels.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 ? (
            <span className="mr-2 text-[10px] font-light text-white/18" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/44">{l}</span>
        </span>
      ))}
    </div>
  );
}
