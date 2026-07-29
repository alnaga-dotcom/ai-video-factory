# AI Video Factory v1

## Mission
Turn an approved episode script into a review-ready AI video while keeping the human in the director role rather than the operator role.

## Pipeline
Episode Spec -> EASE -> Shot Planner -> Character References -> Model Router -> Generation -> QA -> Targeted Retry -> Voice -> Lip Sync -> Timeline -> Sound -> Review Cut -> Director Approval -> Final Export.

## Character identity
Permanent cast identity comes from canonical reference assets. Generated frames must not become the sole identity source for later shots because generation-to-generation inheritance causes identity drift.

## Model routing
Premium generation is used for character acting, faces, interactions, eye contact, emotional beats, dialogue reactions, and hero shots. Faster generation is used for establishing shots, objects, transitions, backs of characters, and simple movement. Provider/model names and prices are configuration-driven.

## EASE
Egyptian Arabic dialogue is normalized before TTS using validated pronunciation rules. Prefer natural Egyptian spelling and context, then minimal diacritics, then tested exceptions, then rephrasing. Validated forms belong in versioned data rather than hard-coded prompts.

## QA gates
Every shot receives machine-readable QA results for character identity, expression, continuity, requested action compliance, eye contact/relationship blocking when applicable, unwanted speaking or mouth movement, and visual artifacts.

A failed criterion triggers a targeted retry with a corrective prompt; the entire episode is not regenerated.

## Director review
A run should end with a compact report such as: `24 shots generated · 19 passed · 5 retried · 23 passed · 1 needs Director Review`.

## v1 implementation target
Typed episode/shot contracts, EASE data, model routing, QA policy, retry policy, provider interfaces, orchestration state, and an EP01 fixture based on the Sabra production tests.