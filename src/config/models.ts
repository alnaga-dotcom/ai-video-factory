import type { ModelTier } from "../routing/model-router.js";

export interface VideoModelConfig {
  provider: string;
  model: string;
  tier: ModelTier;
  enabled: boolean;
  supportedDurationsSeconds: number[];
  estimatedCredits?: Record<number, number>;
}

export interface FactoryModelConfig {
  video: VideoModelConfig[];
}

export function selectConfiguredModel(config: FactoryModelConfig, tier: ModelTier, durationSeconds: number): VideoModelConfig {
  const candidates = config.video.filter(
    (model) => model.enabled && model.tier === tier && model.supportedDurationsSeconds.includes(durationSeconds),
  );

  if (candidates.length === 0) throw new Error(`No ${tier} video model configured for ${durationSeconds}s`);

  return [...candidates].sort((a, b) => {
    const aCost = a.estimatedCredits?.[durationSeconds] ?? Number.POSITIVE_INFINITY;
    const bCost = b.estimatedCredits?.[durationSeconds] ?? Number.POSITIVE_INFINITY;
    return aCost - bCost;
  })[0]!;
}
