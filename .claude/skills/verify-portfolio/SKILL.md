---
name: verify-portfolio
description: Launch feuer.dev locally and drive its plain and fancy modes and policy pages with playwright-cli to prove a change. Use when verifying anything a visitor sees, before a PR is ready, and when reviewing one.
---

# Verify feuer.dev

The surface is one static page in two presentations, plain HTML and the animated fancy mode, plus
the policy pages. Run `npm run build`, `npm test` and `git diff --check` as `AGENTS.md` says. This
skill covers the running site.

## Launch

From the checkout root, after `npm ci`, on a port the usual preview doesn't use:

```sh
mkdir -p verify-results
PORT=5011 perl -e 'setpgrp; exec @ARGV' npm run dev > verify-results/dev.log 2>&1 &
echo $! > verify-results/dev.pid
for i in $(seq 60); do curl -sf http://127.0.0.1:5011/ > /dev/null && break; sleep 1; done
curl -sf -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5011/ || tail -20 verify-results/dev.log
```

`npm run dev` compiles the TypeScript first, so ready means `/` answers `200` and
`/js/app.js` exists. `perl -e 'setpgrp; exec @ARGV'` puts the server in its own process group for
cleanup. Analytics only run on the production host, so a local run sends nothing.

## Doctor

```sh
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5011/js/app.js
ps -o pgid= -p "$(lsof -ti tcp:5011 -sTCP:LISTEN)"; cat verify-results/dev.pid
```

`200` means the build output is served. The two numbers match when the port belongs to the
instance you started. Never drive an instance this run did not start.

## Drive

```sh
export PLAYWRIGHT_CLI_SESSION=portfolio-verify
playwright-cli open http://127.0.0.1:5011/
playwright-cli click "getByRole('button', { name: 'Frontend, show the animated version' })"
playwright-cli eval "document.documentElement.className"
```

Target elements with Playwright locators such as `getByRole(…)`, which wait for the element. The
mode lives only in memory: `document.documentElement` has the class `fancy` in fancy mode, and
`data-reveal-result` records how the reveal went. Check every change at a phone width too, with
`playwright-cli resize 390 844`, since narrow screens use a different reveal.

[`features/README.md`](features/README.md) maps every flow. Drive each entry point the change
touches.

## Evidence

Proof goes into `verify-results/<feature>/`, which git ignores and cleanup keeps:

- `playwright-cli screenshot --filename=verify-results/<feature>/<step>.png` after each action that
  changes the screen, at desktop and phone width.
- The mode class, `data-reveal-result` and `data-reveal-reason` after each switch.
- `playwright-cli console error` at the end. Any error fails the proof.

## Cleanup

```sh
playwright-cli close
kill -TERM -- -"$(cat verify-results/dev.pid)"
rm verify-results/dev.pid
```

This stops only the process group you launched and keeps the evidence in `verify-results/`.
