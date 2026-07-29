import { loadAssetRegistryFromFile } from "../dist/assets/loader.js";
import { routeShot } from "../dist/routing/model-router.js";

const manifestPath = "data/worlds/sabra-world/sabra-assets.canon.json";
const registry = await loadAssetRegistryFromFile(manifestPath);

const shot = {
  id: "shot-1",
  sceneId: "sabra-pilot-01",
  kind: "character",
  durationSeconds: 5,
  characters: ["sabra"],
  action: "Sabra stands naturally in her outdoor environment, notices the camera, and gives a subtle confident smile.",
  emotionalIntent: "warm, natural, confident",
  eyeContactTarget: "camera",
  status: "planned"
};

const roles = ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME", "EXPRESSION", "PROPORTIONS"];
const refs = registry.resolveReferences({
  worldId: "sabra-world",
  characterId: "sabra",
  roles,
  includeSupporting: true,
  maxPerRole: 2,
});
const route = routeShot(shot);

console.log("SABRA PRODUCTION DRY RUN");
console.log(`SHOT ${shot.id} | ${shot.kind} | ${shot.durationSeconds}s`);
console.log(`ROUTE ${route.tier.toUpperCase()} | ${route.reason}`);
console.log(`ACTION ${shot.action}`);
console.log(`INTENT ${shot.emotionalIntent}`);
console.log(`REFERENCES ${refs.length}`);
for (const asset of refs) {
  console.log(`- ${asset.role} | ${asset.canonTier ?? "UNTIERED"} | ${asset.id}`);
  console.log(`  ${asset.uri}`);
}
console.log("DRY RUN PASS — no generation request sent; credits used: 0");
