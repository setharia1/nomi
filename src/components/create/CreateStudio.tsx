"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CreationChooser } from "@/components/create/CreationChooser";
import { CaptureStep } from "@/components/create/CaptureStep";
import { ComposeStep } from "@/components/create/ComposeStep";
import { StudioPreview } from "@/components/create/StudioPreview";
import { PublishMoment, PublishProcessing } from "@/components/create/PublishMoment";
import { CreateOnboarding } from "@/components/create/CreateOnboarding";
import type { CreationPath, PostDraft, StudioPhase } from "@/lib/create/types";
import { defaultDraft } from "@/lib/create/types";
import {
  deleteDraft,
  getDraft,
  hasSeenCreateOnboarding,
  loadDrafts,
} from "@/lib/create/drafts";
import { useDraftsStore } from "@/lib/create/draftsStore";
import { requireMeId } from "@/lib/auth/meId";
import { buildPostFromDraft, useContentMemoryStore } from "@/lib/content/contentMemoryStore";
import { captureVideoPosterDataUrl } from "@/lib/media/videoPoster";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function resumePhase(d: PostDraft): StudioPhase {
  const sp = d.phase;
  if (sp === "capture" || sp === "compose" || sp === "preview") return sp;
  return "compose";
}

function CreateStudioInner({ draftId }: { draftId: string | null }) {
  const loaded = draftId ? getDraft(draftId) : null;

  const [showOnboard, setShowOnboard] = useState(false);
  useEffect(() => {
    /* Client gate: avoid SSR/localStorage mismatch by syncing after mount */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount sync
    setShowOnboard(!hasSeenCreateOnboarding());
  }, []);

  const [phase, setPhase] = useState<StudioPhase>(() =>
    loaded ? resumePhase(loaded) : "chooser",
  );
  const [path, setPath] = useState<CreationPath | null>(() => loaded?.path ?? null);
  const [draft, setDraft] = useState<PostDraft>(() =>
    loaded ? { ...loaded } : defaultDraft(),
  );
  const [sessionMediaUrl, setSessionMediaUrl] = useState<string | null>(() =>
    loaded?.mediaDataUrl ?? null,
  );
  const [sessionMime, setSessionMime] = useState<string | null>(() => loaded?.mediaMime ?? null);
  const [sessionFile, setSessionFile] = useState<File | null>(null);
  const [draftCount, setDraftCount] = useState(() => loadDrafts().length);

  const resetFlow = useCallback(() => {
    if (sessionMediaUrl?.startsWith("blob:")) URL.revokeObjectURL(sessionMediaUrl);
    setPhase("chooser");
    setPath(null);
    setDraft(defaultDraft());
    setSessionMediaUrl(null);
    setSessionMime(null);
    setSessionFile(null);
  }, [sessionMediaUrl]);

  const startPath = useCallback(
    (p: CreationPath) => {
      if (sessionMediaUrl?.startsWith("blob:")) URL.revokeObjectURL(sessionMediaUrl);
      setPath(p);
      setSessionMediaUrl(null);
      setSessionMime(null);
      setSessionFile(null);
      setDraft(
        defaultDraft({
          path: p,
          isConceptDrop: p === "concept-drop",
          feedTab:
            p === "record"
              ? "real-life"
              : p === "concept-drop"
                ? "ai-photos"
                : p === "ai-post"
                  ? "ai-videos"
                  : "ai-photos",
          title: p === "concept-drop" ? "Untitled concept" : "",
        }),
      );
      setPhase("capture");
    },
    [sessionMediaUrl],
  );

  const persistDraft = useCallback(async () => {
    if (!path) return;
    let mediaDataUrl = draft.mediaDataUrl ?? null;
    if (sessionFile?.type.startsWith("image/")) {
      try {
        mediaDataUrl = await fileToDataUrl(sessionFile);
      } catch {
        /* quota */
      }
    }
    const record: PostDraft = {
      ...draft,
      path,
      phase,
      updatedAt: Date.now(),
      mediaDataUrl,
      mediaMime: sessionMime ?? draft.mediaMime,
      videoNote:
        draft.mediaType === "video" && !mediaDataUrl
          ? draft.videoNote ?? "Video attached in session — re-upload if needed."
          : draft.videoNote,
    };
    useDraftsStore.getState().upsert(record);
    setDraftCount(loadDrafts().length);
  }, [draft, path, phase, sessionFile, sessionMime]);

  const runPublish = useCallback(async () => {
    setPhase("publishing");
    await new Promise((r) => setTimeout(r, 1300));
    let posterDataUrl: string | null = null;
    if (draft.mediaType === "video" && sessionMediaUrl) {
      posterDataUrl = await captureVideoPosterDataUrl(sessionMediaUrl);
    }
    const published = buildPostFromDraft({
      draft,
      mediaUrl: sessionMediaUrl,
      creatorId: requireMeId(),
      posterDataUrl,
    });
    useContentMemoryStore.getState().publishPost(published);
    if (draftId) deleteDraft(draftId);
    if (sessionMediaUrl?.startsWith("blob:")) URL.revokeObjectURL(sessionMediaUrl);
    setSessionMediaUrl(null);
    setSessionFile(null);
    setDraftCount(loadDrafts().length);
    setPhase("success");
  }, [draft, draftId, sessionMediaUrl]);

  const transition = {
    initial: { opacity: 0, y: 10, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -8, filter: "blur(4px)" },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <>
      <AnimatePresence>
        {showOnboard ? <CreateOnboarding onDone={() => setShowOnboard(false)} /> : null}
      </AnimatePresence>
      {phase === "publishing" ? <PublishProcessing /> : null}

      <AnimatePresence mode="wait">
        {phase === "chooser" ? (
          <motion.div key="chooser" {...transition}>
            <CreationChooser draftCount={draftCount} onSelect={startPath} />
          </motion.div>
        ) : null}

        {phase === "capture" && path ? (
          <motion.div key="capture" {...transition}>
            <CaptureStep
              path={path}
              draft={draft}
              setDraft={setDraft}
              sessionMediaUrl={sessionMediaUrl}
              setSessionMediaUrl={(u) => {
                setSessionMediaUrl(u);
                if (!u) setSessionFile(null);
              }}
              setSessionMime={setSessionMime}
              onSessionFile={setSessionFile}
              onBack={resetFlow}
              onContinue={() => setPhase("compose")}
            />
          </motion.div>
        ) : null}

        {phase === "compose" && path ? (
          <motion.div key="compose" {...transition}>
            <ComposeStep
              path={path}
              draft={draft}
              setDraft={setDraft}
              onBack={() => setPhase("capture")}
              onNext={() => setPhase("preview")}
              onSaveDraft={persistDraft}
            />
          </motion.div>
        ) : null}

        {phase === "preview" && path ? (
          <motion.div key="preview" {...transition}>
            <StudioPreview
              draft={draft}
              mediaUrl={sessionMediaUrl}
              onBack={() => setPhase("compose")}
              onPublish={runPublish}
              onSaveDraft={persistDraft}
            />
          </motion.div>
        ) : null}

        {phase === "success" ? (
          <motion.div key="success" {...transition}>
            <PublishMoment onCreateAnother={resetFlow} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function CreateStudioRouted() {
  const q = useSearchParams();
  const draftId = q.get("draft");
  return <CreateStudioInner key={draftId ?? "new"} draftId={draftId} />;
}

export function CreateStudio() {
  return (
    <Suspense
      fallback={<div className="py-20 text-center text-sm text-white/45">Opening studio…</div>}
    >
      <CreateStudioRouted />
    </Suspense>
  );
}
