import type { AssetRecord } from "../assets/registry.js";
import type { ShotSpec } from "../domain/contracts.js";
import type { ModelTier } from "../routing/model-router.js";

export interface GenerationRequest {
  shot: ShotSpec;
  prompt: string;
  modelTier: ModelTier;
  referenceAssetIds: string[];
  referenceAssets?: AssetRecord[];
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
