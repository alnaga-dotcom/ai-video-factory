export interface ShotOutcomeSummary {
  attempts: number;
  outcome: "passed" | "director-review";
}

export interface RunSummary {
  generated: number;
  retried: number;
  passed: number;
  directorReview: number;
}

export function summarizeRun(shots: readonly ShotOutcomeSummary[]): RunSummary {
  return {
    generated: shots.length,
    retried: shots.filter((shot) => shot.attempts > 1).length,
    passed: shots.filter((shot) => shot.outcome === "passed").length,
    directorReview: shots.filter((shot) => shot.outcome === "director-review").length,
  };
}

export function formatDirectorReport(summary: RunSummary): string {
  return `${summary.generated} shots generated · ${summary.retried} retried · ${summary.passed} passed · ${summary.directorReview} need Director Review`;
}
