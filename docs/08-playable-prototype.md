# Playable game: instructions and release status

Updated 13 October 2026. The game lives in `dist`. The Word document remains the original researched planning snapshot; this page records the implemented browser release.

## Play locally

From the project directory run:

```sh
python3 tools/serve_game.py
```

Open http://127.0.0.1:8765/ in a desktop browser. No package installation or build is required. The server serves only `dist` on the loopback interface. Append `--port 8766` to use another port. Stop it with Control-C. Keep research videos and private download metadata outside any published game folder.

## Gameplay and winning

1. Check the keys before starting. Player 1 uses Z to count and X to submit; Player 2 uses N and M. The alternative preset is A/S and K/L. Settings also supports individual remapping with four distinct physical keys.
2. Wait through the match countdown and puzzle countdown, then watch the boxes. Input during these phases is ignored.
3. When the boxes disappear, tally the number of separate box objects. Each press adds one, starting at zero and capped at 99. Holding a key adds only one. You cannot decrement the counter. A large unsegmented box counts once; separate boxes in a tower each count.
4. Submit to lock your answer and stop your own timer. The other player can continue. No correctness feedback appears until everyone has submitted or the optional deadline expires.
5. Watch the centered board return and each object turn green. The final total and separate check/cross feedback show the answers.
6. In a competitive match, all answer times are added together, plus **five seconds per wrong answer**. The lower adjusted time wins. The browser draw rule compares totals rounded to the displayed hundredth of a second. Waiting for the other player, countdowns, and reveals do not add to a submitted player's time.

Solo practice reports correct answers, accuracy, and average answer time. Its round details do not add competitive penalties. A Custom deadline marks an unsubmitted answer as wrong even if its counter happens to be correct. The elapsed time for that player is the full answer limit, followed by the five-second penalty in a duel.

## Modes

| Mode | Content and finish condition |
| --- | --- |
| Classic | Two players, ten reconstructed reference rounds in their observed order; original-style individual timers and no deadline. |
| Quick match | Five freshly generated puzzles; solo or two players. |
| Full match | Twenty freshly generated puzzles; solo or two players. |
| Endless practice | Solo generated puzzles until Finish practice. Choose mixed styles or one family. Only submitted/completed rounds enter the result. |
| Choose a puzzle | One solo round from the reference pack, saved levels, or saved packs. |
| Custom match | Solo or two players; generated content with 1–50 rounds, or an authored pack played once through. Optional shuffled pack order, viewing-time override, and answer limit of 5/8/15/30 seconds. |

Quick, Full, Endless, and generated Custom support Gentle, Standard, and Intense. The seed and generator version reproduce arrangements. Generation is an original browser extension, not Nintendo's algorithm. Seven families cover grouped/scattered boxes, separate towers, large boxes, travelling formations, quick flashes, and dense boards. Seeded packs avoid exact repeated arrangements within 100 attempts per round. Generated layouts use constrained templates with supported boxes and visible top surfaces or tower boundaries.

The ten reference answers are 3, 6, 5, 5, 4, 7, 8, 3, 4, and 24. Their layout coordinates and some timing/path values are reconstructed approximations. Classic includes a 100 ms flash, stacked travelling boxes, a broad box, and the final 24-box board.

## Level editor and packs

Create a level from the menu. Choose Add box and click a ground cell. Width, depth, and height specify one object; touching separately created objects remain separate boxes. Click an existing box in Add mode to add a unit box on top, or use Select to inspect its coordinates. Apply to selected changes position/size; Stack, Duplicate, Delete, Clear, Undo, Redo, Mirror, and Rotate provide editing actions.

The editor displays both the **object count** and **occupied unit cells**. Overlap, floating boxes, unsupported bases, board overflow, and heights over four units prevent saving and testing. Names are limited to 80 characters. Choose stationary or travelling presentation, viewing/travel duration, direction, and reveal order. Test solo or Test with two uses the same game engine and returns to the editor with its draft retained. Inspect custom layouts for readable object boundaries; geometry validity alone does not prove puzzle fairness.

Save levels to the browser library. The latest valid editor draft is automatically kept when storage is available. Up to 100 levels and 50 packs can be stored. Build a pack by adding levels, then move them earlier/later, remove entries, name the pack, and save. Adding a level copies it with a new identity so repeated entries are valid. Editing a pack's level through Edit copy creates a separate editor copy; add the saved copy to the pack to replace the original entry.

Export a level or pack as version 1 JSON. Import accepts a pack or a standalone level up to 1 MB. It validates names, identities, 1–50 levels per pack, 1–99 objects per level, integer geometry, collisions, complete support, timing, travel bounds, and reveal membership. Imports create a new pack rather than overwrite existing packs. A large box survives round trips as one entity. Unknown extra fields are stripped from accepted imports.

## Pause, settings, history, and storage

Escape, focus loss, or hiding the tab pauses behind an opaque overlay. Resuming an unfinished generated or Classic puzzle replaces it with a fresh same-family arrangement, clears guesses and both submissions, and restarts its countdown. The interrupted attempt adds no time or penalty. Authored custom/editor/replay puzzles restart mirrored and mark the session assisted, since their arrangement may repeat. Settled rounds keep their recorded answers and times. Leaving a session abandons it without declaring a winner.

Settings controls audio, volume, higher-contrast geometry, and stationary replacements for travel. The system reduced-motion preference supplies the first-run default; a saved choice takes precedence afterward. Changed viewing times, motion replacements, editor tests, and replays are marked assisted. Audio is optional and uses original synthesized cues rather than extracted Nintendo recordings.

Completed sessions appear in Match history with answers, individual times, and competitive penalties. Replay practice uses their saved arrangements. History retains up to 100 sessions and trims older records to keep history near 1 MB. Endless results retain the whole session summary and details/replay for its latest 50 rounds. Browser data is versioned and capped at 4 MB. Storage write failures are shown explicitly; the in-memory draft remains available for export. Clearing site data removes the library, settings, draft, and history, so use JSON exports as backups.

## Technical implementation and verification

The release uses native JavaScript ES modules, SVG, Web Audio, localStorage, and a dependency-free Python development server. The pure engine uses monotonic timestamps and has no DOM dependency. Gameplay uses `KeyboardEvent.code`, repeat suppression, and independent player locks. Touch/mouse count and submit buttons are available during answering, but the initial control check requires a keyboard.

Run:

```sh
node --test tests/*.test.mjs
```

All 21 tests pass, including 630 generated layouts across three difficulty presets and seven families, deterministic packs, a complete 20-round match, exact observed scoring, timeouts, locking, pause reserves, Endless termination, import/export, rendering bounds, and corrupted-storage recovery. See [release QA](09-release-qa.md) for browser evidence and limits.

## Fidelity and later extensions

This is a complete local Box Counting release with the implemented modes and authoring tools, not exact original emulation or the other Brain Training minigames. Original fonts, travel curves, sonic cues, rare rules, and precise timing remain approximations. The editor does not include a timeline scrubber or free-form travel endpoint editor. Online multiplayer, accounts, leaderboards, gamepads, adaptive difficulty, and separate direct-number entry are future extensions. Real keyboard rollover and independent Firefox/Safari checks require hardware/browser testing beyond the current in-app browser QA.
