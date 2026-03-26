#!/usr/bin/env node
/**
 * API + page smoke tests against a running Next server.
 * Usage: SMOKE_BASE_URL=http://127.0.0.1:3000 node scripts/e2e-smoke.mjs
 * Or:    npm run test:ci  (build + start + smoke on port 3999)
 */

import { randomBytes } from "node:crypto";

const BASE = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const failures = [];
let passes = 0;

function assert(cond, msg) {
  if (cond) {
    passes += 1;
    return;
  }
  failures.push(msg);
}

function randHex(bytes = 6) {
  return randomBytes(bytes).toString("hex");
}

async function main() {
  process.stdout.write(`Smoke: ${BASE}\n`);

  // --- Public pages (basic HTML) ---
  for (const path of ["/login", "/signup", "/home", "/explore", "/create"]) {
    const r = await fetch(`${BASE}${path}`, { redirect: "follow" });
    assert(r.ok, `${path} status ${r.status}`);
    const html = await r.text();
    assert(html.includes("html") && html.length > 100, `${path} HTML looks empty`);
  }

  // --- Health & public API ---
  let h = await fetch(`${BASE}/api/nomi/health`);
  assert(h.ok, `/api/nomi/health ${h.status}`);
  const hj = await h.json();
  assert(typeof hj.redis === "boolean", "health.redis boolean");
  assert(typeof hj.blob === "boolean", "health.blob boolean");
  assert(typeof hj.authOk === "boolean", "health.authOk boolean");

  h = await fetch(`${BASE}/api/nomi/posts/catalog`);
  assert(h.ok, `/api/nomi/posts/catalog ${h.status}`);
  const c0 = await h.json();
  assert(Array.isArray(c0.posts), "catalog.posts array");

  h = await fetch(`${BASE}/api/nomi/accounts`);
  assert(h.ok, `/api/nomi/accounts ${h.status}`);
  const acc0 = await h.json();
  assert(Array.isArray(acc0.creators), "accounts.creators array");

  h = await fetch(`${BASE}/api/nomi/accounts/search?q=`);
  assert(h.ok, `/api/nomi/accounts/search ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/accounts/by-username/definitely_missing_${randHex(4)}`);
  assert(h.status === 404, `by-username missing expect 404 got ${h.status}`);

  // --- Auth: 503 if Vercel blocks (document only) ---
  const suffix = randHex(8);
  const email = `smoke_${suffix}@e2e.local`;
  const username = `usr_${suffix}`;
  const password = "smokepass1";

  h = await fetch(`${BASE}/api/nomi/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      username,
      displayName: "Smoke User",
    }),
  });

  if (h.status === 503) {
    process.stdout.write(
      "SKIP auth/post tests: server returns 503 (e.g. Vercel without Redis). Run locally with Redis.\n",
    );
    // Still count prior passes; exit 0 if only this blocks
    printSummary();
    process.exit(failures.length ? 1 : 0);
  }

  const regText = await h.text();
  let reg;
  try {
    reg = JSON.parse(regText);
  } catch {
    reg = {};
  }
  assert(h.ok, `register ${h.status} ${regText.slice(0, 200)}`);
  assert(typeof reg.token === "string" && reg.token.length > 10, "register.token");
  assert(reg.account?.id, "register.account.id");
  const token = reg.token;
  const accountId = reg.account.id;

  // Duplicate register
  h = await fetch(`${BASE}/api/nomi/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "otherpass12",
      username: `other_${suffix}`,
      displayName: "X",
    }),
  });
  assert(h.status === 409, `duplicate email expect 409 got ${h.status}`);

  // Validation
  h = await fetch(`${BASE}/api/nomi/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "bad",
      password,
      username: "ab",
      displayName: "Y",
    }),
  });
  assert(h.status === 400, `invalid register expect 400 got ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `longname_${suffix}@e2e.local`,
      password,
      username: `ln_${suffix}`,
      displayName: "x".repeat(200),
    }),
  });
  assert(h.status === 400, `long display name expect 400 got ${h.status}`);

  // Me
  h = await fetch(`${BASE}/api/nomi/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(h.ok, `/auth/me ${h.status}`);
  const mej = await h.json();
  assert(mej.account?.id === accountId, "me.account.id");

  // Invalid JSON login
  h = await fetch(`${BASE}/api/nomi/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{",
  });
  assert(h.status === 400, `login bad JSON expect 400 got ${h.status}`);

  // Following (self invalid)
  h = await fetch(`${BASE}/api/nomi/following`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ targetId: accountId }),
  });
  assert(h.status === 400, `follow self expect 400 got ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/following`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ targetId: "acc_nonexistent_xyz" }),
  });
  assert(h.status === 404, `follow ghost expect 404 got ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/following`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(h.ok, `following GET ${h.status}`);
  const fj = await h.json();
  assert(Array.isArray(fj.followingIds), "followingIds array");

  // Second user for follow + 403 post test
  const suffixB = randHex(8);
  const emailB = `smoke_b_${suffixB}@e2e.local`;
  const usernameB = `usr_b_${suffixB}`;
  h = await fetch(`${BASE}/api/nomi/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailB,
      password,
      username: usernameB,
      displayName: "B",
    }),
  });
  assert(h.ok, `register B ${h.status}`);
  const regB = await h.json();
  const accountIdB = regB.account.id;

  h = await fetch(`${BASE}/api/nomi/following`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ targetId: accountIdB }),
  });
  assert(h.ok, `follow B ${h.status}`);

  // Posts: no auth
  const postId = `post_${suffix}`;
  const postBody = {
    id: postId,
    creatorId: accountId,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    caption: "smoke",
    prompt: "",
    processNotes: "",
    tags: ["smoke"],
    category: "Signal",
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    views: "0",
    createdAt: "now",
    publishedAt: Date.now(),
    generationJourney: [],
    feedTab: "ai-photos",
    mediaType: "image",
  };

  h = await fetch(`${BASE}/api/nomi/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postBody),
  });
  assert(h.status === 401, `post no auth expect 401 got ${h.status}`);

  // Wrong creator
  h = await fetch(`${BASE}/api/nomi/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...postBody, id: `${postId}_x`, creatorId: accountIdB }),
  });
  assert(h.status === 403, `post wrong owner expect 403 got ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(postBody),
  });
  assert(h.ok, `post create ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/posts?authorId=${encodeURIComponent(accountId)}`);
  assert(h.ok, `posts by author ${h.status}`);
  const pj = await h.json();
  assert(Array.isArray(pj.posts) && pj.posts.some((p) => p.id === postId), "author posts contain new");

  h = await fetch(`${BASE}/api/nomi/posts/catalog`);
  const cat = await h.json();
  assert(cat.posts.some((p) => p.id === postId), "catalog contains post");

  // By username
  h = await fetch(`${BASE}/api/nomi/accounts/by-username/${encodeURIComponent(username)}`);
  assert(h.ok, `by-username self ${h.status}`);
  const bu = await h.json();
  assert(bu.creator?.username === username, "by-username match");

  // Bulk PUT posts
  h = await fetch(`${BASE}/api/nomi/posts`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ posts: [postBody] }),
  });
  assert(h.ok, `posts PUT ${h.status}`);

  // Logout + session invalid
  h = await fetch(`${BASE}/api/nomi/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(h.ok, `logout ${h.status}`);

  h = await fetch(`${BASE}/api/nomi/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(h.status === 401, `me after logout expect 401 got ${h.status}`);

  // Login again
  h = await fetch(`${BASE}/api/nomi/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername: email, password }),
  });
  assert(h.ok, `login ${h.status}`);
  const lg = await h.json();
  assert(lg.token, "login.token");

  // Video status: bad name → 400 (no Google call needed)
  h = await fetch(`${BASE}/api/video/status?name=%3Cbad%3E`);
  assert(h.status === 400, `video/status bad name expect 400 got ${h.status}`);

  // Gemini without body / key: may be 500 if key set with empty prompt — check gracefully
  h = await fetch(`${BASE}/api/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "" }),
  });
  assert(h.status === 400, `gemini empty prompt expect 400 got ${h.status}`);

  printSummary();
  process.exit(failures.length ? 1 : 0);
}

function printSummary() {
  process.stdout.write(`\n${passes} checks passed\n`);
  if (failures.length) {
    process.stderr.write("\nFailures:\n");
    for (const f of failures) process.stderr.write(`  - ${f}\n`);
  }
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e));
  process.exit(1);
});
