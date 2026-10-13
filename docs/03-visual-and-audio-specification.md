# Visual and audio specification

## Fidelity target

Recreate the visual grammar directly observed in V1 and V3: almost white canvas, a small dotted isometric grid, flat white tops and two gray side tones, crisp dark edges, black sans serif instructions, gray two-digit tally tiles, plain black submitted values, and green sequential reveal. Keep the generous empty space. The original gameplay screen has no persistent score dashboard, progress bar, giant colored player cards, or three-dimensional camera orbit.

Use newly drawn geometric assets. Switch controller pictures become cyan and coral keyboard badges; Nintendo branding, the instructor’s face, and the glowing brain result artwork are replaced with simple original interface elements. These substitutions keep the player positions and information hierarchy. The downloaded footage is reference material, not a production asset bundle.

## Screen composition

Use a canonical 1280 by 720 design canvas, scaled uniformly and letterboxed when needed. Normalize reference screenshots to the actual game content rectangle before comparing; V3 includes thin black capture borders and a creator overlay that must not become UI. The supplied collage adds rounded cards, captions, cropping, and a bookmark icon: none belongs to the game.

| Element | Target position or size at 1280 by 720 | Status |
| --- | --- | --- |
| Prompt | Center x 640, baseline y 95, about 42 px | Approximation from footage |
| Countdown or revealed total | Center x 640, baseline y 195, 96 px | Approximation from footage |
| Board | Five by five, projected width 540 px and depth 312 px | Observed structure, approximate dimensions |
| Board ground origin | x 640, y 310 | Browser calibration target |
| Counter tiles | Bottom corners, two gray tiles about 94 by 132 px each | Approximation from footage |
| Submitted number | Bottom corners, about 110 px black text | Observed treatment |
| Player identity | Narrow cyan or coral badge at outer edge | Keyboard adaptation |
| Input legend | Inner side of each counter, 25 px labels | Keyboard adaptation |

The visual-target SVGs show the intended browser composition; they are proposed reconstructions, not Nintendo screenshots. Compare them against references/frames and revise during implementation. Preserve the board’s scale between countdown, display, and reveal. Tall stacks may extend upward; fit validated layouts inside the puzzle region without changing scale independently per round.

## Geometry and face treatment

Use an orthographic isometric projection. For world position x, y, z, project screen x = originX + 54 × (x − y), and screen y = originY + 31.18 × (x + y) − 62.35 × z. These values give approximately 30-degree ground edges. A unit box has four top corners and two visible vertical faces. Larger boxes use their own width, depth, and height with no internal seams across one object.

Render grid edges as fine dark gray dots with spacing around 3 px; foreground box fills cover hidden grid sections. Do not show the ground grid through opaque faces. Render only exposed faces, remove internal shared faces, and maintain distinct seams between separate touching boxes. A solid four-high prism is one object; four outlined unit boxes are four. This distinction affects the correct answer.

| Token | Initial value | Purpose |
| --- | --- | --- |
| Background | #F7F7F7 | Main canvas |
| Text and outlines | #111111 | Prompt and boxes |
| Grid | #797979 | Fine dotted ground edges |
| Watch top | #FFFFFF | Neutral top face |
| Watch left | #D9D9D9 | Lighter vertical face |
| Watch right | #999999 | Darker vertical face |
| Reveal top | #25F34B | Bright green top |
| Reveal left | #0BCB38 | Medium green face |
| Reveal right | #009A24 | Dark green face |
| Correct mark | #65D34D | Thick tick |
| Incorrect mark | #EC5A56 | Thick cross |
| Player 1 | #28CADD | Identity only |
| Player 2 | #F17869 | Identity only |
| Counter tile | #929292 | White numeral background |

These hexadecimal values are chosen calibration targets, not claimed extracted Nintendo palette constants. Start with Arial or a locally bundled metrically similar sans serif, normal-weight prompts and bold result numbers. Exact original font identification is unresolved. Avoid extra texture until side-by-side review establishes a need.

## State specific presentation

During the per-puzzle countdown, show an empty centered grid and a large 3, 2, 1 above it. Counters are extremely faint and inactive. During Watch, remove the numeral and draw the boxes in white and gray. Counters remain inactive. During Answer, activate the two gray digit tiles on each side and show keycap legends for +1 and Done. If a player submits, replace only their tiled counter and legend with a plain black number.

At reveal, center the board even when it previously travelled. Draw the original white formation, then turn one complete box at a time green while the central number increases. Highlight a large box as one entity in one step. The final answer is the number of objects highlighted. Add the check or cross only after this count finishes, using thick strokes over the submitted number while keeping that number recognizable. Shape and nearby accessible text convey correctness independently of color.

The match end dims the last scene under a dark overlay, briefly shows End, then introduces two evenly balanced result columns. Use an original simple circular completion emblem instead of copied brain artwork. Emphasize Winner or Runner up, player identity, raw time, mistakes and penalty, and the final adjusted time. The lower time is green; the other is neutral gray. The original’s reveal order suggests animating raw time, then mistakes, then total; final numbers must remain unchanged throughout presentation.

## Travelling board behavior

Move the complete board and its boxes as one flat projected layer. The HUD and prompt remain stationary. V3 includes diagonal travel from the upper right toward the lower left and a faster later travel in the opposite general direction. Use normalized authored path points and linear interpolation initially. Store motion independently from geometry and counting. The exact original easing and clipping limits need a later frame-overlay comparison.

A moving puzzle can begin and end outside the screen; the full formation must cross the readable viewport during its path. Once it leaves, the Answer state has no board. Reveal returns the arrangement to the normal center. Do not leave a second empty board behind during travel. Reduced-motion mode replaces travel with a stationary exposure and labels the match as assisted, because this changes the challenge.

## Menus and accessibility

Use a simple title screen with Play together, Practice, Create levels, and Settings. Explain the three steps with small geometric illustrations. Do not bring the editor toolbar, level metadata, or developer controls into active gameplay. Settings include volume, remapping, high contrast, reduced motion, and custom timings. Changing challenge-affecting settings marks the session Custom or Assisted.

Menus support tab navigation and visible focus. Reveal feedback has accessible text, not color alone. During a timed puzzle, never place hidden answer totals in aria labels, live regions, debug overlays, or focusable metadata. An alternative untimed accessible mode can describe arrangements, but it is a different experience from the visual competition. At narrow widths preserve the whole canvas and show a pre-match suggestion to rotate or use a larger screen. Desktop keyboard play remains the release target.

## Audio plan

The recordings preserve an audio reference, but this pass did not isolate and classify each sound event. Do not claim exact sonic reproduction. Plan original short count clicks, a submit tick, a soft countdown cue, object-by-object reveal ticks, correctness feedback, and a restrained end sting. Cue correctness only after both players are locked. Unlock browser audio on the user’s Start gesture. Volume and mute persist. Sound cannot be required to know when to answer or who won.

## Visual review gate

Capture matching countdown, Watch, Answer with both active, Answer with one locked, partial green reveal, final reveal, and match result states at 1280 by 720. Compare board bounds, prompt placement, box edge slopes, face tones, counter dimensions, and player positions against the reference crops. Permit only the documented keyboard, branding, and result-art substitutions. Check 1366 by 768 and 1920 by 1080 windows plus browser zoom. No clipping, distorted cubes, moving HUD, or invisible object boundaries passes review.
