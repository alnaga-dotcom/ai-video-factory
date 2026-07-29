import assert from "node:assert/strict";
import test from "node:test";
import { BunnyStorageProvider, normalizeStorageKey } from "../dist/index.js";

test("normalizes Windows storage keys and rejects traversal", () => {
  assert.equal(normalizeStorageKey("\\sabra\\characters\\face.png"), "sabra/characters/face.png");
  assert.throws(() => normalizeStorageKey("sabra/../secret.txt"), /relative path segments/);
  assert.throws(() => normalizeStorageKey("sabra/"), /identify a file/);
});

test("Bunny public URL encodes path segments", () => {
  const provider = new BunnyStorageProvider({
    storageZone: "factory-zone",
    accessKey: "test-key",
    cdnBaseUrl: "https://media.example.test/",
  });

  assert.equal(
    provider.publicUrl("sabra world/characters/face master.png"),
    "https://media.example.test/sabra%20world/characters/face%20master.png",
  );
});

test("Bunny configuration rejects missing credentials", () => {
  assert.throws(
    () => new BunnyStorageProvider({ storageZone: "factory-zone", accessKey: "", cdnBaseUrl: "https://media.example.test" }),
    /accessKey is required/,
  );
});
