#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const [commandRaw, episodeRaw, ...rest] = process.argv.slice(2);
const command = (commandRaw || '').toLowerCase();
const episodeId = (episodeRaw || '').toUpperCase();

function usage() {
  console.log('Usage:');
  console.log('  npm run episode:status -- EP002');
  console.log('  npm run episode:resume -- EP002');
  console.log('  npm run episode:approve-visuals -- EP002');
  console.log('  npm run episode:reject-visuals -- EP002 shot-3 shot-7');
  console.log('  npm run episode:approve-publish -- EP002');
  console.log('  npm run episode:reject-publish -- EP002 [reason]');
}
if (!command || !/^EP\d{3}$/.test(episodeId)) { usage(); process.exit(1); }

const root = path.join(ROOT, 'episodes', episodeId);
const manifestFile = path.join(root, 'manifest.json');
if (!fs.existsSync(manifestFile)) throw new Error(`Episode not found: ${episodeId}`);
const read = () => JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const write = (m) => { m.updatedAt = new Date().toISOString(); fs.writeFileSync(manifestFile, `${JSON.stringify(m, null, 2)}\n`); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const files = (relative) => {
  const dir = path.join(root, relative); if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
};

function nextAction(m) {
  if (m.gates?.storyApproval?.status !== 'APPROVED') return 'Review STORY.md, then: npm run episode:approve-story -- ' + episodeId;
  if (!exists('02-scenes/scene-plan.json')) return 'Scene plan missing. Re-run story approval planning safely after inspection.';
  if (m.gates?.visualReview?.status === 'REJECTED') return 'Regenerate only rejected visual shots, then resume.';
  if (m.gates?.visualReview?.status !== 'APPROVED') return 'Prepare audio/visual masters, review complete set, then approve Gate 01.';
  if (m.stages?.production !== 'COMPLETE') return 'Produce only routed VIDEO/VIDEO_LIPSYNC shots and render MOTION_STILL shots; STILL uses approved masters.';
  if (m.stages?.assembly !== 'COMPLETE') return 'Assemble episode master from approved audio and routed visual outputs.';
  if (m.stages?.finalQc !== 'PASS') return 'Run final QC and correct only failed shots/assets.';
  if (m.gates?.publishAuthorization?.status !== 'APPROVED') return 'Watch final master, then explicitly approve or reject Gate 02.';
  if (m.stages?.publish !== 'COMPLETE') return 'Publication is authorized; execute configured distribution targets.';
  return 'Episode lifecycle complete.';
}

function showStatus(m) {
  console.log(`AI VIDEO FACTORY — ${episodeId}`);
  console.log(`Status: ${m.status}`);
  console.log(`Story gate: ${m.gates?.storyApproval?.status ?? 'UNKNOWN'}`);
  console.log(`Visual gate: ${m.gates?.visualReview?.status ?? 'UNKNOWN'}`);
  console.log(`Publish gate: ${m.gates?.publishAuthorization?.status ?? 'UNKNOWN'}`);
  console.log(`Approved audio files: ${files('04-audio/approved').length}`);
  console.log(`Approved visual files: ${files('03-visuals/approved-16x9').length}`);
  console.log(`Approved video files: ${files('05-production/video/approved').length}`);
  console.log(`Delivery files: ${files('07-delivery').length}`);
  console.log(`Next: ${nextAction(m)}`);
}

const m = read();
if (command === 'status' || command === 'resume') { showStatus(m); process.exit(0); }

if (command === 'approve-visuals') {
  if (m.gates?.storyApproval?.status !== 'APPROVED') throw new Error('Story must be approved first.');
  if (!exists('02-scenes/scene-plan.json')) throw new Error('Scene plan is missing.');
  if (files('03-visuals/approved-16x9').length === 0) throw new Error('No approved 16:9 visual masters found; Gate 01 cannot be approved.');
  m.gates.visualReview = { required: true, status: 'APPROVED', approvedAt: new Date().toISOString() };
  m.stages.visualMasters = 'APPROVED'; m.stages.production = 'PENDING'; m.status = 'PRODUCTION_READY';
  write(m); console.log(`${episodeId} GATE 01: APPROVED`); console.log(`Next: npm run episode:resume -- ${episodeId}`); process.exit(0);
}

if (command === 'reject-visuals') {
  if (rest.length === 0) throw new Error('Specify at least one rejected shot ID.');
  m.gates.visualReview = { required: true, status: 'REJECTED', rejectedAt: new Date().toISOString(), rejectedShots: rest };
  m.stages.visualMasters = 'REVISION_REQUIRED'; m.stages.production = 'BLOCKED'; m.status = 'VISUAL_REVISION_REQUIRED';
  write(m); console.log(`${episodeId} GATE 01: REJECTED`); console.log(`Shots: ${rest.join(', ')}`); process.exit(0);
}

if (command === 'approve-publish') {
  if (m.stages?.assembly !== 'COMPLETE' || m.stages?.finalQc !== 'PASS') throw new Error('Assembly COMPLETE and finalQc PASS are required before publication authorization.');
  if (files('07-delivery').length === 0) throw new Error('No delivery master found; Gate 02 cannot be approved.');
  m.gates.publishAuthorization = { required: true, status: 'APPROVED', approvedAt: new Date().toISOString() };
  m.stages.publish = 'AUTHORIZED'; m.status = 'PUBLISH_AUTHORIZED';
  write(m); console.log(`${episodeId} GATE 02: APPROVED — PUBLICATION AUTHORIZED`); process.exit(0);
}

if (command === 'reject-publish') {
  m.gates.publishAuthorization = { required: true, status: 'REJECTED', rejectedAt: new Date().toISOString(), reason: rest.join(' ') || 'Director revision required' };
  m.stages.assembly = 'REVISION_REQUIRED'; m.stages.publish = 'BLOCKED'; m.status = 'FINAL_REVISION_REQUIRED';
  write(m); console.log(`${episodeId} GATE 02: REJECTED`); process.exit(0);
}

usage(); process.exit(1);
