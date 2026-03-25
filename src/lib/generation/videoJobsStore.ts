"use client";

import { create } from "zustand";
import type { FeedTab } from "@/lib/types";

const JOBS_KEY = "nomi-video-jobs-v1";
const PAYLOAD_KEY = "nomi-video-payload-v1";

export type VideoJobPhase = "queued" | "rendering" | "finishing" | "ready" | "failed";

export type VideoJob = {
  id: string;
  operationName: string;
  prompt: string;
  aspectRatio: "9:16" | "16:9";
  model: string;
  phase: VideoJobPhase;
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
  /** Inline video for preview (persisted separately when possible) */
  resultVideoDataUrl?: string;
  finishCaption: string;
  finishTags: string;
  finishTitle: string;
  processNotes: string;
  feedTab: FeedTab;
  modelUsedLabel: string;
};

export type StartVideoJobInput = {
  operationName: string;
  prompt: string;
  aspectRatio: "9:16" | "16:9";
  model: string;
  finishCaption: string;
  finishTags: string;
  finishTitle: string;
  processNotes: string;
  feedTab: FeedTab;
  modelUsedLabel: string;
};

type PersistedPayload = Record<string, string>;

function newJobId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `vj-${crypto.randomUUID()}`
    : `vj-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadPayload(): PersistedPayload {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PAYLOAD_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === "object" ? (p as PersistedPayload) : {};
  } catch {
    return {};
  }
}

function savePayloadRecord(next: PersistedPayload) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYLOAD_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

function persistAllJobs(jobs: VideoJob[]) {
  if (typeof window === "undefined") return;
  const slim = jobs.map((j) => {
    const copy = { ...j } as VideoJob & { resultVideoDataUrl?: string };
    delete copy.resultVideoDataUrl;
    return copy;
  });
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(slim));
  } catch {
    /* quota */
  }
  const payload: PersistedPayload = {};
  for (const j of jobs) {
    if (j.resultVideoDataUrl && j.phase === "ready") {
      try {
        if (j.resultVideoDataUrl.length < 4_500_000) {
          payload[j.id] = j.resultVideoDataUrl;
        }
      } catch {
        /* skip huge */
      }
    }
  }
  savePayloadRecord(payload);
}

function readStoredJobs(): VideoJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const payload = loadPayload();
    return parsed.map((j) => ({
      ...(j as VideoJob),
      resultVideoDataUrl: payload[(j as VideoJob).id],
    }));
  } catch {
    return [];
  }
}

type VideoJobsState = {
  hydrated: boolean;
  jobs: VideoJob[];
  kickoffUntil: number | null;
  completionToastJobId: string | null;
  hydrate: () => void;
  startJob: (input: StartVideoJobInput) => string;
  setJobPhase: (id: string, phase: VideoJobPhase) => void;
  completeJobWithVideo: (id: string, dataUrl: string) => void;
  failJob: (id: string, message: string) => void;
  updateFinishMeta: (
    id: string,
    patch: Partial<Pick<VideoJob, "finishCaption" | "finishTags" | "finishTitle">>,
  ) => void;
  removeJob: (id: string) => void;
  attachVideoData: (id: string, dataUrl: string) => void;
  fireKickoff: () => void;
  dismissCompletionToast: () => void;
};

export const useVideoJobsStore = create<VideoJobsState>()((set, get) => ({
  hydrated: false,
  jobs: [],
  kickoffUntil: null,
  completionToastJobId: null,

  hydrate: () => {
    if (get().hydrated) return;
    set({ jobs: readStoredJobs(), hydrated: true });
  },

  startJob: (input) => {
    const id = newJobId();
    const now = Date.now();
    const job: VideoJob = {
      id,
      operationName: input.operationName,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
      model: input.model,
      phase: "queued",
      createdAt: now,
      updatedAt: now,
      finishCaption: input.finishCaption,
      finishTags: input.finishTags,
      finishTitle: input.finishTitle,
      processNotes: input.processNotes,
      feedTab: input.feedTab,
      modelUsedLabel: input.modelUsedLabel,
    };
    const jobs = [...get().jobs, job];
    set({ jobs });
    persistAllJobs(jobs);
    return id;
  },

  setJobPhase: (id, phase) => {
    const jobs = get().jobs.map((j) => (j.id === id ? { ...j, phase, updatedAt: Date.now() } : j));
    set({ jobs });
    persistAllJobs(jobs);
  },

  completeJobWithVideo: (id, dataUrl) => {
    const jobs = get().jobs.map((j) =>
      j.id === id
        ? { ...j, phase: "ready" as const, resultVideoDataUrl: dataUrl, updatedAt: Date.now() }
        : j,
    );
    set({ jobs, completionToastJobId: id });
    persistAllJobs(jobs);
  },

  failJob: (id, message) => {
    const jobs = get().jobs.map((j) =>
      j.id === id
        ? {
            ...j,
            phase: "failed" as const,
            errorMessage: message,
            updatedAt: Date.now(),
          }
        : j,
    );
    set({ jobs });
    persistAllJobs(jobs);
  },

  updateFinishMeta: (id, patch) => {
    const jobs = get().jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    set({ jobs });
    persistAllJobs(jobs);
  },

  removeJob: (id) => {
    const jobs = get().jobs.filter((j) => j.id !== id);
    set({ jobs });
    persistAllJobs(jobs);
    const payload = loadPayload();
    if (payload[id]) {
      delete payload[id];
      savePayloadRecord(payload);
    }
  },

  attachVideoData: (id, dataUrl) => {
    const jobs = get().jobs.map((j) =>
      j.id === id ? { ...j, resultVideoDataUrl: dataUrl, updatedAt: Date.now() } : j,
    );
    set({ jobs });
    persistAllJobs(jobs);
  },

  fireKickoff: () => set({ kickoffUntil: Date.now() + 3400 }),

  dismissCompletionToast: () => set({ completionToastJobId: null }),
}));

if (typeof window !== "undefined") {
  setTimeout(() => {
    useVideoJobsStore.getState().hydrate();
  }, 0);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
