import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProductionReport } from "../orchestration/factory.js";
import { buildDirectorReport, renderDirectorReport } from "./director-report.js";
import { stateFromReport } from "./state.js";

export interface PersistedProductionArtifacts {
  directory: string;
  statePath: string;
  directorJsonPath: string;
  directorTextPath: string;
}

export async function persistProductionArtifacts(
  report: ProductionReport,
  root = "data/productions",
): Promise<PersistedProductionArtifacts> {
  const directory = join(root, report.episodeId);
  await mkdir(directory, { recursive: true });

  const state = stateFromReport(report);
  const director = buildDirectorReport(report);
  const statePath = join(directory, "production-state.json");
  const directorJsonPath = join(directory, "director-report.json");
  const directorTextPath = join(directory, "director-report.txt");

  await Promise.all([
    writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8"),
    writeFile(directorJsonPath, `${JSON.stringify(director, null, 2)}\n`, "utf8"),
    writeFile(directorTextPath, renderDirectorReport(director), "utf8"),
  ]);

  return { directory, statePath, directorJsonPath, directorTextPath };
}
