# Media Factory — User Manual

**Repository:** `alnaga-dotcom/ai-video-factory`  
**Working branch:** `build/factory-v1`  
**Authoritative Sabra workspace:** `A:\Media Factory\Sabra World`

## 1. Purpose

Media Factory is the production system for creating repeatable AI-video episodes while preserving character Canon, visual continuity, approved audio, production quality, cost control, and publication safety.

For Sabra World, the operator should work only from:

```text
A:\Media Factory\Sabra World
```

Do not use old or legacy Sabra folders as active production workspaces.

## 2. Media Factory layout

```text
A:\Media Factory\
├── Factory Core\
├── Sabra World\
└── Wasla\
```

`Factory Core` contains shared factory concepts/components. `Sabra World` is the active Sabra production workspace. `Wasla` is a separate world/project and must not be mixed with Sabra assets.

Inside Sabra World, the principal areas are:

```text
brand/          Brand identity and approved brand media
characters/     Character Canon, references and legacy character material
data/           Factory/world metadata
 distribution/  Distribution-related material
 docs/           Operating and technical documentation
 episodes/       Episode source/work assets
 masters/        Approved reusable masters
 scripts/        Factory/operator automation scripts
 src/            Factory source code
 test/           Tests
 work/           Temporary/production work material
 archive/        Preserved historical/legacy assets
```

Generated dependencies and build output such as `node_modules/` and `dist/` are not Canon/source assets.

## 3. Starting work

Open PowerShell and enter the authoritative workspace:

```powershell
cd "A:\Media Factory\Sabra World"
```

Check repository state before important production work:

```powershell
git status --short
git branch --show-current
```

The expected branch is:

```text
build/factory-v1
```

A clean `git status --short` produces no output.

To verify the TypeScript factory:

```powershell
npm run build
```

A successful build returns without a TypeScript error. The current build produces the `dist` tree.

## 4. Creating an episode

The intended operator request is simple. Example:

```text
EP002 (Sabra in Giza)
```

The episode creation script is:

```powershell
node .\scripts\create-episode.mjs "EP002 (Sabra in Giza)"
```

The operator should not have to manually reproduce the production pipeline scene by scene. Once an episode is initiated, automation should continue until the first mandatory human review gate.

## 5. Standard episode flow

The factory follows this state flow:

```text
IDEA
  ↓
STORY
  ↓
SCENES
  ↓
SCENE IMAGES
  ↓
HUMAN GATE 01 — IMAGE REVIEW
  ↓ APPROVE
AUDIO
  ↓
CLIPS
  ↓
ASSEMBLY
  ↓
FINAL QC
  ↓
HUMAN GATE 02 — PUBLISH AUTHORIZATION
  ↓ APPROVE / PUBLISH
PUBLISH
```

### Idea

The episode concept is locked. The system must preserve the requested premise rather than drifting into an unrelated story.

### Story

The system creates the complete episode story, including hook, progression, payoff, and an ending or next-episode hook where appropriate.

### Scenes

The story is divided into production scenes. Each scene should define the required characters, location, action, dialogue/narration, timing, image requirements, audio requirements, video requirements, and whether lip-sync is required.

### Scene images

All required scene masters are prepared before downstream paid video production.

### Human Gate 01 — Image Review

Automation stops only after the complete review set is ready.

The operator may:

- **APPROVE** — lock the images and continue automatically.
- **REJECT** — identify failed scenes; regenerate/fix only those scenes and return to Gate 01.

Do not spend downstream credits using defective or unapproved scene masters.

### Audio

After Gate 01 approval, produce the required dialogue/narration using the approved Canon voice and lock scene timing.

### Clips

Generate clips from approved images/audio. Lip-sync is applied only where required. Model/platform selection should balance quality, Canon fidelity, Arabic lip-sync performance, and cost.

### Assembly

The final episode structure is:

```text
INTRO + EPISODE CARD + SCENE CLIPS + ENDING
```

The assembled episode receives final QC before publication is considered.

### Human Gate 02 — Publish Authorization

Automation stops and asks for explicit publication permission.

**APPROVE / PUBLISH** authorizes publication to configured destinations. **REJECT** sends only the identified failures back for correction and returns the rebuilt episode to Gate 02.

Silence is never publication approval.

## 6. Mandatory visual rule — 16:9

Every episode-production image and video master must be landscape **16:9**, with a target delivery frame of **1920×1080**.

Do not approve square, portrait, vertical, pillarboxed, letterboxed, blurred-fill, or incorrectly cropped assets as production masters.

The ratio requirement must be explicit in every image/video generation instruction. Do not rely on a model's default behavior.

## 7. Strict prompt rule

Production prompts are contracts, not loose creative suggestions.

Every generation instruction should explicitly state:

- what is locked and MUST remain unchanged;
- what is allowed to change;
- landscape 16:9 / 1920×1080 target;
- scene/action requirements;
- camera behavior where applicable;
- duration where applicable;
- audio/lip-sync behavior where applicable;
- prohibited transformations.

The approved reference is the visual source of truth. Preserve character identity, apparent age, facial geometry, proportions, skin tone, hair/headwear, wardrobe, jewelry, distinctive features, environment, props, branding, visible text, lighting, colors, composition, and spatial relationships unless the scene specification explicitly permits a change.

## 8. Character Canon

Current production Canon belongs under `characters/` and approved reusable assets under the appropriate Canon/master areas.

