import type { Creator } from "@/lib/types";
import { creators as seedCreators } from "@/lib/mock-data";
import { useAccountRegistryStore } from "./registryStore";

/** Resolve a creator from the live registry (client) or seed (SSR / fallback). */
export function resolveCreator(id: string): Creator | undefined {
  if (typeof window !== "undefined") {
    const r = useAccountRegistryStore.getState().byId[id];
    if (r) return r;
  }
  return seedCreators.find((c) => c.id === id);
}

export function resolveCreatorByUsername(username: string): Creator | undefined {
  const slug = decodeURIComponent(username).trim().toLowerCase().replace(/^@+/, "");
  if (typeof window !== "undefined") {
    const hit = Object.values(useAccountRegistryStore.getState().byId).find(
      (c) => c.username.toLowerCase() === slug,
    );
    if (hit) return hit;
  }
  return seedCreators.find((c) => c.username.toLowerCase() === slug);
}
