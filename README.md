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
the fancy-mode interactions. It uses port 5001 unless `PREVIEW_URL` is set.

See [AGENTS.md](AGENTS.md) for structure, design rules, the browser checklist and deployment.
