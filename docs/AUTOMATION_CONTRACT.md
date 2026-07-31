# AI Video Factory — Automation Contract v1

## Input
The operator provides one episode idea.

## Automatic flow

`IDEA -> STORY -> SCENES -> SCENE IMAGES -> GATE 01 -> AUDIO -> CLIPS -> ASSEMBLY -> GATE 02 -> PUBLISH`

### 01 Idea
Lock the requested episode concept.

### 02 Story
Create the complete story: hook, progression, payoff, and ending/next hook where appropriate.

### 03 Scenes
Convert the approved story into story-order scenes. Each scene defines dialogue/narration, action, characters, location, timing target, image requirements, audio requirements, video requirements, and lip-sync requirement.

### 04 Scene images
Generate all required scene masters before video production. Every production image MUST be native landscape 16:9, target 1920x1080, and pass strict Canon/reference-fidelity rules.

## HUMAN GATE 01 — IMAGE REVIEW
Automation MUST stop here. The operator reviews the complete image set.

- APPROVE: lock images and continue automatically.
- REJECT: regenerate/fix only rejected scenes, then return to Gate 01.

No paid downstream audio/video job should be started from an unapproved image set.

### 05 Audio
Create required dialogue/narration audio using Canon voices. Produce per-scene approved audio/timing assets.

### 06 Clips
Create video from approved scene images and audio. Apply Arabic lip-sync only where required. Route shots to the most economical suitable model while preserving quality and Canon fidelity.

### 07 Assembly
Assemble the episode in story order and add:

`INTRO + EPISODE CARD + SCENE CLIPS + ENDING`

Produce final 16:9 delivery master and run final QC.

## HUMAN GATE 02 — FINAL REVIEW / PUBLISH AUTHORIZATION
Automation MUST stop here and request explicit publication authorization.

- APPROVE / PUBLISH: publish to configured destinations.
- REJECT: fix only identified failures, rebuild final master, return to Gate 02.

## Non-negotiable state rules

- Never skip either human gate.
- Never interpret silence as approval.
- Never publish without explicit authorization.
- Never overwrite Canon or approved masters during retries.
- Failed scenes loop locally; do not restart the entire episode.
- All episode production imagery is 16:9 / 1920x1080 target.
- Every generation prompt uses strict format, Canon, reference, identity, scene, and change-scope locks.
