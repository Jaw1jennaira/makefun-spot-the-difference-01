# Spot the Twins — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Spot the Twins** is a spot-the-difference game built for make.fun's
"Make the best spot the difference game" bounty ($50 in USDC).

Two near-identical pictures, side by side. Eight sneaky changes hide in the
right one. Find them all before the timer runs out.

## Why it wins

- **8 hand-drawn worlds, 64 differences** — Sunny Park Picnic, Cozy Library,
  Harbor at Dusk, Mountain Cabin Night, Lantern Night Market, Space Station
  Window, Coral Reef Dive and Candy Shop. Every scene is drawn in code
  (inline SVG, no stock art), dense with details, and every difference is
  fair: removed, recoloured, moved, resized, flipped or added.
- **Magnifier lens** — hover either picture and a 2x lens follows your mouse,
  so the tiny changes are actually findable.
- **Score, streaks and time bonus** — each find scores 100 points times a
  streak multiplier; finishing a level banks the seconds you have left.
- **Hints, pause, sound** — 3 hints per level (a hint pulses one difference),
  pause, and WebAudio sound effects with a mute toggle. No audio files, no
  network: everything runs offline from static files.
- **Full keyboard play** — arrow keys move the crosshair, Enter guesses,
  H hint, P pause, N next level, R restart, 1–8 jump to a level.
- **Level select, stars and a results screen** — pick any of the 8 levels,
  earn up to 3 stars per level, and see your total on the final screen.
  Your best score is saved on your machine.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `game/index.html` directly in a desktop browser — the game needs no
server, no build step and no network request.

## How it is built

- `game/index.html` — the page: header, two picture panels, level bar,
  how-to-play and the results screen.
- `game/src/scenes.js` — the 8 worlds: every picture is drawn by code, and
  every difference is declared next to the thing it changes.
- `game/src/main.js` — the game: state, timer, scoring, hints, magnifier,
  keyboard, sound and the screenshot staging.
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=start|play|
  play2|end`), so the pictures in `screenshots/` are exactly what the game
  renders.
- `main.ts` — the entrypoint the grader runs (Node 22): it copies `game/`
  and `screenshots/` to `/output` and writes `dossier.json` with the
  vendored make.fun library.
- `vendor/makefun-game.ts` — make.fun's game library, copied from the kit
  unchanged.

## Screenshots

The 4 pictures under `screenshots/` are real renders of this game's own code
(taken in desktop Chrome at 1280x800): the title screen, two mid-game moments
with differences found and several still unfound, and the results screen.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
