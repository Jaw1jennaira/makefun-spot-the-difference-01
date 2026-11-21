// main.ts — the entrypoint the grader runs (Node 22, standard library only).
//
// Spot the Twins hands in three things:
//   game/         the playable game as static files (index.html + ES modules,
//                 no libraries, no network requests, no build step)
//   screenshots/  4 real renders of the game's own code (see shots.json)
//   dossier.json  the summary the judge reads, built by make.fun's vendored
//                 library from exactly what is handed in.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the game locally with `node serve.ts` (or open game/index.html).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The judge only ever sees the screenshots under screenshots/, so refusing
// to hand in an entry without them is safer than handing in a bare game.
if (!existsSync(join(out, 'screenshots', '1-start.jpg'))) {
  throw new Error('main.ts: screenshots/ is empty — take the 4 shots first (see shots.json)');
}

// The scorer's own caps: at most 4 screenshots, each at most 256 KiB; the
// game tree at most 993 files and 48 MiB in all, no path over 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
