"use client";

import { useEffect, useState } from "react";
import { creators } from "@/lib/mock-data";
import { getSelfProfileOverrides } from "./selfProfileStorage";

/** Bottom nav / deep links — stays in sync when you rename your handle. */
export function useMyProfileHref(): string {
  const [href, setHref] = useState("/profile/orion.latent");

  useEffect(() => {
    const sync = () => {
      const o = getSelfProfileOverrides();
      const u = (o?.username?.trim() || creators[0]!.username).trim();
      setHref(`/profile/${encodeURIComponent(u)}`);
    };
    sync();
    window.addEventListener("nomi-self-profile-changed", sync);
    return () => window.removeEventListener("nomi-self-profile-changed", sync);
  }, []);

  return href;
}
