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
  body: unknown;
  selectedReferences: AssetRecord[];
}

export class VeoVideoProvider implements VideoProvider {
  readonly name = "veo";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(options: VeoProviderOptions) {
    if (!options.apiKey.trim()) throw new Error("Gemini API key is required");
    this.apiKey = options.apiKey;
    this.model = options.model ?? "veo-3.1-generate-preview";
    this.pollIntervalMs = options.pollIntervalMs ?? 10_000;
    this.timeoutMs = options.timeoutMs ?? 15 * 60_000;
  }

  async prepare(request: GenerationRequest): Promise<VeoPreparedRequest> {
    const selectedReferences = selectVeoReferences(request.referenceAssets ?? []);
    if (request.referenceAssetIds.length > 0 && selectedReferences.length === 0) {
      throw new Error("Veo received reference asset IDs without transportable CANON image records");
    }
    if (selectedReferences.length > 0 && request.shot.durationSeconds !== 8) {
      throw new Error("Veo 3.1 reference-image generation requires an 8-second shot");
    }
    if (selectedReferences.length > 0 && this.model.includes("fast")) {
      throw new Error("Veo Fast is not used for CANON reference-image generation");
    }

    const referenceImages = await Promise.all(selectedReferences.map(toVeoReferenceImage));
    const instance: Record<string, unknown> = { prompt: request.prompt };
    if (referenceImages.length > 0) instance.referenceImages = referenceImages;

    return {
      model: this.model,
      selectedReferences,
      body: {
        instances: [instance],
        parameters: {
          aspectRatio: "16:9",
          resolution: "720p",
          durationSeconds: request.shot.durationSeconds,
          numberOfVideos: 1,
          personGeneration: "allow_adult",
        },
      },
    };
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const prepared = await this.prepare(request);
    const operation = await this.postJson(`/models/${prepared.model}:predictLongRunning`, prepared.body);

    if (typeof operation.name !== "string" || !operation.name) throw new Error("Veo did not return an operation name");
    const completed = await this.waitForOperation(operation.name);
    const sample = completed?.response?.generateVideoResponse?.generatedSamples?.[0];
    const uri = sample?.video?.uri;
    if (typeof uri !== "string" || !uri) {
      throw new Error(`Veo completed without a generated video URI. Final operation: ${JSON.stringify(completed)}`);
    }

    return {
      provider: this.name,
      model: this.model,
      assetId: uri,
      durationSeconds: request.shot.durationSeconds,
    };
  }

  private async waitForOperation(name: string): Promise<any> {
    const started = Date.now();
    while (Date.now() - started < this.timeoutMs) {
      const operation = await this.getJson(`/${name}`);
      if (operation.done === true) {
        if (operation.error) throw new Error(`Veo generation failed: ${JSON.stringify(operation.error)}`);
        return operation;
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
    throw new Error(`Veo generation timed out after ${this.timeoutMs}ms`);
  }

  private async postJson(path: string, body: unknown): Promise<any> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify(body),
    });
    return parseResponse(response);
  }

  private async getJson(path: string): Promise<any> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta${path}`, {
      headers: { "x-goog-api-key": this.apiKey },
    });
    return parseResponse(response);
  }
}

async function toVeoReferenceImage(asset: AssetRecord): Promise<unknown> {
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`Unable to fetch reference asset ${asset.id}: HTTP ${response.status}`);
  const mimeType = response.headers.get("content-type")?.split(";")[0] || mimeFromUri(asset.uri);
  if (!mimeType.startsWith("image/")) throw new Error(`Reference asset ${asset.id} is not an image: ${mimeType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    image: {
      inlineData: {
        mimeType,
        data: bytes.toString("base64"),
      },
    },
    referenceType: "asset",
  };
}

function mimeFromUri(uri: string): string {
  const clean = uri.toLowerCase().split("?", 1)[0] ?? uri.toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  return "image/png";
}

async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  let payload: any;
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  if (!response.ok) throw new Error(`Gemini API ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}
