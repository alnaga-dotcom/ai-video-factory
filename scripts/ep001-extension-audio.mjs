import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { GoogleGenAI } from "@google/genai";

async function loadEnv(path = ".env") {
  const text = await readFile(path, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function wavFromPcm(pcm, sampleRate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  const blockAlign = (channels * bits) / 8;
  const byteRate = sampleRate * blockAlign;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function generate(client, input, attempts = 3) {
  let last;
  for (let n = 1; n <= attempts; n++) {
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.1-flash-tts-preview",
        input,
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: "Gacrux" }] },
      });
      const data = interaction.output_audio?.data;
      if (!data) throw new Error("Gemini TTS returned no audio data");
      return Buffer.from(data, "base64");
    } catch (e) {
      last = e;
      console.warn(`  attempt ${n}/${attempts} failed: ${e?.message ?? e}`);
      if (n < attempts) await new Promise((r) => setTimeout(r, 1500 * n));
    }
  }
  throw last;
}

function ffmpeg(args) {
  return new Promise((ok, fail) => {
    const child = spawn("ffmpeg", args, { stdio: "inherit", shell: false });
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)),
    );
  });
}

await loadEnv();
if (!process.env.GEMINI_API_KEY?.trim())
  throw new Error("Missing GEMINI_API_KEY in .env");
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
const out = resolve("staging/sabra-world/episodes/EP001/audio/extension");
await mkdir(out, { recursive: true });

const segments = [
  [
    "13-final-closing-take01",
    "ماكانش معانا حاجة... بس كان معايا ربنا وصابر. واللي حصل في الجيزة؟ دي بقى حكاية تانية... مستنياكم الحلقة الجاية!"
  ],
];const direction = `Speak ONLY the Arabic transcript after TRANSCRIPT.
Character: Sabra, a mature Egyptian woman. Warm, grounded, confident, lived-in, naturally witty. Never announcer-like, childish, theatrical, or cartoonish.
Language and accent: natural Egyptian colloquial Arabic. Sabra was born in Upper Egypt but now lives in villages south of Giza; do not use a full Sa'idi dialect and do not drift into formal MSA.
Performance profile: STORY_ENERGETIC. Conversational and intimate but lively, with forward momentum, shorter pauses, clear articulation, warmth and restrained humor. The intended production tempo is energetic; do not rush pronunciation. Keep صابرة and صابر clearly distinct. Say تمنتاشر naturally in Egyptian Arabic. Emotional beats should feel spontaneous, especially يا ساتر يا رب and the closing invitation.`;

console.log("SABRA WORLD EP001 — AUDIO PRODUCTION");
console.log("VOICE Gacrux | PROFILE STORY_ENERGETIC | segmented QC workflow");
const processed = [];
for (const [id, text] of segments) {
  console.log(`GENERATING ${id}`);
  const pcm = await generate(client, `${direction}\nTRANSCRIPT:\n${text}`);
  const raw = resolve(out, `${id}-raw.wav`);
  const master = resolve(out, `${id}.wav`);
  await writeFile(raw, wavFromPcm(pcm));
  // Approved workshop profile: two successive +8% tempo stages = 1.1664x. Gain remains a review copy choice, not CANON identity.
  await ffmpeg([
    "-y",
    "-i",
    raw,
    "-filter:a",
    "atempo=1.08,atempo=1.08,volume=1.15",
    master,
  ]);
  processed.push(master);
  console.log(`  SAVED ${master}`);
}

const concatFile = resolve(out, "concat.txt");
await writeFile(
  concatFile,
  processed.map((p) => `file '${p.replaceAll("'", "'\\''")}'`).join("\n") +
    "\n",
  "utf8",
);
const full = resolve(out, "EP001-sabra-voice-review.wav");
await ffmpeg([
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatFile,
  "-c:a",
  "pcm_s16le",
  full,
]);
await writeFile(
  resolve(out, "script.txt"),
  segments.map(([id, text]) => `[${id}]\n${text}`).join("\n\n") + "\n",
  "utf8",
);
console.log("EP001 AUDIO PASS — QC REQUIRED BEFORE VIDEO GENERATION");
console.log(`REVIEW ${full}`);
console.log(
  "If one segment has a pronunciation/performance issue, fix/regenerate that segment rather than the whole episode.",
);
