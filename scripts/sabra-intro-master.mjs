import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { BunnyStorageProvider } from "../dist/storage/bunny-storage-provider.js";

const VIDEO = "https://AIVF.b-cdn.net/worlds/sabra-world/brand/intro/candidates/2026-07-29T20-12-34-428Z-3467cf9c759d.mp4";
const root = resolve("staging/sabra-world/brand");
const work = resolve(".tmp/sabra-intro-master");
const output = resolve(work, "sabra-world-intro-v1-master.mp4");

async function loadEnv(path = ".env") { const text = await readFile(path, "utf8"); for (const raw of text.split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith("#")) continue; const i = line.indexOf("="); if (i < 1) continue; const key = line.slice(0,i).trim(); let value = line.slice(i+1).trim(); if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1,-1); if (!(key in process.env)) process.env[key] = value; } }
function required(name) { const value = process.env[name]?.trim(); if (!value) throw new Error(`Missing ${name} in .env`); return value; }
function run(command, args) { return new Promise((ok, fail) => { const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" }); child.on("error", fail); child.on("exit", code => code === 0 ? ok() : fail(new Error(`${command} exited ${code}`))); }); }

await loadEnv();
await rm(work, { recursive: true, force: true }); await mkdir(work, { recursive: true });
for (const file of ["logo.png","intro-music.m4a","sabra-laugh.m4a"]) await readFile(resolve(root,file));
const response = await fetch(VIDEO); if (!response.ok) throw new Error(`Unable to download approved intro: HTTP ${response.status}`);
const inputVideo = resolve(work,"approved-intro.mp4"); await writeFile(inputVideo, new Uint8Array(await response.arrayBuffer()));
console.log("SABRA WORLD INTRO v1 — MASTERING APPROVED VISUAL");
console.log("NO VEO GENERATION — generation spend $0");
const filter = "[1:v]scale=260:-1[logo];[0:v][logo]overlay=W-w-32:32:enable='between(t,5.5,8)'[v];[2:a]atrim=0:8,asetpts=PTS-STARTPTS,volume=0.82[music];[3:a]atrim=0:2.2,asetpts=PTS-STARTPTS,adelay=3600|3600,volume=0.58[laugh];[music][laugh]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]";
await run("ffmpeg", ["-y","-i",inputVideo,"-i",resolve(root,"logo.png"),"-i",resolve(root,"intro-music.m4a"),"-i",resolve(root,"sabra-laugh.m4a"),"-filter_complex",filter,"-map","[v]","-map","[a]","-t","8","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart",output]);
const body = new Uint8Array(await readFile(output)); const sha256 = createHash("sha256").update(body).digest("hex");
const storageHost = process.env.BUNNY_STORAGE_HOST?.trim(); const storage = new BunnyStorageProvider({ storageZone: required("BUNNY_STORAGE_ZONE"), accessKey: required("BUNNY_STORAGE_ACCESS_KEY"), cdnBaseUrl: required("BUNNY_CDN_BASE_URL"), ...(storageHost ? { storageHost } : {}) });
const key = `worlds/sabra-world/brand/intro/masters/${sha256.slice(0,12)}-sabra-world-intro-v1.mp4`; const stored = await storage.upload({ key, body, contentType: "video/mp4" });
const record = { id: `sabra-world-intro-v1-master-${sha256.slice(0,12)}`, worldId: "sabra-world", kind: "video", role: "INTRO_MASTER", status: "CANON", version: "1.0.0", uri: stored.uri, sha256, durationSeconds: 8, sourceVideo: VIDEO, mastering: { logo: "logo.png", music: "intro-music.m4a", laugh: "sabra-laugh.m4a" }, approvedByPolicy: "standing-green-card", generatedAt: new Date().toISOString() };
await mkdir("data/worlds/sabra-world/generated", { recursive: true }); const recordPath = `data/worlds/sabra-world/generated/${record.id}.json`; await writeFile(recordPath, `${JSON.stringify(record,null,2)}\n`, "utf8");
console.log("INTRO MASTER PASS"); console.log(`VIDEO ${stored.uri}`); console.log(`SHA256 ${sha256}`); console.log(`ASSET RECORD ${recordPath}`); console.log("STATUS CANON");
