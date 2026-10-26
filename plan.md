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
- [x] Developer approved Game 1 after testing the live build ("i like it")
- [x] Deployed to the public HTTPS URL: https://neelafarz.github.io/project4/ (GitHub Pages from `main`)
- [ ] Verify on physical phone (below): still to be confirmed and recorded by the Developer

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
- **Changes:** Dracula animates out of the door and stands on the steps with a ground shadow and a size closer to the door; fifth (decoy) eye pair upper left; payoff extended to ~8.5 s with an original waltz theme. Eye-click sound unchanged (the Developer later decided the current one is fine).
- **Verified (headless Chromium, screenshots reviewed):** Dracula small in the doorway at 1–2 s, then standing on the steps; 5 eye pairs shown; melody notes (A4, B♭4, C♯5, D5) scheduled; payoff ends and resets; zero console errors. **Not verified:** how the tune sounds (Developer to listen), Dracula's placement on a real phone.

### Revision 4 (Developer's third test)
- **Observed (Developer):** wanted the first ~6 s of Toccata and Fugue in D minor (downloaded from Freesound) to play when Dracula comes out; thought the statue glow should be red instead of green.
- **Changes:** verified the clip's licence (CC0), trimmed it, and wired it to Dracula's entrance (synth waltz kept as fallback); statue glow, progress dots and rings are now red; credits updated.
- **Verified (headless Chromium, screenshot reviewed):** the 6 s clip starts ~2.8 s after the eye tap (the entrance); red statues match the castle palette; payoff ends and resets; zero console errors. **Not verified:** how the music sounds and blends with the thunder/door/laugh (Developer to listen); whether the laugh at the end clashes with the fade-out.

### Revision 5 (Developer's request for more life in the scene)
- **Observed (Developer):** wanted falling leaves or something from the trees, a bat or two flying out of the trees, a spider crawling across the path near the gargoyles, lightning flashes behind the castle, and light rain or distant thunder, with sounds of my own.
- **Changes:** all added as decoration layers (see `spec.md` ambient effects). First spider was dark on a dark path and almost invisible in my screenshot, so it is larger with a pale rim.
- **Verified (headless Chromium, screenshots reviewed):** 34 rain drops and 11 leaves built; ambient lightning fires by itself ~11 s in and brightens the sky with the castle in silhouette; bat and spider visible when their cycles are advanced; Pause freezes leaves, rain and spider; reduced motion hides them; story still passes (order, decoys, payoff, replay); zero console errors. **Not verified:** how the rain and thunder sound or how loud they are against the music (Developer to listen); whether the flashes feel too frequent or too bright on a phone.

### Revision 6 (Developer's test of Revision 5)
- **Observed (Developer):** rain too loud; still a green glow on the statues; leaves too brown; spider had only four legs and glowed (wanted fully black with a glowing red eye); idea that statues should start without glowing eyes and their eyes glow red when tapped, instead of any silhouette glow.
- **Changes:** rain (sound and streaks) and leaves removed; thunder and lightning kept. Statue activation is now glowing red eyes on dormant statues, using a derived dormant gargoyle layer (original untouched); the old silhouette-glow images deleted. Spider redrawn: solid black, eight legs always drawn and swinging in two alternating sets, glowing red eyes, no rim light. Image links now carry version tags so old cached images cannot reappear.
- **Verified (headless Chromium, screenshots reviewed):** all six statues dormant with no red or green; red eyes appear in the right place on all six when activated; spider has eight legs; story regression passes (order, reset, decoys, payoff, replay, reduced motion); zero console errors. **Not verified:** the Developer's own browser/phone after a hard refresh; whether the eye size reads well on a small screen.

### Revision 7
- **Observed (Developer):** wanted the progress lights in the top left to be blue. **Change:** all four dots use blue (`#5aa8ff`); the red fourth dot is gone. **Verified:** screenshot of the HUD after the full order and the correct eyes shows four lit blue dots; no console errors.

### Revision 8
- **Observed (Developer):** the trees in the middle-left covered the path; the spider was too black and should be dark bluish.
- **Changes:** derived forest layer with the middle-left road cleared (see `research.md`); spider body is now a dark navy gradient with a navy outline and still has red glowing eyes.
- **Verified (headless Chromium, before/after previews and screenshots reviewed):** the road is unobstructed in the middle-left; the spider is dark blue with eight legs and red eyes; the full story regression still passes; zero console errors. **Not verified:** whether the Developer also wants the upper road section (bushes at y ~700–880) cleared.

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

