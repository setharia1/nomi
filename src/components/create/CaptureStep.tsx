"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  Check,
  FlipHorizontal,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { CreationPath, PostDraft } from "@/lib/create/types";
import { cn } from "@/lib/cn";
import { useVideoJobsStore } from "@/lib/generation/videoJobsStore";
import { useDraftsStore } from "@/lib/create/draftsStore";

const DEMO_CLIP =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

type CaptureMode = "idle" | "recording" | "preview";

export function CaptureStep({
  path,
  draft,
  setDraft,
  sessionMediaUrl,
  setSessionMediaUrl,
  setSessionMime,
  onSessionFile,
  onBack,
  onContinue,
}: {
  path: CreationPath;
  draft: PostDraft;
  setDraft: React.Dispatch<React.SetStateAction<PostDraft>>;
  sessionMediaUrl: string | null;
  setSessionMediaUrl: (u: string | null) => void;
  setSessionMime: (m: string | null) => void;
  onSessionFile?: (f: File | null) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  if (path === "record") {
    return (
      <RecordCapture
        sessionMediaUrl={sessionMediaUrl}
        setSessionMediaUrl={setSessionMediaUrl}
        setSessionMime={setSessionMime}
        setDraft={setDraft}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  return (
    <UploadCapture
      path={path}
      draft={draft}
      setDraft={setDraft}
      sessionMediaUrl={sessionMediaUrl}
      setSessionMediaUrl={setSessionMediaUrl}
      setSessionMime={setSessionMime}
      onSessionFile={onSessionFile}
      onBack={onBack}
      onContinue={onContinue}
    />
  );
}

function RecordCapture({
  sessionMediaUrl,
  setSessionMediaUrl,
  setSessionMime,
  setDraft,
  onBack,
  onContinue,
}: {
  sessionMediaUrl: string | null;
  setSessionMediaUrl: (u: string | null) => void;
  setSessionMime: (m: string | null) => void;
  setDraft: React.Dispatch<React.SetStateAction<PostDraft>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<CaptureMode>("idle");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [audioMuted, setAudioMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startPreviewStream = useCallback(
    async (face?: "user" | "environment") => {
      const cam = face ?? facing;
      setError(null);
      stopTimer();
      setTimer(0);
      chunksRef.current = [];
      if (sessionMediaUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(sessionMediaUrl);
        setSessionMediaUrl(null);
      }
      setSessionMime(null);
      setMode("idle");
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cam },
          audio: !audioMuted,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError("Camera unavailable in this environment.");
      }
    },
    [audioMuted, facing, sessionMediaUrl, setSessionMediaUrl, setSessionMime],
  );

  useEffect(() => {
    void startPreviewStream(facing);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount init only
  }, []);

  useEffect(() => {
    if (mode !== "idle" || !streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !audioMuted));
  }, [audioMuted, mode]);

  const startRecord = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
      ? "video/webm; codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      setSessionMediaUrl(url);
      setSessionMime(mime);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setMode("preview");
      setDraft((d) => ({
        ...d,
        mediaType: "video",
        feedTab: "real-life",
        isConceptDrop: false,
        videoNote: undefined,
      }));
    };
    rec.start();
    setMode("recording");
    setTimer(0);
    stopTimer();
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const stopRecord = () => {
    recorderRef.current?.stop();
    stopTimer();
  };

  const useDemoClip = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setSessionMediaUrl(DEMO_CLIP);
    setSessionMime("video/mp4");
    setMode("preview");
    setError(null);
    setDraft((d) => ({
      ...d,
      mediaType: "video",
      feedTab: "real-life",
      videoNote: "Demo clip — replace anytime.",
    }));
  };

  const retake = () => {
    if (sessionMediaUrl?.startsWith("blob:")) URL.revokeObjectURL(sessionMediaUrl);
    setSessionMediaUrl(null);
    setSessionMime(null);
    void startPreviewStream(facing);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-white/70 backdrop-blur-md tap-highlight-none hover:border-white/20 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">Record</p>
          <p className="text-xs text-white/45">Full-screen, minimal controls</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black shadow-[0_0_60px_rgba(0,0,0,0.55)]">
        <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
          <AnimatePresence mode="wait">
            {mode === "preview" && sessionMediaUrl ? (
              <motion.video
                key="pv"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                ref={previewRef}
                src={sessionMediaUrl}
                className="h-full w-full object-cover"
                controls
                playsInline
                autoPlay
                loop
              />
            ) : (
              <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full w-full">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                {mode === "recording" ? (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-rose-400/40 bg-black/55 px-3 py-1.5 text-xs font-bold text-rose-100 backdrop-blur-md">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                    REC {fmt(timer)}
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center backdrop-blur-sm">
            <Camera className="h-10 w-10 text-white/45" />
            <p className="text-sm text-white/70">{error}</p>
            <GlowButton type="button" variant="ghost" onClick={useDemoClip}>
              Use demo clip
            </GlowButton>
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl">
          {mode === "preview" && sessionMediaUrl ? (
            <div className="flex justify-center gap-2">
              <GlowButton type="button" variant="ghost" onClick={retake} className="flex flex-1 items-center justify-center gap-2 sm:flex-none">
                <RefreshCw className="h-4 w-4" />
                Retake
              </GlowButton>
              <GlowButton type="button" onClick={onContinue} className="flex flex-1 items-center justify-center gap-2 sm:flex-none">
                <Check className="h-4 w-4" />
                Continue
              </GlowButton>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setAudioMuted((m) => !m)}
                disabled={mode === "recording"}
                className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:text-white disabled:opacity-30"
                aria-label="Toggle mic"
              >
                {audioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={mode === "recording" ? stopRecord : startRecord}
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-lg transition-colors",
                  mode === "recording"
                    ? "border-rose-400/50 bg-rose-500/90 text-white"
                    : "border-white/25 bg-white text-black",
                )}
                aria-label={mode === "recording" ? "Stop" : "Record"}
              >
                <Video className="h-7 w-7" strokeWidth={2} />
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setFacing((f) => {
                    const n = f === "user" ? "environment" : "user";
                    if (mode === "idle") void startPreviewStream(n);
                    return n;
                  });
                }}
                disabled={mode === "recording"}
                className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:text-white disabled:opacity-30"
                aria-label="Flip camera"
              >
                <FlipHorizontal className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === "preview" && sessionMediaUrl ? null : (
        <p className="text-center text-[11px] text-white/40">
          Prototype: if camera is blocked, use demo clip. Recording saves to this session only until
          publish.
        </p>
      )}
    </div>
  );
}

