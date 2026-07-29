import { readFile } from "node:fs/promises";

async function loadEnv(path = ".env") {
  const text = await readFile(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

await loadEnv();
const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY is missing from .env");

const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
  headers: { "x-goog-api-key": apiKey },
});
const text = await response.text();
let payload;
try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
if (!response.ok) throw new Error(`Gemini API ${response.status}: ${JSON.stringify(payload)}`);

const models = Array.isArray(payload.models) ? payload.models : [];
const veoModels = models
  .map((model) => model?.name)
  .filter((name) => typeof name === "string" && name.toLowerCase().includes("veo"));

console.log("GEMINI API CONNECTIVITY PASS");
console.log(`MODELS VISIBLE ${models.length}`);
console.log(`VEO MODELS VISIBLE ${veoModels.length}`);
for (const name of veoModels) console.log(`- ${name}`);
console.log("NO VIDEO GENERATION REQUEST SENT");