### Peer playtest log (Phase 1)

Source: reported by the Developer after showing the prototype to a peer. The peer session itself is not part of the Agent's transcript, so this log relies on the Developer's account. Peer is not identified.

**Session details (as reported by the Developer):** 2026-10-19 (the same day as the build); 1 peer; played on a phone; was confused at first and then figured it out.

| # | What the peer said (as reported) | Interpretation (Developer/Agent) | Change made | How it was checked |
|---|---|---|---|---|
| 1 | Directions should be explained through on-screen hints so the player understands what is happening. | The first build gave little guidance; the player could not tell there was something to find or what to do. The Developer had the same confusion when first opening the live build. | Start-screen text now states the goal; progressive hints appear by idle time and escalate from a nudge to the full order (statues phase 5 s / 20 s / 40 s, eyes phase 6 s / 20 s); hints reset on interaction. Details in `spec.md` (Story 1, item 4) and Revisions 1–2 below. | Headless browser test confirms the hints appear at the set times and the story completes. **Not yet re-tested with a peer** to confirm the hints now make the goal clear. |
| 2 | The theme of the game could be better. | The Developer agreed. The Developer had also found the first concept (haunted house, graveyard, pumpkin patch, "tap three pumpkins in order") too close to the example in `brief.md`. | Whole-style change: new castle/forest/gargoyle scene in a Scooby-Doo-style mystery look, new story ("The Count Awakens"), new ambient effects and sound. The first version is kept at git tag `pumpkin-v1`. See `research.md` (concept change) and `spec.md`. | Each stage was checked by the Developer on the live site and by the headless browser test (Revisions 2–8). **Not yet re-tested with a peer** to confirm the new theme lands better. |

*Still missing (Developer to add if remembered):* what the peer did while confused, for example where they tapped first, what they tried, how long it took, and what finally made it click. Keep it non-identifying. Only one peer has played so far, so these findings are a single data point.

**Reading of the outcome:** the peer's confusion at the start is consistent with the first build having too little guidance (row 1), and the fact that they got through it suggests the game is discoverable but the opening is the weak point. This is an interpretation from one session, not a measured result.

**Next priority from this evidence:** run the same unguided peer test on the castle version and record what peers do before they say anything.

## Saving transcripts

When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md` or `transcripts/build-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.

## Phase 2: Story 2, "The Cave Awakens" (PLAN: awaiting Developer approval, no code written)

**Main risks:** (1) adding a second scene must not break story 1, so the app's shared parts (clock, audio, hints, Pause, HUD) get a small refactor and a regression test comes first; (2) the bat art and the branch/cave layout depend on hand-placed positions that need checking on screenshots; (3) cycling hint numbers must stay visible but not give the puzzle away; (4) audio on iOS Safari (unchanged risk, still unverified on a physical phone).

**Structure decision (one choice, not three):** a second `<main id="stage2">` beside `#stage`, sharing the existing clock, audio engine, HUD, Pause and toast. A tiny scene switcher shows one stage at a time. Hints become per-scene (a `phase` list each story registers) instead of hard-coded to story 1. No new framework or build step.

