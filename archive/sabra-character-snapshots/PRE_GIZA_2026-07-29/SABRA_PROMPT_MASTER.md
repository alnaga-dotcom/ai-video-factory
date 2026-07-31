# SABRA PROMPT MASTER

**Character ID:** SABRA
**Version:** 1.0
**Project:** Sabra World / عالم صابرة
**Purpose:** Canonical Prompt Framework for Image and Video Generation

---

## 1. Purpose

This file defines the reusable prompt architecture for generating Sabra.

It does not define a single scene.

It separates:

- Immutable character identity
- Scene-specific variables
- Wardrobe
- Environment
- Action
- Emotion
- Camera
- Lighting
- Continuity
- Output requirements

The fundamental rule is:

**Scene variables may change. Sabra's identity does not.**

---

## 2. Source Authority

Before generating Sabra, use these sources in this order:

1. Approved visual reference images
2. `sabra.character.json`
3. `SABRA_VISUAL_IDENTITY.md`
4. `SABRA_CHARACTER_BIBLE.md`
5. `SABRA_BEHAVIOR_BIBLE.md`
6. This prompt framework
7. Scene-specific instructions

A scene prompt must never override canonical identity accidentally.

---

## 3. Primary Visual References

Reference root:

`A:/Sabra World/01_Characters/Sabra/Refrences/`

Primary identity references:

- `Sabra_Master_Reference_Sheet_v1.png`
- `Sabra_Portrait_Front_Master_v1.png`
- `Sabra_Portrait_45R_Master_v1.png`
- `Sabra_Portrait_45L_Master_v1.png`
- `Sabra_Face_Closeup_Front_Master_v1.png`
- `Sabra_FullBody_Turnaround_Master_v1.png`
- `Sabra_Hands_Nails_Master_Reference_v1.png`
- `Sabra_Scale_Proportions_Master_v1.png`

Secondary references may guide wardrobe, expression, pose, and context.

---

# PART A — IMMUTABLE CHARACTER BLOCK

## 4. Master Identity Block

Use the following identity meaning in every Sabra generation:

Sabra is the same canonical Egyptian Sa'idi woman defined by the approved Sabra reference assets.

She is a relatively young grandmother from Upper Egypt: mature, active, feminine, naturally full-bodied, strong, warm, confident, humorous, and naturally authoritative.

She has a soft rounded Egyptian face without prominent facial bones, wide attractive expressive dark eyes enhanced by elegant black kohl, warm wheat/olive-brown skin with natural mature texture, and a recognizable warm smile.

She normally wears a practical traditional Upper Egyptian-inspired headscarf and recognizable traditional Sa'idi gold earrings.

Her gold jewelry is modest and restrained.

Her hands are feminine, healthy, exceptionally clean, and naturally believable for an active woman. Her nails are short, natural, even, and carefully maintained.

Canonical height: 153 cm.

She must remain recognizably the same woman across scenes, wardrobe changes, expressions, lighting conditions, camera angles, and motion.

---

## 5. Identity Preservation Block

Always preserve:

- Same facial identity
- Same facial proportions
- Same soft rounded face
- Same eye identity
- Same elegant kohl language
- Same canonical skin tone
- Same age appearance
- Same body proportions
- Same 153 cm scale
- Same headscarf identity language
- Same signature Sa'idi earrings
- Same restrained jewelry language
- Same hands and nails identity
- Same personality presence

Do not reinterpret Sabra according to the environment.

---

# PART B — SCENE VARIABLES

## 6. Scene Block

Each production prompt should define:

**Scene ID:**
`[SCENE_ID]`

**Location:**
`[LOCATION]`

**Time:**
`[TIME_OF_DAY]`

**Situation:**
`[SCENE_CONTEXT]`

**Sabra's objective:**
`[OBJECTIVE]`

**Other characters present:**
`[OTHER_CHARACTERS]`

**Important objects:**
`[PROPS]`

**Continuity source:**
`[PREVIOUS_SHOT_OR_SCENE]`

---

## 7. Environment Block

Describe only the environment required for the scene.

Template:

Sabra is in `[LOCATION]`.

The environment contains `[KEY_ENVIRONMENT_ELEMENTS]`.

The space should feel established, lived-in, functional, and naturally part of Sabra's daily world.

Sabra behaves as someone deeply familiar with this environment.

Avoid making the location appear like a television set unless explicitly required.

---

## 8. Wardrobe Block

Select wardrobe according to context.

**Wardrobe ID:**
`[WARDROBE_ID]`

**Galabeya / garment:**
`[GARMENT_DESCRIPTION]`

**Headscarf:**
`[HEADSCARF_DESCRIPTION]`

**Earrings:**
Canonical Sabra Sa'idi gold earrings.

**Other jewelry:**
`[JEWELRY_CONTINUITY]`

**Footwear:**
`[FOOTWEAR]`

Wardrobe may change between scenes.

Within continuous scenes, wardrobe must remain identical unless the story explicitly includes a change.

