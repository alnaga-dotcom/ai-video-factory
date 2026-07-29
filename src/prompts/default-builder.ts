import type { ShotSpec } from "../domain/contracts.js";
import type { PromptBuilder } from "../orchestration/factory.js";

export class DefaultPromptBuilder implements PromptBuilder {
  build(shot: ShotSpec): string {
    const parts = [
      `Shot ${shot.id}.`,
      `Type: ${shot.kind}.`,
      `Action: ${shot.action}.`,
      shot.emotionalIntent ? `Emotional intent: ${shot.emotionalIntent}.` : "",
      shot.eyeContactTarget ? `Eye contact: character must visibly look at ${shot.eyeContactTarget}.` : "",
      shot.dialogue?.length ? "Dialogue performance: preserve natural Egyptian character acting and intentional mouth behavior." : "No unintended speaking or lip movement.",
      "Preserve canonical character identity, wardrobe, proportions, location continuity, and established visual style.",
    ];

    return parts.filter(Boolean).join(" ");
  }
}