### Checkpoints (each is run and shown before the next)
- [x] **A. Regression baseline.** The earlier test script was not saved in the repo, so a new one was written: `tests/story1_baseline.py` (run with a Playwright venv; headless Chromium 390×844). Result on the unchanged build: **13/13 passed** (statue order, reset on wrong, 5 eye pairs, decoy, payoff lock, Pause freeze, reset, replay, zero console errors; no gargoyle hotspot under 48px). One first-run failure was my test's timing (checked the 5th eye pair 0 ms too early), not the app.
- [x] **B. Asset prep (done 2026-10-26).** Copy the five supplied images into `assets/img/` (`cave_path.png`, `cave_graveyard.png`, `cave_mouth.png`, `cave_branch.png`, `cave_bat.png`; supplied files untouched). Derive `cave_bat_dormant.png` (eyes darkened, same method as the dormant gargoyles) and an upside-down Dracula (CSS flip of `castle_dracula.png`, no new file). Compress if large. Done when before/after crops of the bat are shown and the file sizes are listed. **Result:** `cave_path.png` and `cave_graveyard.png` are exact copies (852×1846, 1.7 MB and 0.7 MB); cave 1536→1024 wide (0.65 MB), branch 2172→1448 wide (0.19 MB) and bat 1024×1536→512×768 (0.13 MB each, normal and dormant) are resized copies (format/size change only). Dormant bat: both red eye discs painted over with the socket colour; before/after crop checked, eyes read as dark sockets. Original supplied files remain in the session image folder only.
- [x] **C. Static scene.** Layout only: path → cave on the ridge (~2/3 width) → branch (3/4 width) → five bats left to right → graveyard foreground, in `#stage2`. Done when a screenshot shows it correctly and tap targets are ≥48px.
- [x] **D. Switcher + next arrow.** Story 1's payoff ends on the next arrow plus replay (instead of auto-reset); the arrow opens story 2; story 2 has a back/replay arrow. Story 1 hints/dots keep working. Done when the baseline test still passes and a new test covers the arrow.
- [x] **E. Puzzle logic.** Order 1→3→5 with glow, squeak, 3 dots; wrong bat turns its eyes red, resets, toast + screech; already-lit bat only re-squeaks; keyboard operation. Done when a test covers correct order, wrong first/second tap, wrong order, and repeat taps.
- [x] **F. Payoff (~8 s) + sounds.** Bats take off → cave glows red → upside-down Dracula drops in → laugh → fade → reset/replay; taps locked; Pause freezes; synthesized squeak/screech/glow sounds. Done when screenshots at each beat and a test for lock, pause and replay are shown.
- [x] **G. Hints.** Numbers 1, 3, 5 fading in under the bats every ~8–10 s (pause during the payoff); toasts at 5 s and 20 s; Reduce motion shows them steady only after 20 s idle. Done when a test confirms the cycle and the reduced-motion behavior.
- [ ] **H. Docs, credits, deploy.** Add the story 2 credits (ChatGPT) to the start screen and `research.md`, bump the `?v=` cache tags, update `spec.md` (provisional → verified only for what was tested), save transcripts, commit, push to GitHub Pages and check the live URL. Done when the live build is checked.

**Verification (automated, headless Chromium 390×844, screenshots reviewed):** everything in the story 2 acceptance list in `spec.md`, plus story 1 regression, zero console errors. **Not verifiable by me:** how the sounds actually sound, how it feels on a physical phone, and whether the layout reads well to you; those stay open until you test them.

**Stop rule:** if an approach fails twice I stop and report instead of iterating.

### Phase 2 build status (2026-10-26)
- **C–G built together** (the Developer asked to see it): second stage `#stage2`, next/back/replay arrows, 1-3-5 puzzle with red-eyed wrong tap, ~8 s payoff (bats take off → cave glows red → upside-down Dracula drops in → laugh → fade → reset), cycling hint numbers and 5 s/20 s toasts, reduced-motion handling, synthesized squeak/screech/thud.
- **Verified (headless Chromium 390×844, screenshots reviewed):** `tests/story1_baseline.py` 15/15 and `tests/story2.py` 23/23, zero console errors; bat tap targets 57–60px. First screenshots showed the red glow below the cave and Dracula almost invisible; glow moved into the mouth and Dracula enlarged, then re-checked by screenshot (red mouth with an upside-down silhouette).
- **Not verified:** how the new sounds sound, the look and timing on a physical phone, whether the bats are large enough, Dracula's placement, whether the numbers are too easy or too hard to catch.
- **Still to do (H):** story 2 credits are in the start screen; docs/deploy/commit/transcripts not done.

### Revision 9 (Developer's first look at story 2)
- **Observed (Developer):** bats too high and should sit lower on the branch; branch too short and looked like a hanging asset; wanted gravestone taps to reveal the order 1, 3, 5; Dracula too large and too high in the cave.
- **Changes:** branch now runs edge to edge with bat feet placed on the limb at each bat's x (computed from the branch image's alpha) and the whole group lowered ~4%; gravestone taps replace the cycling numbers; Dracula 21u → 13u and lowered into the mouth.
- **Verified (headless 390×844, screenshots reviewed):** `tests/story1_baseline.py` 15/15, `tests/story2.py` 25/25, zero console errors; screenshots show the bats' feet on the branch, numbers 1/3/5 revealed under bats 1/3/5, and a smaller upside-down Dracula in the red mouth. **Not verified:** the Developer's own view; I read "too high" as feet not touching the limb, so tell me if you meant the whole group should sit lower.