Never use wardrobe changes to redesign Sabra.

---

## 9. Action Block

**Primary action:**
`[PRIMARY_ACTION]`

**Secondary action:**
`[SECONDARY_ACTION]`

**Hand activity:**
`[HAND_ACTION]`

**Body orientation:**
`[BODY_ORIENTATION]`

**Movement speed:**
`[MOVEMENT_SPEED]`

Actions should appear familiar and experienced.

Sabra should not look like she is demonstrating an unfamiliar task for the camera.

---

## 10. Emotion Block

**Primary emotional state:**
`[PRIMARY_EMOTION]`

**Secondary emotional layer:**
`[SECONDARY_EMOTION]`

**Expression intensity:**
`[LOW / MEDIUM / HIGH]`

**Trigger:**
`[EMOTIONAL_TRIGGER]`

Emotion changes expression, not identity.

Preserve Sabra's face through all emotional states.

---

## 11. Interaction Block

When another character is present:

**Character:**
`[CHARACTER_ID]`

**Relationship:**
`[RELATIONSHIP]`

**Sabra's attitude:**
`[ATTITUDE]`

**Eye line:**
`[EYELINE]`

**Physical interaction:**
`[PHYSICAL_INTERACTION]`

**Conversation state:**
`[CONVERSATION_STATE]`

Sabra should react naturally rather than waiting mechanically for dialogue turns.

---

# PART C — CAMERA

## 12. Shot Block

**Shot size:**
`[SHOT_SIZE]`

Examples:

- ECU
- CU
- MCU
- MS
- MFS
- FS
- WS

**Camera angle:**
`[CAMERA_ANGLE]`

**Camera height:**
`[CAMERA_HEIGHT]`

**Lens character:**
`[LENS_CHARACTER]`

**Camera movement:**
`[CAMERA_MOVEMENT]`

**Subject movement:**
`[SUBJECT_MOVEMENT]`

**Composition:**
`[COMPOSITION]`

Camera choices must not distort Sabra's established body or facial proportions.

---

## 13. Portrait Rule

For portrait-oriented identity shots:

Prioritize:

1. Facial identity
2. Eyes
3. Kohl
4. Skin texture
5. Headscarf
6. Earrings
7. Expression

Avoid excessive shallow depth of field that removes important identity information.

---

## 14. Full-Body Rule

For full-body shots:

Preserve:

- 153 cm canonical scale
- Full healthy body proportions
- Natural posture
- Clothing length
- Footwear
- Ground contact
- Correct hand anatomy

Avoid elongated AI body proportions.

---

## 15. Hand Close-Up Rule

When hands are prominent:

Prioritize:

- Correct anatomy
- Five fingers per hand
- Natural joints
- Clean skin
- Short natural nails
- Jewelry continuity
- Realistic grip
- Physical contact with objects

Reject visibly malformed hands.

---

# PART D — LIGHTING

## 16. Lighting Block

**Lighting source:**
`[LIGHT_SOURCE]`

**Lighting direction:**
`[LIGHT_DIRECTION]`

**Lighting quality:**
`[LIGHT_QUALITY]`

**Color temperature:**
`[COLOR_TEMPERATURE]`

**Exposure mood:**
`[EXPOSURE_MOOD]`

Lighting may change atmosphere.

Lighting must not change Sabra's canonical skin identity.

---

## 17. Naturalism Rule

Preferred visual philosophy:

**Cinematic naturalism rather than advertising glamour.**

The image may be beautiful.

Beauty should come from:

- Light
- Environment
- composition
- authentic expression
- texture
- atmosphere

Not from transforming Sabra into a glamour model.

---

# PART E — VIDEO

## 18. Video Motion Block

For video generation define:

**Starting pose:**
`[START_POSE]`

**Ending pose:**
`[END_POSE]`

**Primary movement:**
`[PRIMARY_MOVEMENT]`

**Head movement:**
`[HEAD_MOVEMENT]`

**Eye movement:**
`[EYE_MOVEMENT]`

**Hand movement:**
`[HAND_MOVEMENT]`

**Body movement:**
`[BODY_MOVEMENT]`

**Camera movement:**
`[CAMERA_MOVEMENT]`

**Duration:**
`[DURATION]`

**Continuity target:**
`[CONTINUITY_TARGET]`

Movement should be physically natural and consistent with Sabra's behavioral identity.

---

## 19. Video Identity Lock

During motion preserve:

- Face
- Eye shape
- Nose
- Jaw
- Body size
- Skin tone
- Scarf
- Earrings
- Jewelry
- Clothing
- Hands
- Age
- Character energy

Do not allow identity morphing during:

- Head turns
- Smiles
- Laughter
- Speaking
- Bending
- Walking
- Camera movement
- Hand interaction

---

## 20. Dialogue Performance Block

**Dialogue:**
`[DIALOGUE]`

**Dialect:**
Egyptian Sa'idi / Upper Egyptian

**Delivery:**
`[DELIVERY_STYLE]`

