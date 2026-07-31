#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [episodeId, gate, decision] = process.argv.slice(2);
const allowedGates = new Set(['images', 'publish']);
const allowedDecisions = new Set(['approve', 'reject']);
if (!/^EP\d{3}$/.test(episodeId || '') || !allowedGates.has(gate) || !allowedDecisions.has(decision)) {
  console.error('Usage: node scripts/episode-gate.mjs EP002 images|publish approve|reject');
  process.exit(1);
}

const project = process.env.AVF_PROJECT || 'sabra-world';
const root = path.join(process.cwd(), 'projects', project, 'episodes', episodeId);
const manifestPath = path.join(root, 'manifest.json');
if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest: ${manifestPath}`);
const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (gate === 'images') {
  m.gates.imageReview.status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
  if (decision === 'approve') {
    m.stages.images = 'LOCKED';
    m.stages.audio = 'PENDING';
    m.status = 'PRODUCTION_READY';
  } else {
    m.stages.images = 'REVISION_REQUIRED';
    m.status = 'IMAGE_REVISION_REQUIRED';
  }
} else {
  m.gates.publishAuthorization.status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
  if (decision === 'approve') {
    m.stages.publish = 'AUTHORIZED';
    m.status = 'PUBLISH_AUTHORIZED';
  } else {
    m.stages.assembly = 'REVISION_REQUIRED';
    m.stages.publish = 'BLOCKED';
    m.status = 'FINAL_REVISION_REQUIRED';
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n');
console.log(`${episodeId} ${gate.toUpperCase()} GATE: ${decision.toUpperCase()}`);
console.log(`STATUS: ${m.status}`);