For Sabra, always use the current approved Sabra Canon and references when producing a new episode.

Material under `legacy/` or `archive/` is historical/reference material. Its presence does not make it current Canon. Do not automatically promote a legacy character JSON, prompt, image, or Bible over the active Canon.

Never overwrite an approved Canon/master during experimentation.

## 9. Audio and Arabic lip-sync

Audio should normally be approved before lip-sync/video dialogue work.

The approved voice, dialogue, pronunciation, tempo, processing, and timing are the source of truth. A video generator/editor should not replace the approved voice.

For lip-sync, change only mouth movement and the minimum facial articulation necessary for synchronization. Do not allow lip-sync processing to redesign Sabra, alter age, wardrobe, environment, framing, camera behavior, action, audio, or duration.

Arabic lip-sync quality is a critical platform-selection criterion. A visually attractive result that damages Arabic speech synchronization or recurring-character identity fails QC.

## 10. Cost control

Cost is evaluated against **approved usable seconds**, not generated seconds. Failed generations contribute zero approved seconds.

Use free/included/expiring generation capacity first when it is suitable, particularly for non-speaking shots, experiments, and reusable assets. Reserve expensive generations for shots that genuinely require the platform's unique capability.

When a generation fails, identify the specific failure and change the relevant variable rather than rewriting everything blindly.

Do not scale production spend merely because generation is available. Publishing performance and audience validation should inform further investment.

## 11. EP001

`episodes/EP001` is the completed/reference production material currently preserved in the Factory.

Use EP001 to understand established organization, approved audio handling, generation records, and production behavior. Do not overwrite EP001 assets to create EP002. Every new episode receives its own episode identity and working assets.

Historical variants that were recovered during consolidation are preserved under `archive/` or legacy areas. They are not automatically the active EP001 masters.

## 12. Review discipline

There are two mandatory human gates:

**Gate 01:** complete image-set review before downstream production spend.  
**Gate 02:** final episode review before publishing.

Never skip either gate. Never interpret silence as approval. Never publish without explicit authorization. A failed scene should loop locally; do not restart a complete episode merely because one scene failed.

## 13. Publishing and measurement

Before publication, verify at minimum:

- 16:9 / 1920×1080 delivery;
- Sabra/character continuity;
- reference fidelity;
- audio quality and pronunciation;
- lip-sync where required;
- pacing and cuts;
- absence of generation artifacts;
- text/branding integrity;
- correct intro, episode card, ending, and runtime.

After publication, record useful performance indicators such as views, retention/completion, engagement, shares, profile visits, follower conversion, and production cost.

## 14. Git and safety

Git is the source-control safety layer for the Factory code, documentation, and tracked production material.

Before destructive filesystem operations, verify that required material exists in the authoritative workspace and that important changes are committed/pushed.

Useful checks:

```powershell
git status --short
git fetch origin
$Local  = git rev-parse HEAD
$Remote = git rev-parse origin/build/factory-v1
Write-Host "Clean :" ([string]::IsNullOrWhiteSpace((git status --porcelain)))
Write-Host "Synced:" ($Local -eq $Remote)
```

Do not manually delete, move, rename, or overwrite Factory material when its role is uncertain. Inspect, compare, preserve, verify, commit, and only then remove an obsolete copy.

## 15. Troubleshooting

### `create-episode.mjs` cannot be found

Confirm the working directory:

```powershell
Get-Location
Test-Path ".\scripts\create-episode.mjs"
```

The active workspace is `A:\Media Factory\Sabra World`.

### `tsc` is not recognized

Install dependencies:

```powershell
npm install
npm run build
```

Do not copy an old `node_modules` directory between workspaces.

### Build verification

```powershell
npm run build
Write-Host "dist exists:" (Test-Path ".\dist")
Write-Host "dist files:" ((Get-ChildItem ".\dist" -File -Recurse -Force -ErrorAction SilentlyContinue).Count)
```

### A generated scene is wrong

Do not continue downstream. Determine whether the failure is ratio, Canon identity, composition, wardrobe, environment, action, camera, audio, lip-sync, duration, or another locked requirement. Correct the relevant input/instruction and regenerate only the failed scene.

### Old/legacy material is discovered

Do not overwrite active Canon. Compare the material, determine whether it is already preserved, and retain unique historical assets in an appropriate legacy/archive area until their status is known.

## 16. Operator quick reference

Start:

```powershell
cd "A:\Media Factory\Sabra World"
git status --short
npm run build
```

Create an episode:

```powershell
node .\scripts\create-episode.mjs "EP002 (Sabra in Giza)"
```

Production rule:

```text
IDEA → STORY → SCENES → IMAGES → REVIEW → AUDIO → CLIPS → ASSEMBLY → FINAL REVIEW → PUBLISH
```

Always remember:

```text
16:9 ALWAYS
CANON IS LOCKED
PROMPTS ARE STRICT
NO DOWNSTREAM SPEND BEFORE IMAGE APPROVAL
NO PUBLISHING WITHOUT EXPLICIT AUTHORIZATION
PRESERVE APPROVED MASTERS
FIX FAILED SCENES LOCALLY
```

## 17. Technical companion documents

For implementation-level rules, use:

- `docs/AUTOMATION_CONTRACT.md`
- `docs/FOLDER_STANDARD.md`
- `docs/PRODUCTION_PIPELINE.md`

This User Manual defines the normal operator workflow; the companion documents define the technical production contract and folder/pipeline standards.
