import type { ProductionMode, ShotSpec, TimingDriver } from "../domain/contracts.js";

export type ModelTier = "premium" | "fast";

export interface ProductionRoute {
  mode: ProductionMode;
  timingDriver: TimingDriver;
  requiresVideoGeneration: boolean;
  tier?: ModelTier;
  reason: string;
}

function inferTimingDriver(shot: ShotSpec): TimingDriver {
  if (shot.timingDriver) return shot.timingDriver;
  if (shot.dialogue?.length) return "audio";
  if (shot.kind === "interaction" || shot.kind === "reaction") return "action";
  return "fixed";
}

function inferProductionMode(shot: ShotSpec): ProductionMode {
  if (shot.productionMode) return shot.productionMode;
  if (shot.lipSyncRequired) return "video-lipsync";

  // Physical interaction/action needs temporal motion. Dialogue alone does not:
  // narration can economically run over a still or motion-still visual.
  if (shot.kind === "interaction") return "video";

  if (shot.kind === "establishing" || shot.kind === "transition") return "motion-still";
  return "still";
}

export function routeShot(shot: ShotSpec): ProductionRoute {
  const mode = inferProductionMode(shot);
  const timingDriver = inferTimingDriver(shot);

  if (mode === "still") {
    return {
      mode,
      timingDriver,
      requiresVideoGeneration: false,
      reason: "static visual satisfies the shot; avoid video-generation cost",
    };
  }

  if (mode === "motion-still") {
    return {
      mode,
      timingDriver,
      requiresVideoGeneration: false,
      reason: "editor motion on a still satisfies the shot; avoid video-generation cost",
    };
  }

  if (mode === "video-lipsync") {
    return {
      mode,
      timingDriver: "audio",
      requiresVideoGeneration: true,
      tier: "premium",
      reason: "visible synchronized dialogue requires high identity, facial and timing fidelity",
    };
  }

  const premium = Boolean(shot.eyeContactTarget) || shot.kind === "character" || shot.kind === "reaction";
  return {
    mode,
    timingDriver,
    requiresVideoGeneration: true,
    tier: premium ? "premium" : "fast",
    reason: premium
      ? "action video requires high character/performance fidelity"
      : "action requires temporal motion and is eligible for economical video generation",
  };
}
