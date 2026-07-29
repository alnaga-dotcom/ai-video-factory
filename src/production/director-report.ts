import type { ProductionReport } from "../orchestration/factory.js";

export interface DirectorReport {
  episodeId: string;
  decision: "APPROVED" | "DIRECTOR_REVIEW" | "FAILED";
  approvedShots: number;
  directorReviewShots: number;
  failedShots: number;
  totalAttempts: number;
  totalCostCredits: number;
  shotSummary: Array<{
    shotId: string;
    status: string;
    attempts: number;
    costCredits: number;
    failedCriteria: string[];
  }>;
}

export function buildDirectorReport(report: ProductionReport): DirectorReport {
  const decision = report.status === "approved" ? "APPROVED" : report.status === "director-review" ? "DIRECTOR_REVIEW" : "FAILED";
  return {
    episodeId: report.episodeId,
    decision,
    approvedShots: report.approvedShots,
    directorReviewShots: report.directorReviewShots,
    failedShots: report.failedShots,
    totalAttempts: report.totalAttempts,
    totalCostCredits: report.totalCostCredits,
    shotSummary: report.shots.map((shot) => ({
      shotId: shot.shot.id,
      status: shot.status,
      attempts: shot.attempts.length,
      costCredits: shot.totalCostCredits,
      failedCriteria: [...shot.failedCriteria],
    })),
  };
}

export function renderDirectorReport(report: DirectorReport): string {
  const lines = [
    `DIRECTOR REPORT — ${report.episodeId}`,
    `DECISION ${report.decision}`,
    `SHOTS approved=${report.approvedShots} review=${report.directorReviewShots} failed=${report.failedShots}`,
    `ATTEMPTS ${report.totalAttempts}`,
    `COST CREDITS ${report.totalCostCredits}`,
  ];
  for (const shot of report.shotSummary) {
    lines.push(`SHOT ${shot.shotId} | ${shot.status} | attempts=${shot.attempts} | cost=${shot.costCredits} | failed=${shot.failedCriteria.join(",") || "none"}`);
  }
  return `${lines.join("\n")}\n`;
}
