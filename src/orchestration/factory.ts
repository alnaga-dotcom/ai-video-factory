import type { EpisodeSpec, ProductionStatus, ShotSpec } from "../domain/contracts.js";
import type { CharacterRegistry } from "../characters/registry.js";
import type { AssetRecord, AssetRegistry, AssetRole } from "../assets/registry.js";
import type { FactoryModelConfig } from "../config/models.js";
import { selectConfiguredModel } from "../config/models.js";
import { routeShot } from "../routing/model-router.js";
import type { GenerationResult, VideoProvider } from "../providers/video-provider.js";
import { decideRetry, type QaResult } from "../qa/policy.js";

export interface PromptBuilder {
  build(shot: ShotSpec): string;
}

export interface QaEvaluator {
  evaluate(shot: ShotSpec, generation: GenerationResult): Promise<QaResult>;
}

export interface FactoryDependencies {
  characters: CharacterRegistry;
  assets?: AssetRegistry;
  worldId?: string;
  models: FactoryModelConfig;
  providers: Map<string, VideoProvider>;
  prompts: PromptBuilder;
  qa?: QaEvaluator;
}

export interface ProducedShot {
  shot: ShotSpec;
  generation: GenerationResult;
  routeReason: string;
}

export interface ShotAttempt extends ProducedShot {
  attempt: number;
  qa?: QaResult;
  correctiveInstruction?: string;
}

export interface ShotProductionResult {
  shot: ShotSpec;
  status: Extract<ProductionStatus, "approved" | "director-review" | "failed">;
  attempts: ShotAttempt[];
  totalCostCredits: number;
  failedCriteria: string[];
}

export interface ProductionReport {
  episodeId: string;
  status: "approved" | "director-review" | "failed";
  shots: ShotProductionResult[];
  approvedShots: number;
  directorReviewShots: number;
  failedShots: number;
  totalAttempts: number;
  totalCostCredits: number;
}

export interface ProductionOptions {
  maxRetries?: number;
  stopOnFailure?: boolean;
}

function withStatus(shot: ShotSpec, status: ProductionStatus): ShotSpec {
  return { ...shot, status };
}

function appendCorrection(basePrompt: string, correctiveInstruction?: string): string {
  return correctiveInstruction ? `${basePrompt}\n\nCORRECTION:\n${correctiveInstruction}` : basePrompt;
}

function rolesForShot(shot: ShotSpec): AssetRole[] {
  const roles: AssetRole[] = ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME"];
  if (shot.kind === "dialogue" || shot.kind === "reaction" || shot.emotionalIntent) roles.push("EXPRESSION");
  if (shot.kind === "interaction") roles.push("ACTION");
  if (shot.kind === "character" || shot.kind === "establishing") roles.push("PROPORTIONS");
  return [...new Set(roles)];
}

function resolveReferenceAssets(shot: ShotSpec, deps: FactoryDependencies): AssetRecord[] {
  if (!deps.assets || !deps.worldId) return [];
  const roles = rolesForShot(shot);
  return shot.characters.flatMap((characterId) =>
    deps.assets!.resolveReferences({
      worldId: deps.worldId!,
      characterId,
      roles,
      includeSupporting: true,
      maxPerRole: 2,
    }),
  );
}

async function generateShot(
  shot: ShotSpec,
  deps: FactoryDependencies,
  correctiveInstruction?: string,
): Promise<ProducedShot> {
  const route = routeShot(shot);
  const model = selectConfiguredModel(deps.models, route.tier, shot.durationSeconds);
  const provider = deps.providers.get(model.provider);
  if (!provider) throw new Error(`Provider not registered: ${model.provider}`);

  const referenceAssets = resolveReferenceAssets(shot, deps);
  const semanticIds = [...new Set(referenceAssets.map((asset) => asset.id))];
  const referenceAssetIds = semanticIds.length > 0 ? semanticIds : deps.characters.resolveAssets(shot.characters);

  const generation = await provider.generate({
    shot,
    prompt: appendCorrection(deps.prompts.build(shot), correctiveInstruction),
    modelTier: route.tier,
    referenceAssetIds,
    ...(referenceAssets.length > 0 ? { referenceAssets } : {}),
  });

  return { shot, generation, routeReason: route.reason };
}

