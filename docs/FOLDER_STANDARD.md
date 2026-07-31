# AI Video Factory — Folder Standard v1

```text
ai-video-factory/
├─ docs/
│  ├─ PRODUCTION_PIPELINE.md
│  └─ FOLDER_STANDARD.md
├─ scripts/
│  └─ ... reusable generation/processing scripts
├─ projects/
│  └─ sabra-world/
│     ├─ canon/
│     │  ├─ characters/
│     │  ├─ environments/
│     │  ├─ voices/
│     │  └─ branding/
│     ├─ prompts/
│     │  ├─ image/
│     │  ├─ video/
│     │  └─ lipsync/
│     ├─ reusable/
│     │  ├─ images/
│     │  ├─ video/
│     │  └─ audio/
│     └─ episodes/
│        └─ EP001/
│           ├─ 00-spec/
│           ├─ 01-audio/
│           │  ├─ raw/
│           │  ├─ approved/
│           │  └─ timing/
│           ├─ 02-images/
│           │  ├─ references/
│           │  └─ approved-16x9/
│           ├─ 03-video/
│           │  ├─ generated/
│           │  ├─ lipsync/
│           │  └─ approved/
│           ├─ 04-edit/
│           ├─ 05-delivery/
│           └─ 06-qc/
└─ staging/
   └─ ... temporary/legacy working assets pending controlled migration
```

## Rules

- `projects/<project>/canon/` contains approved sources of truth only.
- `staging/` is temporary. New production work should use the standardized project/episode structure.
- Never silently move/delete legacy assets. Migrate only after verifying paths used by scripts and manifests.
- Raw generations remain raw. Approved assets are copied/promoted into `approved/`; do not overwrite raw evidence.
- All episode-production image masters under `approved-16x9/` must be landscape 16:9, target 1920×1080.
- Delivery files belong only in `05-delivery/`.
- QC records belong in `06-qc/` and should identify model, cost, duration, result, and rejection reason where applicable.

## Naming

Use stable story-order IDs, not generation-order IDs:

```text
S01-introduction
S02-origin
S03-marriage
...
```

Variants append a purpose/take suffix:

```text
S09-wedding-take01.wav
S09-wedding-take02.wav
S09-wedding-approved.wav
S13-closing-8s.wav
```

Once an episode scene order is locked, do not create out-of-order scene numbers. Generation chronology belongs in metadata/QC logs, not filenames.
