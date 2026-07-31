#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const [commandRaw, episodeRaw, ...rest] = process.argv.slice(2);
const command = (commandRaw || '').toLowerCase();
const episodeId = (episodeRaw || '').toUpperCase();
function usage() { console.log('Commands: status, resume, approve-tts, reject-tts, approve-audio, reject-audio, approve-visuals, reject-visuals, approve-publish, reject-publish'); }
if (!command || !/^EP\d{3}$/.test(episodeId)) { usage(); process.exit(1); }
const root = path.join(ROOT, 'episodes', episodeId); const mf = path.join(root, 'manifest.json'); if (!fs.existsSync(mf)) throw new Error(`Episode not found: ${episodeId}`);
const read = () => JSON.parse(fs.readFileSync(mf, 'utf8')); const write = (m) => { m.updatedAt = new Date().toISOString(); fs.writeFileSync(mf, `${JSON.stringify(m, null, 2)}\n`); };
const exists = (r) => fs.existsSync(path.join(root, r)); const files = (r) => { const d = path.join(root, r); return fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name) : []; };
function nextAction(m) {
  if (m.gates?.storyApproval?.status !== 'APPROVED') return `Review STORY.md, then approve story.`;
  if (!exists('02-scenes/scene-plan.json')) return 'Scene plan missing.';
  if (!m.audio?.ttsScript) return `Run: npm run episode:prepare-audio -- ${episodeId}`;
  if (m.audio?.ttsApproval !== 'APPROVED') return `Review TTS_SCRIPT.md, then: npm run episode:approve-tts -- ${episodeId}`;
  if (m.audio?.synthesis !== 'REVIEW_READY' && m.audio?.qc !== 'APPROVED') return `Run: npm run episode:generate-audio -- ${episodeId}`;
  if (m.audio?.qc !== 'APPROVED') return `Listen to review audio, then approve or reject audio QC.`;
  if (m.gates?.visualReview?.status === 'REJECTED') return 'Regenerate only rejected visual shots.';
  if (m.gates?.visualReview?.status !== 'APPROVED') return 'Prepare/review visual masters, then approve Gate 01.';
  if (m.stages?.production !== 'COMPLETE') return 'Produce routed shots.';
  if (m.stages?.assembly !== 'COMPLETE') return 'Assemble episode master.';
  if (m.stages?.finalQc !== 'PASS') return 'Run final QC.';
  if (m.gates?.publishAuthorization?.status !== 'APPROVED') return 'Review final master and authorize publication.';
  if (m.stages?.publish !== 'COMPLETE') return 'Execute configured distribution.';
  return 'Episode lifecycle complete.';
}
function status(m) { console.log(`AI VIDEO FACTORY — ${episodeId}`); console.log(`Status: ${m.status}`); console.log(`Story: ${m.gates?.storyApproval?.status ?? 'UNKNOWN'} | TTS: ${m.audio?.ttsApproval ?? 'NOT_READY'} | Audio QC: ${m.audio?.qc ?? 'NOT_READY'} | Visual: ${m.gates?.visualReview?.status ?? 'UNKNOWN'} | Publish: ${m.gates?.publishAuthorization?.status ?? 'UNKNOWN'}`); console.log(`Approved audio: ${files('04-audio/approved').length} | visuals: ${files('03-visuals/approved-16x9').length} | videos: ${files('05-production/video/approved').length} | delivery: ${files('07-delivery').length}`); console.log(`Next: ${nextAction(m)}`); }
const m = read(); if (command === 'status' || command === 'resume') { status(m); process.exit(0); }
if (command === 'approve-tts') { if (!exists('04-audio/scripts/TTS_SCRIPT.md')) throw new Error('TTS script missing.'); m.audio = { ...m.audio, ttsApproval: 'APPROVED', ttsApprovedAt: new Date().toISOString(), synthesis: 'READY' }; m.stages.audio = 'SYNTHESIS_READY'; m.status = 'AUDIO_SYNTHESIS_READY'; write(m); console.log(`${episodeId} TTS SCRIPT: APPROVED`); process.exit(0); }
if (command === 'reject-tts') { m.audio = { ...m.audio, ttsApproval: 'REJECTED', ttsRejectionReason: rest.join(' ') || 'Pronunciation/script revision required', synthesis: 'BLOCKED' }; m.stages.audio = 'TTS_REVISION_REQUIRED'; m.status = 'TTS_REVISION_REQUIRED'; write(m); console.log(`${episodeId} TTS SCRIPT: REJECTED`); process.exit(0); }
if (command === 'approve-audio') { const review = m.audio?.reviewMaster; if (!review || !exists(review)) throw new Error('Review audio master missing.'); const src = path.join(root, review); const dstRel = `04-audio/approved/${episodeId}-voice-master.wav`; const dst = path.join(root, dstRel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); m.audio = { ...m.audio, qc: 'APPROVED', qcApprovedAt: new Date().toISOString(), approvedMaster: dstRel }; m.stages.audio = 'APPROVED'; m.status = 'VISUAL_PREPARATION_READY'; write(m); console.log(`${episodeId} AUDIO QC: APPROVED`); console.log(`Immutable approved copy: ${dst}`); process.exit(0); }
if (command === 'reject-audio') { m.audio = { ...m.audio, qc: 'REJECTED', qcRejectionReason: rest.join(' ') || 'Audio revision required', synthesis: 'REVISION_REQUIRED' }; m.stages.audio = 'REVISION_REQUIRED'; m.status = 'AUDIO_REVISION_REQUIRED'; write(m); console.log(`${episodeId} AUDIO QC: REJECTED`); process.exit(0); }
if (command === 'approve-visuals') { if (m.audio?.qc !== 'APPROVED') throw new Error('Approved audio master is required before Gate 01.'); if (!exists('02-scenes/scene-plan.json') || files('03-visuals/approved-16x9').length === 0) throw new Error('Scene plan/approved visuals missing.'); m.gates.visualReview = { required: true, status: 'APPROVED', approvedAt: new Date().toISOString() }; m.stages.visualMasters = 'APPROVED'; m.stages.production = 'PENDING'; m.status = 'PRODUCTION_READY'; write(m); console.log(`${episodeId} GATE 01: APPROVED`); process.exit(0); }
if (command === 'reject-visuals') { if (!rest.length) throw new Error('Specify rejected shot IDs.'); m.gates.visualReview = { required: true, status: 'REJECTED', rejectedAt: new Date().toISOString(), rejectedShots: rest }; m.stages.visualMasters = 'REVISION_REQUIRED'; m.stages.production = 'BLOCKED'; m.status = 'VISUAL_REVISION_REQUIRED'; write(m); console.log(`${episodeId} GATE 01: REJECTED — ${rest.join(', ')}`); process.exit(0); }
if (command === 'approve-publish') { if (m.stages?.assembly !== 'COMPLETE' || m.stages?.finalQc !== 'PASS' || files('07-delivery').length === 0) throw new Error('Completed assembly, PASS QC and delivery master required.'); m.gates.publishAuthorization = { required: true, status: 'APPROVED', approvedAt: new Date().toISOString() }; m.stages.publish = 'AUTHORIZED'; m.status = 'PUBLISH_AUTHORIZED'; write(m); console.log(`${episodeId} GATE 02: APPROVED — PUBLICATION AUTHORIZED`); process.exit(0); }
if (command === 'reject-publish') { m.gates.publishAuthorization = { required: true, status: 'REJECTED', rejectedAt: new Date().toISOString(), reason: rest.join(' ') || 'Director revision required' }; m.stages.assembly = 'REVISION_REQUIRED'; m.stages.publish = 'BLOCKED'; m.status = 'FINAL_REVISION_REQUIRED'; write(m); console.log(`${episodeId} GATE 02: REJECTED`); process.exit(0); }
usage(); process.exit(1);
