#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
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

if (!idea) {
  console.error('Episode idea is required.');
  process.exit(1);
}

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
if (fs.existsSync(episodeRoot)) {
  console.error(`${episodeId} already exists: ${episodeRoot}`);
  process.exit(2);
}

const dirs = [
  '00-spec',
  '01-story',
  '02-scenes',
  '03-visuals/generated',
  '03-visuals/approved-16x9',
  '04-audio/raw',
  '04-audio/approved',
  '05-production/motion-still',
  '05-production/video/generated',
  '05-production/video/lipsync',
  '05-production/video/approved',
  '06-edit',
  '07-delivery',
  '08-qc',
];

for (const dir of dirs) fs.mkdirSync(path.join(episodeRoot, dir), { recursive: true });

const manifest = {
  schemaVersion: 2,
  pipelineVersion: 2,
  project: 'sabra-world',
  episodeId,
  idea,
  status: 'STORY_APPROVAL_REQUIRED',
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
    idea: 'LOCKED',
    story: 'PENDING',
    scenes: 'BLOCKED',
    routing: 'BLOCKED',
    audioVisualPlan: 'BLOCKED',
    visualMasters: 'BLOCKED',
    production: 'BLOCKED',
    assembly: 'BLOCKED',
    finalQc: 'BLOCKED',
    publish: 'BLOCKED',
  },
  createdAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(episodeRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(episodeRoot, '00-spec', 'IDEA.md'),
  `# ${episodeId}\n\n## Idea\n${idea}\n\n## Pipeline\n- Pipeline v2\n- Cheapest valid production mode per shot\n- STILL / MOTION_STILL / VIDEO / VIDEO_LIPSYNC\n- AUDIO / ACTION / FIXED timing\n\n## Hard format\n- Landscape 16:9\n- 1920x1080 target\n- Strict Canon/reference fidelity\n- No paid video generation for STILL or MOTION_STILL\n`,
);
fs.writeFileSync(
  path.join(episodeRoot, '01-story', 'STORY.md'),
  `# ${episodeId} — Story\n\nStatus: DRAFT REQUIRED\n\n## Locked idea\n${idea}\n\n## Story\n\n`,
);
fs.writeFileSync(
  path.join(episodeRoot, '02-scenes', 'SCENE_PLAN.md'),
  `# ${episodeId} — Scene Plan\n\nStatus: BLOCKED — STORY APPROVAL REQUIRED\n\nEach shot must define productionMode (STILL | MOTION_STILL | VIDEO | VIDEO_LIPSYNC) and timingDriver (AUDIO | ACTION | FIXED).\n`,
);
fs.writeFileSync(
  path.join(episodeRoot, '08-qc', 'QC.md'),
  `# ${episodeId} QC\n\n## Story approval\nPENDING\n\n## Gate 01 — Visual review\nBLOCKED\n\n## Gate 02 — Publish authorization\nBLOCKED\n`,
);

console.log('AI VIDEO FACTORY — PIPELINE V2');
console.log('');
console.log(`✓ ${episodeId} created`);
console.log(`✓ Idea locked: ${idea}`);
console.log('✓ 16:9 / 1920x1080 production contract applied');
console.log('✓ Cost-aware scene routing enabled');
console.log('');
console.log('STOPPED — STORY APPROVAL REQUIRED');
console.log('Next: create/review STORY.md, approve story, then build scene/routing plan.');
console.log(episodeRoot);