**Emotion:**
`[VOICE_EMOTION]`

**Speaking target:**
`[CAMERA / CHARACTER / OFFSCREEN PERSON]`

**Gesture during dialogue:**
`[DIALOGUE_GESTURE]`

Until the canonical Sabra voice is locked, dialogue audio must be treated as temporary production material.

---

# PART F — CONTINUITY

## 21. Shot Continuity Block

When generating consecutive shots, explicitly preserve:

**Previous shot:**
`[PREVIOUS_SHOT_ID]`

**Same wardrobe:**
`[YES/NO]`

**Same hairstyle/headscarf:**
`[YES/NO]`

**Same jewelry:**
`[YES/NO]`

**Same environment:**
`[YES/NO]`

**Same props:**
`[PROPS]`

**Sabra's emotional state entering shot:**
`[EMOTIONAL_STATE]`

**Sabra's physical state entering shot:**
`[PHYSICAL_STATE]`

**Object positions:**
`[OBJECT_POSITIONS]`

Do not reset the character between shots.

---

## 22. Continuity Priority

When compromises are required, prioritize:

1. Character identity
2. Narrative continuity
3. Physical continuity
4. Wardrobe continuity
5. Prop continuity
6. Lighting continuity
7. Cinematic flourish

Never sacrifice Sabra's identity for a more visually spectacular shot.

---

# PART G — MASTER GENERATION TEMPLATE

## 23. Image Prompt Template

Use this structure:

### CHARACTER

Use canonical SABRA identity from approved references.

Preserve Sabra's exact facial identity, wide expressive dark eyes with elegant black kohl, soft rounded face, warm wheat/olive-brown natural skin, mature but relatively young grandmother appearance, naturally full healthy body, 153 cm scale, traditional headscarf language, signature Sa'idi gold earrings, restrained gold jewelry, and clean feminine hands with short natural nails.

### SCENE

`[SCENE_DESCRIPTION]`

### WARDROBE

`[WARDROBE_DESCRIPTION]`

### ACTION

`[ACTION_DESCRIPTION]`

### EMOTION

`[EMOTION_DESCRIPTION]`

### CAMERA

`[CAMERA_DESCRIPTION]`

### LIGHT

`[LIGHTING_DESCRIPTION]`

### CONTINUITY

`[CONTINUITY_REQUIREMENTS]`

### STYLE

Photorealistic cinematic naturalism.

Authentic lived-in environment.

Natural Egyptian rural atmosphere where relevant.

No television-set appearance.

No fashion-glamour transformation.

Character identity has priority over stylistic variation.

---

## 24. Video Prompt Template

### CHARACTER LOCK

Canonical SABRA.

Use approved Sabra visual references as identity authority.

Do not redesign face, body, age, scarf identity, earrings, hands, or jewelry language.

### START STATE

`[START_STATE]`

### ACTION

`[ACTION]`

### PERFORMANCE

`[PERFORMANCE]`

### DIALOGUE

`[DIALOGUE]`

### CAMERA

`[CAMERA]`

### ENVIRONMENT

`[ENVIRONMENT]`

### LIGHT

`[LIGHT]`

### END STATE

`[END_STATE]`

### CONTINUITY

`[CONTINUITY]`

### VIDEO CONSTRAINT

Preserve Sabra's identity throughout every frame.

No facial morphing.

No body-size drift.

No age drift.

No scarf or jewelry mutation.

No hand deformation.

Natural physical motion.

Natural emotional continuity.

---

# PART H — PRODUCTION RULES

## 25. One Variable at a Time

During early testing, avoid changing many variables simultaneously.

For identity testing:

Keep environment, wardrobe, and lighting simple.

Change one factor at a time.

Examples:

- Camera angle
- Expression
- Head turn
- Walking
- Hand action
- Dialogue
- Lighting

This helps identify the source of character drift.

---

## 26. Reference Selection

Do not attach every reference image to every generation.

Use the smallest relevant reference set.

Example:

Portrait test:

- Master reference
- Front portrait
- Relevant 45-degree portrait

Full-body test:

- Master reference
- Full-body turnaround
- Scale reference

Hand-intensive test:

- Master reference
- Hands and nails reference
- Relevant body reference

Wardrobe test:

- Master reference
- Wardrobe reference
- Full-body reference

---

## 27. Generation Acceptance

A generation is accepted only when:

- Sabra is immediately recognizable
- Age is correct
- Body proportions are correct
- Eyes remain canonical
- Kohl is correct
- Skin remains natural
- Scarf is coherent
- Earrings are correct
- Hands are acceptable when visible
- Wardrobe matches context
- Behavior matches character
- Scene continuity is preserved

Technical beauty alone is insufficient.

---

## 28. Master Prompt Rule

**Do not describe a new Sabra for every scene.**

Start from canonical Sabra.

Then describe only what changes.

The production question is never:

**"What should this woman look like?"**

The production question is:

**"What is Sabra doing in this shot?"**
