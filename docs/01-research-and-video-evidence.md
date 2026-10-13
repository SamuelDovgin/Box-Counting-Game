# Research and video evidence

## Findings that change the earlier proposal

All three identified videos were downloaded with the installed yt-dlp, using the Chrome session with the user’s explicit permission, and examined locally as extracted frames. This resolves several major uncertainties in the pasted notes. The complete Hadski Box Counting session contains ten rounds. The final result adds five seconds for each mistake to each player’s accumulated answering time, and the lower adjusted time wins. Stacks, a large box, brief flashes, and boards that travel across the screen are present in this original-game recording. They are not merely proposed extensions.

The answer is the number of distinct boxes, not necessarily occupied unit volume. At approximately 5:51.7, one broad unsegmented box occupies a larger footprint than the adjacent small boxes. At approximately 5:55.5 the game reveals four boxes in total. A height-map sum would miscount that scene. Level data therefore needs explicit box objects with dimensions.

## Sources and local provenance

| ID | Source | What was inspected |
| --- | --- | --- |
| S1 | Nintendo UK product page | Official description and embedded video links |
| V1 | Nintendo UK Box Counting 1 | Downloaded 7-second clip, 60 fps container; full sequence sampled |
| V2 | Nintendo UK Box Counting 2 | Downloaded 5-second clip, 60 fps container; countdown, display, hide |
| V3 | Hadski Gaming two player head to head | Downloaded 419-second recording; complete Box Counting segment inspected |
| S2 | Nintendo World Report review | Independent description of count and submit shoulder buttons |
| S3 | Playgama browser adaptation listing | Comparison only; its rules do not establish Nintendo rules |
| U1 | User supplied screenshot | Both panels show result feedback; original file preserved |

S1: https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Dr-Kawashima-s-Brain-Training-for-Nintendo-Switch-1656777.html

V1: https://www.youtube.com/watch?v=JfkkS7yH4Co — uploaded 25 November 2019, as reported by video metadata.

V2: https://www.youtube.com/watch?v=9PZazcFJEvk — uploaded 12 December 2019, as reported by video metadata.

V3: https://www.youtube.com/watch?v=2SR6dQM1BDc — Hadski Gaming, uploaded 12 January 2020. The video’s chapter label places Box Counting at 5:11, but its instructional material starts before that. The result chapter is labeled 6:45; results begin appearing earlier.

S2: https://nintendoworldreport.com/review/52510/dr-kawashimas-brain-training-for-nintendo-switch-switch-review

S3: https://playgama.com/game/try-to-count-the-boxes-brain-training

Accessed 13 October 2026. Video files and original metadata are under references/videos. Extracted evidence and timestamped contact sheets are under references/frames. Downloads initially failed anonymously; authenticated Chrome access succeeded. No cookies were exported into this project. Do not publish raw download metadata, which can contain temporary media URLs, as application assets.

## What the official clips show

V1 shows an empty dotted grid with a 3, 2, 1 countdown, a brief white and gray six-box formation, then an empty board and independent counters. One player locks before the other. The submitted counter becomes a plain black number. After both lock, the boxes return and turn green in sequence as the large central total counts upward; both sixes receive checks. This is stronger evidence than the pasted summary for the input and reveal treatment. The clip does not contain a complete match or its scoring screen.

V2 shows the same countdown and a different small arrangement, followed by disappearance and a question. It is a short promotional challenge excerpt with no complete player-answer or match-result sequence. It cannot establish penalties or match length.

## What the full recording establishes

At approximately 5:00–5:08, the game instructions describe a momentary view followed by number entry after the boxes disappear. At approximately 5:15–5:17, the button check asks for ZL or ZR, then L or R. At approximately 5:17–5:20 there is an initial large circular countdown. Each puzzle also has its own smaller 3, 2, 1 countdown on the empty grid.

The board sometimes stays in place and sometimes travels diagonally through the view. In travelling rounds, the empty board is also absent while the players answer. Therefore “the grid always stays visible” and “the arrangement is always stationary” are both incorrect universal rules. Counters remain fixed at the screen edges while the puzzle layer moves.

There is no visible answer countdown. In round ten, Player 2 spends about 10.88 seconds answering, so the earlier proposed eight-second limit would truncate a demonstrated original round. Both players can make mistakes and still proceed. A submitted player waits for the other before correctness is revealed.

## Round observations from V3

