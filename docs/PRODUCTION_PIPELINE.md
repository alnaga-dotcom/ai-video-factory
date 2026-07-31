# AI Video Factory — Production Pipeline v1

## Purpose
A repeatable production pipeline for Sabra World and future AI-video projects. The factory owns canon, audio, prompts, QC, cost control, and reproducibility. Editing/generation services are execution tools, not sources of truth.

## Hard production rules

1. **16:9 is mandatory for episode-production images and video.** Target delivery frame: **1920×1080 landscape**. Do not accept square, portrait, pillarboxed, letterboxed, blurred-fill, or vertical compositions as production masters.
2. **Reference fidelity is mandatory.** A supplied Canon reference is the visual source of truth. Preserve identity, apparent age, facial geometry, body proportions, skin tone, hair/headwear, clothing, jewelry, distinctive features, environment, props, branding, visible text, lighting, colors, composition, and spatial relationships unless a scene specification explicitly authorizes a change.
3. **Prompts are strict contracts.** Every production prompt must state what MUST remain locked, what MAY change, output ratio, duration, camera behavior, action, audio behavior, and prohibited transformations.
4. **Audio is produced before lip-sync.** Canon voice, approved dialogue, tempo, processing, and target duration are finalized outside the video generator whenever practical. Do not allow a video/editor service to replace the approved voice.
5. **QC is a gate.** Do not spend credits on the next stage using a defective upstream asset.
6. **Masters are immutable.** Keep Canon/reference, raw, approved, and delivery assets distinct. Never overwrite an approved master during experimentation.
7. **One variable per retry.** When a generation fails QC, identify the failure and change only the relevant input/instruction.
8. **Cost is measured per approved second, not generated second.** Failed generations produce zero approved seconds.

## Standard pipeline

### 0 — Episode specification
Lock story, dialogue, scene order, target runtime, required characters, locations, and delivery format.

### 1 — Canon
Select approved character and environment references. Do not proceed with ambiguous character identity.

### 2 — 16:9 scene master
Create or approve a native 16:9 scene reference. Character Canon may inform the scene, but the scene master itself must pass ratio and continuity QC before animation.

### 3 — Audio master
Generate dialogue through the project's Canon voice pipeline. Review pronunciation and performance. Adjust timing only from an approved master; preserve the original master.

### 4 — Scene package
Every generated shot receives four explicit inputs when applicable:
- Canon/reference image
- approved audio file
- scene/action description
- strict production lock

### 5 — Video generation
Prefer included/free/expiring generation capacity for non-speaking shots and experimentation. Generate motion only when lip-sync is not required. Do not ask a model to reinterpret a locked reference.

### 6 — Lip-sync/dialogue
Use the approved WAV as timing and voice source. Lip-sync may modify only the mouth and minimal supporting facial articulation. Reject outputs that change identity, age, wardrobe, environment, framing, duration, or audio.

### 7 — Edit
Assemble approved shots in story order. Visuals may cross audio boundaries when useful; do not cut strong dialogue merely to match a generated clip boundary.

### 8 — Final QC
Check: 16:9/1920×1080 delivery, character continuity, reference fidelity, audio quality, pronunciation, lip-sync, pacing, cuts, artifacts, text/branding integrity, ending, and runtime.

### 9 — Publish and measure
Record views, retention/completion, engagement, shares, profile visits, follower conversion, and production cost. Scale spend only after audience validation.

## Mandatory prompt header

```text
FORMAT LOCK — MANDATORY
Landscape 16:9 composition. Target frame: 1920×1080.
Do NOT output square, portrait, cropped, pillarboxed, letterboxed, blurred-fill, or vertical composition.

REFERENCE LOCK — HIGHEST PRIORITY
The supplied approved reference is the absolute visual source of truth.
Preserve all locked character and scene properties EXACTLY unless the scene specification explicitly authorizes a change.
Do NOT redesign, reinterpret, beautify, rejuvenate, age, restyle, replace, culturally reinterpret, or regenerate locked subjects.
REFERENCE FIDELITY OVERRIDES CREATIVE INTERPRETATION.
```

## Lip-sync lock

```text
LIP-SYNC EDIT ONLY.
Use the supplied video/reference as the visual source of truth and supplied audio as the dialogue/timing source.
Do NOT generate or replace the voice, rewrite dialogue, change speaking speed, or change duration.
Modify only mouth movement and minimal supporting facial articulation required for natural synchronization.
Preserve identity, age, body, wardrobe, accessories, environment, props, text, branding, framing, camera motion, and existing action.
```

## Current platform strategy

- Use expiring/daily generation capacity first for useful production shots and reusable assets.
- Reserve expensive generations for locked shots that need the platform's unique capability.
- Arabic lip-sync remains a critical model-selection criterion.
- A model that produces attractive motion but changes the recurring character fails production QC.
- Maintain a model ledger: platform/model, date, scene, credits, duration, prompt/reference, result, PASS/FAIL, failure reason, and approved seconds.
