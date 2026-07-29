import assert from "node:assert/strict";
import test from "node:test";
import { AssetRegistry } from "../dist/assets/registry.js";

function canonAsset(overrides = {}) {
  return {
    id: "sabra-face-master",
    worldId: "sabra-world",
    kind: "image",
    status: "CANON",
    version: "1.0.0",
    uri: "https://cdn.example.test/sabra/face.png",
    sha256: "abc123",
    characterId: "sabra",
    tags: ["identity", "face", "master"],
    ...overrides,
  };
}

test("registers and resolves a CANON asset", () => {
  const registry = new AssetRegistry();
  registry.register(canonAsset());

  const asset = registry.requireCanon("sabra-face-master");
  assert.equal(asset.worldId, "sabra-world");
  assert.equal(asset.status, "CANON");
});

test("rejects duplicate asset ids", () => {
  const registry = new AssetRegistry();
  registry.register(canonAsset());

  assert.throws(() => registry.register(canonAsset()), /Asset already registered/);
});

test("blocks CANDIDATE assets from production CANON resolution", () => {
  const registry = new AssetRegistry();
  registry.register(canonAsset({ id: "logo", kind: "logo", status: "CANDIDATE" }));

  assert.throws(() => registry.requireCanon("logo"), /CANDIDATE, not CANON/);
});

test("queries by world, status, character, kind, and tags", () => {
  const registry = new AssetRegistry();
  registry.register(canonAsset());
  registry.register(canonAsset({
    id: "sabra-theme",
    kind: "audio",
    characterId: undefined,
    tags: ["brand", "theme"],
    uri: "https://cdn.example.test/sabra/theme.mp3",
  }));
  registry.register(canonAsset({
    id: "other-world-face",
    worldId: "other-world",
    characterId: "other",
    tags: ["identity", "face"],
  }));

  const results = registry.query({
    worldId: "sabra-world",
    kind: "image",
    status: "CANON",
    characterId: "sabra",
    tags: ["identity", "face"],
  });

  assert.deepEqual(results.map((asset) => asset.id), ["sabra-face-master"]);
});

test("copies tags on registration so caller mutation cannot alter registry state", () => {
  const registry = new AssetRegistry();
  const tags = ["identity", "face"];
  registry.register(canonAsset({ tags }));
  tags.push("mutated-after-register");

  assert.deepEqual(registry.require("sabra-face-master").tags, ["identity", "face"]);
});
