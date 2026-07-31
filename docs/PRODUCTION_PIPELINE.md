# AI Video Factory — Production Pipeline v2

## Purpose
A repeatable, cost-aware production pipeline for Sabra World and future AI-video projects. The factory owns Canon, audio, prompts, QC, routing, cost control, and reproducibility. Editing/generation services are execution tools, not sources of truth.

## Core principle

**Use the cheapest production mode that fully satisfies each shot.** Do not generate video merely because video generation is available.

Each shot is routed independently to one of four modes:

- `STILL` — approved static 16:9 visual; no video-generation credits.
- `MOTION_STILL` — approved still with editor-created pan/zoom/reframe/transition motion; no video-generation credits.
- `VIDEO` — temporal generation when physical action or genuine movement is required.
- `VIDEO_LIPSYNC` — video path for visible synchronized speech; premium fidelity path by default.

Each shot also has a timing driver:

- `AUDIO` — narration/dialogue determines duration and edit rhythm.
- `ACTION` — physical action determines duration.
- `FIXED` — predetermined duration, useful for cards, transitions and similar shots.

Audio-first is a supported strategy, not a universal rule. Storytelling may be mostly STILL/MOTION_STILL; cooking and action content may require VIDEO; mixed episodes should use a hybrid scene-by-scene plan.

## Hard production rules

1. **16:9 is mandatory for episode-production images and video.** Target delivery frame: **1920×1080 landscape**. Do not accept square, portrait, pillarboxed, letterboxed, blurred-fill, or vertical compositions as production masters.
2. **Reference fidelity is mandatory.** A supplied Canon reference is the visual source of truth. Preserve identity, apparent age, facial geometry, body proportions, skin tone, hair/headwear, clothing, jewelry, distinctive features, environment, props, branding, visible text, lighting, colors, composition, and spatial relationships unless a scene specification explicitly authorizes a change.
3. **Prompts are strict contracts.** Every production prompt must state what MUST remain locked, what MAY change, output ratio, duration, camera behavior, action, audio behavior, and prohibited transformations.
4. **Audio is produced before lip-sync.** Canon voice, approved dialogue, tempo, processing, and target duration are finalized outside the video generator whenever practical. Audio-driven scenes use the approved audio master to determine visual coverage.
5. **QC is a gate.** Do not spend credits on the next stage using a defective upstream asset.
6. **Masters are immutable.** Keep Canon/reference, raw, approved, and delivery assets distinct. Never overwrite an approved master during experimentation.
7. **One variable per retry.** When a generation fails QC, identify the failure and change only the relevant input/instruction.
8. **Cost is measured per approved second, not generated second.** Failed generations produce zero approved seconds.
9. **No unnecessary video generation.** STILL and MOTION_STILL shots must not invoke a paid video provider.
10. **Escalate locally.** If a still-based shot proves insufficient, escalate that shot only to VIDEO or VIDEO_LIPSYNC; do not convert the whole episode to animation.

## Pipeline v2

### 0 — Episode specification
Lock story/format, dialogue, scene order, target runtime, required characters, locations, and delivery format.

### 1 — Canon
Select approved character and environment references. Do not proceed with ambiguous character identity.

### 2 — Scene breakdown and requirements
For each scene/shot define action, characters, dialogue/narration, visual requirement, timing target, continuity, and whether visible synchronized speech is actually required.

### 3 — Production Mode Router
Classify every shot as `STILL`, `MOTION_STILL`, `VIDEO`, or `VIDEO_LIPSYNC`, plus timing driver `AUDIO`, `ACTION`, or `FIXED`.

Default toward the least expensive valid path. Dialogue does not automatically imply lip-sync: narration or off-camera speech can run over still imagery. Physical interaction/action generally requires temporal motion. Explicit visible synchronized dialogue requires `VIDEO_LIPSYNC`.

### 4 — Audio and visual asset plan
For audio-driven scenes, produce/lock dialogue or narration early enough to determine visual coverage and timing. For action-driven scenes, action blocking may determine timing first. Plan only the assets needed for the selected production modes.

### 5 — 16:9 visual masters
Create or approve the complete visual review set. Character Canon may inform each scene, but every production master must pass ratio, identity, composition, and continuity QC.

## HUMAN GATE 01 — VISUAL REVIEW
Automation stops after the complete review set is ready.

- `APPROVE` — lock approved visuals and continue.
- `REJECT` — regenerate/fix only rejected scenes/shots and return to Gate 01.

Do not spend downstream video-generation credits using defective or unapproved visual masters.

### 6 — Mode-specific production

#### STILL
Use the approved visual master directly for the required duration. Audio, music and SFX may continue across the shot.

#### MOTION_STILL
Create editorial movement from the approved still: slow push, pull, pan, crop/reframe, transition, or other non-generative motion that preserves the master. Do not invoke a video generator.

#### VIDEO
Generate temporal motion only because the scene requires it: cooking actions, walking, object interaction, physical comedy, reactions that require motion, or other action-dependent content. Route to the economical suitable model unless fidelity requirements demand premium generation.

#### VIDEO_LIPSYNC
Use approved audio as the voice/timing source. Preserve identity and scene continuity. Lip-sync may modify only mouth movement and minimal supporting facial articulation required for natural synchronization.

### 7 — Assembly
Assemble approved outputs in story order. A mixed episode may freely combine stills, motion-stills, generated video, and lip-synced video. Visuals may cross audio boundaries when useful; do not cut strong dialogue merely to match a generated clip boundary.

Episode structure normally includes:

`INTRO + EPISODE CARD + STORY/SCENE OUTPUTS + ENDING`

### 8 — Final QC
Check 16:9/1920×1080 delivery, character continuity, reference fidelity, audio quality, pronunciation, lip-sync where required, pacing, cuts, artifacts, text/branding integrity, ending, runtime, and whether any expensive generation could have been avoided without harming quality.

## HUMAN GATE 02 — FINAL REVIEW / PUBLISH AUTHORIZATION
Automation stops and requests explicit publication authorization.

- `APPROVE / PUBLISH` — publish to configured destinations.
- `REJECT` — fix only identified failures, rebuild, and return to Gate 02.

Silence is never approval.

### 9 — Publish and measure
Record views, retention/completion, engagement, shares, profile visits, follower conversion, production mode mix, generated-video seconds, approved seconds, and production cost. Scale spend only after audience validation.

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

## Content examples

### Children's storytelling
Typically `AUDIO` timing with mostly `STILL` / `MOTION_STILL`. Use VIDEO only for moments where motion materially improves storytelling; use VIDEO_LIPSYNC only when Sabra must visibly speak.

### Cooking
Typically hybrid. Ingredient cards, recipe text, beauty shots and some explanations may use STILL/MOTION_STILL. Pouring, cutting, stirring, serving, hand/object interaction and food transformation generally require VIDEO. Visible synchronized speech uses VIDEO_LIPSYNC only when necessary.

### Travel / daily life / comedy
Route shot by shot. Narration may cover economical visuals; reserve generated motion for arrivals, walking, interactions, reactions, physical comedy and high-value cinematic moments.

## Current platform strategy

- Use free/included/expiring capacity first when suitable.
- Reserve expensive generations for shots that genuinely require the platform's capability.
- Arabic lip-sync remains a critical model-selection criterion.
- A model that produces attractive motion but changes the recurring character fails production QC.
- Maintain a model ledger: platform/model, date, scene, production mode, credits, duration, prompt/reference, result, PASS/FAIL, failure reason, and approved seconds.
