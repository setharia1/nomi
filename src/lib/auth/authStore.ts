"use client";

import { create } from "zustand";
import type { AccountPublic } from "@/lib/nomi/roleTypes";
import type { Creator } from "@/lib/types";
import { accountPublicToCreator } from "@/lib/nomi/accountBridge";
import { useAccountRegistryStore } from "@/lib/accounts/registryStore";

const TOKEN_KEY = "nomi-session-token";

export type AuthState = {
  token: string | null;
  account: AccountPublic | null;
  ready: boolean;

  setSession: (token: string, account: AccountPublic) => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<{ error?: string }>;
  register: (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
};

async function fetchAccountsDirectory() {
  const r = await fetch("/api/nomi/accounts");
  if (!r.ok) return;
  const data = (await r.json()) as { creators: Creator[] };
  useAccountRegistryStore.getState().setFromServer(data.creators ?? []);
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  account: null,
  ready: false,

  setSession: async (token, account) => {
    localStorage.setItem(TOKEN_KEY, token);
    useAccountRegistryStore.getState().upsert(accountPublicToCreator(account));
    set({ token, account, ready: true });
    await fetchAccountsDirectory();
  },

  bootstrap: async () => {
    if (typeof window === "undefined") {
      set({ ready: true });
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ token: null, account: null, ready: true });
      await fetchAccountsDirectory();
      return;
    }
    try {
      const r = await fetch("/api/nomi/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        localStorage.removeItem(TOKEN_KEY);
        set({ token: null, account: null, ready: true });
        await fetchAccountsDirectory();
        return;
      }
      const { account } = (await r.json()) as { account: AccountPublic };
      await get().setSession(token, account);
      set({ ready: true });
    } catch {
      set({ token: null, account: null, ready: true });
      await fetchAccountsDirectory();
    }
  },

  login: async (emailOrUsername, password) => {
    const r = await fetch("/api/nomi/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const data = await r.json();
    if (!r.ok) {
      return { error: typeof data.error === "string" ? data.error : "Login failed" };
    }
    const { token, account } = data as { token: string; account: AccountPublic };
    await get().setSession(token, account);
    return {};
  },

  register: async (input) => {
    const r = await fetch("/api/nomi/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    if (!r.ok) {
      return { error: typeof data.error === "string" ? data.error : "Sign up failed" };
    }
    const { token, account } = data as { token: string; account: AccountPublic };
    await get().setSession(token, account);
    return {};
  },

  logout: async () => {
    const tok = get().token;
    if (tok) {
      await fetch("/api/nomi/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, account: null, ready: true });
    await fetchAccountsDirectory();
  },
}));
