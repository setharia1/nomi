"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { defaultAccountSettings, loadAccountSettings, saveAccountSettings, type AppearanceSettings, type AccountSettings, type ContentPreferences, type PrivacySettings } from "@/lib/profile/accountSettingsStorage";

type SettingsModel = AccountSettings & ContentPreferences & PrivacySettings & AppearanceSettings;

export default function SettingsAccountPage() {
  const initial = useMemo(() => defaultAccountSettings() as SettingsModel, []);
  const [model, setModel] = useState<SettingsModel>(() => loadAccountSettings() as SettingsModel || initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-[var(--nomi-section-gap)] pb-6">
      <PageHeader
        kicker="Private account"
        title="Account"
        description="Manage identity, sessions, and security controls."
      />

      <div className="space-y-3">
        <GlassPanel className="space-y-4 border-white/[0.07] p-3.5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Profile identity</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-white/75">Email</span>
                <input
                  value={model.email}
                  onChange={(e) => {
                    const next = { ...model, email: e.target.value };
                    setModel(next);
                    setDirty(true);
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/75">Phone</span>
                <input
                  value={model.phone}
                  onChange={(e) => {
                    const next = { ...model, phone: e.target.value };
                    setModel(next);
                    setDirty(true);
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Sessions</p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-semibold text-white/90">Devices</p>
                <p className="text-sm text-white/45">{model.sessionsDeviceCount} active sessions</p>
              </div>
              <GlowButton type="button" variant="ghost" onClick={() => setDirty(true)}>
                Review
              </GlowButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <span className="text-sm text-white/75">Two-factor authentication</span>
              <input
                type="checkbox"
                checked={model.twoFactorEnabled}
                onChange={(e) => {
                  const next = { ...model, twoFactorEnabled: e.target.checked };
                  setModel(next);
                  setDirty(true);
                }}
                className="h-4 w-4 accent-violet-400"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <span className="text-sm text-white/75">Marketing email</span>
              <input
                type="checkbox"
                checked={model.marketingEmail}
                onChange={(e) => {
                  const next = { ...model, marketingEmail: e.target.checked };
                  setModel(next);
                  setDirty(true);
                }}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm text-white/75">Push notifications</span>
            <input
              type="checkbox"
              checked={model.pushNotifications}
              onChange={(e) => {
                const next = { ...model, pushNotifications: e.target.checked };
                setModel(next);
                setDirty(true);
              }}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </GlassPanel>

        <div className="grid gap-3 sm:grid-cols-2">
          <GlassPanel className="p-4 border-white/[0.07]">
            <p className="text-sm font-semibold text-white/90">Logout</p>
            <p className="mt-1 text-sm text-white/45">Ends sessions on this device (mock action).</p>
            <div className="mt-3">
              <GlowButton type="button" variant="ghost" className="w-full" onClick={() => setDirty(true)}>
                Logout
              </GlowButton>
            </div>
          </GlassPanel>
          <GlassPanel className="p-4 border-white/[0.07]">
            <p className="text-sm font-semibold text-white/90">Deactivate account</p>
            <p className="mt-1 text-sm text-white/45">Temporarily hide your creator identity (mock).</p>
            <div className="mt-3">
              <GlowButton type="button" variant="ghost" className="w-full" onClick={() => setDirty(true)}>
                Deactivate
              </GlowButton>
            </div>
          </GlassPanel>
        </div>

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
            Save changes
          </GlowButton>
        </div>
      </div>
    </div>
  );
}

