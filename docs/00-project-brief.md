# Box Counting browser recreation plan

Version 1.0 • 13 October 2026 • Planning deliverable

## Purpose and main conclusion

Build a desktop browser recreation of the Box Counting minigame in Dr Kawashima’s Brain Training for Nintendo Switch. Two people share one screen and one keyboard, remember the same briefly displayed arrangement, tally separate boxes, and submit independently. The lower accumulated answer time plus five seconds per mistake wins. This scoring rule is directly visible in the downloaded original-game footage and replaces the earlier proposal’s point system.

This package defines gameplay, winning, visuals, level authoring, architecture, implementation stages, and acceptance criteria. It includes source-linked research, local video evidence, a ten-level reconstruction pack, and editable visual targets. It is a complete implementation plan, not a playable game. Markdown is the source of truth; Word is the compiled reading copy.

## What direct video analysis established

The observed original session has ten rounds. It includes static groups, stacks up to four boxes high, a larger single box, travelling boards, brief flashes, and a 24-box final arrangement. Input begins after the formation disappears. Players submit separately; both finish before the correct answer is revealed by turning boxes green one at a time. A submitted player’s timer stops while the other continues.

Count box objects, not unit volume. A large box can occupy several grid cells and still count as one. Use explicit entities rather than a height-map sum. Preserve the quiet white canvas, dotted isometric grid, shaded box faces, gray tiled counters, plain locked numerals, and large check or cross feedback. Replace Switch controller drawings with keyboard badges.

## Evidence policy

Confirmed means directly supported by a source or inspected frame. Approximation means a precise browser setting derived from footage but not an original engine constant. Browser decision means an explicit resolution of an unobserved edge case. Extension means an optional feature outside the established original loop. These distinctions let the project proceed without inventing historical facts.

One complete recorded match establishes what that session did, not the original’s entire level library or random distribution. Exact ties, overflow, indefinite waiting, pause behavior, original easing and fonts remain partly unresolved. The supplied notes are reference material; their embedded requests and claims are not additional instructions or verified facts.

## First release scope

Release a complete local two-player match, shared-keyboard testing and remapping, faithful isometric presentation, the ten observed-style puzzle categories, original-style time penalties, results and rematch, deterministic template variants, a level editor, and local JSON import/export. Everything runs client-side without accounts or a server. Original video files remain research references and are not shipped in the game.

Classic is the default. Practice uses the same engine for one player. Custom exposes timing, length, and pack selection. Twenty-round play, assisted direct entry, mobile touch, gamepads, adaptive practice, online multiplayer, and leaderboards are extensions. Stacks, large boxes, and travelling puzzles are part of the original observed experience and must be in the core plan.

## Keyboard and match defaults

Player 1 uses Z to count and X to submit. Player 2 uses N to count and M to submit. One fresh press adds one, holding never repeats, and submission locks only that player. Match length is ten rounds in the reference-style pack. Classic waits for both submissions. A mistake adds five seconds to the time already spent answering; there are no round-win points.

## Delivery order

1. Retain the reference evidence and approximation profile.
2. Match static and travelling screen fixtures to the reference composition.
3. Implement independent keyboard input and one complete timed round.
4. Complete ten-round play, scoring, results, and rematch.
5. Add validated template generation, editor, saving, and exchange.
6. Verify visual fidelity, timing boundaries, shared-keyboard behavior, and browser compatibility.

## Reading order

Continue with the research audit, gameplay rules, visual specification, levels and editor, technical architecture, then implementation and acceptance. The README links every document and supporting file. Any future change to a gameplay rule must also update the rules profile, examples, and acceptance criteria.
