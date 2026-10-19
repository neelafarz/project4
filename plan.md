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
- [x] Read brief and project docs
- [x] CC0 ambient audio sourced and licences checked
- [x] Prototype built: `index.html`, `style.css`, `app.js`
- [x] Art swapped to Developer-supplied image (first SVG art rejected)
- [x] Headless browser test passes (see `spec.md` acceptance list)
- [ ] Developer approves spec and art overlay alignment
- [ ] Deploy to public HTTPS URL (GitHub Pages from `main`)
- [ ] Verify on physical phone (below)

**Main risk:** audio on iOS Safari (autoplay unlock, MP3 loop gap) and overlay alignment of hotspots on real screens.

### Revision 1 (Developer's first look at the live build)
- Observed (Developer): "idk what I\'m supposed to be doing"; bats "don\'t seem to fit the scene".
- Changes: start screen states the goal; hints start at 5 s and escalate; all bats removed, story burst replaced by rising embers. Verify: headless test + Developer re-check.

### Developer must verify on a physical phone
1. Sound starts after tapping Enter (iOS: silent switch off, volume up); ambient loops without an obvious gap.
2. Tap targets: small pumpkin at far right edge is comfortable to hit; door and gravestones respond.
3. Glow overlay lines up with the pumpkins and house door.
4. Pause freezes sound, motion, and blocks taps; Play resumes. Lock the screen / switch apps: it should auto-pause.
5. Full story plays ~7.5 s, taps are ignored during it, and it replays.
6. Reduce motion checkbox (and the phone's Reduce Motion setting) removes leaves/embers/flash.
7. Layout fits without scrolling in portrait; text is readable; no performance stutter.
8. Hints appear after idle time (5 s / 20 s / 40 s).


## Evidence and revisions

Record non-identifying playtest observations, separating what Users did or said from your interpretation. Use the findings to choose revision priorities and record what changed and how you verified the improvement.

Keep implementation progress and verification here. Update `research.md` when evidence changes a decision and `spec.md` when intended behavior changes; link to those updates rather than duplicating them. Record consequential changes, not every small adjustment.

## Saving transcripts

When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md` or `transcripts/build-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
