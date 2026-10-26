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
  1. **Statues, in order:** tap the front-left statue (red eyes), then the top-right statue, then the bottom-right statue. Each correct tap lights that statue's own silhouette in a soft green glow (per-statue image traced to its outline, not a circle) with a rising stone chime, a ring and a progress dot (3 red dots). A wrong statue grumbles and, if any were lit, they all go dark again with a toast. Tapping an already-lit statue re-chimes only. Statues are tappable by keyboard in tab order.
  2. **Eyes:** after the third statue, a toast says something stirs and five pairs of red eyes appear in the forest (staggered). The **largest** pair (left) is correct; four smaller decoy pairs sit on the right side and the upper left. Each pair fades in and out every ~4–6 s on its own cycle (steady, not cycling, with Reduce motion). Tapping a decoy plays a whisper and the eyes blink shut for 1.5 s with no progress. Tapping the correct pair growls, lights the 4th (red) dot and starts the payoff. Eyes stay tappable even while faded so keyboard/touch users are never locked out.
  3. **Payoff (~8.5 s):** rumble → lightning + castle door flare (0.9 s) → door creak and Dracula steps out of the front door onto the steps (1.8 s; starts small in the doorway, grows, soft ground shadow) → **the first 6 s of Bach's Toccata and Fugue in D minor (CC0 Freesound clip) plays as he steps out (1.9 s)**; bat burst (3.2 s) → laugh + second flash and Dracula fades as the music fades out (7.0 s) → glows fade (7.5 s) → rest and toast (8.5 s). All taps are locked meanwhile; then everything resets and it replays. If the clip fails to load, an original synthesized waltz plays instead.
  4. **Hints by idle time, per phase:** statues 5 s ("stone guardians seem to be watching"), 20 s ("they wake in a certain order, start on the left"), 40 s ("left first, then top right, then bottom right"); eyes 6 s, 20 s ("trust the one that glares the biggest"). Reset on any interaction.
- **Reduced motion:** no mist/cloud drift, window flicker, bats, flashes, shaking or pulsing; glows and fades only.
- **Pending from the Developer:** a creepier replacement sound for tapping the correct eyes (currently a synthesized growl); to be sourced and license-checked, then swapped in.
- **Not built yet:** Phase 2 stories 2 and 3. Dracula is one supplied silhouette (`castle_dracula.png`) shown in the door; a window peek is a possible variation.
- **Acceptance (automated, headless Chromium 390×844):** statue order and reset-on-wrong, eyes appear/hidden states, decoy eyes, payoff lock + reset + replay, Pause freezes the payoff, tap targets ≥48px, reduced-motion attribute, zero console errors. **Not yet verified:** physical phone (see `plan.md`).