export async function produceShot(shot: ShotSpec, deps: FactoryDependencies): Promise<ProducedShot> {
  return generateShot(withStatus(shot, "generating"), deps);
}

export async function produceShotWithQa(
  shot: ShotSpec,
  deps: FactoryDependencies,
  options: ProductionOptions = {},
): Promise<ShotProductionResult> {
  const maxRetries = Math.max(0, options.maxRetries ?? 2);
  const attempts: ShotAttempt[] = [];
  let correctiveInstruction: string | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const attemptStatus: ProductionStatus = attempt === 1 ? "generating" : "retry";
    const generated = await generateShot(withStatus(shot, attemptStatus), deps, correctiveInstruction);
    const qa = deps.qa
      ? await deps.qa.evaluate(withStatus(shot, "qa"), generated.generation)
      : undefined;

    const attemptRecord: ShotAttempt = { ...generated, attempt };
    if (qa !== undefined) attemptRecord.qa = qa;
    if (correctiveInstruction !== undefined) attemptRecord.correctiveInstruction = correctiveInstruction;
    attempts.push(attemptRecord);

    if (!qa) return summarizeShot(shot, "approved", attempts, []);

    const decision = decideRetry(qa);
    if (!decision.retry) return summarizeShot(shot, "approved", attempts, []);

    if (attempt > maxRetries) return summarizeShot(shot, "director-review", attempts, decision.failedCriteria);
    correctiveInstruction = decision.correctiveInstruction;
  }

  return summarizeShot(shot, "failed", attempts, ["unknown"]);
}

function summarizeShot(
  shot: ShotSpec,
  status: ShotProductionResult["status"],
  attempts: ShotAttempt[],
  failedCriteria: readonly string[],
): ShotProductionResult {
  return {
    shot: withStatus(shot, status),
    status,
    attempts,
    totalCostCredits: attempts.reduce((sum, item) => sum + (item.generation.costCredits ?? 0), 0),
    failedCriteria: [...failedCriteria],
  };
}

export async function produceEpisode(
  episode: EpisodeSpec,
  deps: FactoryDependencies,
  options: ProductionOptions = {},
): Promise<ProductionReport> {
  const shots: ShotProductionResult[] = [];

  for (const scene of episode.scenes) {
    for (const shot of scene.shots) {
      try {
        const result = await produceShotWithQa(shot, deps, options);
        shots.push(result);
        if (options.stopOnFailure && result.status !== "approved") return summarizeEpisode(episode.id, shots);
      } catch {
        shots.push({
          shot: withStatus(shot, "failed"),
          status: "failed",
          attempts: [],
          totalCostCredits: 0,
          failedCriteria: ["generation-error"],
        });
        if (options.stopOnFailure) return summarizeEpisode(episode.id, shots);
      }
    }
  }

  return summarizeEpisode(episode.id, shots);
}

function summarizeEpisode(episodeId: string, shots: ShotProductionResult[]): ProductionReport {
  const approvedShots = shots.filter((shot) => shot.status === "approved").length;
  const directorReviewShots = shots.filter((shot) => shot.status === "director-review").length;
  const failedShots = shots.filter((shot) => shot.status === "failed").length;
  const status = failedShots > 0 ? "failed" : directorReviewShots > 0 ? "director-review" : "approved";

  return {
    episodeId,
    status,
    shots,
    approvedShots,
    directorReviewShots,
    failedShots,
    totalAttempts: shots.reduce((sum, shot) => sum + shot.attempts.length, 0),
    totalCostCredits: shots.reduce((sum, shot) => sum + shot.totalCostCredits, 0),
  };
}
