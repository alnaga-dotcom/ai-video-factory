import type { ShotId } from "../domain/contracts.js";

export type QaCriterion =
  | "identity"
  | "expression"
  | "continuity"
  | "action"
  | "eye-contact"
  | "mouth-behavior"
  | "artifacts";

export interface QaCheck {
  criterion: QaCriterion;
  passed: boolean;
  score: number;
  note?: string;
}

export interface QaResult {
  shotId: ShotId;
  checks: QaCheck[];
}

export interface RetryDecision {
  retry: boolean;
  failedCriteria: QaCriterion[];
  correctiveInstruction?: string;
}

export function decideRetry(result: QaResult): RetryDecision {
  const failed = result.checks.filter((check) => !check.passed).map((check) => check.criterion);

  if (failed.length === 0) return { retry: false, failedCriteria: [] };

  return {
    retry: true,
    failedCriteria: failed,
    correctiveInstruction: `Regenerate only this shot. Correct: ${failed.join(", ")}. Preserve all passing continuity and identity constraints.`,
  };
}
