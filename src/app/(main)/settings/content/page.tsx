"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { defaultAccountSettings, loadAccountSettings, saveAccountSettings, type AccountSettings, type AppearanceSettings, type ContentPreferences, type PrivacySettings } from "@/lib/profile/accountSettingsStorage";

type SettingsModel = AccountSettings & ContentPreferences & PrivacySettings & AppearanceSettings;

export default function SettingsContentPage() {
  const initial = useMemo(() => defaultAccountSettings() as SettingsModel, []);
  const [model, setModel] = useState<SettingsModel>(() => loadAccountSettings() as SettingsModel || initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Posting defaults"
        title="Content & posting"
        description="Defaults for comments, remix, prompt reveal, and visibility."
      />

      <GlassPanel className="space-y-4 border-white/[0.07] p-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Default allow comments</span>
            <input
              type="checkbox"
              checked={model.defaultAllowComments}
              onChange={(e) => {
                setModel((m) => ({ ...m, defaultAllowComments: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Default allow remix</span>
            <input
              type="checkbox"
              checked={model.defaultAllowRemix}
              onChange={(e) => {
                setModel((m) => ({ ...m, defaultAllowRemix: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-violet-400"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Prompt reveal public by default</span>
            <input
              type="checkbox"
              checked={model.defaultPromptRevealPublic}
              onChange={(e) => {
                setModel((m) => ({ ...m, defaultPromptRevealPublic: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-violet-400"
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm text-white/75">Default post visibility</p>
            <select
              value={model.defaultAudience}
              onChange={(e) => {
                setModel((m) => ({ ...m, defaultAudience: e.target.value as SettingsModel["defaultAudience"] }));
                setDirty(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
            >
              <option value="public">Public</option>
              <option value="followers">Followers</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Auto-save drafts</span>
            <input
              type="checkbox"
              checked={model.autoSaveDrafts}
              onChange={(e) => {
                setModel((m) => ({ ...m, autoSaveDrafts: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Save original uploads</span>
            <input
              type="checkbox"
              checked={model.saveOriginalUploads}
              onChange={(e) => {
                setModel((m) => ({ ...m, saveOriginalUploads: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/70">
            Tip: Create Studio uses smart defaults based on your chosen drop type; these settings tune the base behavior.
          </p>
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
          Save content preferences
        </GlowButton>
      </div>
    </div>
  );
}

