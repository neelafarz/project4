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

### Phase 1 contract (castle concept; provisional until Developer approves)
- **Scene:** three stacked 852×1846 layers (background castle → forest → gargoyles), unaltered; the stage keeps that aspect and is letterboxed on other phones. Features: castle (focal point), forest, gargoyle statues. Style: Scooby-Doo-style mystery, ages 10+, no gore.
- **Ambient effects:** drifting mist, flickering red castle windows, cloud shadows passing over the moon. Sound: CC0 dungeon bed + wind layer, plus an occasional owl hoot (recorded clip, CC BY-NC, credited; synthesized fallback) at ~9 s then every 18–35 s while idle, skipped during the story, frozen by Pause.
- **Start screen:** Reduce-motion checkbox (preset from device setting) + Enter, which unlocks audio and applies the motion choice.
- **Play/Pause:** one 48px button (or `P`) freezes audio, CSS animation, shared timers and scene interaction; also auto-pauses when the tab is hidden.
- **Story 1, "The Count Awakens" (~8 s payoff):**
  1. Tap any three of the six gargoyle statues. Each lights up green with a rising stone chime, a ring and a progress dot (3 green dots). Tapping a lit statue just re-chimes; once three are lit, the other three only grumble (decoys).
  2. After the third, a toast says something stirs and red eyes open in the forest after ~1.4 s. Tapping them growls, lights the 4th (red) dot and starts the payoff.
  3. Payoff: rumble → lightning + castle door flare (0.9 s) → door creak → organ sting + bats burst (2.8 s) → laugh + second flash (4.8 s) → glows fade (6.2 s) → rest and toast (7.2 s). All taps are locked meanwhile; then everything resets and it replays.
  4. Hints by idle time, per phase: statues phase 5 s / 20 s / 40 s; eyes phase 6 s / 20 s. Reset on any interaction.
- **Reduced motion:** no mist/cloud drift, window flicker, bats, flashes, shaking or pulsing; glows and fades only.
- **Not built yet:** Dracula figure (waiting on the Developer's layer); Phase 2 stories 2 and 3.
- **Acceptance (automated, headless Chromium 390×844):** any-three logic, decoy behavior, eyes appear/hidden states, payoff lock + reset + replay, Pause freezes the payoff, tap targets ≥48px, reduced-motion attribute, zero console errors. **Not yet verified:** physical phone (see `plan.md`).

## Scope and revisions

Record excluded ideas, the next behavior that must work, and consequential requirement changes with their evidence.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
