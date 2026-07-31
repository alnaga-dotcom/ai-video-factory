import type { EpisodeSpec, ProductionMode, ShotSpec, TimingDriver } from "../domain/contracts.js";
import type { FactoryModelConfig } from "../config/models.js";
import { selectConfiguredModel } from "../config/models.js";
import { routeShot, type ModelTier } from "../routing/model-router.js";

export interface DryRunShot {
  shotId: string;
  durationSeconds: number;
  productionMode: ProductionMode;
  timingDriver: TimingDriver;
  requiresVideoGeneration: boolean;
  tier: ModelTier | null;
  provider: string | null;
  model: string | null;
  routeReason: string;
  estimatedCredits: number | null;
  prompt: string;
}

export interface DryRunReport {
  episodeId: string;
  shotCount: number;
  totalSeconds: number;
  estimatedCredits: number | null;
  shots: DryRunShot[];
}

export function buildProductionDryRun(episode: EpisodeSpec, models: FactoryModelConfig): DryRunReport {
  const shots = episode.scenes.flatMap((scene) => scene.shots.map((shot) => planShot(shot, scene.location, scene.timeOfDay, models)));
  const paidShots = shots.filter((shot) => shot.requiresVideoGeneration);
  const costs = paidShots.map((shot) => shot.estimatedCredits);
  return {
    episodeId: episode.id,
    shotCount: shots.length,
    totalSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
    estimatedCredits: costs.every((cost) => cost !== null) ? costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0) : null,
    shots,
  };
}

function planShot(shot: ShotSpec, location: string, timeOfDay: string | undefined, models: FactoryModelConfig): DryRunShot {
  const route = routeShot(shot);

  if (!route.requiresVideoGeneration || !route.tier) {
    return {
      shotId: shot.id,
      durationSeconds: shot.durationSeconds,
      productionMode: route.mode,
      timingDriver: route.timingDriver,
      requiresVideoGeneration: false,
      tier: null,
      provider: null,
      model: null,
      routeReason: route.reason,
      estimatedCredits: 0,
      prompt: buildShotPrompt(shot, location, timeOfDay),
    };
  }

  const model = selectConfiguredModel(models, route.tier, shot.durationSeconds);
  return {
    shotId: shot.id,
    durationSeconds: shot.durationSeconds,
    productionMode: route.mode,
    timingDriver: route.timingDriver,
    requiresVideoGeneration: true,
    tier: route.tier,
    provider: model.provider,
    model: model.model,
    routeReason: route.reason,
    estimatedCredits: model.estimatedCredits?.[shot.durationSeconds] ?? null,
    prompt: buildShotPrompt(shot, location, timeOfDay),
  };
}

export function buildShotPrompt(shot: ShotSpec, location: string, timeOfDay?: string): string {
  const dialogue = shot.dialogue?.length ? ` Dialogue: ${shot.dialogue.map((line) => `${line.characterId}: ${line.text}`).join(" | ")}.` : "";
  return `${shot.action} Emotional intent: ${shot.emotionalIntent ?? "natural"}. Location: ${location}. Time: ${timeOfDay ?? "natural"}.${dialogue} Preserve exact character identity, body proportions, costume continuity, natural anatomy and realistic movement. No redesign, no age change, no facial drift, no costume substitution.`;
}
