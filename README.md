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
sun occlusion of rear particles, pointer interaction and project imagery on
desktop/mobile. Fine mouse pointers sweep a dust wake through the scene,
including behind content. Swipes change orbital speed and spacing; scattered
particles settle into the band at their new positions. A stationary pointer
exerts no force.
It uses port 5001 unless `PREVIEW_URL` is set.
The Safari scroll check simulates discrete input in Chromium using desktop Safari
identification. Check the preview in actual Safari to judge the mouse-wheel feel.

Run `node scripts/measure-pointer.mjs` separately for paired active/inactive renderer
timings at two desktop sizes. It uses seeded particles, three samples per scene,
1.5× canvas density, CPU rendering timings and frame intervals. Avoid running other
browser checks at the same time. It measures Chromium on the current machine,
not real-device or cross-browser performance.

See [AGENTS.md](AGENTS.md) for structure, design rules, the browser checklist and deployment.
