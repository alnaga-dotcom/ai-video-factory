#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROJECT = process.env.AVF_PROJECT || 'sabra-world';
const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: node scripts/create-episode.mjs "episode idea"');
  process.exit(1);
}

const episodesRoot = path.join(ROOT, 'projects', PROJECT, 'episodes');
fs.mkdirSync(episodesRoot, { recursive: true });
const existing = fs.readdirSync(episodesRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^EP\d{3}$/.test(e.name))
  .map((e) => Number(e.name.slice(2)));
const number = String(Math.max(0, ...existing) + 1).padStart(3, '0');
const episodeId = `EP${number}`;
const episodeRoot = path.join(episodesRoot, episodeId);
if (fs.existsSync(episodeRoot)) throw new Error(`${episodeId} already exists`);

const dirs = [
  '00-spec', '01-story', '02-scenes',
  '03-images/generated', '03-images/approved-16x9',
  '04-audio/raw', '04-audio/approved',
  '05-video/generated', '05-video/lipsync', '05-video/approved',
  '06-edit', '07-delivery', '08-qc'
];
for (const dir of dirs) fs.mkdirSync(path.join(episodeRoot, dir), { recursive: true });

const manifest = {
  schemaVersion: 1,
  project: PROJECT,
  episodeId,
  idea: title,
  status: 'STORY_REQUIRED',
  format: { aspectRatio: '16:9', width: 1920, height: 1080 },
  gates: {
    imageReview: { required: true, status: 'PENDING' },
    publishAuthorization: { required: true, status: 'PENDING' }
  },
  stages: {
    idea: 'LOCKED', story: 'PENDING', scenes: 'BLOCKED', images: 'BLOCKED',
    audio: 'BLOCKED', clips: 'BLOCKED', assembly: 'BLOCKED', publish: 'BLOCKED'
  }
};
fs.writeFileSync(path.join(episodeRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(episodeRoot, '00-spec', 'IDEA.md'), `# ${episodeId}\n\n## Idea\n${title}\n\n## Hard format\n- Landscape 16:9\n- 1920x1080 target\n- Strict Canon/reference fidelity\n`);
fs.writeFileSync(path.join(episodeRoot, '08-qc', 'QC.md'), `# ${episodeId} QC\n\n## Gate 01 — Images\nPENDING\n\n## Gate 02 — Publish authorization\nPENDING\n`);

console.log(`${episodeId} CREATED`);
console.log(`IDEA LOCKED: ${title}`);
console.log('NEXT: STORY -> SCENES -> IMAGES -> HUMAN GATE 01');
console.log(episodeRoot);
