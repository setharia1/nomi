"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { defaultAccountSettings, loadAccountSettings, saveAccountSettings, type AccountSettings, type AppearanceSettings, type ContentPreferences, type PrivacySettings } from "@/lib/profile/accountSettingsStorage";

type SettingsModel = AccountSettings & ContentPreferences & PrivacySettings & AppearanceSettings;

export default function SettingsPrivacyPage() {
  const initial = useMemo(() => defaultAccountSettings() as SettingsModel, []);
  const [model, setModel] = useState<SettingsModel>(() => loadAccountSettings() as SettingsModel || initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Private account"
        title="Privacy"
        description="Who can message, comment, remix, and see prompt details."
      />

      <GlassPanel className="space-y-4 border-white/[0.07] p-3.5">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Messaging</p>
          <select
            value={model.whoCanMessage}
            onChange={(e) => {
              setModel((m) => ({ ...m, whoCanMessage: e.target.value as PrivacySettings["whoCanMessage"] }));
              setDirty(true);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Comments</p>
          <select
            value={model.whoCanComment}
            onChange={(e) => {
              setModel((m) => ({ ...m, whoCanComment: e.target.value as PrivacySettings["whoCanComment"] }));
              setDirty(true);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Remix permissions</p>
          <select
            value={model.whoCanRemix}
            onChange={(e) => {
              setModel((m) => ({ ...m, whoCanRemix: e.target.value as PrivacySettings["whoCanRemix"] }));
              setDirty(true);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
            <option value="allowed-creators">Allowed creators</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Prompt reveal</p>
          <select
            value={model.whoCanRevealPrompt}
            onChange={(e) => {
              setModel((m) => ({ ...m, whoCanRevealPrompt: e.target.value as PrivacySettings["whoCanRevealPrompt"] }));
              setDirty(true);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Allow tagging</span>
            <input
              type="checkbox"
              checked={model.allowTagging}
              onChange={(e) => {
                setModel((m) => ({ ...m, allowTagging: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Allow mentions</span>
            <input
              type="checkbox"
              checked={model.allowMentions}
              onChange={(e) => {
                setModel((m) => ({ ...m, allowMentions: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Blocked & muted</p>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white/85">Muted</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {model.mutedUsernames.length ? (
                  model.mutedUsernames.map((u) => (
                    <span key={u} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/60">
                      @{u}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/45">None</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/85">Blocked</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {model.blockedUsernames.length ? (
                  model.blockedUsernames.map((u) => (
                    <span key={u} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/60">
                      @{u}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/45">None</span>
                )}
              </div>
            </div>
            <GlowButton type="button" variant="ghost" className="w-full" onClick={() => setDirty(true)}>
              Manage list (mock)
            </GlowButton>
          </div>
        </div>
      </GlassPanel>

      <div className="flex gap-3">
        <GlowButton
          type="button"
          onClick={() => {
            saveAccountSettings(model);
            setDirty(false);
          }}
          disabled={!dirty}
          className="flex-1"
        >
          Save privacy settings
        </GlowButton>
      </div>
    </div>
  );
}

