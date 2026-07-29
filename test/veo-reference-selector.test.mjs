import test from "node:test";
import assert from "node:assert/strict";
import { selectVeoReferences } from "../dist/providers/veo-reference-selector.js";

const asset = (id, role, tier, sha256 = id) => ({
  id, worldId: "sabra-world", kind: "image", status: "CANON", version: "1", uri: `https://cdn/${id}.png`,
  characterId: "sabra", role, canonTier: tier, sha256,
});

test("Veo selector caps references at three and prioritizes face, body and costume", () => {
  const selected = selectVeoReferences([
    asset("expression", "EXPRESSION", "SUPPORTING"),
    asset("costume", "COSTUME", "PRIMARY"),
    asset("body", "BODY_IDENTITY", "PRIMARY"),
    asset("face", "FACE_IDENTITY", "PRIMARY"),
    asset("proportions", "PROPORTIONS", "PRIMARY"),
  ]);
  assert.deepEqual(selected.map((item) => item.id), ["face", "body", "costume"]);
});

test("Veo selector excludes non-CANON, brand and duplicate binary assets", () => {
  const face = asset("face", "FACE_IDENTITY", "PRIMARY", "same");
  const duplicate = asset("face-copy", "BODY_IDENTITY", "PRIMARY", "same");
  const candidate = { ...asset("candidate", "BODY_IDENTITY", "PRIMARY"), status: "CANDIDATE" };
  const brand = asset("logo", "BRAND", "PRIMARY");
  const costume = asset("costume", "COSTUME", "PRIMARY");
  const selected = selectVeoReferences([face, duplicate, candidate, brand, costume]);
  assert.deepEqual(selected.map((item) => item.id), ["face", "costume"]);
});
