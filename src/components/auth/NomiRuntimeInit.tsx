"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import { useFeedCatalogStore } from "@/lib/feed/feedCatalogStore";

export function NomiRuntimeInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
    void useFeedCatalogStore.getState().hydrate();
  }, []);
  return <>{children}</>;
}
