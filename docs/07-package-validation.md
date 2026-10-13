# Package validation

Completed 13 October 2026.

## Research verification

Downloaded all three cited YouTube videos using the installed yt-dlp 2026.08.19 and the user-authorized Chrome session. Used ffmpeg to extract visual evidence. Inspected both official short clips and the full Box Counting segment of the Hadski recording. Recorded ten rounds, the visible guesses and answers, and the final time-plus-penalty result. The measured response interval sums differ from the displayed raw totals by 0.01 seconds per player, within the stated recording uncertainty.

The scripts tools/video_sheets.py and tools/measure_video.py support frame review. HUD threshold output includes false positives from checkmarks and the creator overlay and requires visual interpretation; it is not an unattended ground-truth detector. The curated measurements are references/round-measurements.csv. Contact-sheet labels are nominal sample positions; use decoded-frame measurements for fine timing.

## Supporting data validation

Validated data/reference-pack.json against the Draft 2020-12 schema using jsonschema 4.26.0. Semantic checks passed for unique level and box IDs, coordinate bounds, non-overlapping occupied volumes, full support, and reveal-order membership. The ten answers are 3, 6, 5, 5, 4, 7, 8, 3, 4, and 24. The original displayed scoring arithmetic produces 29.24 seconds and 53.34 seconds.

The validation script is tools/validate_pack.py; its dependency is declared in tools/requirements-validation.txt. Temporary installed validation dependencies are isolated under .qa. These checks validate planning fixtures, not an implemented game engine. The authored coordinates and path endpoints remain approximations and need playable visual review.

## Document and visual review

Compiled the seven main Markdown chapters into a 20-page editable Word document with reference screenshots and three newly drawn visual targets. Rendered the final DOCX and inspected all twenty page images. Checked titles, table headers and wrapping, margins, captions, images, and the absence of clipped content. Removed an inherited decorative title border. Intermediate PDF and page PNGs remain in .qa and are not the delivered document.

Inspected the Watch, Answer and Reveal target images in the rendered document. They express the intended composition and keyboard adaptation. They are design targets, not evidence of a playable build or a finished pixel-match implementation.

## Planning validation scope

The validation above covers the planning package. A playable frontend, keyboard loop, scoring, and authored ten-round match have since been implemented and tested as recorded in [the prototype status](08-playable-prototype.md). The editor and other full-plan features remain future work. Original tie handling, overflow, maximum idle behavior, exact easing, original font identity, full layout distribution, and individual audio cue matching remain unresolved. The plan supplies explicit browser defaults wherever a playable implementation needs a decision.
