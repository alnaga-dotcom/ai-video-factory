import type { ProductionReport } from "../orchestration/factory.js";

export interface ProductionState {
  episodeId: string;
  status: ProductionReport["status"] | "planned" | "producing";
  updatedAt: string;
  totalAttempts: number;
  totalCostCredits: number;
  shots: Array<{
    shotId: string;
    status: string;
    attempts: number;
    costCredits: number;
    failedCriteria: string[];
  }>;
}

export function stateFromReport(report: ProductionReport, updatedAt = new Date().toISOString()): ProductionState {
  return {
    episodeId: report.episodeId,
    status: report.status,
    updatedAt,
    totalAttempts: report.totalAttempts,
    totalCostCredits: report.totalCostCredits,
    shots: report.shots.map((shot) => ({
      shotId: shot.shot.id,
      status: shot.status,
      attempts: shot.attempts.length,
      costCredits: shot.totalCostCredits,
      failedCriteria: [...shot.failedCriteria],
    })),
  };
}
