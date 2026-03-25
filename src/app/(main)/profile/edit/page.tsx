"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Upload, Globe } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { CreatorLabelChips } from "@/components/profile/CreatorLabelChips";
import type { Creator } from "@/lib/types";
import { creators, getMoodBoardsForCreator } from "@/lib/mock-data";
import {
  clearSelfProfileOverrides,
  getSelfProfileOverrides,
  setSelfProfileOverrides,
  type SelfProfileOverrides,
} from "@/lib/profile/selfProfileStorage";
import { isDataUrlAvatar, normalizeProfilePhotoFile } from "@/lib/profile/avatarUpload";

const labelChoices = ["AI Filmmaker", "Visual Experimenter", "Prompt Designer", "Concept Artist", "Signature Creator"];

/** Picker hint: broad coverage for mobile galleries (HEIC, odd Android MIMEs, TIFF, etc.). */
const AVATAR_ACCEPT =
  "image/*,.heic,.heif,.avif,.tif,.tiff,.bmp,.gif,.jpg,.jpeg,.png,.webp";

export default function ProfileEditPage() {
  const router = useRouter();
  const me = creators[0];
  const boards = getMoodBoardsForCreator(me.id);

  const [overrides, setOverrides] = useState<SelfProfileOverrides>(() => (getSelfProfileOverrides() ?? {}));
  const [busy, setBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const effective: Creator = useMemo(() => {
    return {
      ...me,
      displayName: overrides.displayName ?? me.displayName,
      username: overrides.username ?? me.username,
      bio: overrides.bio ?? me.bio,
      avatarUrl: overrides.avatarUrl ?? me.avatarUrl,
      tags: me.tags,
    };
  }, [me, overrides]);

  const featuredMoodBoardId = overrides.featuredMoodBoardId ?? boards[0]?.id;
  const featuredBoard = boards.find((b) => b.id === featuredMoodBoardId);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = async (file: File) => {
    setAvatarError(null);
    setBusy(true);
    try {
      const url = await normalizeProfilePhotoFile(file);
      setOverrides((o) => ({ ...o, avatarUrl: url }));
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Could not use this photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-6">
      <header className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/80">Creator studio</p>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">Edit profile</h1>
        <p className="max-w-md text-sm text-white/50">Make your identity feel unmistakably you.</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <GlassPanel className="p-4 border-white/[0.07] space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-3xl border border-white/10 bg-black">
                <Image
                  src={effective.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized={isDataUrlAvatar(effective.avatarUrl)}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">Avatar</p>
                <p className="text-sm text-white/45">Tap to upload from device</p>
              </div>
            </div>
            <input
              ref={avatarFileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void onPickAvatar(f);
              }}
              aria-label="Choose avatar image"
            />
            <GlowButton
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => avatarFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {busy ? "Uploading" : "Change"}
            </GlowButton>
          </div>
          {avatarError ? (
            <p className="text-sm text-rose-200/90" role="status">
              {avatarError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-white/75">Display name</span>
              <input
                value={overrides.displayName ?? me.displayName}
                onChange={(e) => setOverrides((o) => ({ ...o, displayName: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
              />
            </label>
            <label className="block">
              <span className="text-sm text-white/75">Username</span>
              <input
                value={overrides.username ?? me.username}
                onChange={(e) => setOverrides((o) => ({ ...o, username: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-white/75">Bio</span>
            <textarea
              value={overrides.bio ?? me.bio}
              onChange={(e) => setOverrides((o) => ({ ...o, bio: e.target.value }))}
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus"
              placeholder="Your creator identity statement…"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-white/75 inline-flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-200/70" />
                Website
              </span>
              <input
                value={overrides.website ?? ""}
                onChange={(e) => setOverrides((o) => ({ ...o, website: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
                placeholder="https://your.link"
              />
            </label>
            <label className="block">
              <span className="text-sm text-white/75">Location / vibe</span>
              <input
                value={overrides.location ?? ""}
                onChange={(e) => setOverrides((o) => ({ ...o, location: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
                placeholder="Teal hour studio"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Creator label</p>
            <div className="flex flex-wrap gap-2">
              {labelChoices.map((l) => {
                const active = (overrides.creatorLabel ?? "") === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setOverrides((o) => ({ ...o, creatorLabel: active ? undefined : l }))}
                    className={[
                      "rounded-full border px-3 py-2 text-xs font-semibold transition-colors tap-highlight-none",
                      active ? "border-violet-400/45 bg-violet-500/15 text-white shadow-[0_0_18px_rgba(139,92,246,0.18)]" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                    ].join(" ")}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Featured mood board</p>
            <select
              value={featuredMoodBoardId ?? ""}
              onChange={(e) => setOverrides((o) => ({ ...o, featuredMoodBoardId: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white glow-focus"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
              {!boards.length ? <option value="">No boards</option> : null}
            </select>
          </div>

          <div className="flex gap-3">
            <GlowButton
              type="button"
              className="flex-1"
              onClick={() => {
                const prevUser = (getSelfProfileOverrides()?.username ?? me.username).trim();
                setSelfProfileOverrides(overrides);
                setSavedAt(Date.now());
                const nextUser = (overrides.username?.trim() || me.username).trim();
                if (nextUser && nextUser.toLowerCase() !== prevUser.toLowerCase()) {
                  router.replace(`/profile/${encodeURIComponent(nextUser)}`);
                }
              }}
            >
              Save profile
            </GlowButton>
            <GlowButton
              type="button"
              variant="ghost"
              onClick={() => {
                setOverrides({});
                clearSelfProfileOverrides();
              }}
            >
              Reset
            </GlowButton>
          </div>

          <AnimatePresence>
            {savedAt ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.05] p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-cyan-100/90">
                  <Check className="h-4 w-4" />
                  Saved. Your identity is updated.
                </p>
                <p className="mt-1 text-sm text-white/50">Profile preview reflects your latest changes.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </GlassPanel>

        <GlassPanel className="p-4 border-white/[0.07] space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-semibold">Live preview</p>
            <p className="mt-2 text-sm text-white/50">Your header, labels, and featured collection.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <Image
                    src={effective.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized={isDataUrlAvatar(effective.avatarUrl)}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90 truncate">{effective.displayName}</p>
                  <p className="text-[11px] text-white/45 truncate">@{effective.username}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/70">
                {overrides.creatorLabel ?? effective.creatorCategory}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <CreatorLabelChips creator={effective} overridesLabel={overrides.creatorLabel} />
              <p className="text-sm text-white/70">{overrides.bio ?? me.bio}</p>
            </div>
          </motion.div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-semibold">Featured</p>
            {featuredBoard ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="relative aspect-[4/3] bg-black">
                  <Image src={featuredBoard.coverUrls[0]} alt="" fill className="object-cover" sizes="300px" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-white/90">{featuredBoard.title}</p>
                  <p className="text-[11px] text-white/45">{featuredBoard.itemCount} references</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-white/45">
                Choose a featured mood board
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

