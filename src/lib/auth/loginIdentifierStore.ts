"use client";

import type { AccountPublic } from "@/lib/nomi/roleTypes";

const LOGIN_IDENTIFIERS_KEY = "nomi-login-identifiers-v1";
const LOGIN_LAST_INPUT_KEY = "nomi-login-last-input-v1";
const MAX_ITEMS = 6;

type StoredLoginIdentifiers = {
  emails: string[];
  usernames: string[];
  lastSuccessfulIdentifier: string | null;
};

export type LoginIdentifierSnapshot = {
  emails: string[];
  usernames: string[];
  lastSuccessfulIdentifier: string | null;
  lastInputIdentifier: string | null;
};

function normalizeEmail(value: string): string | null {
  const v = value.trim().toLowerCase();
  return v.includes("@") ? v : null;
}

function normalizeUsername(value: string): string | null {
  const v = value.trim().replace(/^@+/, "").toLowerCase();
  if (!v) return null;
  return /^[a-z0-9_]{3,32}$/.test(v) ? v : null;
}

function dedupeAndCap(items: string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!item || out.includes(item)) continue;
    out.push(item);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

function loadStoredLoginIdentifiers(): StoredLoginIdentifiers {
  if (typeof window === "undefined") {
    return { emails: [], usernames: [], lastSuccessfulIdentifier: null };
  }
  try {
    const raw = localStorage.getItem(LOGIN_IDENTIFIERS_KEY);
    if (!raw) return { emails: [], usernames: [], lastSuccessfulIdentifier: null };
    const parsed = JSON.parse(raw) as Partial<StoredLoginIdentifiers>;
    return {
      emails: Array.isArray(parsed.emails) ? dedupeAndCap(parsed.emails.map((v) => String(v).trim().toLowerCase())) : [],
      usernames: Array.isArray(parsed.usernames)
        ? dedupeAndCap(parsed.usernames.map((v) => String(v).trim().replace(/^@+/, "").toLowerCase()))
        : [],
      lastSuccessfulIdentifier:
        typeof parsed.lastSuccessfulIdentifier === "string" && parsed.lastSuccessfulIdentifier.trim()
          ? parsed.lastSuccessfulIdentifier.trim()
          : null,
    };
  } catch {
    return { emails: [], usernames: [], lastSuccessfulIdentifier: null };
  }
}

function saveStoredLoginIdentifiers(next: StoredLoginIdentifiers) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LOGIN_IDENTIFIERS_KEY,
      JSON.stringify({
        emails: dedupeAndCap(next.emails),
        usernames: dedupeAndCap(next.usernames),
        lastSuccessfulIdentifier: next.lastSuccessfulIdentifier ?? null,
      } satisfies StoredLoginIdentifiers),
    );
  } catch {
    /* ignore localStorage errors */
  }
}

export function rememberSuccessfulLogin(account: AccountPublic, enteredIdentifier?: string) {
  const existing = loadStoredLoginIdentifiers();
  const normalizedEmail = normalizeEmail(account.email);
  const normalizedUsername = normalizeUsername(account.username);
  const entered = (enteredIdentifier ?? "").trim();
  const enteredEmail = normalizeEmail(entered);
  const enteredUsername = normalizeUsername(entered);

  const emails = dedupeAndCap([
    ...(enteredEmail ? [enteredEmail] : []),
    ...(normalizedEmail ? [normalizedEmail] : []),
    ...existing.emails,
  ]);
  const usernames = dedupeAndCap([
    ...(enteredUsername ? [enteredUsername] : []),
    ...(normalizedUsername ? [normalizedUsername] : []),
    ...existing.usernames,
  ]);

  const lastSuccessfulIdentifier =
    enteredEmail ?? (enteredUsername ? `@${enteredUsername}` : null) ?? normalizedEmail ?? (normalizedUsername ? `@${normalizedUsername}` : null);

  saveStoredLoginIdentifiers({
    emails,
    usernames,
    lastSuccessfulIdentifier,
  });
}

export function saveLastLoginInput(value: string) {
  if (typeof window === "undefined") return;
  const next = value.trim();
  try {
    if (next) {
      localStorage.setItem(LOGIN_LAST_INPUT_KEY, next);
    } else {
      localStorage.removeItem(LOGIN_LAST_INPUT_KEY);
    }
  } catch {
    /* ignore localStorage errors */
  }
}

export function loadLoginIdentifierSnapshot(): LoginIdentifierSnapshot {
  const stored = loadStoredLoginIdentifiers();
  if (typeof window === "undefined") {
    return {
      ...stored,
      lastInputIdentifier: null,
    };
  }
  let lastInputIdentifier: string | null = null;
  try {
    const raw = localStorage.getItem(LOGIN_LAST_INPUT_KEY);
    if (raw && raw.trim()) lastInputIdentifier = raw.trim();
  } catch {
    /* ignore localStorage errors */
  }
  return {
    ...stored,
    lastInputIdentifier,
  };
}