### Phase 2 contract: Story 2, "Dinner for the Count" (kitchen; BUILT 2026-10-26, automated checks pass; awaiting Developer review on a real device)
- **Scene:** a separate scene (Developer decision: each story has its own scene; **risk:** the brief asks for "one cohesive scene… without switching pages", so the Developer should confirm this reading with the instructor). Layers: kitchen room (`kitchen_bg.png`, from the supplied 851×1847 image) → Dracula (hidden behind the pot) → cauldron on the dais → soup glow, bubbles, steam → ten ingredients → parchment riddle → interface. Same start screen, Play/Pause, progress dots, Reduce-motion handling and ambient bed as the other stories.
- **Ingredients:** the ten supplied sprites, one per shelf (five each side), dealt to the shelves at random on load and on every replay, so the right three land on random shelves. **Right (any order):** moon essence (crescent jar), pumpkin, bat-shaped pasta. **Decoys:** garlic, mushrooms and the whole second row (swirl bottle, candy corn, berries, crystals, herb). Tap targets ≥48px.
- **Riddle (always visible on a parchment):** "Something silver from the night sky, something orange, and something with wings." Three runes below light up as the right ingredients go in; the three progress dots light too.
- **Right tap:** the item arcs into the cauldron with its own sound (moon: sparkle; pumpkin: glug; pasta: flutter), a blorp, a rune and a dot. **Wrong tap:** the item arcs in, the pot puffs and spits it back, a short funny line shows, progress is kept. **Garlic:** puff, a roar ("GARLIC?! In MY soup?!"), everything resets and the used ingredients return. (Assumption: the Developer's "or your rest with funny dialogue" meant "reset".)
- **Payoff (~8.5 s):** third ingredient → soup bubbles and glows red, red steam curls up → Dracula (the same black figure, `castle_dracula.png`, no spoon) fades in behind the pot with a low synthesized bell and says "Who dares summon me… for DINNER?" → "Hmm… acceptable. Tell the bats I approve." → he leaves in a puff → reset with Replay / Back / Next arrows. Taps are locked and Pause freezes it. It summons him (Developer: part of a bigger story).
- **Hints:** the riddle plus idle toasts at 5 s ("The Count is hungry…"), 20 s ("Something bottled from the moon… and a gourd from the harvest.") and 40 s ("And something that flutters in the dark: shaped like wings.").
- **Order and navigation:** castle → kitchen → cave. Next arrows after the castle and kitchen payoffs; Back and Replay on the kitchen and cave. `index.html#kitchen` and `#cave` open a story directly (developer shortcut).
- **Reduced motion:** items vanish into the pot without flying, bubbles and steam hold still, puffs fade only.
- **Acceptance (automated, headless 390×844):** `tests/story_kitchen.py`: ten ingredients on ten distinct shelves, wrong keeps progress, garlic resets, any order, payoff lock/Pause/reset, replay reshuffles, hints, reduced motion, navigation across the three scenes, zero console errors.

### Phase 2 contract: Story 3, "The Cave Awakens" (BUILT 2026-10-26, automated checks pass; awaiting Developer review on a real device; moved to third place when the kitchen was added)
- **Scene:** one scene in the same template as story 1 (same stage aspect, start screen, Play/Pause, progress dots, reduced-motion handling, ambient sound bed). Layers back to front: path with moon (`1.png`, 852×1846, opaque) → cave (`3.png`, 1536×1024, transparent; scaled to roughly two-thirds of stage width, on the ridge where the path ends) → branch (`4.png`, 2172×724; revised to run edge to edge, 108% of stage width, because 3/4 looked too short and hung in mid-air) crossing the path below the cave, bats' feet placed on the limb at each bat's position → five hanging bats (`5.png`, 1024×1536, one image reused) → graveyard foreground (`2.png`, 852×1846, transparent). Source files are still in the session image folder; not yet copied into `assets/img/` (awaiting plan approval). Credits in `research.md`.
- **Navigation:** after story 1's payoff a 48px, keyboard-focusable **next arrow** appears (replaces the automatic replay reset) with a replay option beside it; it moves to story 2. Story 2 shows a matching back/replay arrow after its payoff.
- **Puzzle:** five bats left to right. Tap bats **1, 3, 5** in that order. Bats hang perfectly still. Each correct bat squeaks, adds a progress dot and **flies away at once** (no glow or pop). A wrong bat has its **eyes turn red** (nothing moves), all progress resets, the flown bats fade back, with a toast and a screech. Tapping a bat that already flew does nothing. Bats are keyboard-tappable with ≥48px targets. Because the supplied bat already has red eyes, dormant bats use a derived copy with the eyes darkened (supplied file untouched).
- **Payoff (~8 s):** last correct tap → the two unpressed bats also take off → cave glows red → Dracula (existing `castle_dracula.png`, flipped upside down, ~13u tall, hanging in the middle of the mouth) **fades in** where he hangs (no drop) → laugh, then he and the glow fade → reset. Taps locked during the payoff; Pause freezes it.
- **Hints (revised again 2026-10-26, Developer):** the numbers are carved on three gravestones (front-left = 1, upper-right = 3, front-right = 5), stone-coloured and translucent so they blend in. Tapping a stone lets its number show for 3 s (quiet whisper, no ring), then it fades; the order is learned by tapping the stones. Idle toasts at 5 s ("the bats hang restless") and 20 s ("the old graves carry numbers. Tap them."). Same in Reduce motion (no fade animation). Numbers hide when the payoff starts. Gravestone taps show no ring. Assumption: which stone carries which number was my choice, and the fourth stone I had was dropped.
- **Sounds:** squeaks, screech and cave glow are synthesized (original, no licence), as in story 1, unless the Developer supplies clips.
- **Acceptance (planned, headless Chromium 390×844):** correct order 1-3-5 triggers the payoff; any wrong bat or order resets and turns that bat's eyes red; payoff locks taps, resets and replays; Pause freezes the payoff; next/back arrows work and are ≥48px; hint numbers cycle and are steady/delayed under Reduce motion; zero console errors.
- **Developer decisions (2026-10-26):** yes to dark-eyed dormant bats with red eyes for a wrong tap; the branch spans **3/4 of the stage width**.
- **Developer confirmed (2026-10-26):** reduced-motion hint numbers appear steady only after 20 s idle. Art credit: the five story 2 images were generated with ChatGPT.
- **Still open:** approval of the Phase 2 plan in `plan.md` before any code is written.

## Scope and revisions

**Revision log (2026-10-26, kitchen):** a new story, "Dinner for the Count", was added as story 2 and the cave moved to story 3 (Developer decision); the Dracula cave sound and the neumorphic start screen were added earlier the same day.

**Revision log (2026-10-26):** story 2 (cave, five bats, tap 1-3-5) drafted as a provisional Phase 2 contract with a next-arrow transition from story 1. Nothing built yet. Evidence: `research.md` and `transcripts/spec-2026-10-26_*.md`.

**Revision log:** 2026-10-19 (Revision 4): statue glow changed from green to deep red; Dracula's entrance music is now the first 6 s of the Toccata (CC0) instead of my synthesized waltz (kept as fallback).

**Earlier:** 2026-10-19 (Revision 3): Dracula steps out of the front door and stands on the steps (was too low); fifth eye pair (decoy, upper left); original Transylvanian-style theme after Dracula appears; replacement eye-click sound pending.

**Earlier:** 2026-10-19 (castle concept, after the Developer's first phone/desktop test): statue trigger changed from "any three" to a fixed order (front-left → top-right → bottom-right); glow changed from a green circle to a silhouette-shaped soft glow; forest eyes made smaller, moved left, supplemented by decoy pairs on the right, and set to fade in and out; Dracula moved down onto the road. Evidence is recorded in `plan.md` (Revision 2).

Record excluded ideas, the next behavior that must work, and consequential requirement changes with their evidence.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
