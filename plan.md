# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Track the next useful build checkpoints, verification, and consequential revisions.

## Working agreement

Developer: Keep the browser preview running, choose priorities, test results directly, and plan only the next few checkpoints.

Agent: Read the project documents and inspect the files. Keep each checkpoint small enough to run and judge. Do not expand scope or mark Developer verification complete.

Start or continue a fresh chat with:

`Read the project documents, inspect the current build, and help me complete the next unchecked checkpoint.`

## Checkpoints

Create your own checklist for the next few results, using the workflow in `brief.md` and the current `spec.md`. Name the main risk, what each checkpoint should produce, and how you will verify it. Review and approve the approach before implementation.

Test each result before continuing, including related behavior that already works. Update priorities as evidence emerges and preserve meaningful working checkpoints in git. Before delivery, verify the deployed app against the brief and specification.

### Phase 1 checkpoints
- [x] Read brief and project docs; CC0 ambient audio sourced and licences checked
- [x] First prototype (pumpkin concept) built, deployed and Developer-tested on desktop; tagged `pumpkin-v1`
- [x] Concept changed to the castle version (Developer decision; see `research.md`)
- [x] Castle prototype built: three art layers, effects, start screen, Pause, hints, Story 1; headless test passes (see `spec.md`)
- [x] Dracula silhouette received and added to the payoff (door)
- [x] Revision 2 applied after Developer's test (see below)
- [ ] Developer approves spec and re-checks hotspot/glow alignment
- [ ] Deploy castle version to the public HTTPS URL (GitHub Pages from `main`)
- [ ] Verify on physical phone (below)

**Main risks:** audio on iOS Safari (autoplay unlock, MP3 loop gap); hotspot alignment on real screens; owl clip licence (see `research.md`).

### Revision 1 (Developer's first look at the live build)
- Observed (Developer): "idk what I\'m supposed to be doing"; bats "don\'t seem to fit the scene".
- Changes: start screen states the goal; hints start at 5 s and escalate; all bats removed, story burst replaced by rising embers. Verify: headless test + Developer re-check.

### Revision 2 (Developer's test of the castle build)
- **Observed (Developer):** the gargoyle glow was a green circle laid over part of the statue and too bright; the red eyes sat on the path and were too large; wanted the eyes further left plus several more spread on the right, the correct one being the largest pair; wanted the statues clicked in an order (one on the left, then top right, then bottom right) before the eyes; wanted the eyes to appear and disappear every few seconds; Dracula appeared too high and should be lower on the path.
- **Changes:** per-statue silhouette glow in a softer green; fixed statue order with reset on a wrong tap; four eye pairs (largest = correct, left; three decoys, right) that fade in/out on separate cycles; eyes smaller; Dracula moved onto the road and enlarged slightly; hints rewritten for the ordered puzzle. See `spec.md` (Story 1) and `research.md` (glow technique).
- **Verified (headless Chromium 390×844, screenshots reviewed):** wrong first/second tap resets to 0 lit; correct order lights 3 and shows 4 eye pairs; statue taps and decoy eyes give feedback with no progress; correct eyes start the payoff; Pause freezes it; it resets and replays; reduced-motion attribute set; zero console errors. **Not verified:** how the glow edges and eye positions look on a real phone; whether "front-left first" matches what the Developer meant.

### Revision 3 (Developer's second test)
- **Observed (Developer):** Dracula now too low and looked like he was floating; wanted him to come out of the front door; wanted another set of eyes on the upper left; disliked the sound after tapping the red eyes (wants it creepier, will source it); wanted a spooky Transylvanian tune after Dracula comes out.
- **Changes:** Dracula animates out of the door and stands on the steps with a ground shadow and a size closer to the door; fifth (decoy) eye pair upper left; payoff extended to ~8.5 s with an original waltz theme. Eye-click sound unchanged until the Developer supplies one.
- **Verified (headless Chromium, screenshots reviewed):** Dracula small in the doorway at 1–2 s, then standing on the steps; 5 eye pairs shown; melody notes (A4, B♭4, C♯5, D5) scheduled; payoff ends and resets; zero console errors. **Not verified:** how the tune sounds (Developer to listen), Dracula's placement on a real phone.

### Revision 4 (Developer's third test)
- **Observed (Developer):** wanted the first ~6 s of Toccata and Fugue in D minor (downloaded from Freesound) to play when Dracula comes out; thought the statue glow should be red instead of green.
- **Changes:** verified the clip's licence (CC0), trimmed it, and wired it to Dracula's entrance (synth waltz kept as fallback); statue glow, progress dots and rings are now red; credits updated.
- **Verified (headless Chromium, screenshot reviewed):** the 6 s clip starts ~2.8 s after the eye tap (the entrance); red statues match the castle palette; payoff ends and resets; zero console errors. **Not verified:** how the music sounds and blends with the thunder/door/laugh (Developer to listen); whether the laugh at the end clashes with the fade-out.

### Revision 5 (Developer's request for more life in the scene)
- **Observed (Developer):** wanted falling leaves or something from the trees, a bat or two flying out of the trees, a spider crawling across the path near the gargoyles, lightning flashes behind the castle, and light rain or distant thunder, with sounds of my own.
- **Changes:** all added as decoration layers (see `spec.md` ambient effects). First spider was dark on a dark path and almost invisible in my screenshot, so it is larger with a pale rim.
- **Verified (headless Chromium, screenshots reviewed):** 34 rain drops and 11 leaves built; ambient lightning fires by itself ~11 s in and brightens the sky with the castle in silhouette; bat and spider visible when their cycles are advanced; Pause freezes leaves, rain and spider; reduced motion hides them; story still passes (order, decoys, payoff, replay); zero console errors. **Not verified:** how the rain and thunder sound or how loud they are against the music (Developer to listen); whether the flashes feel too frequent or too bright on a phone.

### Developer must verify on a physical phone
1. Sound starts after tapping Enter (iOS: silent switch off, volume up); ambient loops without an obvious gap.
2. Tap targets: all six statues and the four eye pairs are comfortable to hit (the small right-side pairs have a 48 px target); wrong statues grumble.
3. Dracula appears in the lit doorway at the right size and place; green gargoyle glow lines up with each statue; the forest eyes are easy to see and tap.
4. Pause freezes sound, motion, and blocks taps; Play resumes. Lock the screen / switch apps: it should auto-pause.
5. Full payoff plays ~8 s, taps are ignored during it, and it replays.
6. Reduce motion checkbox (and the phone's Reduce Motion setting) removes mist/cloud drift, flicker, bats and flashes.
7. Layout fits without scrolling in portrait; text is readable; no performance stutter.
8. Hints appear after idle time (5 s / 20 s / 40 s, then 6 s / 20 s once the eyes phase starts).
9. The eyes fade in and out, and the largest pair on the left is easy to find and tap.


## Evidence and revisions

Record non-identifying playtest observations, separating what Users did or said from your interpretation. Use the findings to choose revision priorities and record what changed and how you verified the improvement.

Keep implementation progress and verification here. Update `research.md` when evidence changes a decision and `spec.md` when intended behavior changes; link to those updates rather than duplicating them. Record consequential changes, not every small adjustment.

## Saving transcripts

When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md` or `transcripts/build-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
