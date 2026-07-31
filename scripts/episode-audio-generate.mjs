#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
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
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function wavFromPcm(pcm, sampleRate = 24000, channels = 1, bits = 16) {
  const h = Buffer.alloc(44); const align = channels * bits / 8; const rate = sampleRate * align;
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22); h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(rate, 28); h.writeUInt16LE(align, 32); h.writeUInt16LE(bits, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
function ffmpeg(args) { return new Promise((ok, fail) => { const p = spawn('ffmpeg', args, { stdio: 'inherit', shell: false }); p.on('error', fail); p.on('exit', (c) => c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`))); }); }
async function synth(client, model, voice, input, attempts = 3) {
  let last; for (let n = 1; n <= attempts; n++) { try {
    const r = await client.interactions.create({ model, input, response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice }] } });
    const data = r.output_audio?.data; if (!data) throw new Error('TTS returned no audio data'); return Buffer.from(data, 'base64');
  } catch (e) { last = e; console.warn(`attempt ${n}/${attempts} failed: ${e?.message ?? e}`); if (n < attempts) await new Promise((r) => setTimeout(r, 1500 * n)); } } throw last;
}

loadEnv();
const episodeId = (process.argv[2] || '').toUpperCase();
if (!/^EP\d{3}$/.test(episodeId)) throw new Error('Usage: npm run episode:generate-audio -- EP002');
const root = path.join(ROOT, 'episodes', episodeId); const mf = path.join(root, 'manifest.json');
if (!fs.existsSync(mf)) throw new Error(`${episodeId} not found.`);
const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
if (m.audio?.ttsApproval !== 'APPROVED') throw new Error('TTS script approval is required before synthesis.');
const scriptFile = path.join(root, m.audio.ttsScript || '04-audio/scripts/TTS_SCRIPT.md');
if (!fs.existsSync(scriptFile)) throw new Error('TTS script missing.');
const key = process.env.GEMINI_API_KEY?.trim(); if (!key) throw new Error('GEMINI_API_KEY missing.');
const model = process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-3.1-flash-tts-preview';
const voice = process.env.SABRA_TTS_VOICE?.trim() || 'Gacrux';
const text = fs.readFileSync(scriptFile, 'utf8');
const marker = '## Pronunciation Review'; const spoken = text.includes(marker) ? text.slice(0, text.indexOf(marker)) : text;
const cleaned = spoken.replace(/^#.*$/gm, '').replace(/^Status:.*$/gmi, '').replace(/^##.*$/gm, '').trim();
if (!cleaned) throw new Error('No spoken TTS content found.');
const rawDir = path.join(root, '04-audio/raw'); const approvedDir = path.join(root, '04-audio/approved'); fs.mkdirSync(rawDir, { recursive: true }); fs.mkdirSync(approvedDir, { recursive: true });
const client = new GoogleGenAI({ apiKey: key });
const direction = `Speak ONLY the Arabic transcript after TRANSCRIPT. Character: Sabra, a mature Egyptian woman. Warm, grounded, confident, lived-in and naturally witty. Never announcer-like, childish, theatrical or cartoonish. Use natural Egyptian colloquial Arabic. Preserve punctuation-driven pauses and all intentional selective diacritics. Pronounce proper names, numbers, abbreviations and foreign/Arabized terms exactly as represented in the TTS script. Do not add, omit, translate or paraphrase words.`;
console.log(`${episodeId} — TTS SYNTHESIS | ${model} | voice ${voice}`);
const pcm = await synth(client, model, voice, `${direction}\nTRANSCRIPT:\n${cleaned}`);
const raw = path.join(rawDir, `${episodeId}-voice-raw.wav`); const review = path.join(rawDir, `${episodeId}-voice-review.wav`);
fs.writeFileSync(raw, wavFromPcm(pcm));
await ffmpeg(['-y', '-i', raw, '-c:a', 'pcm_s16le', review]);
m.audio = { ...m.audio, provider: 'gemini', model, voice, synthesis: 'REVIEW_READY', rawMaster: `04-audio/raw/${episodeId}-voice-raw.wav`, reviewMaster: `04-audio/raw/${episodeId}-voice-review.wav`, qc: 'PENDING' };
m.stages.audio = 'QC_REQUIRED'; m.status = 'AUDIO_QC_REQUIRED'; m.updatedAt = new Date().toISOString(); writeJson(mf, m);
console.log('✓ Audio generated'); console.log('STOPPED — AUDIO QC REQUIRED'); console.log(`Review: ${review}`);
