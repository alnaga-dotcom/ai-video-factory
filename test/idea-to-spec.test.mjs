import test from "node:test";
import assert from "node:assert/strict";
import { planIdea } from "../dist/planning/idea-to-spec.js";

test("plans a 30 second vertical idea into deterministic shots", () => {
  const result = planIdea({
    id: "EP-MILESTONE",
    title: "Sabra Morning",
    idea: "Sabra starts her morning and prepares a simple drink before greeting the day.",
    characterId: "sabra",
    location: "Sabra outdoor home",
    timeOfDay: "early morning",
    targetSeconds: 30,
    format: "9:16",
  });

  const shots = result.episode.scenes.flatMap((scene) => scene.shots);
  assert.equal(result.input.format, "9:16");
  assert.equal(shots.length, 4);
  assert.equal(shots.reduce((sum, shot) => sum + shot.durationSeconds, 0), 30);
  assert.deepEqual(shots.map((shot) => shot.durationSeconds), [8, 8, 7, 7]);
  assert.equal(shots[1].continuityFrom, "shot-1");
  assert.equal(shots[3].status, "planned");
});