function AiVeoGenerateControls({ draft, prompt }: { draft: PostDraft; prompt: string }) {
  const router = useRouter();
  const startJob = useVideoJobsStore((s) => s.startJob);
  const fireKickoff = useVideoJobsStore((s) => s.fireKickoff);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");

  const runGenerate = async () => {
    const p = prompt.trim();
    if (!p || busy) return;
    setError(null);
    setBusy(true);

    try {
      const gen = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, aspectRatio }),
      });
      const genJson: { operationName?: string; model?: string; error?: string } = await gen.json();
      if (!gen.ok) {
        throw new Error(genJson.error || "Could not start video generation");
      }
      const operationName = genJson.operationName;
      if (!operationName) {
        throw new Error("No operation name returned");
      }
      const modelLabel = genJson.model ?? "";

      const jobId = startJob({
        operationName,
        prompt: p,
        aspectRatio,
        model: modelLabel,
        finishCaption: draft.caption,
        finishTags: draft.tags,
        finishTitle: draft.title,
        processNotes: draft.processNotes,
        feedTab: "ai-videos",
        modelUsedLabel: modelLabel,
      });

      useDraftsStore.getState().upsert({
        ...draft,
        updatedAt: Date.now(),
        workflowStatus: "rendering",
        linkedVideoJobId: jobId,
        prompt: p,
        modelUsed: modelLabel || draft.modelUsed,
      });

      fireKickoff();
      router.push("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-white/[0.08] pt-3">
      <div className="flex gap-2">
        {(["9:16", "16:9"] as const).map((r) => (
          <button
            key={r}
            type="button"
            disabled={busy}
            onClick={() => setAspectRatio(r)}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors tap-highlight-none disabled:opacity-50",
              aspectRatio === r
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                : "border-white/12 bg-black/30 text-white/55 hover:border-white/20",
            )}
          >
            {r === "9:16" ? "Vertical 9:16" : "Landscape 16:9"}
          </button>
        ))}
      </div>
      <GlowButton
        type="button"
        variant="primary"
        className="w-full"
        disabled={!prompt.trim() || busy}
        onClick={runGenerate}
      >
        {busy ? "Starting…" : "Generate & head to feed"}
      </GlowButton>
      <p className="text-[11px] leading-relaxed text-white/45">
        Runs in the background — scroll Nomi while Veo works. We&apos;ll nudge you when it&apos;s
        ready.
      </p>
      {error ? <p className="text-xs text-rose-300/90">{error}</p> : null}
    </div>
  );
}

