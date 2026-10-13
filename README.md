# Box Counting

A complete local browser game is included. Run `python3 tools/serve_game.py`, then open [Box Counting](http://127.0.0.1:8765/). No installation or build is needed.

## GitHub Pages

The hosted game will be available at [Box Counting](https://samueldovgin.github.io/Box-Counting-Game/) after GitHub Pages is enabled and the deployment succeeds.

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages**. If the first run failed before Pages was enabled, choose **Re-run all jobs**, or use **Run workflow** on `main`.

Every push to `main` runs the game tests and deploys `dist/` using `.github/workflows/pages.yml`. The workflow publishes only the playable game; research files and downloaded video references are excluded from the deployed site. No build command or custom domain is needed.

Play Classic (10 reconstructed rounds), Quick (5 fresh puzzles), Full (20 fresh puzzles), Endless solo practice, individual puzzle practice, a Custom match, Video Challenge (12 traced layouts), Pattern Ladder, Motion Gauntlet, a customizable Endless Duel, or Difficulty Climb through ten tiers. The Puzzle generator creates batches of 1–50 levels with a target tier, style, presentation and seed; save, export, edit or play them. Each puzzle has a calculated 0–100 difficulty score. [Generation and difficulty scoring](docs/12-puzzle-generator-and-difficulty.md) explains the factors and configurable climb. Create and save levels, arrange packs, import/export JSON, remap controls, and review or replay completed sessions. Player 1 uses **Z/X**; Player 2 uses **N/M**. Phones automatically show left/right Count and Submit buttons, including a keyboard-free control check. [Phone play and testing](docs/11-phone-controls.md) covers the layout and local-network preview. [Game instructions and release status](docs/08-playable-prototype.md) explain all modes and winning rules.

A researched implementation plan for recreating the Box Counting minigame from Dr Kawashima’s Brain Training for Nintendo Switch in a browser, with two players sharing one keyboard.

**Key discovery from downloaded footage:** the original uses accumulated answer time plus **five seconds per mistake**, and the lower adjusted time wins. It also includes stacks, moving boards, and larger boxes that count as one. The earlier pasted point system and unit-cube-only model have been corrected.

## Start here

- [Project brief](docs/00-project-brief.md)
- [Research and timestamped video analysis](docs/01-research-and-video-evidence.md)
- [Gameplay loop and winning rules](docs/02-gameplay-and-winning.md)
- [Visual and audio specification](docs/03-visual-and-audio-specification.md)
- [Levels and editor](docs/04-levels-and-editor.md)
- [Technical architecture](docs/05-technical-architecture.md)
- [Implementation and acceptance](docs/06-implementation-and-acceptance.md)
- [Complete editable Word document](output/Box-Counting-Game-Plan.docx)

## Supporting artifacts

- [Video and endless-duel expansion](docs/10-video-layouts-and-endless-duel.md)
- [Twelve-level video challenge pack](data/video-pack.json)
- [Ten-level reconstruction pack](data/reference-pack.json), [schema](data/level-pack.schema.json), and [rules profile](data/rules-profile.json)
- [Watch visual target](assets/visual-targets/watch.png), [answer visual target](assets/visual-targets/answer.png), and [reveal visual target](assets/visual-targets/reveal.png); editable SVGs sit beside the PNGs
- [Observed large box](references/frames/large-boxes.png) and [observed final score](references/frames/final-score.png)
- [Original supplied notes](references/original-notes.txt) and [supplied screenshot](references/user-reference.png)
- [Validation record](docs/07-package-validation.md)

## Downloaded video references

- [Nintendo Box Counting 1](https://www.youtube.com/watch?v=JfkkS7yH4Co) — local file references/videos/JfkkS7yH4Co.mp4
- [Nintendo Box Counting 2](https://www.youtube.com/watch?v=9PZazcFJEvk) — local file references/videos/9PZazcFJEvk.mp4
- [Hadski two-player recording](https://www.youtube.com/watch?v=2SR6dQM1BDc) — local file references/videos/2SR6dQM1BDc.mp4

Research files include private temporary download metadata and are not production assets. Do not publish the references/videos directory in a game build. No cookies were exported into this workspace.

The Word document is the original planning snapshot. The playable files are under dist. Original rules are separated from measured approximations and explicit browser decisions; the game status describes the implemented release and remaining fidelity refinements.


## Verification

Run `node --test tests/*.test.mjs` for the 43 checks covering scores, full matches, timers, pausing, generation, geometry, imports, and persistence. [Release QA](docs/09-release-qa.md) records browser checks and practical limits.
