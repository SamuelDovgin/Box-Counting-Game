# Technical architecture

## Implementation approach

The implemented release uses native JavaScript ES modules in `dist`, SVG geometry, Web Audio effects, and localStorage. No React, Vite, TypeScript compiler, or package installation is needed. The pure game engine is separate from DOM rendering and input. `tools/serve_game.py` serves only playable assets on localhost.

These are browser implementation decisions, not claims about Nintendo internals. The earlier TypeScript/Vite and IndexedDB proposals were simplified for this small local release. [Playable release status](08-playable-prototype.md) is the source of truth for shipped behavior; additional architectural targets below describe future refinements.
## Modules and contracts

| Module | Responsibility | Must not do |
| --- | --- | --- |
| rules | Phase transitions, locks, elapsed time, penalties, winner | Read DOM or draw geometry |
| input | Map physical presses to player actions, held-key tracking | Change scores directly |
| clock | One monotonic clock and phase deadlines | Use wall-clock dates for elapsed time |
| levels | Parse, validate, generate and serialize entities | Guess answers from pixels |
| renderer | Project faces, draw grid and HUD, animate path and reveal | Decide correctness |
| editor | Manipulate level entities and preview the shared engine | Maintain separate scoring rules |
| storage | Versioned settings, levels and completed results | Persist browser credentials or downloaded video metadata |
| shell | Screens, navigation, pause, audio start and errors | Accumulate time from repeated intervals |

The implemented modules are `dist/engine.js` (phases), `core.js` (geometry/scoring/imports), `generator.js` (seeded templates), `renderer.js` (SVG), `storage.js` (persistence), `audio.js` (effects), `ui.js` (screens), and `app.js` (input, editor actions, and orchestration). Keep data/reference-pack.json as development content and copy only audited playable data into production. Research video files, contact sheets, downloaded info JSON, and Word QA output must stay outside the build asset graph.

## Engine state

Represent phase as a discriminated union: lobby, matchCountdown, puzzleCountdown, watch, answer, preReveal, revealCounting, resultHold, matchEnd, results, paused. A match includes rulesVersion, immutable resolved levels, current round index, settled round records, and interruption records. Each player has guess, submittedAtMs or null, and elapsedMs or null for the current round. Do not overload zero as an absent timestamp or absent answer.

Events are READY, TICK, COUNT, SUBMIT, PAUSE, RESUME_READY, ABANDON, and START_MATCH. The reducer consumes an event plus a monotonic timestamp and returns a new state plus presentation effects. All score changes come from a single settlement function with a unique round-attempt ID. Repeat or stale settlement events are ignored. Animation completion can request a transition but must not double-count a result.

## Input and clocks

Use KeyboardEvent.code bindings and a Set of held physical keys. Ignore event.repeat, duplicate held keydowns, composition input, and gameplay keys when an editor or text field has focus. Clear held keys on blur. Prevent browser defaults only for bound active-game actions. Both players’ actions use the same capture path and clock; do not install competing global handlers for each player.

At the frame boundary that switches Watch to Answer, record answerOpenedAt. Each accepted submission records now minus that boundary. requestAnimationFrame presents the state; elapsed time comes from performance.now, not the number of frames or setInterval increments. Schedule audio and visual transitions from absolute phase deadlines. On resumed tabs do not fast-forward through several scored puzzles; the interruption policy replaces the incomplete attempt.

Approximate browser timing differs from physical display scan-out and device latency. Avoid claims of hardware-level competitive timing. The original result comparison is centisecond resolution; use the documented rounding and tie policy consistently. No network synchronization is necessary for one-screen play.

## Rendering and occlusion

Project all six faces from world coordinates, retain camera-facing exposed portions, and draw back to front. Large cuboids and stacks require an overlap-aware face order; sorting object centers alone can produce incorrect occlusion. For initial templates, constrain geometry so a deterministic face-depth ordering is valid, verify it with reference fixtures, and reject ambiguous intersections. Render shared object boundaries once where possible so adjacent outlines are not accidentally twice as thick.

Grid and box layer share one transform for travelling puzzles. HUD stays in a separate fixed layer. Remove all puzzle geometry at Answer entry, retain only the grid for static puzzles, and restore the centered formation for Reveal. Use object IDs to apply reveal green state. Keep title and counters as accessible DOM text or SVG text with appropriate accessible equivalents; never expose hidden answers before reveal.

## Storage and privacy

The release stores settings, levels, packs, editor draft, and completed-match summaries in a versioned localStorage record, capped at 4 MB. IndexedDB remains a possible upgrade for larger libraries. Version records and provide explicit migrations. Match records store rule version, generated geometry, guesses, elapsed times, penalties, and interruption status. History retains at most 100 sessions, within a 1 MB history budget; long sessions retain their latest 50 detailed rounds. A separate clear-history control remains a UI refinement. No analytics, account system, or network service is needed for first release.

Do not persist downloaded media URLs, browser-session data, or original gameplay footage in game state. Render imported names as text. Import into a temporary model, validate completely, then save transactionally. Keep backups of the previous valid pack on replacement or provide undo. Display write failures honestly and allow immediate export of the unsaved draft.

## Meaningful tests

Use unit tests for pure scoring, phase transitions, locking, schema and semantic validation, deterministic generation, and round-trip serialization. Browser integration tests should verify simultaneous keyboard use, repeat suppression, independent submissions, blur handling, completed-match flow, and editor test mode. Prefer representative state fixtures and boundary tests over snapshots that merely repeat implementation details.

Scoring fixtures include the original 29.24 versus 53.34 result, both-wrong contributions, no per-round points, and a displayed-centisecond tie. Geometry fixtures include the large box counting once, four stacked unit entities counting four, volume collisions, missing support, and invalid reveal lists. A full ten-round scripted input run verifies that countdown and reveal time never accumulate into answer totals.

## Performance targets

Target a stable 60 Hz presentation on a typical desktop at 1280 by 720, immediate counter updates on the next frame, and no layout shifts during exposure. These are development targets requiring measurement, not guarantees. The initial content cap is small enough for SVG. Profile before adding a canvas or WebGL renderer. Critical assets are local; gameplay starts only after fonts and required sounds are ready or an explicit silent fallback is selected.
