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
  1. **Statues, in order:** tap the front-left statue (red eyes), then the top-right statue, then the bottom-right statue. Each correct tap lights that statue's own silhouette in a soft green glow (per-statue image traced to its outline, not a circle) with a rising stone chime, a ring and a progress dot (3 green dots). A wrong statue grumbles and, if any were lit, they all go dark again with a toast. Tapping an already-lit statue re-chimes only. Statues are tappable by keyboard in tab order.
  2. **Eyes:** after the third statue, a toast says something stirs and five pairs of red eyes appear in the forest (staggered). The **largest** pair (left) is correct; four smaller decoy pairs sit on the right side and the upper left. Each pair fades in and out every ~4–6 s on its own cycle (steady, not cycling, with Reduce motion). Tapping a decoy plays a whisper and the eyes blink shut for 1.5 s with no progress. Tapping the correct pair growls, lights the 4th (red) dot and starts the payoff. Eyes stay tappable even while faded so keyboard/touch users are never locked out.
  3. **Payoff (~8.5 s):** rumble → lightning + castle door flare (0.9 s) → door creak and Dracula steps out of the front door (1.8 s): he starts small inside the doorway and grows as he steps onto the steps at the top of the path, standing on a soft ground shadow so he is not floating → original Transylvanian-style waltz theme plays with the bat burst (3.2 s, ~4.5 s long) → laugh + second flash (5.6 s) → Dracula fades (7.0 s) → glows fade (7.5 s) → rest and toast (8.5 s). All taps are locked meanwhile; then everything resets and it replays.
  4. **Hints by idle time, per phase:** statues 5 s ("stone guardians seem to be watching"), 20 s ("they wake in a certain order, start on the left"), 40 s ("left first, then top right, then bottom right"); eyes 6 s, 20 s ("trust the one that glares the biggest"). Reset on any interaction.
- **Reduced motion:** no mist/cloud drift, window flicker, bats, flashes, shaking or pulsing; glows and fades only.
- **Pending from the Developer:** a creepier replacement sound for tapping the correct eyes (currently a synthesized growl); to be sourced and license-checked, then swapped in.
- **Not built yet:** Phase 2 stories 2 and 3. Dracula is one supplied silhouette (`castle_dracula.png`) shown in the door; a window peek is a possible variation.
- **Acceptance (automated, headless Chromium 390×844):** statue order and reset-on-wrong, eyes appear/hidden states, decoy eyes, payoff lock + reset + replay, Pause freezes the payoff, tap targets ≥48px, reduced-motion attribute, zero console errors. **Not yet verified:** physical phone (see `plan.md`).

## Scope and revisions

**Revision log:** 2026-10-19 (Revision 3): Dracula steps out of the front door and stands on the steps (was too low); fifth eye pair (decoy, upper left); original Transylvanian-style theme after Dracula appears; replacement eye-click sound pending.

**Earlier:** 2026-10-19 (castle concept, after the Developer's first phone/desktop test): statue trigger changed from "any three" to a fixed order (front-left → top-right → bottom-right); glow changed from a green circle to a silhouette-shaped soft glow; forest eyes made smaller, moved left, supplemented by decoy pairs on the right, and set to fade in and out; Dracula moved down onto the road. Evidence is recorded in `plan.md` (Revision 2).

Record excluded ideas, the next behavior that must work, and consequential requirement changes with their evidence.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
