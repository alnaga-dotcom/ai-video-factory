#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

const ROOT = process.cwd();
function loadEnv(file = path.join(ROOT, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('='); if (i < 1) continue;
    const key = line.slice(0, i).trim(); let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
function textOf(response) {
  if (typeof response?.text === 'string') return response.text.trim();
  return (response?.candidates?.[0]?.content?.parts ?? []).map((p) => p?.text ?? '').join('').trim();
}
function parseJson(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

loadEnv();
const episodeId = (process.argv[2] || '').toUpperCase();
if (!/^EP\d{3}$/.test(episodeId)) throw new Error('Usage: npm run episode:approve-story -- EP002');
const root = path.join(ROOT, 'episodes', episodeId);
const manifestFile = path.join(root, 'manifest.json');
const storyFile = path.join(root, '01-story', 'STORY.md');
if (!fs.existsSync(manifestFile) || !fs.existsSync(storyFile)) throw new Error(`${episodeId} workspace/story not found.`);

const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
if (manifest.gates?.storyApproval?.status === 'APPROVED') throw new Error(`${episodeId} story is already approved.`);
const story = fs.readFileSync(storyFile, 'utf8');
const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env.');
const model = process.env.GEMINI_TEXT_MODEL?.trim() || manifest.intelligence?.textModel || 'gemini-2.5-flash';

console.log(`Approving ${episodeId} story and building scene plan...`);
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model,
  contents: `Convert this APPROVED Sabra World story into a production scene plan. Return JSON only, no Markdown fences.\n\n${story}\n\nSchema:\n{"scenes":[{"id":"S01","location":"...","shots":[{"id":"shot-1","kind":"establishing|character|interaction|dialogue|reaction|object|transition","durationSeconds":6,"characters":["sabra"],"action":"...","dialogue":[{"characterId":"sabra","text":"..."}],"productionMode":"STILL|MOTION_STILL|VIDEO|VIDEO_LIPSYNC","timingDriver":"AUDIO|ACTION|FIXED","lipSyncRequired":false,"reason":"..."}]}]}\n\nRules:\n- Choose the CHEAPEST valid production mode per shot.\n- Narration/off-camera dialogue does NOT require lip-sync.\n- STILL for static coverage; MOTION_STILL when editor pan/zoom/reframe is enough.\n- VIDEO only for meaningful temporal action such as cooking, walking, interaction or physical comedy.\n- VIDEO_LIPSYNC only when visible synchronized speech is necessary.\n- AUDIO timing for narration/dialogue-led shots; ACTION for physical action; FIXED for cards/transitions.\n- Keep total runtime approximately aligned with the approved story.\n- Preserve Sabra Canon; do not invent redesign instructions.`,
});
const raw = textOf(response);
if (!raw) throw new Error('Gemini returned an empty scene plan. Story approval was not committed.');
const plan = parseJson(raw);
if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) throw new Error('Invalid scene plan: scenes[] missing. Story approval was not committed.');

const sceneJsonFile = path.join(root, '02-scenes', 'scene-plan.json');
writeJson(sceneJsonFile, plan);
let md = `# ${episodeId} — Scene Plan\n\nStatus: READY — STORY APPROVED\n\n`;
for (const scene of plan.scenes) {
  md += `## ${scene.id} — ${scene.location ?? 'Unspecified location'}\n\n`;
  for (const shot of scene.shots ?? []) md += `- **${shot.id}** — ${shot.productionMode} / ${shot.timingDriver} / ${shot.durationSeconds}s — ${shot.action}${shot.reason ? ` — ${shot.reason}` : ''}\n`;
  md += '\n';
}
fs.writeFileSync(path.join(root, '02-scenes', 'SCENE_PLAN.md'), md);
manifest.status = 'SCENE_PLAN_READY';
manifest.gates.storyApproval.status = 'APPROVED';
manifest.gates.storyApproval.approvedAt = new Date().toISOString();
manifest.gates.visualReview.status = 'PENDING_PREPARATION';
manifest.stages.story = 'APPROVED';
manifest.stages.scenes = 'READY';
manifest.stages.routing = 'READY';
manifest.stages.audioVisualPlan = 'READY';
manifest.stages.visualMasters = 'PENDING';
manifest.updatedAt = new Date().toISOString();
writeJson(manifestFile, manifest);

console.log('✓ Story approved');
console.log('✓ Scene plan generated');
console.log('✓ Production modes assigned');
console.log('✓ Timing drivers assigned');
console.log('STOPPED — VISUAL/AUDIO PREPARATION IS NEXT');
console.log(`Review plan: ${path.join(root, '02-scenes', 'SCENE_PLAN.md')}`);
