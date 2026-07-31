#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

const ROOT = process.cwd();

function loadEnv(file = path.join(ROOT, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function extractText(response) {
  if (typeof response?.text === 'string') return response.text.trim();
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part?.text ?? '').join('').trim();
}

function updateManifest(file, mutate) {
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(manifest);
  manifest.updatedAt = new Date().toISOString();
  writeJson(file, manifest);
  return manifest;
}

loadEnv();
const args = process.argv.slice(2);
const raw = args.join(' ').trim();

if (!raw) {
  console.error('Usage: npm run episode -- "EP002 — episode idea"');
  console.error('   or: npm run episode -- "episode idea"');
  process.exit(1);
}

const explicit = raw.match(/^EP(\d{3})\s*(?:[-—:()]\s*)?(.*)$/i);
const requestedId = explicit ? `EP${explicit[1]}`.toUpperCase() : null;
const idea = (explicit?.[2] || raw).trim().replace(/^\((.*)\)$/, '$1').trim();
if (!idea) throw new Error('Episode idea is required.');

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env; episode was not created.');
const textModel = process.env.GEMINI_TEXT_MODEL?.trim() || 'gemini-2.5-flash';

const episodesRoot = path.join(ROOT, 'episodes');
fs.mkdirSync(episodesRoot, { recursive: true });
const existingIds = fs.readdirSync(episodesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^EP\d{3}$/i.test(entry.name))
  .map((entry) => entry.name.toUpperCase());

let episodeId = requestedId;
if (!episodeId) {
  const numbers = existingIds.map((id) => Number(id.slice(2))).filter(Number.isFinite);
  episodeId = `EP${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
}
const episodeRoot = path.join(episodesRoot, episodeId);
if (fs.existsSync(episodeRoot)) throw new Error(`${episodeId} already exists: ${episodeRoot}`);

console.log('AI VIDEO FACTORY — PIPELINE V2');
console.log(`Preparing ${episodeId}...`);
console.log(`Generating story with ${textModel}...`);

// Generate before creating the workspace so an AI/API failure cannot leave a half-created episode.
const ai = new GoogleGenAI({ apiKey });
const storyResponse = await ai.models.generateContent({
  model: textModel,
  contents: `Create the production-ready story/script for Sabra World episode ${episodeId}.\n\nLOCKED IDEA:\n${idea}\n\nRequirements:\n- Primary language: Egyptian Arabic (ar-EG), natural and family-friendly.\n- Sabra is the established recurring character; do not redesign or redefine her Canon identity.\n- Target runtime: approximately 1–2 minutes unless the idea clearly requires otherwise.\n- Strong opening hook, coherent progression, satisfying payoff/ending.\n- For children's content: age-appropriate, warm, engaging, and never preachy.\n- For cooking/action content: write actions clearly enough for later scene planning.\n- Do not decide AI models, production modes, camera prompts, or technical generation details here.\n- Output only the story/script in Markdown, ready for director review.`,
});
const story = extractText(storyResponse);
if (!story) throw new Error('Gemini returned an empty story; episode was not created.');

const dirs = [
  '00-spec', '01-story', '02-scenes', '03-visuals/generated', '03-visuals/approved-16x9',
  '04-audio/raw', '04-audio/approved', '05-production/motion-still', '05-production/video/generated',
  '05-production/video/lipsync', '05-production/video/approved', '06-edit', '07-delivery', '08-qc',
];
for (const dir of dirs) fs.mkdirSync(path.join(episodeRoot, dir), { recursive: true });

const manifestFile = path.join(episodeRoot, 'manifest.json');
const manifest = {
  schemaVersion: 2,
  pipelineVersion: 2,
  project: 'sabra-world', episodeId, idea,
  status: 'STORY_APPROVAL_REQUIRED',
  intelligence: { provider: 'gemini', textModel },
  format: { aspectRatio: '16:9', width: 1920, height: 1080 },
  productionModes: ['STILL', 'MOTION_STILL', 'VIDEO', 'VIDEO_LIPSYNC'],
  timingDrivers: ['AUDIO', 'ACTION', 'FIXED'],
  routingPolicy: 'CHEAPEST_VALID_MODE',
  gates: {
    storyApproval: { required: true, status: 'PENDING' },
    visualReview: { required: true, status: 'BLOCKED' },
    publishAuthorization: { required: true, status: 'BLOCKED' },
  },
  stages: {
    idea: 'LOCKED', story: 'DRAFT_READY', scenes: 'BLOCKED', routing: 'BLOCKED',
    audioVisualPlan: 'BLOCKED', visualMasters: 'BLOCKED', production: 'BLOCKED',
    assembly: 'BLOCKED', finalQc: 'BLOCKED', publish: 'BLOCKED',
  },
  createdAt: new Date().toISOString(),
};
writeJson(manifestFile, manifest);
fs.writeFileSync(path.join(episodeRoot, '00-spec', 'IDEA.md'), `# ${episodeId}\n\n## Idea\n${idea}\n\n## Pipeline\n- Pipeline v2\n- Cheapest valid production mode per shot\n- STILL / MOTION_STILL / VIDEO / VIDEO_LIPSYNC\n- AUDIO / ACTION / FIXED timing\n\n## Hard format\n- Landscape 16:9\n- 1920x1080 target\n- Strict Canon/reference fidelity\n- No paid video generation for STILL or MOTION_STILL\n`);
fs.writeFileSync(path.join(episodeRoot, '01-story', 'STORY.md'), `# ${episodeId} — Story\n\nStatus: DIRECTOR REVIEW REQUIRED\n\n## Locked idea\n${idea}\n\n## Story / Script\n\n${story}\n`);
fs.writeFileSync(path.join(episodeRoot, '02-scenes', 'SCENE_PLAN.md'), `# ${episodeId} — Scene Plan\n\nStatus: BLOCKED — STORY APPROVAL REQUIRED\n`);
fs.writeFileSync(path.join(episodeRoot, '08-qc', 'QC.md'), `# ${episodeId} QC\n\n## Story approval\nPENDING\n\n## Gate 01 — Visual review\nBLOCKED\n\n## Gate 02 — Publish authorization\nBLOCKED\n`);

console.log('');
console.log(`✓ ${episodeId} created`);
console.log('✓ Idea locked');
console.log('✓ Story draft generated');
console.log('✓ Pipeline v2 contract applied');
console.log('');
console.log('STOPPED — STORY APPROVAL REQUIRED');
console.log(`Review: ${path.join(episodeRoot, '01-story', 'STORY.md')}`);
console.log(`Then run: npm run episode:approve-story -- ${episodeId}`);
