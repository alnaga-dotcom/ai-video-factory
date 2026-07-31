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
function textOf(r) { return typeof r?.text === 'string' ? r.text.trim() : (r?.candidates?.[0]?.content?.parts ?? []).map((p) => p?.text ?? '').join('').trim(); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

loadEnv();
const episodeId = (process.argv[2] || '').toUpperCase();
if (!/^EP\d{3}$/.test(episodeId)) throw new Error('Usage: npm run episode:prepare-audio -- EP002');
const root = path.join(ROOT, 'episodes', episodeId);
const manifestFile = path.join(root, 'manifest.json');
const storyFile = path.join(root, '01-story', 'STORY.md');
const sceneFile = path.join(root, '02-scenes', 'scene-plan.json');
if (!fs.existsSync(manifestFile) || !fs.existsSync(storyFile) || !fs.existsSync(sceneFile)) throw new Error('Approved episode story/scene plan is incomplete.');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
if (manifest.gates?.storyApproval?.status !== 'APPROVED') throw new Error('Story approval is required before audio preparation.');
const apiKey = process.env.GEMINI_API_KEY?.trim(); if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');
const model = process.env.GEMINI_TEXT_MODEL?.trim() || manifest.intelligence?.textModel || 'gemini-2.5-flash';
const story = fs.readFileSync(storyFile, 'utf8');
const scenePlan = fs.readFileSync(sceneFile, 'utf8');
const audioRoot = path.join(root, '04-audio');
fs.mkdirSync(path.join(audioRoot, 'scripts'), { recursive: true });

const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model,
  contents: `Create the TTS-ready spoken script for this APPROVED Sabra World episode.\n\nAPPROVED STORY:\n${story}\n\nAPPROVED SCENE PLAN:\n${scenePlan}\n\nMANDATORY TTS STANDARD:\n- Natural language suitable for the audience; Egyptian Arabic (ar-EG) where Arabic dialogue/narration is intended.\n- Short, balanced spoken sentences.\n- Correct punctuation (، . ؛ : ! ؟ …) for natural pauses and rhythm.\n- Add selective diacritics only where pronunciation could be ambiguous.\n- Proactively resolve ambiguous pronunciation using diacritics or meaning-preserving rephrasing.\n- Proper names, terms, Arabized foreign words, abbreviations and numbers must be represented for reliable pronunciation.\n- Rephrase only to improve pronunciation/natural delivery; preserve meaning, facts, tone, intent and speaker identity exactly.\n- Avoid robotic constructions and likely TTS pronunciation traps.\n- Review the entire result for likely pronunciation errors before output.\n- Do not add dialogue, facts or story content. Do not alter Canon.\n\nOutput Markdown only. Organize by speaker and/or scene so synthesis can later create separate voice assets. Include a final section named Pronunciation Review listing any words/names/terms that required special treatment and the intended pronunciation.`,
});
const tts = textOf(response); if (!tts) throw new Error('TTS optimization returned empty output. No audio state was changed.');
const scriptFile = path.join(audioRoot, 'scripts', 'TTS_SCRIPT.md');
fs.writeFileSync(scriptFile, `# ${episodeId} — TTS Script\n\nStatus: PRONUNCIATION REVIEW READY\n\n${tts}\n`);
fs.copyFileSync(storyFile, path.join(audioRoot, 'scripts', 'ORIGINAL_APPROVED_SCRIPT.md'));
manifest.audio = { ...(manifest.audio ?? {}), originalScript: '04-audio/scripts/ORIGINAL_APPROVED_SCRIPT.md', ttsScript: '04-audio/scripts/TTS_SCRIPT.md', pronunciationReview: 'READY', synthesis: 'BLOCKED' };
manifest.stages.audio = 'TTS_REVIEW_READY';
manifest.status = 'TTS_PRONUNCIATION_REVIEW_REQUIRED';
manifest.updatedAt = new Date().toISOString();
writeJson(manifestFile, manifest);
console.log(`✓ ${episodeId} original approved script preserved`);
console.log('✓ TTS script optimized');
console.log('✓ Pronunciation review prepared');
console.log('STOPPED — AUDIO SYNTHESIS BLOCKED UNTIL TTS SCRIPT IS APPROVED');
console.log(`Review: ${scriptFile}`);