Times are seconds from the start of the downloaded recording, not from its chapter. Visual sampling at half-second intervals established the sequence; 60 fps decoded frames and small HUD pixel regions refined answer-window boundaries. Treat these as measurements of this recording with roughly 0.04-second practical uncertainty, not original engine constants. The creator’s subscribe overlay obscures part of the last left counter.

| Round | Answer opens | P1 submits | P2 submits | True count | P1 and P2 guesses | Structure |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 324.367 | 325.333 | 325.050 | 3 | 3 and 2 | Two adjacent and one isolated |
| 2 | 329.333 | 331.133 | 332.150 | 6 | 6 and 7 | Compact flat group and isolated box |
| 3 | 336.400 | 337.967 | 338.400 | 5 | 5 and 5 | Two two-high stacks and a singleton |
| 4 | 342.983 | 344.850 | 348.150 | 5 | 4 and 6 | Travelling flat formation |
| 5 | 352.317 | 353.617 | 354.567 | 4 | 4 and 4 | Large box plus three small boxes |
| 6 | 358.983 | 361.967 | 362.667 | 7 | 7 and 7 | Travelling stacks of four and two plus one |
| 7 | 367.000 | 369.517 | 369.250 | 8 | 8 and 8 | Two rows of four |
| 8 | 373.267 | 374.500 | 374.733 | 3 | 3 and 3 | Very brief flat group |
| 9 | 378.650 | 380.000 | 380.800 | 4 | 4 and 5 | Fast travelling four-box formation |
| 10 | 384.367 | 393.033 | 395.250 | 24 | 24 and 24 | Five by five arrangement missing center |

The rounded frame measurements sum to 24.25 seconds for P1 and 33.35 seconds for P2, each 0.01 seconds above the displayed 24.24 and 33.34. This discrepancy is within the recording measurement uncertainty. This supports accumulating the individual answer times across all rounds, including mistakes, and excluding the countdown and other player’s remaining answer time.

## Timing observations

Static Watch intervals in rounds 1, 2, 3, 5, and 7 measure approximately 0.77 seconds in the encoded recording. Round 8 is approximately 0.10 seconds; round 10 approximately 0.25 seconds. Travelling formations are visible for roughly one second in rounds 4 and 6, and about half a second in round 9, depending on whether partially offscreen geometry is counted. Those moving intervals are not interchangeable with a stationary exposure timer.

The first per-puzzle countdown is about three seconds; subsequent countdowns are about two seconds total. The large initial countdown is another approximately three seconds. Box reveal advances object by object, roughly twelve per second in the final 24-box scene, then holds the completed answer briefly. Browser constants chosen from these observations are documented separately and remain approximations.

## Winning formula directly shown

At approximately 6:45, the result screen displays:

| Player | Time | Mistakes | Penalty | Adjusted time | Outcome |
| --- | --- | --- | --- | --- | --- |
| 1 | 24.24 s | 1 | 5.00 s | 29.24 s | Winner |
| 2 | 33.34 s | 4 | 20.00 s | 53.34 s | Loser |

Thus the observed formula is adjusted time = accumulated answering time + 5 seconds × mistakes, with lower adjusted time winning. There are no displayed per-round win points. The footage does not test exact ties, an indefinitely idle player, a counter above 99, decrement behavior, or the original pause rules.

## Corrections to the pasted notes

Replace the proposed 100-plus-10 point formula with adjusted time. Replace the assumption of flat-only Classic with a varied ten-round reference pack including stacks, movement, and different box sizes. Replace the universal height sum with the number of explicit box entities. Replace the one-to-three-second preview with measured brief exposures. Replace the eight-second default answer timeout with waiting for both players. Preserve the two-button tally mechanic, white/gray challenge palette, green reveal, and single shared puzzle.

The supplied image’s left caption calls its panel the counting challenge, but that panel visibly contains green boxes, a revealed total, and a green check. It is result-state imagery. V1 now independently confirms the actual white/gray Watch state. The earlier example height matrix sums to ten, but that representation only works when every entity is a unit cube.

## Remaining uncertainty and verification gate

One full match does not prove a universal fixed ten-round level order, all possible original layouts, or all difficulty modes. It establishes a ten-round observed session and its ten patterns. Exact original easing, fonts, audio waveforms, sub-frame timers, tie policy, maximum idle time, and randomization rules remain unverified. Implement the explicit defaults in this package and do not call them byte-for-byte or frame-perfect emulation. Additional sessions would be needed to establish original procedural distribution and rare outcomes.