function UploadCapture({
  path,
  draft,
  setDraft,
  sessionMediaUrl,
  setSessionMediaUrl,
  setSessionMime,
  onSessionFile,
  onBack,
  onContinue,
}: {
  path: CreationPath;
  draft: PostDraft;
  setDraft: React.Dispatch<React.SetStateAction<PostDraft>>;
  sessionMediaUrl: string | null;
  setSessionMediaUrl: (u: string | null) => void;
  setSessionMime: (m: string | null) => void;
  onSessionFile?: (f: File | null) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const applyFile = (file: File | null) => {
    if (!file) return;
    onSessionFile?.(file);
    if (sessionMediaUrl?.startsWith("blob:")) URL.revokeObjectURL(sessionMediaUrl);
    const url = URL.createObjectURL(file);
    setSessionMediaUrl(url);
    setSessionMime(file.type);
    const isVid = file.type.startsWith("video/");
    setDraft((d) => {
      let feedTab = d.feedTab;
      if (path === "concept-drop") {
        return {
          ...d,
          mediaType: isVid ? "video" : "image",
          isConceptDrop: true,
          feedTab: isVid ? "real-life" : "ai-photos",
        };
      }
      if (path === "ai-post") {
        feedTab = isVid ? "ai-videos" : "ai-photos";
      }
      if (path === "upload") {
        feedTab = isVid ? "real-life" : "ai-photos";
      }
      return {
        ...d,
        mediaType: isVid ? "video" : "image",
        isConceptDrop: false,
        feedTab,
      };
    });
  };

  const canContinue =
    Boolean(sessionMediaUrl) ||
    path === "concept-drop" ||
    (path === "ai-post" && draft.prompt.trim().length > 0);

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-white/70 backdrop-blur-md tap-highlight-none hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            {path === "ai-post" ? "AI post" : path === "concept-drop" ? "Concept drop" : "Upload"}
          </p>
          <p className="text-xs text-white/45">
            {path === "concept-drop"
              ? "Rough is beautiful — add a frame if you have one."
              : path === "ai-post"
                ? "Describe the shot below and tap Generate, or upload your own clip."
                : "Drop a finished render or camera export."}
          </p>
        </div>
      </div>

      {path === "ai-post" ? (
        <GlassPanel className="space-y-3 border-cyan-400/15 p-4">
          <div className="flex items-start gap-2 text-cyan-100/90">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Google Veo</p>
              <p className="mt-0.5 text-xs leading-snug text-white/50">
                Tap generate and we&apos;ll send you back to the feed while your clip renders.
              </p>
            </div>
          </div>
          <textarea
            value={draft.prompt}
            onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
            placeholder="Describe the video you want (subject, motion, lighting, mood)…"
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs text-white placeholder:text-white/30 glow-focus focus:border-cyan-400/35"
          />
          <AiVeoGenerateControls draft={draft} prompt={draft.prompt} />
          <textarea
            value={draft.processNotes}
            onChange={(e) => setDraft((d) => ({ ...d, processNotes: e.target.value }))}
            placeholder="Process notes (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus focus:border-violet-400/35"
          />
        </GlassPanel>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) applyFile(f);
        }}
        className={cn(
          "relative w-full overflow-hidden rounded-[1.35rem] border-2 border-dashed px-4 py-14 text-center transition-all",
          dragOver
            ? "border-cyan-400/55 bg-cyan-500/10"
            : "border-white/12 bg-white/[0.03] hover:border-violet-400/35",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
        />
        <Upload className="mx-auto h-10 w-10 text-white/35" />
        <p className="mt-3 font-semibold text-white">Tap or drop media</p>
        <p className="mt-1 text-sm text-white/45">
          {path === "ai-post" ? "Optional — skip if you generated with Veo above." : "MP4, MOV, WebM, PNG, JPG"}
        </p>
      </button>

      {sessionMediaUrl ? (
        <GlassPanel className="overflow-hidden p-0">
          <div className="relative aspect-[4/5] w-full bg-black">
            {draft.mediaType === "video" ? (
              <video src={sessionMediaUrl} className="h-full w-full object-cover" controls playsInline />
            ) : (
              <Image src={sessionMediaUrl} alt="" fill className="object-cover" unoptimized sizes="100vw" />
            )}
          </div>
        </GlassPanel>
      ) : null}

      {path === "concept-drop" ? (
        <GlassPanel className="space-y-3 border-teal-400/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-100/85">Concept core</p>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Working title"
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus"
          />
          <textarea
            value={draft.conceptIdea}
            onChange={(e) => setDraft((d) => ({ ...d, conceptIdea: e.target.value }))}
            placeholder="What’s the idea? What are you exploring?"
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30 glow-focus"
          />
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-white/75">Open to remix</span>
            <input
              type="checkbox"
              checked={draft.lookingForRemix}
              onChange={(e) => setDraft((d) => ({ ...d, lookingForRemix: e.target.checked }))}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>
        </GlassPanel>
      ) : null}

      <div className="flex gap-2">
        <GlowButton type="button" variant="ghost" className="flex-1" onClick={onBack}>
          Back
        </GlowButton>
        <GlowButton
          type="button"
          className="flex-1"
          disabled={!canContinue}
          onClick={() => {
            if (path === "concept-drop" && !sessionMediaUrl) {
              setDraft((d) => ({ ...d, mediaType: "image", isConceptDrop: true }));
            }
            if (path === "ai-post" && !sessionMediaUrl) {
              setDraft((d) => ({
                ...d,
                mediaType: "image",
                feedTab: "ai-photos",
              }));
            }
            onContinue();
          }}
        >
          Continue
        </GlowButton>
      </div>
    </div>
  );
}
