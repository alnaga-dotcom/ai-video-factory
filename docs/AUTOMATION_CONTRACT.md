# AI Video Factory — Automation Contract v2

## Input
The operator provides one episode idea.

Example:

`EP002 (Sabra in Giza)`

## Automatic flow

`IDEA -> STORY/FORMAT -> SCENES -> REQUIREMENTS -> MODE ROUTER -> AUDIO/VISUAL PLAN -> VISUAL MASTERS -> GATE 01 -> MODE-SPECIFIC PRODUCTION -> ASSEMBLY -> FINAL QC -> GATE 02 -> PUBLISH`

### 01 Idea
Lock the requested episode concept.

### 02 Story / format
Create the complete story or episode format: hook, progression, payoff, and ending/next hook where appropriate. The content type may be storytelling, cooking, travel, comedy, daily life, educational, or another approved format.

### 03 Scenes
Convert the story/format into story-order scenes and shots. Each shot defines dialogue/narration, action, characters, location, timing target, continuity, visual requirements, audio requirements, and whether visible lip-sync is genuinely required.

### 04 Requirements and Production Mode Router
Route each shot independently to the cheapest valid production path:

- `STILL` — static approved visual; zero video-generation credits.
- `MOTION_STILL` — editorial motion from an approved still; zero video-generation credits.
- `VIDEO` — generated temporal motion where action requires it.
- `VIDEO_LIPSYNC` — generated/synchronized video where visible speech requires it.

Assign timing driver:

- `AUDIO` — narration/dialogue controls timing.
- `ACTION` — physical action controls timing.
- `FIXED` — predetermined duration.

Dialogue alone does not require VIDEO_LIPSYNC. Narration/off-camera speech may use STILL or MOTION_STILL. Physical interaction, cooking actions, walking and other temporally meaningful movement may require VIDEO.

An explicit operator/planner production-mode requirement may override automatic inference when technically valid.

### 05 Audio / visual asset plan
For audio-driven shots, create or lock Canon dialogue/narration early enough to determine duration and visual coverage. For action-driven shots, action blocking may establish timing first. Plan only the assets required by the selected modes.

### 06 Visual masters
Generate/prepare the complete required visual review set before paid video production. Every production visual MUST be native landscape 16:9, target 1920×1080, and pass strict Canon/reference-fidelity rules.

## HUMAN GATE 01 — VISUAL REVIEW
Automation MUST stop here. The operator reviews the complete visual set.

- `APPROVE` — lock visuals and continue automatically.
- `REJECT` — regenerate/fix only rejected scenes/shots, then return to Gate 01.

No paid video-generation job may start from an unapproved visual set.

### 07 Mode-specific production
After Gate 01 approval:

- STILL: use the approved visual directly.
- MOTION_STILL: create editor motion without invoking a video generator.
- VIDEO: generate only the motion required by the action.
- VIDEO_LIPSYNC: use approved Canon audio as timing/voice source and apply lip-sync only where required.

The router MUST NOT invoke a paid video provider for STILL or MOTION_STILL shots.

If a still-based shot is inadequate, escalate that shot only. Do not automatically escalate the episode.

### 08 Assembly
Assemble the episode in story order. Mixed production modes are expected and supported.

Typical structure:

`INTRO + EPISODE CARD + SCENE OUTPUTS + ENDING`

Produce the final 16:9 delivery master.

### 09 Final QC
Verify ratio/delivery, Canon continuity, reference fidelity, audio, pronunciation, lip-sync where required, action continuity, pacing, cuts, artifacts, text/branding, runtime, and production-mode appropriateness.

## HUMAN GATE 02 — FINAL REVIEW / PUBLISH AUTHORIZATION
Automation MUST stop here and request explicit publication authorization.

- `APPROVE / PUBLISH` — publish to configured destinations.
- `REJECT` — fix only identified failures, rebuild final master, return to Gate 02.

## Non-negotiable state rules

- Never skip either human gate.
- Never interpret silence as approval.
- Never publish without explicit authorization.
- Never overwrite Canon or approved masters during retries.
- Failed scenes/shots loop locally; do not restart the entire episode.
- All episode production imagery is 16:9 / 1920×1080 target.
- Every generation prompt uses strict format, Canon, reference, identity, scene, and change-scope locks.
- STILL and MOTION_STILL must consume zero video-generation credits.
- VIDEO is used only when temporal motion materially contributes to the shot.
- VIDEO_LIPSYNC is used only when visible synchronized speech is required.
- Audio-first is preferred for audio-driven storytelling, but action-driven formats such as cooking may establish timing from physical action.
- Cost optimization must never override Canon fidelity, required action clarity, audio quality, or final QC.
