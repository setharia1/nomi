"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { defaultAccountSettings, loadAccountSettings, saveAccountSettings, type AccountSettings, type AppearanceSettings, type ContentPreferences, type PrivacySettings } from "@/lib/profile/accountSettingsStorage";

type SettingsModel = AccountSettings & ContentPreferences & PrivacySettings & AppearanceSettings;

export default function SettingsAppearancePage() {
  const initial = useMemo(() => defaultAccountSettings() as SettingsModel, []);
  const [model, setModel] = useState<SettingsModel>(() => loadAccountSettings() as SettingsModel || initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Appearance"
        title="Theme & motion"
        description="Accent, density, autoplay previews, and motion — tuned to how you use Nomi."
      />

      <GlassPanel className="space-y-4 border-white/[0.07] p-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-white/75">Theme</p>
            <select
              value={model.theme}
              onChange={(e) => {
                setModel((m) => ({ ...m, theme: e.target.value as AppearanceSettings["theme"] }));
                setDirty(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/75">Density</p>
            <select
              value={model.density}
              onChange={(e) => {
                setModel((m) => ({ ...m, density: e.target.value as AppearanceSettings["density"] }));
                setDirty(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-white/75">Accent</p>
          <div className="flex flex-wrap gap-2">
            {(["violet", "cyan", "teal", "rose"] as const).map((a) => {
              const active = model.accent === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setModel((m) => ({ ...m, accent: a }));
                    setDirty(true);
                  }}
                  className={[
                    "rounded-full border px-4 py-2 text-xs font-semibold transition-colors tap-highlight-none",
                    active
                      ? "border-white/20 bg-white/[0.05] text-white shadow-[0_0_24px_rgba(139,92,246,0.2)]"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Reduce motion</span>
            <input
              type="checkbox"
              checked={model.reduceMotion}
              onChange={(e) => {
                setModel((m) => ({ ...m, reduceMotion: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-violet-400"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Autoplay previews</span>
            <input
              type="checkbox"
              checked={model.autoplayPreviews}
              onChange={(e) => {
                setModel((m) => ({ ...m, autoplayPreviews: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </div>
      </GlassPanel>

      <div className="flex gap-3">
        <GlowButton
          type="button"
          className="flex-1"
          onClick={() => {
            saveAccountSettings(model);
            setDirty(false);
          }}
          disabled={!dirty}
        >
          Save appearance
        </GlowButton>
      </div>
    </div>
  );
}

