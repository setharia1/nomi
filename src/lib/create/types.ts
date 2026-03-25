export type CreationPath = "record" | "upload" | "ai-post" | "concept-drop";

/** High-level wizard steps */
export type StudioPhase = "chooser" | "capture" | "compose" | "preview" | "publishing" | "success";

export type PostMood = "cinematic" | "playful" | "minimal" | "experimental" | "intimate";

export interface GenerationDraftStep {
  id: string;
  label: string;
  detail: string;
}

export type DraftWorkflowStatus = "draft" | "rendering" | "ready_to_post" | "published";

/** Serializable draft for localStorage (media optional / lightweight) */
export interface PostDraft {
  id: string;
  updatedAt: number;
  path: CreationPath;
  phase: StudioPhase;
  /** Lifecycle for studio + AI pipeline */
  workflowStatus?: DraftWorkflowStatus;
  /** Links draft to background Veo job id */
  linkedVideoJobId?: string;
  /** Image data URL for thumbnails; videos not stored in full */
  mediaDataUrl?: string | null;
  mediaType: "video" | "image" | null;
  mediaMime?: string;
  videoNote?: string;
  title: string;
  caption: string;
  tags: string;
  mood: PostMood;
  category: string;
  feedTab: "ai-videos" | "ai-photos" | "real-life";
  prompt: string;
  processNotes: string;
  toolsUsed: string;
  modelUsed: string;
  inspiration: string;
  promptRevealPublic: boolean;
  allowRemix: boolean;
  allowComments: boolean;
  audience: "public" | "followers";
  isConceptDrop: boolean;
  lookingForRemix: boolean;
  conceptIdea: string;
  journey: GenerationDraftStep[];
}

export function defaultDraft(partial?: Partial<PostDraft>): PostDraft {
  const id =
    partial?.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `draft-${Date.now()}`);
  return {
    id,
    updatedAt: Date.now(),
    path: partial?.path ?? "upload",
    phase: partial?.phase ?? "chooser",
    mediaDataUrl: partial?.mediaDataUrl ?? null,
    mediaType: partial?.mediaType ?? null,
    mediaMime: partial?.mediaMime,
    videoNote: partial?.videoNote,
    title: partial?.title ?? "",
    caption: partial?.caption ?? "",
    tags: partial?.tags ?? "",
    mood: partial?.mood ?? "cinematic",
    category: partial?.category ?? "Signal",
    feedTab: partial?.feedTab ?? "ai-photos",
    prompt: partial?.prompt ?? "",
    processNotes: partial?.processNotes ?? "",
    toolsUsed: partial?.toolsUsed ?? "",
    modelUsed: partial?.modelUsed ?? "",
    inspiration: partial?.inspiration ?? "",
    promptRevealPublic: partial?.promptRevealPublic ?? true,
    allowRemix: partial?.allowRemix ?? true,
    allowComments: partial?.allowComments ?? true,
    audience: partial?.audience ?? "public",
    isConceptDrop: partial?.isConceptDrop ?? false,
    lookingForRemix: partial?.lookingForRemix ?? false,
    conceptIdea: partial?.conceptIdea ?? "",
    journey: partial?.journey ?? [],
    workflowStatus: partial?.workflowStatus,
    linkedVideoJobId: partial?.linkedVideoJobId,
  };
}
