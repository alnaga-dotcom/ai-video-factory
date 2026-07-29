import type { EpisodeSpec, ShotKind, ShotSpec } from "../domain/contracts.js";

export interface IdeaInput {
  id: string;
  title: string;
  idea: string;
  characterId: string;
  location: string;
  timeOfDay?: string;
  targetSeconds?: number;
  language?: "ar-EG";
  format?: "9:16" | "16:9";
}

export interface PlannedProduction {
  input: Required<Pick<IdeaInput, "id" | "title" | "idea" | "characterId" | "location">> & {
    targetSeconds: number;
    language: "ar-EG";
    format: "9:16" | "16:9";
    timeOfDay?: string;
  };
  story: string;
  episode: EpisodeSpec;
}

export function planIdea(input: IdeaInput): PlannedProduction {
  const targetSeconds = Math.max(8, input.targetSeconds ?? 30);
  const shotCount = Math.max(1, Math.ceil(targetSeconds / 8));
  const durations = distributeDuration(targetSeconds, shotCount);
  const sceneId = `${input.id}-scene-01`;
  const shots = durations.map((durationSeconds, index) => buildShot(input, sceneId, index, durationSeconds));

  return {
    input: {
      id: input.id,
      title: input.title,
      idea: input.idea,
      characterId: input.characterId,
      location: input.location,
      ...(input.timeOfDay ? { timeOfDay: input.timeOfDay } : {}),
      targetSeconds,
      language: input.language ?? "ar-EG",
      format: input.format ?? "9:16",
    },
    story: `${input.title}: ${input.idea}`,
    episode: {
      id: input.id,
      title: input.title,
      language: input.language ?? "ar-EG",
      scenes: [{
        id: sceneId,
        location: input.location,
        ...(input.timeOfDay ? { timeOfDay: input.timeOfDay } : {}),
        shots,
      }],
    },
  };
}

function distributeDuration(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  let remainder = total - base * count;
  return Array.from({ length: count }, () => base + (remainder-- > 0 ? 1 : 0));
}

function buildShot(input: IdeaInput, sceneId: string, index: number, durationSeconds: number): ShotSpec {
  const kinds: ShotKind[] = ["establishing", "interaction", "character", "reaction"];
  const kind = kinds[Math.min(index, kinds.length - 1)] ?? "character";
  const actions = [
    `Establish ${input.location} and introduce ${input.characterId} naturally. Story intent: ${input.idea}`,
    `${input.characterId} begins the central action of the idea: ${input.idea}`,
    `${input.characterId} develops the moment with clear natural behavior while preserving continuity. Story intent: ${input.idea}`,
    `${input.characterId} resolves the moment with a readable, understated ending connected to the idea: ${input.idea}`,
  ];
  return {
    id: `shot-${index + 1}`,
    sceneId,
    kind,
    durationSeconds,
    characters: [input.characterId],
    action: actions[Math.min(index, actions.length - 1)] ?? actions[2]!,
    emotionalIntent: index === 0 ? "welcoming and natural" : index === kinds.length - 1 ? "satisfying and understated" : "natural and engaged",
    ...(index > 0 ? { continuityFrom: `shot-${index}` as ShotSpec["id"] } : {}),
    status: "planned",
  };
}