### Revision 10
- **Observed (Developer):** numbers should be on the gravestones, stone-coloured/translucent so they blend (a hint, not a sign); bats look better now; tap animation way too much; Dracula now too low.
- **Changes:** numbers 1/3/5 carved on three gravestones (per-stone reveal, 3 s); story 2 taps use a small soft ring, 6% pop, softer glow and smaller wrong-bat shake; Dracula raised (top 18.3% → 16.6%).
- **Verified (headless 390×844, screenshots reviewed):** `tests/story1_baseline.py` 15/15 and `tests/story2.py` 26/26 (see output), zero console errors; screenshot shows faint numbers on the three stones and Dracula mid-mouth. **Not verified:** how subtle the animation feels in your hands, the Developer's view of Dracula's height.

### Revision 11
- **Observed (Developer):** still disliked the bat animations; wanted the bats still, then flying away once pressed correctly; Dracula should fade into the scene, not come in from the top.
- **Changes:** removed bat sway, glow, pop and shake; each correct bat flies away immediately (the other two follow in the payoff); wrong tap only turns the eyes red, then the bats fade back; Dracula fades in place over 1.6 s (door creak instead of a thud). Assumption: "after they're pressed correctly" read as each correct bat leaving as it is pressed.
- **Verified (headless 390×844, screenshots reviewed):** results in the test output below; bats have no animation at rest, bat 1 gone after a correct tap and back after a wrong one; Dracula at half opacity without moving.

### Revision 12
- **Observed (Developer):** wanted the intro screen more neumorphic and navy blue.
- **Changes:** start screen restyled with one navy base colour and soft raised/inset shapes (light from the top left): title embossed, tagline inset, Reduce-motion pill with an inset custom checkbox, raised Enter button that presses in, raised Credits panel that goes inset when open. Text contrast kept high (light text on navy). Markup unchanged.
- **Verified:** screenshots at 390×844 of the closed and open Credits states; the Reduce-motion checkbox still toggles (used by the tests). **Not verified:** how it looks on a physical phone.

### Revision 13
- **Observed (Developer):** bats too high again; Dracula too small; bats should not vanish as each is pressed (they should glow, then all fly away once all three are right); wanted a sound when Dracula comes out and supplied "147_Octane draculastab 01".
- **Cause found for "too high":** the shared `.hotspot` rule centres elements with `translate(-50%, -50%)`, which silently moved every bat up by half its height (~42px) and left by half its width; fixed with `transform: none` on the bats, so positions now match the computed branch geometry (and the group sits 5% lower). Earlier lowering attempts were fighting this bug.
- **Changes:** correct bats glow in place (no flying, no ring); all five fly away together when the third is right; Dracula 13u → 17u; Dracula's entrance plays the supplied recording (Freesound 662621, CC BY 4.0, credited on the start screen and in `research.md`; the brief accepts "appropriately licensed" material with credit); my synthesized sting is the fallback.

### Revision 14
- **Observed (Developer):** wanted subtle rain drops and rain sound in story 2; confirmed it is good.
- **Changes:** 36 faint rain streaks over the scene and a very quiet synthesized rain bed (~5% volume, fades with the scene); Pause freezes both; Reduce motion hides the drops and keeps the quiet sound. Story 1 stays rain-free (removed earlier as too loud).
- **Verified (headless 390×844):** `tests/story1_baseline.py` 15/15, `tests/story2.py` 34/34 (includes rain drops animating, reduced motion hiding them, and the Dracula stab file loading), zero console errors. **Not verified:** how the rain sounds on a phone speaker.

## Phase 3: story order and the kitchen story (2026-10-26)
- [x] Pushed everything so far to GitHub (commit a359b20 on `main`; Pages URL above).
- [x] Kitchen assets sliced and added (`ing_*.png`, `kitchen_bg.png`, `kitchen_cauldron.png`).
- [x] Kitchen scene, logic, sounds and hints built; castle → kitchen → cave navigation; `#kitchen` / `#cave` shortcuts. Cave tests now open the cave directly.
- [x] Verified (headless 390×844, screenshots reviewed): `tests/story_kitchen.py` 23/23, `tests/story1_baseline.py` 15/15, `tests/story2.py` (cave) 34/34, zero console errors. Not verified: sounds by ear, physical phone, shelf alignment on other phone sizes. Then pushed; Developer review on a phone; final docs, transcripts, deploy check.
