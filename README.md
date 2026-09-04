# feuer.dev

Personal website built with HTML, CSS and JavaScript. TypeScript compiles the
animated heading into JavaScript; the deployed website has no application backend.

## Run locally

Use Node **24.15.0** from `.nvmrc`. The verified npm version is **11.12.1**.
With nvm installed:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000). The development server binds
only to loopback and builds TypeScript before serving. It uses the exact `http-server`
version in `package.json` and the committed dependency lockfile.

macOS may reserve port 5000 for AirPlay Receiver. Use another port without
changing system settings:

```sh
PORT=5001 npm run dev
```

Then open [http://127.0.0.1:5001](http://127.0.0.1:5001). The server fails if the
chosen port is busy instead of silently selecting a different address. The port
override uses POSIX shell syntax, supported on macOS and Linux.

When editing TypeScript, leave this running in a second terminal:

```sh
npm run watch
```

Refresh the browser to see changes. HTML, CSS and plain JavaScript are served
directly, so they need no compilation. Stop either command with Ctrl+C.

No Docker, production `.env`, SSH key or cloud account is needed for local work.
Installation needs access to npm. Existing Google Fonts and analytics scripts
make external requests in the browser; their markup is unchanged in this phase.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the committed dependency versions, including local tools. |
| `npm run build` | Compile TypeScript into `public/js/scramble.js`. |
| `npm run dev` | Build and serve locally, default port 5000. |
| `PORT=5001 npm run dev` | Use an alternate local port. |
| `npm run watch` | Recompile TypeScript when it changes. |
| `npm start` | Alias for local development. |
| `npm test` | Check internal links at both hosting paths and preserve policy URLs. |

The VS Code TypeScript task runs `npm run watch` using the project compiler.
The editor may ask whether to allow the existing automatic folder-open task.

## Editing and checking changes

The homepage is `public/index.html`; styles are in `public/css/style.css`.
`public/js/app.js` controls project details and particles. Edit `scramble.ts`,
not the ignored generated `scramble.js`.

Before handing off a change, run `npm run build`, `npm test` and `git diff --check`.
After dependency changes, also verify a fresh `npm ci`. Check the page in a
browser, including the animated heading, particles, each project Details link,
its close button and browser Back. Preserve these direct links:

- `/privacy-policy.html`
- `/bigpond-privacy.html`
- `/bigpond-tos.html`
- `/impfalarm-privacy.html`
- `/impfalarm-tos.html`

## Deployment

The `Website` GitHub Actions workflow installs the locked dependencies, compiles
TypeScript and runs the static-site checks. Pull requests run the build/check job.
Successful pushes to `master` also upload `public/` and deploy it to GitHub Pages.
Actions are pinned to commit SHAs, and only the deployment job has Pages write access.

The production address is [feuer.dev](https://feuer.dev), with HTTPS managed by
GitHub Pages. Cloudflare remains the DNS provider. Its other subdomains and services
are independent of this repository. Private cutover details live in the infrastructure
repository. The old Jenkins, Docker and semantic-release deployment files have been
removed. There is no dedicated branch-preview deployment.

Keep internal links relative so temporary hosting at `/portfolio/` works too.
All five policy URLs remain available at the production domain. To roll back a
content change, revert it on a branch, check the PR and merge the revert to `master`.
The workflow can also be run manually on `master` to redeploy the current revision.

Update dependencies in bounded changes and commit `package-lock.json` with them.
No global compiler or release tool is required.

## Troubleshooting

- Missing `http-server` or `tsc`: run `npm ci` without `--omit=dev`; do not install global tools.
- Missing `js/scramble.js`: run `npm run build`, or start with `npm run dev`.
- TypeScript edits do not appear: start `npm run watch` and refresh the browser.
- Wrong Node version: initialize nvm in the current shell, then run `nvm use` here.
- Port busy: use the documented `PORT` override. Do not stop unrelated processes.
- Dependency audit warnings: investigate and record them. Do not apply breaking
  `npm audit fix --force` updates as a routine setup step.
