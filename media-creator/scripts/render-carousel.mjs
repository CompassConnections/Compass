// Exports one settled still per Intro scene as a 4:5 Instagram carousel slide.
//
// Each frame is picked mid-scene — after the entrance animations have settled and
// before the scene cross-fades out — from the schedule `S` in src/scenes/Intro.tsx.
// If you change scene timings there, update the `frame` values here to match.
//
// Run with:  npm run render:carousel   ->  out/carousel/01-logo.jpg … 06-cta.jpg
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

const OUT_DIR = join('out', 'carousel');
mkdirSync(OUT_DIR, {recursive: true});

// name (drives upload order via the numeric prefix) -> absolute frame in IntroPost
const SLIDES = [
  {name: '01-logo', frame: 78},
  {name: '02-hook', frame: 190},
  {name: '03-what', frame: 315},
  {name: '04-features', frame: 495},
  {name: '05-vision', frame: 602},
  {name: '06-cta', frame: 720},
];

const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

for (const {name, frame} of SLIDES) {
  const output = join(OUT_DIR, `${name}.jpg`);
  console.log(`→ ${output}  (frame ${frame})`);
  execFileSync(
    bin,
    [
      'remotion',
      'still',
      'IntroPost', // 4:5 canvas — see FORMATS in src/theme.ts
      output,
      `--frame=${frame}`,
      '--image-format=jpeg',
      '--jpeg-quality=95',
    ],
    {stdio: 'inherit'},
  );
}

console.log(`\nDone — ${SLIDES.length} carousel slides in ${OUT_DIR}/`);
