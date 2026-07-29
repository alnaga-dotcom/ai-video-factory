import { GoogleGenAI } from "@google/genai";
import type { AssetRecord } from "../assets/registry.js";
import { selectVeoReferences } from "./veo-reference-selector.js";
import type { GenerationRequest, GenerationResult, VideoProvider } from "./video-provider.js";

export interface VeoProviderOptions {
  apiKey: string;
  model?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface VeoPreparedRequest {
  model: string;
  prompt: string;
  config: Record<string, unknown>;
  selectedReferences: AssetRecord[];
}

export class VeoSafetyFilteredError extends Error {
  readonly code = "SAFETY_FILTERED";
  readonly reasons: string[];
  constructor(reasons: string[]) {
    super(`Veo generation safety-filtered${reasons.length ? `: ${reasons.join(" | ")}` : ""}`);
    this.name = "VeoSafetyFilteredError";
    this.reasons = reasons;
  }
}

export class VeoVideoProvider implements VideoProvider {
  readonly name = "veo";
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(options: VeoProviderOptions) {
    if (!options.apiKey.trim()) throw new Error("Gemini API key is required");
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model ?? "veo-3.1-generate-preview";
    this.pollIntervalMs = options.pollIntervalMs ?? 10_000;
    this.timeoutMs = options.timeoutMs ?? 15 * 60_000;
  }

  async prepare(request: GenerationRequest): Promise<VeoPreparedRequest> {
    const selectedReferences = selectVeoReferences(request.referenceAssets ?? []);
    if (request.referenceAssetIds.length > 0 && selectedReferences.length === 0) throw new Error("Veo received reference asset IDs without transportable CANON image records");
    if (selectedReferences.length > 0 && request.shot.durationSeconds !== 8) throw new Error("Veo 3.1 reference-image generation requires an 8-second shot");
    const referenceImages = await Promise.all(selectedReferences.map(toSdkReferenceImage));
    return { model: this.model, prompt: request.prompt, selectedReferences, config: { aspectRatio: "16:9", resolution: "720p", durationSeconds: request.shot.durationSeconds, numberOfVideos: 1, ...(referenceImages.length > 0 ? { referenceImages } : {}) } };
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const prepared = await this.prepare(request);
    let operation = await this.ai.models.generateVideos({ model: prepared.model, prompt: prepared.prompt, config: prepared.config } as any);
    const started = Date.now();
    while (!operation.done) {
      if (Date.now() - started >= this.timeoutMs) throw new Error(`Veo generation timed out after ${this.timeoutMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
      operation = await this.ai.operations.getVideosOperation({ operation });
    }
    if (operation.error) throw new Error(`Veo generation failed: ${JSON.stringify(operation.error)}`);
    const response = operation.response as any;
    const filteredCount = Number(response?.raiMediaFilteredCount ?? 0);
    const filteredReasons = Array.isArray(response?.raiMediaFilteredReasons) ? response.raiMediaFilteredReasons.filter((value: unknown): value is string => typeof value === "string") : [];
    if (filteredCount > 0 || filteredReasons.length > 0) throw new VeoSafetyFilteredError(filteredReasons);
    const uri = response?.generatedVideos?.[0]?.video?.uri;
    if (typeof uri !== "string" || !uri) throw new Error(`Veo completed without a generated video URI. Final operation: ${JSON.stringify(operation)}`);
    return { provider: this.name, model: this.model, assetId: uri, durationSeconds: request.shot.durationSeconds };
  }
}

async function toSdkReferenceImage(asset: AssetRecord): Promise<unknown> {
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`Unable to fetch reference asset ${asset.id}: HTTP ${response.status}`);
  const mimeType = response.headers.get("content-type")?.split(";")[0] || mimeFromUri(asset.uri);
  if (!mimeType.startsWith("image/")) throw new Error(`Reference asset ${asset.id} is not an image: ${mimeType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { image: { imageBytes: bytes.toString("base64"), mimeType }, referenceType: "asset" };
}

function mimeFromUri(uri: string): string {
  const clean = uri.toLowerCase().split("?", 1)[0] ?? uri.toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  return "image/png";
}
