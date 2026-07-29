import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { persistProductionArtifacts } from "../dist/production/artifacts.js";

const shot = (id, status, cost, attempts = 1, failedCriteria = []) => ({
  shot: { id, sceneId: "scene-1", kind: "character", durationSeconds: 8, characters: ["sabra"], action: "test", status },
  status,
  attempts: Array.from({ length: attempts }, (_, index) => ({
    shot: { id, sceneId: "scene-1", kind: "character", durationSeconds: 8, characters: ["sabra"], action: "test", status },
    generation: { provider: "veo", model: "veo-test", assetId: `asset-${index}`, durationSeconds: 8, costCredits: cost / attempts },
    routeReason: "test",
    attempt: index + 1,
  })),
  totalCostCredits: cost,
  failedCriteria,
});

test("persists production state and director report", async () => {
  const root = await mkdtemp(join(tmpdir(), "aivf-production-"));
  const report = {
    episodeId: "EP-TEST",
    status: "director-review",
    shots: [shot("shot-1", "approved", 4), shot("shot-2", "director-review", 8, 2, ["identity"])],
    approvedShots: 1,
    directorReviewShots: 1,
    failedShots: 0,
    totalAttempts: 3,
    totalCostCredits: 12,
  };

  const artifacts = await persistProductionArtifacts(report, root);
  const state = JSON.parse(await readFile(artifacts.statePath, "utf8"));
  const director = JSON.parse(await readFile(artifacts.directorJsonPath, "utf8"));
  const text = await readFile(artifacts.directorTextPath, "utf8");

  assert.equal(state.status, "director-review");
  assert.equal(state.totalCostCredits, 12);
  assert.equal(director.decision, "DIRECTOR_REVIEW");
  assert.deepEqual(director.shotSummary[1].failedCriteria, ["identity"]);
  assert.match(text, /COST CREDITS 12/);
  assert.match(text, /SHOT shot-2/);
});
