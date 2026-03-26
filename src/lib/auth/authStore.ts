"use client";

import { create } from "zustand";
import type { AccountPublic } from "@/lib/nomi/roleTypes";
import type { Creator } from "@/lib/types";
import { accountPublicToCreator } from "@/lib/nomi/accountBridge";
import { useAccountRegistryStore } from "@/lib/accounts/registryStore";
import { rememberSuccessfulLogin } from "@/lib/auth/loginIdentifierStore";

const TOKEN_KEY = "nomi-session-token";
const ACCOUNT_CACHE_KEY = "nomi-session-account-v1";

function loadCachedAccount(): AccountPublic | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccountPublic>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.id !== "string" || typeof parsed.username !== "string") return null;
    return parsed as AccountPublic;
  } catch {
    return null;
  }
}

function clearSessionPersistence() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_CACHE_KEY);
}

function cacheSession(token: string, account: AccountPublic) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(account));
}

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
    cacheSession(token, account);
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
    const cachedAccount = loadCachedAccount();
    if (!token) {
      set({ token: null, account: null, ready: true });
      await fetchAccountsDirectory();
      return;
    }
    if (cachedAccount) {
      set({ token, account: cachedAccount, ready: true });
      useAccountRegistryStore.getState().upsert(accountPublicToCreator(cachedAccount));
    } else {
      set({ token, account: null, ready: true });
    }
    try {
      const r = await fetch("/api/nomi/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        if (r.status === 401 || r.status === 404) {
          clearSessionPersistence();
          set({ token: null, account: null, ready: true });
          await fetchAccountsDirectory();
        }
        return;
      }
      const { account } = (await r.json()) as { account: AccountPublic };
      await get().setSession(token, account);
      set({ ready: true });
    } catch {
      set((prev) => ({ ready: true, token: prev.token ?? token, account: prev.account ?? cachedAccount ?? null }));
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
    rememberSuccessfulLogin(account, emailOrUsername);
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
    rememberSuccessfulLogin(account, account.email);
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
    clearSessionPersistence();
    set({ token: null, account: null, ready: true });
    await fetchAccountsDirectory();
  },
}));
