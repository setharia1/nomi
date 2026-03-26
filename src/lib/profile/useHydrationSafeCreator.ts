"use client";

import { useEffect, useState } from "react";
import type { Creator } from "@/lib/types";
import { ME_CREATOR_ID, mergeSelfProfileIntoCreator } from "./meCreator";

/**
 * Returns seed catalog data on server and the first client pass so HTML matches hydration.
 * After mount, applies local self-profile overrides for ME only.
 */
export function useHydrationSafeCreator(creator: Creator): Creator {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (creator.id !== ME_CREATOR_ID) return creator;
  if (!mounted) return creator;
  return mergeSelfProfileIntoCreator(creator);
}
