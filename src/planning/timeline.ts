export interface TimelineInput {
  targetSeconds: number;
  introSeconds?: number;
  titleCardSeconds?: number;
}

type TimelineSegment = {
  kind: "intro" | "title-card" | "generated-story";
  durationSeconds: number;
  generationRequired: boolean;
};

export interface TimelinePlan {
  targetSeconds: number;
  introSeconds: number;
  titleCardSeconds: number;
  generatedStorySeconds: number;
  reusableSeconds: number;
  segments: TimelineSegment[];
}

export function planTimeline(input: TimelineInput): TimelinePlan {
  const targetSeconds = input.targetSeconds;
  const introSeconds = input.introSeconds ?? 8;
  const titleCardSeconds = input.titleCardSeconds ?? 2;
  if (targetSeconds <= 0) throw new Error("targetSeconds must be positive");
  if (introSeconds < 0 || titleCardSeconds < 0) throw new Error("timeline segment durations cannot be negative");
  const reusableSeconds = introSeconds + titleCardSeconds;
  if (reusableSeconds >= targetSeconds) throw new Error("reusable timeline segments must leave time for generated story content");
  const generatedStorySeconds = targetSeconds - reusableSeconds;
  const segments: TimelineSegment[] = [
    { kind: "intro", durationSeconds: introSeconds, generationRequired: false },
    { kind: "title-card", durationSeconds: titleCardSeconds, generationRequired: false },
    { kind: "generated-story", durationSeconds: generatedStorySeconds, generationRequired: true },
  ].filter((segment) => segment.durationSeconds > 0);
  return { targetSeconds, introSeconds, titleCardSeconds, generatedStorySeconds, reusableSeconds, segments };
}
