# Levels and editor

## Model the actual countable objects

Use a list of axis-aligned box entities, each with an ID, integer x, y, z origin, and positive integer width, depth, and height. The answer is boxes.length. A large rectangular box is one object; four separately listed touching boxes are four. A height map may be converted into unit entities as an import convenience, but it is not the canonical format. This directly addresses the larger box observed in V3 round five.

Keep the board five by five for the reference pack. Support vertical stacks up to four unit boxes in the initial content, as observed in round six. Every object starts on the ground or is fully supported by boxes below it. Validate occupied unit voxels for collisions and support; visual identity is still per entity, never per voxel. Disallow intersecting volumes, floating boxes, negative coordinates, and partially unsupported overhangs in first release.

## Starter pack

The supplied JSON pack contains ten authored reconstructions based on the observed sequence. Counts, structures, and revised grid coordinates follow the decoded V3 Watch/Reveal frames; motion endpoints and precise exposures remain approximations, not recovered Nintendo level files. Keep a provenance label on the pack and each level.

| Round | Pattern | Objects | Presentation |
| --- | --- | --- | --- |
| 1 | Pair and separated singleton | 3 | Static, 750 ms |
| 2 | Five connected boxes plus one | 6 | Static, 750 ms |
| 3 | Two two-high stacks plus one | 5 | Static, 750 ms |
| 4 | Three in a line, gap, and offset pair | 5 | Diagonal travel, 1200 ms path |
| 5 | One broad box plus three unit boxes | 4 | Static, 750 ms |
| 6 | Four-high stack, two-high stack, singleton | 7 | Diagonal travel, 1200 ms path |
| 7 | Two separated rows of four | 8 | Static, 750 ms |
| 8 | Three-box corner | 3 | Flash, 100 ms |
| 9 | Two small adjacent groups | 4 | Faster opposite travel, 700 ms path |
| 10 | Full five by five minus center | 24 | Flash, 250 ms |

The level order demonstrates why “add more cubes every round” is inadequate. Challenge also comes from travel speed, exposure, object size, grouping, stack boundaries, and misleading occupied area. The final arrangement is easy to reason about as 25 minus one despite having many objects; it also requires 24 tally presses. Input effort is part of the original competition.

## Data contract

Pack version 1 has id, title, provenance, rulesProfile, and levels. Each level has a unique id, name, boardSize, boxes, presentation, and revealOrder. Each box has id, x, y, z, w, d, h. Static presentation has kind and durationMs. Moving presentation additionally has from and to offsets in canonical screen pixels relative to the standard board origin. Reveal order must list every box ID exactly once.

Geometry is immutable during a match. Do not persist a manually editable correct-answer field. Compute it from the validated object array. Saved results contain the resolved geometry, pack ID, rule version, and per-player submissions, so replays survive generator changes. When importing older height-map data, convert each unit cube into one entity and label the conversion; never assume a large box was intended.

Use the accompanying JSON Schema for basic structure and the separate semantic validation checklist for relationships that JSON Schema cannot prove. A level may have 1–99 objects. Board size is 5 in Classic; Custom may later allow 3–8. Limit coordinates and dimensions so complete boxes fit inside the board, with vertical extent at most four in initial release.

## Deterministic procedural generation

Generation is an extension for replayability, not a reverse-engineered original algorithm. Begin with the observed ten structural families. A seed plus generator version, family, and rules profile must always produce the same ordered object list and motion path. Choose an explicit versioned PRNG such as a documented 32-bit algorithm, lock its implementation, and store representative seed fixtures. Do not use Math.random for reproducible generation.

Generate a target object count, select a template, place grounded objects without overlaps, and then create supported stacks or a clearly bounded large box if that family permits it. Count entities. Evaluate visibility across the entire Watch path. Reject geometry if any object’s identity cannot be distinguished in at least one readable frame. Ground-support reasoning must never require guessing an entirely hidden extra object. For initial release, use audited templates and a finite variant set instead of a speculative “occlusion score” that gives false confidence.

Normalize geometry into an ordered signature to detect repeats. Avoid exact repeats within a match; do not reject all rotated patterns, because camera occlusion can change their readability. Cap generation at 100 attempts, then use a prevalidated fallback in the requested family and record the fallback. Never loop indefinitely or silently return an invalid board.

## Difficulty and custom modes

Keep the ten observed-style categories as the Classic progression. For custom generation expose Gentle, Standard, and Intense presets that adjust exposure, travel, stack complexity, and count ranges together. Exact values require playtesting; they are not original difficulty names. Keep both players on identical layouts and timings. Disable adaptive changes during a Classic match. Practice may let the user choose a family and exposure directly.

The release implements the ten-level Classic pack, generated Quick/Full matches, Endless solo practice, per-puzzle practice, Custom packs, Video Challenge, Pattern Ladder, Motion Gauntlet, and Endless Duel. Pointer count/submit buttons supplement the keyboard. Three named fixed 20-level packs and direct number entry remain future ideas. A shuffled custom pack should preserve the user’s selected order unless Shuffle is explicitly enabled.

## Editor workflow

The editor opens with the same projection and face style used by the game. Choose Add unit box, Add large box, Select, Move, Resize, or Delete. Display the selected entity’s coordinates and dimensions in a side panel. A ground-cell click places a unit box; clicking a valid supporting top face stacks one. Large-box placement requires explicit dimensions. Never turn several unit boxes into a large box merely because they touch.

Show object count, occupied volume as a separately named diagnostic, support and collision status, and a live playable preview. Clearly distinguish “4 boxes” from “7 occupied unit cells” in the large-box example. Selected-object highlight is editor-only. Provide clear, undo, redo, duplicate, rotate layout, and reset view. Rotating a layout revalidates visibility.

The release provides Stationary or Travel, exposure/path duration, left/right direction, and reveal-order buttons. Test mode shows the full moving presentation. Free-form endpoints and timeline scrubbing remain editor refinements. Drag boxes in reveal order or use a deterministic back-to-front default; keep the order stable on export. A Test button runs the normal engine with editor answers hidden. Return restores the unsaved editor draft.

## Saving and exchange

Save named drafts locally and mark unsaved changes. A pack editor orders, duplicates, and removes levels. Export plain JSON with schemaVersion and provenance. Import validates size, JSON structure, unique IDs, bounded integer geometry, support, collisions, timing ranges, and reveal membership before anything is playable. Present errors with level and box IDs. Never replace an existing pack without an explicit replace-or-copy choice. Use text rendering for imported names, never HTML injection.

Initial limits: 1 MB per imported file, 50 levels per pack, 99 objects per level, names up to 80 characters, static duration 100–10000 ms, travel duration 300–10000 ms. Exact 100 ms flashes match an observed category but are inappropriate for some players; custom timing is available. Storage errors preserve the in-memory draft and offer export. Saving success must reflect an actual completed write.

## Level acceptance

Every included fixture must pass schema and semantic validation, render with distinguishable object boundaries, produce the correct entity count, reveal each entity once, and survive save-export-import round trips unchanged. Inspect the large-box, four-high tower, fast motion, and 24-box fixtures separately. A geometry-valid level is not automatically visually fair; manually audit the authored release pack and all generator templates.


## Enforced visibility rule

Every playable object must expose a complete camera-facing face under the actual render order. This now runs automatically in generation, imports, editor saves and tests, and at the engine boundary. Paths must also show each complete travelling box inside the common desktop/phone canvas for at least 80 ms. Existing unfair saved layouts are preserved for repair or export, with play disabled. See [visibility and motion verification](13-visibility-and-smooth-motion.md).
