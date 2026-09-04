# Working on this portfolio

This is a public repository for feuer.dev. The site uses static HTML, CSS and
JavaScript, with one TypeScript file. Keep the current architecture unless the
task calls for a change. Content and design changes are separate from infrastructure work.

## Local development

- Use the Node version in `.nvmrc`. Local checks use Node 24.15.0 and npm 11.12.1.
  Commit the npm lockfile with dependency changes. The lockfile uses version 3.
- Run `npm ci`, then `npm run dev`. It builds TypeScript and serves `public/`
  at `http://127.0.0.1:5000`. If that port is occupied, use
  `PORT=5001 npm run dev`. These commands use a POSIX shell on macOS/Linux.
- Run `npm run watch` in a second terminal when editing TypeScript. Refresh
  the browser after changes; there is no automatic browser reload.
- Local development needs no Docker daemon, `.env`, SSH connection, or production
  credentials. `npm start` is an alias for the local development command.

## Source and generated files

- `public/index.html`: homepage, project descriptions, links and analytics markup.
- `public/css/style.css`: layout and visual styles.
- `public/js/app.js`: project details, browser history and particle initialization.
- `public/js/scramble.ts`: animated heading source; `npm run build` emits the
  ignored `public/js/scramble.js`. Do not edit or commit that generated file.
- `public/js/particles.min.js`: vendored particle library. Avoid incidental changes.
- Preserve existing policy and terms URLs under `public/`; external apps may link to them.

## Change and verification workflow

1. Inspect `git status` and the current branch before editing. Preserve unrelated changes.
2. Branch from `master` with a descriptive `chore/`, `fix/` or `feat/` name.
   Personal work does not require a Jira ticket.
3. For dependency changes, keep the lockfile synchronized, preserve its version,
   and verify `npm ci`. Pin local tools; do not fetch unlisted tools at startup.
4. Run `npm run build`, `npm test` and exercise the changed behavior locally. For development
   or serving changes, also check homepage/assets, all policy pages, heading
   animation, particles, project details and browser Back. Use meaningful checks;
   do not introduce a test framework solely for documentation or script edits.
5. Run `git diff --check`; review the diff for secrets, generated files and unintended
   content changes. Report actual command results and any remaining limitations.

## Publishing to GitHub Pages

`.github/workflows/pages.yml` builds and checks pull requests. Successful pushes
to `master` publish `public/` through GitHub Pages. A manual run on `master` can
redeploy it. PRs and other branches cannot execute the deployment job.

Work on branches and use draft PRs when publishing is in scope. A merge to `master`
is a production deployment, so it must be included in the task's authorization.
Keep the workflow's permissions minimal and actions pinned to commit SHAs.

Run `npm run build` before `npm test`; the checks need the generated heading script.
Use relative internal links so the site works both under `/portfolio/` on the
temporary GitHub URL and at the root of `feuer.dev`. Keep all policy URLs intact.
GitHub Pages manages HTTPS. There is no Docker, Jenkins, semantic-release or SSH
deployment step. Recover a bad release by reverting its change and redeploying
`master`, not by bringing the old VPS pipeline back.

## Documentation and private operations

Update this file and the README when local commands, source layout or deployment
behavior change. Detailed inventory, access methods, backup and recovery notes
belong in the private infrastructure repository, not here. Never commit `.env`,
private keys, credentials, certificate state, server backups or Jenkins exports.
Infrastructure work must account for other services sharing the VPS.
