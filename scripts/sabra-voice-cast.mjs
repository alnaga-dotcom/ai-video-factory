import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function wavFromPcm(pcm, sampleRate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  const blockAlign = channels * bits / 8;
  const byteRate = sampleRate * blockAlign;
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32); header.writeUInt16LE(bits, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function generateWithRetry(client, voice, input, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.1-flash-tts-preview",
        input,
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice }] },
      });
      const data = interaction.output_audio?.data;
      if (!data) throw new Error("Gemini TTS returned no audio data");
      return Buffer.from(data, "base64");
    } catch (error) {
      lastError = error;
      console.warn(`  attempt ${attempt}/${attempts} failed: ${error?.message ?? error}`);
      if (attempt < attempts) await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}

await loadEnv();
if (!process.env.GEMINI_API_KEY?.trim()) throw new Error("Missing GEMINI_API_KEY in .env");
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
const outDir = resolve("staging/sabra-world/audio-workshop/voice-cast-01");
await mkdir(outDir, { recursive: true });

const transcript = `قبل ما نبدأ... خلّيني أعرّفكم بنفسي.
أنا صابرة... بنت الصعيد.
اتولدت واتربيت هناك وسط أهلي وناسي، واتربيت على الأصول، وعلى إن البيت والعيلة هما السند.
ولما بقى عندي تمنتاشر سنة، اتجوزت صابر، وجيت معاه نعيش في قرى جنوب الجيزة.
شربت من مية النيل، وأكلت من خير بلدنا... وعندي الأرض، والبيت، والعيلة الحلوة.
وشُفت أيام حلوة... وأيام تقول: يا ساتر يا رب!
بس الحكايات؟ الحكايات عمرها ما خلصت!`;

const commonDirection = `Synthesize ONLY the spoken transcript below. Do not read these directions aloud.
Audio profile: Sabra is an Egyptian woman in mature middle age, authentic, warm, grounded, confident and naturally witty. She is a real person, not a cartoon character, announcer, presenter, or theatrical caricature.
Accent: natural contemporary Egyptian colloquial Arabic. Her biography begins in Upper Egypt, but DO NOT perform a full Sa'idi accent. Avoid Modern Standard Arabic delivery.
Performance: intimate storytelling to family and neighbors, conversational, emotionally alive, natural pauses, clear pronunciation, moderate pace. Keep صابرة and صابر distinct. Say تمنتاشر naturally in Egyptian Arabic. Let يا ساتر يا رب carry a small amused reaction. The final line should have warmth and a hint of playful promise.
Spoken transcript begins:
${transcript}`;

const candidates = [
  { id: "A", voice: "Gacrux", direction: "Voice emphasis: mature, earthy, reassuring, lived-in warmth." },
  { id: "B", voice: "Sulafat", direction: "Voice emphasis: warm, expressive, sociable, with restrained comic sparkle." },
  { id: "C", voice: "Vindemiatrix", direction: "Voice emphasis: gentle but confident, intimate, clever, emotionally nuanced." },
];

console.log("SABRA AUDIO WORKSHOP 01 — VOICE CASTING");
console.log("MODEL gemini-3.1-flash-tts-preview | 3 candidates | audio only");
for (const candidate of candidates) {
  console.log(`GENERATING ${candidate.id} | ${candidate.voice}`);
  const pcm = await generateWithRetry(client, candidate.voice, `${commonDirection}\n${candidate.direction}`);
  const path = resolve(outDir, `sabra-voice-${candidate.id}-${candidate.voice}.wav`);
  await writeFile(path, wavFromPcm(pcm));
  console.log(`  SAVED ${path}`);
}
await writeFile(resolve(outDir, "audition-script.txt"), `${transcript}\n`, "utf8");
console.log("VOICE CAST PASS — listen to A, B and C before CANON selection");
console.log(`OUTPUT ${outDir}`);
