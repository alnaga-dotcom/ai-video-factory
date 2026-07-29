import type { ShotSpec } from "../domain/contracts.js";
import type { ModelTier } from "../routing/model-router.js";

export interface GenerationRequest {
  shot: ShotSpec;
  prompt: string;
  modelTier: ModelTier;
  referenceAssetIds: string[];
}

export interface GenerationResult {
  provider: string;
  model: string;
  assetId: string;
  durationSeconds: number;
  costCredits?: number;
}

export interface VideoProvider {
  generate(request: GenerationRequest): Promise<GenerationResult>;
}
