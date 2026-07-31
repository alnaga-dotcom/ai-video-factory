export type ShotId = `shot-${number}`;

export type ShotKind =
  | "establishing"
  | "character"
  | "interaction"
  | "dialogue"
  | "reaction"
  | "object"
  | "transition";

/** Cheapest valid production path is preferred; escalate only when the scene requires it. */
export type ProductionMode = "still" | "motion-still" | "video" | "video-lipsync";

/** Defines which asset determines the final shot duration and edit rhythm. */
export type TimingDriver = "audio" | "action" | "fixed";

export type ProductionStatus =
  | "planned"
  | "generating"
  | "qa"
  | "retry"
  | "director-review"
  | "approved"
  | "failed";

export interface DialogueLine {
  characterId: string;
  text: string;
  easeText?: string;
}

export interface ShotSpec {
  id: ShotId;
  sceneId: string;
  kind: ShotKind;
  durationSeconds: number;
  characters: string[];
  action: string;
  emotionalIntent?: string;
  eyeContactTarget?: string;
  dialogue?: DialogueLine[];
  continuityFrom?: ShotId;
  /** Optional operator/story-planner override. Otherwise the router derives the cheapest valid mode. */
  productionMode?: ProductionMode;
  /** Audio for narration/dialogue, action for physical sequences, fixed for cards/transitions/etc. */
  timingDriver?: TimingDriver;
  /** Explicitly marks dialogue that must be visibly synchronized to the speaker. */
  lipSyncRequired?: boolean;
  status: ProductionStatus;
}

export interface SceneSpec {
  id: string;
  location: string;
  timeOfDay?: string;
  shots: ShotSpec[];
}

export interface EpisodeSpec {
  id: string;
  title: string;
  language: "ar-EG";
  scenes: SceneSpec[];
}
