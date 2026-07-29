import type { EpisodeSpec } from "../src/domain/contracts.js";

export const ep01: EpisodeSpec = {
  id: "EP01",
  title: "Sabra — Kitchen Test",
  language: "ar-EG",
  scenes: [
    {
      id: "scene-kitchen",
      location: "Sabra family home kitchen, Giza village, Egypt",
      shots: [
        {
          id: "shot-3",
          sceneId: "scene-kitchen",
          kind: "character",
          durationSeconds: 6,
          characters: ["sabra"],
          action: "Sabra is naturally present in the kitchen, warm and attractive, without a gloomy expression.",
          emotionalIntent: "warm, relaxed grandmother presence",
          status: "planned",
        },
        {
          id: "shot-4",
          sceneId: "scene-kitchen",
          kind: "interaction",
          durationSeconds: 6,
          characters: ["sabra", "hamada"],
          action: "Hamada walks into the kitchen and visibly acknowledges Sabra rather than walking past her.",
          emotionalIntent: "familiar family connection",
          eyeContactTarget: "Sabra",
          continuityFrom: "shot-3",
          status: "planned",
        },
      ],
    },
  ],
};
