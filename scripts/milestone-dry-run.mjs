import { planIdea } from "../dist/planning/idea-to-spec.js";
import { buildProductionDryRun } from "../dist/planning/dry-run.js";

const idea = process.argv.slice(2).join(" ").trim() || "Sabra starts her morning, prepares a simple drink, and welcomes the new day.";

const planned = planIdea({
  id: "EP-MILESTONE-001",
  title: "Sabra World Milestone",
  idea,
  characterId: "sabra",
  location: "Sabra's outdoor home environment",
  timeOfDay: "early morning",
  targetSeconds: 30,
  format: "9:16",
});

// Planning credits are deliberately configurable placeholders until provider billing
// is normalized into one Factory unit. They are not presented as USD.
const models = {
  video: [
    { provider: "veo", model: "veo-3.1-fast-generate-preview", tier: "fast", enabled: true, supportedDurationsSeconds: [7, 8], estimatedCredits: { 7: 7, 8: 8 } },
    { provider: "veo", model: "veo-3.1-generate-preview", tier: "premium", enabled: true, supportedDurationsSeconds: [7, 8], estimatedCredits: { 7: 14, 8: 16 } },
  ],
};

const report = buildProductionDryRun(planned.episode, models);
console.log("AI VIDEO FACTORY — MILESTONE DRY RUN");
console.log(`IDEA ${idea}`);
console.log(`FORMAT ${planned.input.format}`);
console.log(`TARGET ${planned.input.targetSeconds}s`);
console.log(`STORY ${planned.story}`);
console.log(`SHOTS ${report.shotCount} | TOTAL ${report.totalSeconds}s`);
for (const shot of report.shots) {
  console.log(`SHOT ${shot.shotId} | ${shot.durationSeconds}s | ${shot.tier.toUpperCase()} | ${shot.model}`);
  console.log(`  ROUTE ${shot.routeReason}`);
  console.log(`  ESTIMATE ${shot.estimatedCredits ?? "UNKNOWN"} planning-credit(s)`);
  console.log(`  PROMPT ${shot.prompt}`);
}
console.log(`TOTAL ESTIMATE ${report.estimatedCredits ?? "UNKNOWN"} planning-credit(s)`);
console.log("GENERATION REQUESTS 0");
console.log("SPEND $0");
console.log("MILESTONE DRY RUN PASS");
