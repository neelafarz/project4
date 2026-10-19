# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep a concise, testable description of the experience currently being built.

## Working agreement

Developer: Begin with the running prototype, approve the intended behavior, test it directly, and update this file when the intended result changes.

Agent: Read `AGENTS.md`, `brief.md`, `research.md`, and this file, then inspect the project. Turn decisions into acceptance checks without inventing product choices or freezing details that still require testing.

Start a fresh chat with:

`Read the project documents, inspect the running prototype, and help me specify the next useful build checkpoint.`

## Current build contract

Define only enough to build and verify the current direction:

- the intended User experience and chosen scene, ambience, and story behavior
- the system structure, shared rules, and states that keep audiovisual behavior and interaction coordinated
- the assets and layout needed for that structure, linking to sources and credits in `research.md`
- acceptance checks for the chosen behavior and every requirement in `brief.md`, including accessibility and failure behavior

Reference the brief's fixed requirements rather than copying them. Specify your decisions precisely enough that the Developer and Agent can judge the same result. Leave untested details open until they are needed, and distinguish provisional ideas from approved behavior.

### Phase 1 contract (provisional until Developer approves)
- **Scene:** `assets/img/scene.png` full-bleed, unaltered; stage keeps its 853×1844 aspect, letterboxed on other phones. Features: haunted house (focal), graveyard, pumpkin patch.
- **Ambient effects:** drifting fog, falling leaves, flickering house glow (bats removed after Developer feedback: they did not fit the scene). Sound: CC0 dungeon bed + wind layer (see `research.md`).
- **Owl:** distant synthesized hoot at ~9 s, then every 18–35 s while idle; skipped during the story; frozen by Pause.
- **Start screen:** Reduce-motion checkbox (preset from device setting) + Enter, which unlocks audio and applies the motion choice.
- **Play/Pause:** one 48px button (or `P`) freezes audio, CSS animation, shared timers and scene interaction; also auto-pauses when the tab is hidden.
- **Story 1:** tap pumpkins small (far right) → medium (centre) → large (lower left). Each tap: unique note, ring, progress dot. Wrong order: buzz, shake, reset. Third tap starts ~7.5 s story (wake, house flare + rising embers, peak + cackle, fizzle + smoke, rest). Other taps are locked during the story; replayable.
- **Hints:** after 5 s / 20 s / 40 s idle, increasingly specific; start-screen text now states the goal (explore; something in the patch wants waking); reset on any interaction.
- **Decoys:** door and two gravestones give sound + visual feedback only.
- **Reduced motion:** no leaves, embers, drift, shake or flash; glow and fades only.
- **Acceptance (automated, headless Chromium 390×780):** order logic, reset, replay, pause freezes story, hints, `P` key, tap targets ≥44px, reduced-motion attribute, zero console errors. **Not yet verified:** physical phone (see `plan.md`).


## Scope and revisions

Record excluded ideas, the next behavior that must work, and consequential requirement changes with their evidence.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
