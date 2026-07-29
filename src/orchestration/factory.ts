import type { ShotSpec } from "../domain/contracts.js";
import type { CharacterRegistry } from "../characters/registry.js";
import type { FactoryModelConfig } from "../config/models.js";
import { selectConfiguredModel } from "../config/models.js";
import { routeShot } from "../routing/model-router.js";
import type { GenerationResult, VideoProvider } from "../providers/video-provider.js";

export interface PromptBuilder {
  build(shot: ShotSpec): string;
}

export interface FactoryDependencies {
  characters: CharacterRegistry;
  models: FactoryModelConfig;
  providers: Map<string, VideoProvider>;
  prompts: PromptBuilder;
}

export interface ProducedShot {
  shot: ShotSpec;
  generation: GenerationResult;
  routeReason: string;
}

export async function produceShot(shot: ShotSpec, deps: FactoryDependencies): Promise<ProducedShot> {
  const route = routeShot(shot);
  const model = selectConfiguredModel(deps.models, route.tier, shot.durationSeconds);
  const provider = deps.providers.get(model.provider);
  if (!provider) throw new Error(`Provider not registered: ${model.provider}`);

  const generation = await provider.generate({
    shot,
    prompt: deps.prompts.build(shot),
    modelTier: route.tier,
    referenceAssetIds: deps.characters.resolveAssets(shot.characters),
  });

  return { shot, generation, routeReason: route.reason };
}
