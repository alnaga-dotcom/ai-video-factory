export type ShotId = `shot-${number}`;

export type ShotKind =
  | "establishing"
  | "character"
  | "interaction"
  | "dialogue"
  | "reaction"
  | "object"
  | "transition";

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
