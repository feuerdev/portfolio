# feuer.dev

Jannik Feuerhahn's website. Plain HTML first, with an optional fancy mode.
Both views share one document and follow the device's light/dark preference.

## Run locally

Use Node **24.15.0** from `.nvmrc`, with tested npm **11.12.1**:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open [localhost:5000](http://127.0.0.1:5000). If the port is occupied, run
`PORT=5001 npm run dev`. The preview binds only to loopback and never switches ports
silently. No Docker or production credentials are needed.

For TypeScript changes, run `npm run watch` in a second terminal and refresh the page.
HTML and CSS changes only need a refresh. `npm start` is an alias for `npm run dev`.
The VS Code task also runs the TypeScript watcher.

## Two presentations

The default is a readable document with native links and expandable project notes.
It works without JavaScript and fetches no project artwork, external fonts or analytics.

The corner button loads the fancy stylesheet and animation module. It adds large
typography, project artwork, scroll reveals and an interactive particle sculpture.
Use **Back to plain HTML** to return. `?mode=fancy` opens the fancy view directly.
The choice is in the URL, with no cookie or browser-storage preference.

Reduced-motion users get a static presentation. The motion button pauses/resumes
animation. Rendering also pauses when the artwork is offscreen or the tab is hidden.
View Transitions enhance the switch where supported, with an immediate fallback.

## Editing and checking

Edit content in `public/index.html`, base styles in `public/css/style.css`, fancy
styles in `public/css/fancy.css`, and behavior in `src/app.ts` / `src/fancy.ts`.
TypeScript compiles to ignored files in `public/js/`. Don't edit generated JavaScript.

```sh
npm run build
npm test
git diff --check
```

The tests check hosting paths, existing policy URLs, native navigation and first-load
resource rules. Check interactions and layout in a browser too. See `AGENTS.md` for
the focused browser checklist. All five existing policy/terms URLs remain intact.

The current redesign is a branch for review. Copy uses existing project information.
Before publishing, review project status/links and update the website privacy policy,
which still describes the previous analytics and external-font setup.

## Deployment

GitHub Actions builds and checks PRs. Successful pushes to `master` publish `public/`
to GitHub Pages at [feuer.dev](https://feuer.dev), with HTTPS managed by GitHub.
Use relative internal URLs so temporary hosting under `/portfolio/` also works.
A checked revert on `master` rolls back a release. There is no dedicated PR deployment.

## Troubleshooting

- Missing scripts or compiler: run `npm ci`, then `npm run build`.
- TypeScript changes not showing: run the watcher and refresh.
- Port busy: use the `PORT` override instead of stopping unrelated services.
- Fancy assets failed to load: the plain page remains available. Check the network
  connection and try again. Local preview must run through HTTP, not `file://`.
- Wrong Node version: initialize nvm, then run `nvm use`.
