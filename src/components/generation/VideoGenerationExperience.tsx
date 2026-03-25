"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard, Sparkles, X } from "lucide-react";
import { useVideoJobsStore, blobToDataUrl } from "@/lib/generation/videoJobsStore";
import { useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { useInteractionsStore, ME_ID } from "@/lib/interactions/store";
import { getCreatorByIdResolved } from "@/lib/profile/meCreator";
import { cn } from "@/lib/cn";

const RELAX_COPY = [
  "Your video is cooking — scroll while we work on it.",
  "Generation in motion — enjoy the feed, we'll tap you when it's ready.",
  "We're crafting your clip — keep exploring Nomi.",
  "Your next post is underway — relax and wander a bit.",
];

const KICKOFF_LINES = [
  { title: "It's alive", subtitle: "Your generation is running — we'll keep an eye on it." },
  { title: "Off it goes", subtitle: "Scroll, explore, vibe — no need to wait on this screen." },
  { title: "All set", subtitle: "Your video is in the queue. We'll nudge you when it's ready." },
];

function notifIdForJob(jobId: string) {
  return `gen-ready-${jobId}`;
}

export function VideoGenerationExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const jobs = useVideoJobsStore((s) => s.jobs);
  const kickoffUntil = useVideoJobsStore((s) => s.kickoffUntil);
  const completionToastJobId = useVideoJobsStore((s) => s.completionToastJobId);
  const dismissCompletionToast = useVideoJobsStore((s) => s.dismissCompletionToast);
  const hydrate = useVideoJobsStore((s) => s.hydrate);

  const [copyIndex, setCopyIndex] = useState(0);
  const [kickoffLine, setKickoffLine] = useState(0);
  const [kickoffLive, setKickoffLive] = useState(false);

  useEffect(() => {
    hydrate();
    useContentMemoryStore.getState().hydrate();
  }, [hydrate]);

  useEffect(() => {
    const t = setInterval(() => setCopyIndex((i) => (i + 1) % RELAX_COPY.length), 14000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!kickoffUntil) {
      queueMicrotask(() => setKickoffLive(false));
      return;
    }
    queueMicrotask(() => {
      setKickoffLine(Math.floor(Math.random() * KICKOFF_LINES.length));
      setKickoffLive(true);
    });
    const tick = () => setKickoffLive(Date.now() < kickoffUntil);
    const iv = setInterval(tick, 400);
    const ms = Math.max(0, kickoffUntil - Date.now());
    const end = setTimeout(() => {
      useVideoJobsStore.setState({ kickoffUntil: null });
      queueMicrotask(() => setKickoffLive(false));
    }, ms);
    return () => {
      clearInterval(iv);
      clearTimeout(end);
    };
  }, [kickoffUntil]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const { jobs: list, setJobPhase, completeJobWithVideo, failJob } = useVideoJobsStore.getState();
      const active = list.filter(
        (j) => j.phase === "queued" || j.phase === "rendering" || j.phase === "finishing",
      );

      for (const job of active) {
        const fresh = useVideoJobsStore.getState().jobs.find((j) => j.id === job.id);
        if (!fresh || fresh.phase === "ready" || fresh.phase === "failed") continue;

        try {
          if (fresh.phase === "queued") setJobPhase(fresh.id, "rendering");

          const st = await fetch(
            `/api/video/status?name=${encodeURIComponent(fresh.operationName)}`,
          );
          const stJson: { done?: boolean; error?: string | null } = await st.json();

          if (!st.ok) {
            failJob(fresh.id, (stJson as { error?: string }).error || "Couldn't check status");
            continue;
          }
          if (stJson.error) {
            failJob(fresh.id, stJson.error);
            continue;
          }

          if (stJson.done) {
            const again = useVideoJobsStore.getState().jobs.find((j) => j.id === fresh.id);
            if (!again || again.phase === "ready") continue;

            setJobPhase(fresh.id, "finishing");
            const fileRes = await fetch(
              `/api/video/file?name=${encodeURIComponent(fresh.operationName)}`,
            );

            if (!fileRes.ok) {
              const errBody = (await fileRes.json().catch(() => ({}))) as { error?: string };
              failJob(fresh.id, errBody.error || "Couldn't download your video");
              continue;
            }

            const blob = await fileRes.blob();
            const dataUrl = await blobToDataUrl(blob);
            completeJobWithVideo(fresh.id, dataUrl);

            const me = getCreatorByIdResolved(ME_ID);
            const already = useInteractionsStore
              .getState()
              .notifications.some(
                (n) => n.type === "generation_ready" && n.generationJobId === fresh.id,
              );
            if (me && !already) {
              useInteractionsStore.getState().pushNotification({
                id: notifIdForJob(fresh.id),
                type: "generation_ready",
                actor: me,
                message: "Your AI video is ready — add a caption and post.",
                time: "now",
                read: false,
                generationJobId: fresh.id,
              });
            }

            const target = `/create/ready/${encodeURIComponent(fresh.id)}`;
            if (pathnameRef.current !== target) {
              router.push(target);
            }
          }
        } catch (e) {
          failJob(
            job.id,
            e instanceof Error ? e.message : "Something went wrong with generation",
          );
        }
        if (cancelled) break;
      }
    };

    const iv = setInterval(tick, 6500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [router]);

  const inFlight = useMemo(
    () => jobs.filter((j) => j.phase === "queued" || j.phase === "rendering" || j.phase === "finishing"),
    [jobs],
  );

  const failedJob = useMemo(() => jobs.find((j) => j.phase === "failed"), [jobs]);

  const showKickoff = kickoffLive;
  const kick = KICKOFF_LINES[kickoffLine] ?? KICKOFF_LINES[0];

  const completeJob =
    completionToastJobId != null ? jobs.find((j) => j.id === completionToastJobId) : null;

  return (
    <>
      <AnimatePresence>
        {showKickoff ? (
          <motion.div
            key="kickoff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center bg-gradient-to-t from-violet-950/40 via-transparent to-transparent pb-[calc(var(--nomi-nav-h)+5rem)] px-4 sm:items-center sm:pb-24"
          >
            <motion.div
              initial={{ y: 18, opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto max-w-md rounded-[1.35rem] border border-white/[0.12] bg-black/55 px-5 py-5 shadow-[0_0_60px_rgba(139,92,246,0.18)] backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/20 to-violet-600/25 shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                  <Sparkles className="h-5 w-5 text-cyan-100" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
                    {kick.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{kick.subtitle}</p>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/38">
                    {RELAX_COPY[copyIndex % RELAX_COPY.length]}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {inFlight.length > 0 && !showKickoff ? (
          <motion.div
            key="dock"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center px-3"
            style={{ bottom: "calc(var(--nomi-nav-h) + 0.35rem)" }}
          >
            <div
              className={cn(
                "pointer-events-auto flex max-w-lg items-center gap-3 rounded-full border border-white/[0.1]",
                "bg-black/50 px-4 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_32px_rgba(139,92,246,0.12)]",
              )}
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <motion.span
                  className="absolute inset-0 rounded-full bg-violet-500/25 blur-md"
                  animate={{ opacity: [0.45, 0.85, 0.45], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <Clapperboard className="relative z-10 h-4 w-4 text-violet-100" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white/92">
                  {inFlight.length === 1 ? "Making your video" : `${inFlight.length} videos generating`}
                </p>
                <p className="truncate text-[11px] text-white/48">{RELAX_COPY[copyIndex % RELAX_COPY.length]}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200/90">
                {inFlight.some((j) => j.phase === "finishing") ? "Finalizing" : "Rendering"}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {completeJob && completeJob.phase === "ready" ? (
          <motion.div
            key="done-toast"
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed inset-x-0 z-[75] flex justify-center px-3"
            style={{ bottom: "calc(var(--nomi-nav-h) + 4.25rem)" }}
          >
            <div className="flex max-w-md items-stretch gap-0 overflow-hidden rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-950/85 via-black/80 to-cyan-950/80 shadow-[0_12px_48px_rgba(16,185,129,0.2)] backdrop-blur-xl">
              <Link
                href={`/create/ready/${encodeURIComponent(completeJob.id)}`}
                onClick={() => dismissCompletionToast()}
                className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 tap-highlight-none"
              >
                <p className="text-sm font-bold text-white">Your video is ready</p>
                <p className="text-xs text-emerald-100/75">Tap to preview and finish your post.</p>
              </Link>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismissCompletionToast()}
                className="shrink-0 border-l border-white/[0.08] px-3 text-white/45 hover:bg-white/[0.05] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {failedJob ? (
          <motion.div
            key="fail-toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 z-[75] flex justify-center px-3"
            style={{ bottom: "calc(var(--nomi-nav-h) + 4.25rem)" }}
          >
            <div className="flex max-w-md items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-950/80 px-4 py-3 shadow-lg backdrop-blur-xl">
              <p className="min-w-0 flex-1 text-xs text-rose-100/90">
                {failedJob.errorMessage ?? "Generation didn't finish."}
              </p>
              <button
                type="button"
                className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/70 hover:text-white"
                onClick={() => useVideoJobsStore.getState().removeJob(failedJob.id)}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </>
  );
}
