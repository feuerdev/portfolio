# feuer.dev

Jannik Feuerhahn's website: a plain HTML document with an optional animated fancy mode,
published to [feuer.dev](https://feuer.dev) with GitHub Pages.

## Run locally

Use Node **24.15.0** from `.nvmrc`, with tested npm **11.12.1**:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open [localhost:5000](http://127.0.0.1:5000), or run `PORT=5001 npm run dev` if the port is occupied.
Run `npm run watch` in a second terminal while editing TypeScript, then refresh.

## Check

```sh
npm run build
npm test
git diff --check
```

With agent-browser installed and a preview running, `npm run test:browser` checks
the mode switch and calm scroll behavior, including steady sun framing, Pause and
sun occlusion of rear particles, the wider faded star field, pointer interaction
and project imagery on desktop/mobile. Fine mouse pointers sweep a dust wake through the scene,
including behind content. Swipes change orbital speed and spacing; scattered
particles settle into the band at their new positions. A stationary pointer
exerts no force.
It uses port 5001 unless `PREVIEW_URL` is set.
The Safari scroll check simulates discrete input in Chromium using desktop Safari
identification. Check the preview in actual Safari to judge the mouse-wheel feel.
The scroll timing check simulates Android identification and verifies that the
title and universe use the current native position before each frame is drawn.
Check physical Android Chrome separately to judge touch-scroll feel.
The title check covers fade/split appearance, orientation, reduced motion and
cleanup without inherited root style updates. The mobile checks cover the
original 1.5x backing resolution, inactive touch physics, mouse connection/removal,
and stable camera framing under simulated browser-control insets.
Anchor checks cover native smooth project navigation, hashes and Back, direct
project URLs and reduced-motion jumps on desktop and narrow layouts.

Run `node scripts/measure-pointer.mjs` separately for paired active/inactive renderer
timings at two desktop sizes. It uses seeded particles, three samples per scene,
1.5× canvas density, CPU rendering timings and frame intervals. Avoid running other
browser checks at the same time. It measures Chromium on the current machine,
not real-device or cross-browser performance.

For before/after background measurements, serve the approved `public/js/space.js`
at `/js/space.js` on a separate local server, then run
`BASELINE_URL=http://127.0.0.1:5003/ node scripts/measure-universe.mjs`.
Set `PREVIEW_URL` to the changed preview. This alternates seeded samples at
1440×900, 2560×1440 and 390×844, with a 1.5× backing scale. CPU timings measure
Canvas command submission; frame intervals also reflect presentation pressure.
Run it without other browser checks.

See [AGENTS.md](AGENTS.md) for structure, design rules, the browser checklist and deployment.
