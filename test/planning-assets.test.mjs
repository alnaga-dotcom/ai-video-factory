import test from "node:test";
import assert from "node:assert/strict";
import { AssetRegistry } from "../dist/assets/registry.js";
import { planIdea } from "../dist/planning/idea-to-spec.js";
import { resolveEpisodeAssets } from "../dist/planning/assets.js";

test("resolves one primary identity reference per required role for every shot", () => {
  const registry = new AssetRegistry();
  for (const [id, role] of [["face", "FACE_IDENTITY"], ["body", "BODY_IDENTITY"], ["costume", "COSTUME"]]) {
    registry.register({ id, worldId: "sabra-world", characterId: "sabra", kind: "image", status: "CANON", version: "1", uri: `https://cdn.test/${id}.png`, role, canonTier: "PRIMARY" });
  }
  const planned = planIdea({ id: "EP-X", title: "X", idea: "Morning", characterId: "sabra", location: "home", targetSeconds: 30 });
  const assets = resolveEpisodeAssets(registry, planned.episode, "sabra-world");
  assert.equal(assets.shots.length, 4);
  assert.deepEqual(assets.uniqueAssetIds.sort(), ["body", "costume", "face"]);
  assert.ok(assets.shots.every((shot) => shot.references.length === 3));
});
