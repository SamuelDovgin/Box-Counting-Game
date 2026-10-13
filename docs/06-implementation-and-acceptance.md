# Implementation and acceptance plan

## Milestones and exit gates

| Milestone | Deliverable | Exit gate |
| --- | --- | --- |
| 1 Reference baseline | Evidence log, ten observed round categories, timing profile | Claims tied to footage; uncertainties marked |
| 2 Visual slice | Countdown, Watch, input, reveal, final-score fixtures | Side-by-side screenshot review passes |
| 3 Playable loop | One complete shared-keyboard round | Both independent answers, locks, reveal and elapsed times correct |
| 4 Full match | Ten-round pack, time penalties, summary and replay | Recorded scoring example and all outcome cases pass |
| 5 Replayability | Versioned seeded templates and reserves | Reproducibility, support, visibility and repetition checks pass |
| 6 Authoring | Editor, saving, JSON import and export | Large-box identity and round-trip tests pass |
| 7 Release polish | Browser checks, accessibility, audio and motion options | Complete acceptance list passes |

Milestones are ordered by dependency, not a promised calendar estimate. The current release implements the gameplay loop, reference match, generated modes/reserves, authoring, local persistence, history/replay, remapping, and audio/motion settings. [Release QA](09-release-qa.md) records completed checks. Hardware rollover, independent browser-matrix checks, and exact reference pixel matching remain unverified. Avoid replacing this plan with an unrelated visual redesign.

## Priorities

P0 includes one-keyboard multiplayer, object-based counting, neutral isometric visuals, input after exposure, independent timers, five-second mistake penalties, ten-round matches, supported stacks, large boxes, travelling boards, and flash puzzles. P1 includes the editor, persistent custom packs, remapping, reserve generation, settings, and import/export. A complete first release includes both P0 and P1. P2 covers additional packs, touch, gamepads, direct entry, adaptive practice, online play, and leaderboards.

Implement motion and the large-box model early; treating either as final polish would require reworking the core renderer and level format. Hold complex generation until the authored pack is visually reliable. A simple generator built from validated templates is preferable to extensive unverified “difficulty” math.

## Required gameplay checks

1. Both players see the same geometry and Watch interval.
2. Countdown and Watch keys do not change guesses or queue future actions.
3. Z and N can increment independently in the same animation frame; X and M can submit independently.
4. Holding a count key adds exactly one; releasing and pressing again adds one more.
5. One locked player cannot change their answer, and the other retains control.
6. No correctness cue occurs before both lock.
7. Both correct answers receive checks even if their response times differ.
8. Both wrong answers add one mistake each and preserve their actual elapsed times.
9. A large box counts once; four separate stacked boxes count four.
10. Countdown, Watch, reveal, and waiting for the other player do not increase a submitted player’s time.
11. Original result fixture produces 29.24 seconds versus 53.34 seconds.
12. Classic permits an answer longer than eight seconds.
13. Equal displayed final times produce Draw under the documented browser tie rule.
14. Pause and blur do not replay a scored exposure or settle a round twice.
15. An incomplete or abandoned match does not declare a competitive winner.

## Required visual checks

Inspect a stationary unit group, stacked towers, a large cuboid, two rows, the 24-box board, both travel directions, the 100 ms flash, and the complete final result. Keep the original’s sparse composition, shaded faces, thin edges, dotted grid, tiled input digits, plain submitted numerals, and progressive green reveal. Confirm the board is absent after travelling exposures and re-centered for reveal. Verify no source-video borders, subscription graphics, collage captions, or bookmark overlays appear in the game.

## Required editor and data checks

Reject duplicate object IDs, out-of-bounds geometry, overlapping occupied volumes, unsupported entities, malformed dimensions, unknown schema versions, oversized packs, and reveal lists with missing or repeated IDs. Test one large box and four unit boxes with the same occupied volume: their correct answers must differ. Export then import must preserve entities, presentation, order, and count. Interrupted storage writes must leave the previous valid pack usable.

## Browser and hardware matrix

Test current stable Chrome, Firefox, and Safari on desktop during implementation; record actual versions in the build QA report. Test a laptop keyboard and an external keyboard with overlapping count and submit presses. Exercise browser zoom, window resizing, tab hiding, focus switching, muted audio, failed storage, and system reduced-motion preference. A simulated key test cannot replace a real shared-keyboard rollover check.

## Remaining research work

Additional original-game sessions would help establish whether the ten category order is universal, the full library of layouts, maximum wait behavior, exact ties, overflow, and variation between game versions. Measure original audio cues separately if sonic fidelity is a priority. These are fidelity refinements, not blockers to implementing the explicit browser decisions already specified.

## Definition of done

A user can open the game, understand the controls, complete a ten-round match with a second person on one keyboard, understand why one adjusted time won, play again, create a valid large-box or stacked puzzle, save it, export it, reload it, and play it in a custom match. Every rule affecting that outcome is documented, validated, and consistent with the final UI. Do not claim exact original emulation while unresolved timing and rare-rule differences remain.
