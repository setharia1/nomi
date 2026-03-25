"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { defaultAccountSettings, loadAccountSettings, saveAccountSettings, type AccountSettings, type AppearanceSettings, type ContentPreferences, type PrivacySettings } from "@/lib/profile/accountSettingsStorage";

type SettingsModel = AccountSettings & ContentPreferences & PrivacySettings & AppearanceSettings;

export default function SettingsSecurityPage() {
  const initial = useMemo(() => defaultAccountSettings() as SettingsModel, []);
  const [model, setModel] = useState<SettingsModel>(() => loadAccountSettings() as SettingsModel || initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Security"
        title="Login & recovery"
        description="Two-factor, sessions, and recovery — mock controls for the prototype."
      />

      <GlassPanel className="space-y-4 border-white/[0.07] p-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Two-factor authentication</span>
            <input
              type="checkbox"
              checked={model.twoFactorEnabled}
              onChange={(e) => {
                setModel((m) => ({ ...m, twoFactorEnabled: e.target.checked }));
                setDirty(true);
              }}
              className="h-4 w-4 accent-violet-400"
            />
          </label>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-white/90">Active sessions</p>
            <p className="mt-1 text-sm text-white/45">{model.sessionsDeviceCount} devices</p>
            <GlowButton type="button" variant="ghost" className="mt-3 w-full" onClick={() => setDirty(true)}>
              Manage sessions (mock)
            </GlowButton>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Login activity</p>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/70">Today · Safari on iPhone</span>
              <span className="text-[11px] text-cyan-200/70">Trusted</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/70">2 days ago · Chrome on Mac</span>
              <span className="text-[11px] text-white/45">Trusted</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/70">1 week ago · Unknown device</span>
              <span className="text-[11px] text-rose-200/70">Review</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <GlowButton type="button" variant="ghost" className="w-full" onClick={() => setDirty(true)}>
            Start recovery (mock)
          </GlowButton>
          <GlowButton type="button" variant="ghost" className="w-full" onClick={() => setDirty(true)}>
            Export login history
          </GlowButton>
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
          Save security changes
        </GlowButton>
      </div>
    </div>
  );
}

