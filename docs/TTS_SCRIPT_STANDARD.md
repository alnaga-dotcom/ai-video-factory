# AI Video Factory — TTS Script Standard

## Purpose
Every spoken script must be converted into a TTS-ready performance script before audio generation. The approved story/dialogue remains the semantic source of truth; the TTS script is a pronunciation and delivery representation only.

## Mandatory rules
- Use natural, fluent language appropriate for the target audience.
- Prefer short, balanced sentences that are easy to pronounce and listen to.
- Use Arabic punctuation correctly (، . ؛ : ! ؟ …) to create natural pauses, emphasis, and rhythm.
- Add selective Arabic diacritics to words or phrases whose pronunciation may be ambiguous. Do not fully vocalize the text unless required.
- Resolve words or phrases with multiple plausible pronunciations before generation through selective diacritics or meaning-preserving rephrasing.
- Write proper names, technical terms, Arabized foreign words, abbreviations, numbers, and unusual expressions in the representation most likely to produce the intended pronunciation.
- Rephrase when this materially improves natural pronunciation or clarity, while preserving meaning, intent, facts, tone, and speaker identity.
- Avoid constructions known to cause robotic delivery, pronunciation ambiguity, or unnatural pauses.
- Review the complete TTS script proactively as though the speech engine will mispronounce every ambiguous token; correct likely failures before synthesis.
- Optimize for spoken delivery: natural rhythm, useful pauses, clarity, and listening comfort.
- Pronunciation quality and natural delivery take priority over preserving the exact written form when a meaning-preserving TTS representation is better.

## Integrity rules
The TTS optimization stage MUST NOT:
- change the approved story meaning;
- add or remove facts;
- change character intent or personality;
- invent dialogue;
- alter Canon;
- silently replace the approved original script.

Store both versions:
- Original approved script/dialogue — semantic source of truth.
- TTS script — pronunciation/delivery source used for synthesis.

## Audio gate
No TTS synthesis may start until the TTS script exists and has completed pronunciation review. The review must explicitly consider Egyptian Arabic, proper names, ambiguous Arabic words, numbers, abbreviations, and foreign/Arabized words where present.
