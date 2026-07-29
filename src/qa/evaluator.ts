import type { ShotSpec } from "../domain/contracts.js";
import type { GenerationResult } from "../providers/video-provider.js";
import type { QaResult } from "./policy.js";

export interface QaEvaluationContext {
  shot: ShotSpec;
  generation: GenerationResult;
}

export interface QaEvaluator {
  evaluate(context: QaEvaluationContext): Promise<QaResult>;
}

export function assertQaResultMatchesShot(context: QaEvaluationContext, result: QaResult): QaResult {
  if (result.shotId !== context.shot.id) {
    throw new Error(`QA result ${result.shotId} does not match shot ${context.shot.id}`);
  }
  if (result.checks.length === 0) throw new Error(`QA returned no checks for ${context.shot.id}`);
  return result;
}
