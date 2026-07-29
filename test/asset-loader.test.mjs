import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadAssetRegistryFromFile } from "../dist/assets/loader.js";

test("runtime loader registers CANON assets and resolver selects semantic references", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aivf-assets-"));
  const path = join(dir, "canon.json");
  await writeFile(path, JSON.stringify({
    worldId: "sabra-world",
    assets: [
      { id: "face", worldId: "sabra-world", kind: "image", status: "CANON", version: "1", uri: "https://cdn/face.png", sha256: "a", characterId: "sabra", role: "FACE_IDENTITY", canonTier: "PRIMARY" },
      { id: "expression", worldId: "sabra-world", kind: "image", status: "CANON", version: "1", uri: "https://cdn/expression.png", sha256: "b", characterId: "sabra", role: "EXPRESSION", canonTier: "SUPPORTING" },
      { id: "candidate", worldId: "sabra-world", kind: "image", status: "CANDIDATE", version: "1", uri: "https://cdn/candidate.png", characterId: "sabra", role: "FACE_IDENTITY" }
    ]
  }), "utf8");

  const registry = await loadAssetRegistryFromFile(path);
  const refs = registry.resolveReferences({ worldId: "sabra-world", characterId: "sabra", roles: ["FACE_IDENTITY", "EXPRESSION"] });
  assert.deepEqual(refs.map((asset) => asset.id), ["face", "expression"]);
});
