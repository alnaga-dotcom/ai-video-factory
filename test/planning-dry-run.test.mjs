import test from "node:test";
import assert from "node:assert/strict";
import { planIdea } from "../dist/planning/idea-to-spec.js";
import { buildProductionDryRun } from "../dist/planning/dry-run.js";

test("routes and costs a planned 30 second production without generation", () => {
  const planned = planIdea({ id: "EP-MILESTONE", title: "Test", idea: "Sabra prepares a morning drink.", characterId: "sabra", location: "outdoor home", targetSeconds: 30, format: "9:16" });
  const models = { video: [
    { provider: "veo", model: "veo-fast", tier: "fast", enabled: true, supportedDurationsSeconds: [7, 8], estimatedCredits: { 7: 7, 8: 8 } },
    { provider: "veo", model: "veo-premium", tier: "premium", enabled: true, supportedDurationsSeconds: [7, 8], estimatedCredits: { 7: 14, 8: 16 } },
  ] };
  const report = buildProductionDryRun(planned.episode, models);
  assert.equal(report.shotCount, 4);
  assert.equal(report.totalSeconds, 30);
  assert.equal(report.shots[0].tier, "fast");
  assert.equal(report.shots[1].tier, "premium");
  assert.deepEqual(report.shots.map((shot) => shot.durationSeconds), [8, 8, 7, 7]);
  assert.deepEqual(report.shots.map((shot) => shot.estimatedCredits), [8, 16, 14, 14]);
  assert.equal(report.estimatedCredits, 52);
  assert.match(report.shots[0].prompt, /Preserve exact character identity/);
});
