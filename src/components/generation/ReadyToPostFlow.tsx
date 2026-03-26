"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Clapperboard, RefreshCw } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useVideoJobsStore } from "@/lib/generation/videoJobsStore";
import {
  buildUserPostFromVideoJob,
  useContentMemoryStore,
} from "@/lib/content/contentMemoryStore";
import { captureVideoPosterDataUrl } from "@/lib/media/videoPoster";
import { useDraftsStore } from "@/lib/create/draftsStore";
import { requireMeId } from "@/lib/auth/meId";
import { cn } from "@/lib/cn";

export function ReadyToPostFlow({ jobId }: { jobId: string }) {
  const router = useRouter();
  const job = useVideoJobsStore((s) => s.jobs.find((j) => j.id === jobId));
  const updateFinishMeta = useVideoJobsStore((s) => s.updateFinishMeta);
  const removeJob = useVideoJobsStore((s) => s.removeJob);
  const dismissToast = useVideoJobsStore((s) => s.dismissCompletionToast);

  const [posted, setPosted] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (useVideoJobsStore.getState().completionToastJobId === jobId) {
      dismissToast();
    }
  }, [jobId, dismissToast]);

  const videoSrc = job?.resultVideoDataUrl;

  const phaseLabel = useMemo(() => {
    if (!job) return "";
    if (job.phase === "ready") return "Ready";
    if (job.phase === "failed") return "Couldn't finish";
    if (job.phase === "finishing") return "Finalizing…";
    return "Still rendering…";
  }, [job]);

  const onPublish = useCallback(async () => {
    if (!job || !job.resultVideoDataUrl) return;
    dismissToast();

    const postId = `pub-${job.id}`;
    const posterDataUrl = await captureVideoPosterDataUrl(job.resultVideoDataUrl);
    const post = buildUserPostFromVideoJob({
      id: postId,
      creatorId: requireMeId(),
      videoDataUrl: job.resultVideoDataUrl,
      caption: job.finishCaption,
      tagsLine: job.finishTags,
      title: job.finishTitle,
      prompt: job.prompt,
      processNotes: job.processNotes,
      modelLabel: job.modelUsedLabel || job.model,
      feedTab: job.feedTab,
      posterDataUrl,
    });

    await useContentMemoryStore.getState().publishPost(post);
    removeJob(job.id);

    const drafts = useDraftsStore.getState().list;
    const linked = drafts.find((d) => d.linkedVideoJobId === job.id);
    if (linked) useDraftsStore.getState().remove(linked.id);

    setPublishedPostId(postId);
    setPosted(true);
  }, [job, dismissToast, removeJob]);

  if (!job) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <p className="text-sm text-white/55">This generation isn&apos;t here anymore.</p>
        <GlowButton type="button" className="mt-6" onClick={() => router.push("/create")}>
          Back to Create
        </GlowButton>
      </div>
    );
  }

  if (job.phase === "failed") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Generation paused
            </h1>
            <p className="text-xs text-white/45">{job.errorMessage}</p>
          </div>
        </div>
        <GlowButton type="button" className="w-full" onClick={() => router.push("/create")}>
          Try again in Create
        </GlowButton>
      </div>
    );
  }

  if (posted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/35 bg-emerald-500/15">
          <Check className="h-8 w-8 text-emerald-200" strokeWidth={2.2} />
        </div>
        <h2 className="mt-6 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">Posted</h2>
        <p className="mt-2 max-w-sm text-sm text-white/55">
          Your signal is staged for the feed. In production this would publish to your followers.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          {publishedPostId ? (
            <GlowButton type="button" onClick={() => router.push(`/post/${publishedPostId}`)}>
              View post
            </GlowButton>
          ) : null}
          <GlowButton type="button" variant="ghost" className="border-white/12" onClick={() => router.push("/home")}>
            Back to home
          </GlowButton>
        </div>
      </motion.div>
    );
  }

  if (job.phase === "ready" && !videoSrc) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Clip didn&apos;t restore
            </h1>
            <p className="text-xs text-white/45">
              Your video was ready but is too large to keep in browser storage. Generate again from
              Create.
            </p>
          </div>
        </div>
        <GlowButton type="button" className="w-full" onClick={() => router.push("/create")}>
          Back to Create
        </GlowButton>
      </div>
    );
  }

  if (job.phase !== "ready") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Almost there
            </h1>
            <p className="text-xs text-white/45">{phaseLabel}</p>
          </div>
        </div>
        <GlassPanel className="flex flex-col items-center gap-4 border-violet-400/15 p-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="h-12 w-12 rounded-full border-2 border-violet-400/30 border-t-cyan-300"
          />
          <p className="text-center text-sm text-white/55">
            Relax — you can leave this screen. We&apos;ll notify you when the file lands.
          </p>
          <GlowButton type="button" variant="ghost" onClick={() => router.push("/home")}>
            Browse the feed
          </GlowButton>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-white/70 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/75">
            Ready to post
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Finish your video
          </h1>
        </div>
      </div>

      <GlassPanel className="overflow-hidden border-white/[0.08] p-0">
        <div className="relative aspect-[9/16] max-h-[52dvh] w-full bg-black sm:mx-auto sm:max-w-[280px]">
          <video
            src={videoSrc}
            className="h-full w-full object-cover"
            controls
            playsInline
            muted
          />
        </div>
        <div className="space-y-1 border-t border-white/[0.06] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Prompt</p>
          <p className="text-xs leading-relaxed text-white/65">{job.prompt}</p>
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-4 border-violet-400/12 p-4">
        <div className="flex items-center gap-2 text-violet-100/85">
          <Clapperboard className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Light touches</span>
        </div>
        <input
          value={job.finishTitle}
          onChange={(e) => updateFinishMeta(job.id, { finishTitle: e.target.value })}
          placeholder="Title (optional)"
          className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30"
        />
        <textarea
          value={job.finishCaption}
          onChange={(e) => updateFinishMeta(job.id, { finishCaption: e.target.value })}
          placeholder="Caption — say what this is about"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30"
        />
        <textarea
          value={job.finishTags}
          onChange={(e) => updateFinishMeta(job.id, { finishTags: e.target.value })}
          placeholder="Tags — cinematic, neon, chill…"
          rows={2}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30"
        />
        <p className="text-[11px] text-white/38">
          Model: {job.modelUsedLabel || job.model}. Aspect {job.aspectRatio}.
        </p>
      </GlassPanel>

      <div className="flex flex-col gap-2 sm:flex-row">
        <GlowButton
          type="button"
          variant="ghost"
          className={cn("flex-1 gap-2")}
          onClick={() => router.push("/create")}
        >
          <RefreshCw className="h-4 w-4" />
          New generation
        </GlowButton>
        <GlowButton type="button" className="flex-[2]" onClick={onPublish}>
          Publish
        </GlowButton>
      </div>
    </div>
  );
}
