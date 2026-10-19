# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep the evidence and creative decisions that currently guide the build.

## Working agreement

Developer: Run the starter first. Direct the inquiry, judge sources and options, make consequential decisions, and keep this file current.

Agent: Read `AGENTS.md`, `brief.md`, and this file, then inspect the project. Help compare possibilities, test assumptions quickly, and verify external sources without delaying the prototype for exhaustive research.

Start a fresh chat with:

`Read brief.md and research.md, inspect the running project, and help me develop the scene and three spooky stories.`

## Inquiry and decisions

Record only what informs the next build decisions:

- creative alternatives for the scene, stories, and audiovisual direction, with reasons for your choices
- useful sources and references, what they support, and important limitations
- experiments that resolve uncertainty, the results, and consequential trade-offs

Investigate unfamiliar techniques or asset sources as needed. Verify usage terms and keep source links and required credits here. Distinguish evidence from assumptions; the Agent's recommendation alone is not evidence.

### Decisions (Phase 1)
- **Concept change (2026-10-19):** the first concept (haunted house, graveyard, pumpkin patch, "tap three pumpkins in order") was dropped by the Developer because it was too close to the brief's own example. It is preserved at git tag `pumpkin-v1`. Earlier iterations also dropped flying bats (did not fit that scene) and my code-drawn SVG art (rejected on style).
- **Scene (current):** gothic vampire castle at the end of a moonlit road, with a dead forest and gargoyle statues. Style target set by the Developer: Scooby-Doo mystery vibe (angular cartoon shapes, painted textures, eerie lighting), ages 10+. Artwork is three stacked layers supplied by the Developer, used unaltered, back to front: `castle_bg.png`, `castle_forest.png`, `castle_gargoyles.png` (all 852×1846).
- **Story 1, "The Count Awakens":** light three gargoyle statues in order (front-left, top-right, bottom-right) → four pairs of red eyes appear in the forest, the largest is correct → castle door flares, lightning, Dracula steps onto the road, bats burst out, laugh and organ sting → quiet again; ~8 s. Developer decisions: statues in a fixed order (changed from "any three" after testing), eerie green glow, Dracula silhouette supplied by the Developer, eyes that fade in and out, and decoy eyes on the right. Assumption to confirm: "one on left" was read as the front-left statue; "bottom right" as the front-right statue. Alternatives not built (Phase 2 candidates): bell tower tolling, coffin crypt, mirror that shows no reflection.
- **Music:** Revision 3 added an original synthesized waltz after Dracula appears. The Developer then found and chose a recording instead: "J S Bach-Toccata and Fugue" (Freesound 673357). I verified its page: CC0, uploader mariomf_cardoso, 27 s, no performer named on the page (Bach's composition itself is public domain). The first 0.9 s of the file is silent, so the clip is cut from 0.9 s to 6.9 s, 30 ms fade in, 1 s fade out, MP3 96 kbps (`toccata_intro.mp3`). Trade-off: it is a solo-instrument recording, bolder than my synthesized waltz; the synthesized waltz remains as a load-failure fallback.
- **Ambient wildlife and weather:** the Developer asked for bats out of the trees, a spider crawling near the gargoyles, lightning flashes behind the castle and distant thunder, with sounds of my own. Falling leaves and light rain were added and then removed at the Developer's request (leaves too brown; rain too loud). Lightning technique: an overlay using the `overlay` blend mode, which lights the mid-tone sky and clouds but leaves the dark castle pixels dark, so the castle reads as silhouetted. Thunder is synthesized in code (low filtered-noise rumble), so no licences apply. Safety: flashes are brief, none repeat more often than every ~9 s, and reduced motion removes them. Spider: first version showed only four legs at a time and had a rim light (Developer rejected both); redrawn solid black with all eight legs always visible and glowing red eyes.
- **Eye-click sound:** the Developer first wanted a creepier sound, then decided the current synthesized growl is fine; no external asset needed.
- **Statue activation (Revision 6):** the silhouette glow (green, then red) was dropped at the Developer's direction: statues now start dormant and a tap makes their eyes glow red. This needed a derived gargoyle layer, `castle_gargoyles_dormant.png`: pixel checks showed the original layer has a painted red eye on the front-left statue and a pale glint in the upper-left statue's eye, so those pixels were darkened to stone colour (the supplied `castle_gargoyles.png` is untouched and kept). Red eye overlays were placed by eye on each face (checked on zoomed crops). The earlier traced silhouette images (`lit_g0–5.png`) were deleted; they remain in git history. Likely cause of the Developer still seeing green after the red change: the replaced PNGs kept their file names and were served from the browser cache.
- **Audio approach:** two CC0 loops for the ambient bed; interaction/story sound effects are synthesized with Web Audio (original, no licence needed). Chosen because no verified CC0 owl/cackle clip was found (OpenGameArt owl results were CC-BY-SA screeches; Utah soundscape archive recordings are CC BY-NC-ND; others paid). The ambient owl hoot is therefore synthesized (soft sine "hoo, hoo-hoo", random 18–35 s gaps). Swap in a CC0 Freesound recording later if the Developer finds one and verifies its page.
- **Format:** OGG sources converted to MP3 (96 kbps) because OGG support on iOS Safari is uncertain. Conversion is a format change only.

### Asset sources (verified on the source page, 2026-10-19)
| Asset | Author | Licence | Source |
|---|---|---|---|
| Loopable Dungeon Ambience (`dungeon_ambient_1`) | JaggedStone | CC0 1.0 | https://opengameart.org/content/loopable-dungeon-ambience |
| Wind whoosh loop | SketchMan3 | CC0 1.0 | https://opengameart.org/content/wind-whoosh-loop |
| Owl hoot `owl_hoot.mp3` (from `251937__musicmasta1__owlhootclean.wav`, 3.8 s, converted to MP3) | musicmasta1 (clip cleaned from "Owls in the Night" by Npeo) | **CC BY-NC 3.0, not CC0** | https://freesound.org/people/musicmasta1/sounds/251937/ |
| Toccata intro `toccata_intro.mp3` (0.9–6.9 s of `673357__mariomf_cardoso__j-s-bach-toccata-and-fugue.mp3`) | mariomf_cardoso (composition: J. S. Bach, public domain) | CC0 1.0 | https://freesound.org/people/mariomf_cardoso/sounds/673357/ |
| Castle scene layers `assets/img/castle_bg.png`, `castle_forest.png`, `castle_gargoyles.png`, `castle_dracula.png` (plus derived `castle_gargoyles_dormant.png`) | Supplied by Developer | AI-generated by the Developer with ChatGPT from the Developer's own prompts (used unaltered) | n/a |

### Open risk: owl clip licence (Developer decision, 2026-10-19)
Developer chose to use the CC BY-NC owl clip after being told it is not CC0/public domain as the brief names and that NonCommercial may conflict with a theme-park promotion. Credit is on the start screen. The upstream recording ("Owls in the Night" by Npeo) was not checked. Confirm with the instructor; to remove, delete `owl_hoot.mp3` and the load line in `app.js` (a synthesized hoot is the built-in fallback).

### Assumptions / limits
- Loop points: MP3 encoding may leave a tiny gap at the loop seam. Not yet judged by ear.
- Gargoyle tap areas, statue-eye overlay positions and the five forest-eye positions were mapped by eye onto the layers (grid overlays and zoomed crops); the source PNGs are untouched.
- Dracula silhouette: supplied by the Developer as a transparent PNG; only cropped, resized and tinted to the scene's near-black navy (`castle_dracula.png`). Placed by eye on the road below the castle door (first at the door, which the Developer found too high).

## Revisions

Update decisions when new evidence changes the direction, linking to playtest observations in `plan.md` rather than copying them. Keep chosen behavior and asset requirements in `spec.md`. The Developer confirms when the inquiry is sufficient to continue building; exhaustive research is not a prerequisite.

## Saving the transcript

When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
