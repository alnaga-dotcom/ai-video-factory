import type { GenerationRequest, GenerationResult, VideoProvider } from "./video-provider.js";

export interface VeoProviderOptions {
  apiKey: string;
  model?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
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

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    // The semantic reference resolver may return more assets than Veo accepts.
    // Reference-image transport is added separately; never silently discard identity refs here.
    if (request.referenceAssetIds.length > 0) {
      throw new Error("Veo reference image transport is not configured yet; refusing identity-unsafe generation");
    }

    const operation = await this.postJson(`/models/${this.model}:predictLongRunning`, {
      instances: [{ prompt: request.prompt }],
      parameters: {
        aspectRatio: "16:9",
        numberOfVideos: 1,
        resolution: "720p",
      },
    });

    if (typeof operation.name !== "string" || !operation.name) throw new Error("Veo did not return an operation name");
    const completed = await this.waitForOperation(operation.name);
    const sample = completed?.response?.generateVideoResponse?.generatedSamples?.[0];
    const uri = sample?.video?.uri;
    if (typeof uri !== "string" || !uri) throw new Error("Veo completed without a generated video URI");

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

async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  let payload: any;
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  if (!response.ok) throw new Error(`Gemini API ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}
