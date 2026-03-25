"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { defaultAccountSettings, loadAccountSettings, saveAccountSettings, type AccountSettings, type AppearanceSettings, type ContentPreferences, type PrivacySettings } from "@/lib/profile/accountSettingsStorage";

type SettingsModel = AccountSettings & ContentPreferences & PrivacySettings & AppearanceSettings;

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <span className="text-sm text-white/75">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
    </label>
  );
}

export default function SettingsNotificationsPage() {
  const initial = useMemo(() => defaultAccountSettings() as SettingsModel, []);
  const [model, setModel] = useState<SettingsModel>(() => loadAccountSettings() as SettingsModel || initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Notifications"
        title="Notification preferences"
        description="Likes, comments, remix activity, and more — only what you want to feel."
      />

      <GlassPanel className="space-y-3 border-white/[0.07] p-3.5">
        <ToggleRow
          label="Enable push notifications"
          checked={model.pushNotifications}
          onChange={(v) => {
            setModel((m) => ({ ...m, pushNotifications: v }));
            setDirty(true);
          }}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Likes"
            checked={model.notifyLikes}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyLikes: v }));
              setDirty(true);
            }}
          />
          <ToggleRow
            label="Comments"
            checked={model.notifyComments}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyComments: v }));
              setDirty(true);
            }}
          />
          <ToggleRow
            label="Follows"
            checked={model.notifyFollows}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyFollows: v }));
              setDirty(true);
            }}
          />
          <ToggleRow
            label="Messages"
            checked={model.notifyMessages}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyMessages: v }));
              setDirty(true);
            }}
          />
          <ToggleRow
            label="Mentions"
            checked={model.notifyMentions}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyMentions: v }));
              setDirty(true);
            }}
          />
          <ToggleRow
            label="Remix activity"
            checked={model.notifyRemixActivity}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyRemixActivity: v }));
              setDirty(true);
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Prompt reveal interactions"
            checked={model.notifyPromptReveal}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyPromptReveal: v }));
              setDirty(true);
            }}
          />
          <ToggleRow
            label="Creator updates"
            checked={model.notifyCreatorUpdates}
            onChange={(v) => {
              setModel((m) => ({ ...m, notifyCreatorUpdates: v }));
              setDirty(true);
            }}
          />
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
          Save notification preferences
        </GlowButton>
      </div>
    </div>
  );
}

