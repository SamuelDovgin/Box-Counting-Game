# Gameplay and winning rules

## Player experience

Two people share one keyboard and one screen. They check their buttons, start a match, watch a brief arrangement of boxes, and recall how many separate boxes it contained. Each repeatedly taps their own count button and then submits. Once both have finished, the arrangement reappears and each box turns green as the correct count is demonstrated. The next puzzle follows automatically. After ten rounds, the player with the lower total answering time plus mistake penalties wins.

Sources V1 and V3 establish this loop. The observed scoring formula and ten-round session replace the earlier point-based proposal. Browser-specific edge cases below are labeled as decisions rather than claims about Nintendo.

## Shared keyboard controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Add one to answer | Z | N |
| Submit answer | X | M |
| Alternative preset | A then S | K then L |
| Pause shared game | Escape | Escape |

These physical keys replace the original’s ZL or ZR count button and L or R submit button. The controls are our browser mapping, not a claimed original keyboard mapping. Include remapping, a test screen, and visible keycaps. Each of the four actions must have a unique key. Both players test their count key, then their submit key; each completed check gets a green tick. Both ready up before a match.

Input is discrete: one fresh keydown increments once; key repeat and a second keydown while the same key is held do nothing. Holding count while pressing submit must still submit. One player’s input never blocks the other. On a non-US layout, bind physical positions with KeyboardEvent.code and use available layout labels for display. Provide the alternative preset when a keyboard cannot register the default combinations. Never promise that software can repair hardware ghosting.

## Round state machine

| State | Implementation timing | Board and HUD behavior |
| --- | --- | --- |
| Controls and ready | User driven | Keyboard test and two ready states |
| Match countdown | 3 × 1000 ms | Large circular 3, 2, 1, once per match |
| Puzzle countdown | First 3 × 1000 ms, later 3 × 667 ms | Empty centered grid, smaller numeral, faint disabled counters |
| Watch | Per level | White and gray boxes; counters remain disabled |
| Answer | Until both submit | Active two-digit counters; stationary grid remains, travelling grid is gone |
| Pre reveal | 500 ms after last submission | Both guesses shown as plain black numbers |
| Count reveal | 83.33 ms per box | Reappear at center; progressively turn boxes green and raise central total |
| Result hold | 500 ms | Full green arrangement; checks or crosses over submitted numbers |
| Next puzzle | Immediate | Reset counters and enter the next puzzle countdown |
| Match end | 2000 ms then result summary | Dark overlay, End, followed by two result columns |

Durations are approximation defaults based on video observations, not recovered game constants. Watch is 750 ms for ordinary static examples, 100 ms for the flash example, and 250 ms for the dense final example. Travelling rounds use a defined path duration; do not also add a static preview. First and subsequent countdown lengths differ in the observed recording. Keep these values in a versioned rules profile, not scattered through rendering code.

The first input opportunity is the Answer state after Watch ends. Inputs during countdown or Watch are ignored, never buffered. At Answer entry reset both guesses to 00 and start each player’s elapsed-answer timer from the same boundary. A submitted player stops their own timer immediately. Their tiled counter becomes a plain numeral and their input is locked. The other player continues answering. Correctness remains hidden until both submit.

Do not automatically reveal when the first player is correct. Do not grade an unsubmitted counter. Do not use an eight-second cutoff in Classic; the reference includes an answer lasting more than ten seconds. No exact original maximum wait was established. Our Classic waits indefinitely, with Pause and Abandon match available. After thirty seconds, a subtle help hint may appear without forcing a guess or exposing the answer.

## What counts as a box

Count explicit box objects. A single wide unsegmented box counts as one even when it spans several grid cells. A column drawn as four separate stacked boxes counts as four. Large object faces must not have internal unit-grid seams. The same list of object IDs drives rendering, answer validation, green reveal order, and the editor’s answer total. No invisible decorative geometry contributes to the answer.

## Correctness and round feedback

Each player receives a green check for an exact submitted count or a red cross for a different count. A faster wrong answer can still lose after its time penalty; a slower correct answer is not automatically the match winner. There are no per-round winner points in Classic. Both players may receive checks or both crosses.

Examples: true total six, P1 submits six after 1.30 seconds and P2 submits seven after 1.10 seconds. Their contributions to adjusted match time are 1.30 and 6.10 seconds. If both submit six after 1.30 and 1.36 seconds, their contributions remain 1.30 and 1.36; there is no 100-millisecond speed-tie band. If both are wrong, both get five-second penalties in addition to the time each used.

## Match winner and statistics

For each player, accumulated time is the sum of their answer elapsed times across all completed rounds, including wrong answers. Mistakes is the number of wrong submitted counts. Adjusted time equals accumulated time plus 5000 milliseconds per mistake. Lower adjusted time wins. The recording’s result is 24.24 + 1 × 5 = 29.24 seconds versus 33.34 + 4 × 5 = 53.34 seconds.

Store high-resolution elapsed times and apply penalties in milliseconds. Browser decision for ties: round each final adjusted total to the nearest 10 milliseconds, display two decimal places, and declare a draw if those displayed totals match. This avoids apparently identical displayed scores naming different winners. The original tie rule is unverified. Do not compare number of correct answers or average time as hidden tiebreakers.

Show Time, Mistakes multiplied by 5 seconds, Added penalty, and Total in each result column. Mark Winner and Runner up, or Draw in both columns. Runner up is a deliberate wording substitution for the original’s Loser. Accuracy and per-round times belong in an optional Details panel. A match result is settled exactly once; animations and rerenders cannot change it.

## Edge cases and interruption decisions

The browser tally starts at zero, uses two digits, and clamps at 99 rather than wraps. Original overflow behavior was not observed. A zero submission is valid input but wrong on every standard puzzle. Classic has no decrement because none was established in the two-button instructions; assisted practice can offer corrections as a separate option.

At focus loss, tab hiding, or Escape, replace all gameplay with an opaque pause overlay and stop accepting input. For an interrupted unscored round, void the attempt and choose a fresh puzzle of the same category after both players resume. Keep earlier completed rounds. This prevents additional study time from being rewarded. Record the voided attempt. If an authored pack has no replacement, offer to continue that puzzle as unranked practice or end the match incomplete. A travelling board resumes only on a new attempt, never halfway through a scored exposure.

If paused after settlement, retain the outcome and remaining animation time. Clear held-key state on blur; require all action keys to be released before ready input is armed again. A page refresh abandons the live match but retains saved levels and settings. Abandoning does not declare a winner. These are browser decisions; original pause and recovery behavior remains unverified.

Optional timed Custom mode sets the same answer limit for both players. At its deadline, an unsubmitted guess is No answer, contributes the full limit plus one five-second mistake penalty, and cannot become a correct answer by coincidence. Handle events at the deadline as expired. This extension is clearly named and disabled in Classic.

## Match setup and repeat play

Default to the ten-round reference-style pack. Practice allows one player and selectable puzzles. Custom supports one through fifty rounds, authored packs or deterministic generation, and clearly labeled timing overrides. Twenty rounds is a custom option, not the claimed original format. Changing rules mid-match ends or restarts the match after a visible choice; settings do not silently affect only the remaining rounds.

After results offer New match, Replay these puzzles, Details, and Menu. Replaying the same puzzles is marked Practice because the arrangements are known. Both players ready up for a new competitive match. Use brief prompts matching the footage: Try to count the boxes, then How many boxes were there. Keyboard instruction text remains beside each player’s counter during input.
