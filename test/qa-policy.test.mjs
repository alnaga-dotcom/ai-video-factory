import assert from "node:assert/strict";
import test from "node:test";
import { decideRetry } from "../dist/qa/policy.js";

test("QA passes without retry when every criterion passes", () => {
  const result = decideRetry({
    shotId: "shot-1",
    checks: [
      { criterion: "identity", passed: true, score: 1 },
      { criterion: "continuity", passed: true, score: 0.95 },
    ],
  });

  assert.deepEqual(result, { retry: false, failedCriteria: [] });
});

test("QA returns only failed criteria and a targeted correction", () => {
  const result = decideRetry({
    shotId: "shot-2",
    checks: [
      { criterion: "identity", passed: true, score: 0.98 },
      { criterion: "eye-contact", passed: false, score: 0.3 },
      { criterion: "artifacts", passed: false, score: 0.2 },
    ],
  });

  assert.equal(result.retry, true);
  assert.deepEqual(result.failedCriteria, ["eye-contact", "artifacts"]);
  assert.match(result.correctiveInstruction, /eye-contact, artifacts/);
  assert.match(result.correctiveInstruction, /Preserve all passing continuity and identity constraints/);
});
