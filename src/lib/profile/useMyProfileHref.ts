"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import { resolveCreator } from "@/lib/accounts/resolveCreator";
import { getSelfProfileOverrides } from "./selfProfileStorage";

/** Bottom nav / deep links — stays in sync when you rename your handle. */
export function useMyProfileHref(): string {
  const account = useAuthStore((s) => s.account);
  const [profileEpoch, setProfileEpoch] = useState(0);

  useEffect(() => {
    const onProfile = () => setProfileEpoch((n) => n + 1);
    window.addEventListener("nomi-self-profile-changed", onProfile);
    return () => window.removeEventListener("nomi-self-profile-changed", onProfile);
  }, []);

  return useMemo(() => {
    void profileEpoch;
    const o = getSelfProfileOverrides();
    const fromReg = account?.id ? resolveCreator(account.id) : undefined;
    const u = (o?.username?.trim() || fromReg?.username || account?.username || "you").trim();
    return `/profile/${encodeURIComponent(u)}`;
  }, [account?.id, account?.username, profileEpoch]);
}
