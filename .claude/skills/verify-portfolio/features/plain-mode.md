# Plain mode

Every visit starts with the plain document: the introduction, contact links and the projects as
linked headings with one paragraph each, in browser-default styling.

## Sub-features

- `plain-content` shows the introduction, the contact links and the projects in order.
- `plain-links` keeps project anchors and the skip link working.
- `plain-legacy-query` removes a legacy `mode` query parameter and keeps the rest of the URL.

## How to get to it (user POV)

- Open `/`.
- Open a project anchor such as `/#human-api`.
- Open an old link with `?mode=fancy`.

## Driving it with playwright-cli

Preconditions:

- None beyond the baseline.

- **Load.** Run `playwright-cli open http://127.0.0.1:5011/`. `document.documentElement` has no
  `fancy` class, and the introduction ends with the word "frontend".
- **Order.** Run
  `playwright-cli eval "[...document.querySelectorAll('article.project')].map(a => a.id).join(',')"`.
  The order is keep-mcp, human-api, llm-autobattler, split-keyboards, yt-sponsor-detect,
  heron-deterrent, agent-box, feuer-io, swift-raytracer, big-pond.
- **Anchor.** Run `playwright-cli open http://127.0.0.1:5011/#human-api`. The human-api project is at
  the top of the viewport.
- **Legacy query.** Run `playwright-cli open "http://127.0.0.1:5011/?mode=fancy&ref=x#agent-box"` and
  `playwright-cli eval "location.search + location.hash"`. The result is `?ref=x#agent-box` and the
  page is plain.
- **Proof.** Screenshot the page at desktop and at `resize 390 844`.

## Gotchas

- Plain mode loads no images or external fonts. A screenshot with project artwork means fancy mode
  is on.
