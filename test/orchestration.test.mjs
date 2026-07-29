import assert from "node:assert/strict";
import test from "node:test";
import { CharacterRegistry } from "../dist/characters/registry.js";
import { produceEpisode, produceShotWithQa } from "../dist/orchestration/factory.js";

function makeShot(id = "shot-1") {
  return {
    id,
    sceneId: "scene-1",
    kind: "dialogue",
    durationSeconds: 5,
    characters: ["sabra"],
    setting: "warm Egyptian family kitchen",
    action: "Sabra addresses the camera warmly",
    dialogue: [{ characterId: "sabra", text: "يا أهلاً" }],
    eyeContactTarget: "camera",
    continuityGroup: "intro",
    status: "planned",
  };
}

function makeDeps(qaResults) {
  const characters = new CharacterRegistry();
  characters.register({
    id: "sabra",
    displayName: "Sabra",
    canonicalAssetIds: ["sabra-face-master"],
    identityPrompt: "Preserve Sabra identity exactly",
  });

  const promptsSeen = [];
  let generations = 0;
  let qaIndex = 0;

  const provider = {
    id: "mock",
    async generate(request) {
      generations += 1;
      promptsSeen.push(request.prompt);
      return {
        provider: "mock",
        model: "mock-premium",
        jobId: `job-${generations}`,
        status: "succeeded",
        outputUrl: `mock://shot-${generations}.mp4`,
        costCredits: 10,
      };
    },
  };

  return {
    deps: {
      characters,
      models: {
        video: [
          {
            provider: "mock",
            model: "mock-premium",
            tier: "premium",
            enabled: true,
            supportedDurationsSeconds: [5],
            estimatedCredits: { 5: 10 },
          },
        ],
      },
      providers: new Map([["mock", provider]]),
      prompts: { build: (shot) => `BASE PROMPT ${shot.id}` },
      qa: {
        async evaluate(shot) {
          const result = qaResults[Math.min(qaIndex, qaResults.length - 1)];
          qaIndex += 1;
          return { shotId: shot.id, checks: result };
        },
      },
    },
    promptsSeen,
    generationCount: () => generations,
  };
}

const failEyeContact = [
  { criterion: "identity", passed: true, score: 0.98 },
  { criterion: "eye-contact", passed: false, score: 0.3 },
];
const passAll = [
  { criterion: "identity", passed: true, score: 0.99 },
  { criterion: "eye-contact", passed: true, score: 0.96 },
];

test("failed QA triggers targeted retry and then approves the shot", async () => {
  const fixture = makeDeps([failEyeContact, passAll]);
  const result = await produceShotWithQa(makeShot(), fixture.deps, { maxRetries: 2 });

  assert.equal(result.status, "approved");
  assert.equal(result.attempts.length, 2);
  assert.equal(result.totalCostCredits, 20);
  assert.equal(fixture.generationCount(), 2);
  assert.equal(fixture.promptsSeen[0], "BASE PROMPT shot-1");
  assert.match(fixture.promptsSeen[1], /CORRECTION:/);
  assert.match(fixture.promptsSeen[1], /eye-contact/);
});

test("retry exhaustion routes the shot to director review", async () => {
  const fixture = makeDeps([failEyeContact, failEyeContact, failEyeContact]);
  const result = await produceShotWithQa(makeShot(), fixture.deps, { maxRetries: 2 });

  assert.equal(result.status, "director-review");
  assert.equal(result.attempts.length, 3);
  assert.equal(result.totalCostCredits, 30);
  assert.deepEqual(result.failedCriteria, ["eye-contact"]);
});

test("episode report aggregates approved shots, attempts, and cost", async () => {
  const fixture = makeDeps([passAll, passAll]);
  const episode = {
    id: "episode-1",
    title: "Factory smoke test",
    format: "short",
    aspectRatio: "9:16",
    targetDurationSeconds: 10,
    scenes: [
      { id: "scene-1", order: 1, purpose: "intro", shots: [makeShot("shot-1"), makeShot("shot-2")] },
    ],
  };

  const report = await produceEpisode(episode, fixture.deps, { maxRetries: 1 });

  assert.equal(report.status, "approved");
  assert.equal(report.approvedShots, 2);
  assert.equal(report.directorReviewShots, 0);
  assert.equal(report.failedShots, 0);
  assert.equal(report.totalAttempts, 2);
  assert.equal(report.totalCostCredits, 20);
});
