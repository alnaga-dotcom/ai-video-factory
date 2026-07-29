import type { ShotSpec } from "../domain/contracts.js";

export type ModelTier = "premium" | "fast";

export interface ModelRoute {
  tier: ModelTier;
  reason: string;
}

const premiumKinds = new Set<ShotSpec["kind"]>([
  "character",
  "interaction",
  "dialogue",
  "reaction",
]);

export function routeShot(shot: ShotSpec): ModelRoute {
  if (shot.eyeContactTarget) {
    return { tier: "premium", reason: "eye-contact blocking requires high acting fidelity" };
  }

  if (shot.dialogue?.length) {
    return { tier: "premium", reason: "dialogue requires facial and performance fidelity" };
  }

  if (premiumKinds.has(shot.kind)) {
    return { tier: "premium", reason: `${shot.kind} shot requires character fidelity` };
  }

  return { tier: "fast", reason: `${shot.kind} shot is eligible for economical generation` };
}
