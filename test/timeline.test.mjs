import test from "node:test";
import assert from "node:assert/strict";
import { planTimeline } from "../dist/planning/timeline.js";

test("reserves intro and title card before generated story", () => {
  const plan = planTimeline({ targetSeconds: 30, introSeconds: 8, titleCardSeconds: 2 });
  assert.equal(plan.reusableSeconds, 10);
  assert.equal(plan.generatedStorySeconds, 20);
  assert.deepEqual(plan.segments, [
    { kind: "intro", durationSeconds: 8, generationRequired: false },
    { kind: "title-card", durationSeconds: 2, generationRequired: false },
    { kind: "generated-story", durationSeconds: 20, generationRequired: true },
  ]);
});

test("rejects reusable segments that consume the whole target", () => {
  assert.throws(() => planTimeline({ targetSeconds: 10, introSeconds: 8, titleCardSeconds: 2 }));
});
