"use client";

import { useEffect, useState } from "react";
import type { Creator } from "@/lib/types";
import { useMeId } from "@/lib/auth/meId";
import { mergeSelfProfileIntoCreator } from "./meCreator";

/**
 * Returns seed catalog data on server and the first client pass so HTML matches hydration.
 * After mount, applies local self-profile overrides for the signed-in account only.
 */
export function useHydrationSafeCreator(creator: Creator): Creator {
  const meId = useMeId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  if (!meId || creator.id !== meId) return creator;
  if (!mounted) return creator;
  return mergeSelfProfileIntoCreator(creator);
}
