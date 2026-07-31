# AI Video Factory

Production system for repeatable AI-assisted video creation, beginning with **Sabra World**.

## Production baseline

- Episode-production masters are **landscape 16:9**, target **1920×1080**.
- Approved references are sources of truth; **reference fidelity overrides creative reinterpretation**.
- Production prompts are strict contracts: format, identity, scene, motion, duration, audio, allowed changes, and prohibited changes must be explicit.
- Canon audio is finalized before lip-sync whenever practical.
- QC gates every stage; failed assets do not become inputs to later paid stages.
- Cost is tracked by **approved seconds**, not generated seconds.

## Documentation

- `docs/PRODUCTION_PIPELINE.md` — end-to-end workflow, strict prompt locks, lip-sync rules, QC, and platform strategy.
- `docs/FOLDER_STANDARD.md` — canonical project/episode structure, migration policy, and naming rules.

## Migration policy

Existing `staging/` assets are treated as legacy working material. They must not be bulk-moved or deleted until script dependencies and approved masters are verified. New work should follow the standardized `projects/<project>/...` structure documented above.
