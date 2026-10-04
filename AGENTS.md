# Working on feuer.dev

Static HTML, CSS and TypeScript, deployed through GitHub Pages. One document has
two presentations: plain HTML by default, and an optional animated fancy mode.
Keep the default fast and readable without JavaScript. Preserve all five policy URLs.

## Inline frontend invitation

The entry action is the word "frontend" in the first introductory sentence.
It starts plain; the word is
a small dark star window with dust escaping its edges. Clicking uses the existing
circular reveal from that word to fancy. Use the surrounding plain font,
normal weight, small vertical padding and a subdued border. In fancy mode the
word becomes ordinary text, and separate "Back to plain HTML" and pause controls
appear at the top right on desktop and fixed at the bottom right on mobile.
Without JavaScript, show ordinary text. Keep focus on the newly available mode
control after switching. The inline word is an entry action rather than a toggle.

`src/frontend-teaser.ts` draws 48 emitted particles and 18 static stars in a small
canvas. It shares `src/particle-palette.ts` with the full universe, without starting
the solar-system renderer or loading fancy fonts/assets in plain mode. Teaser
particles are round dots with a few pre-baked radial halos, never plus shapes.
Pointer movement stirs nearby dust on fine mouse devices; stationary pointers and touch
do not apply forces. Cap the backing resolution at 1.5x. Stop the teaser in fancy
mode, while switching, offscreen, hidden or under reduced motion. Reduced motion
keeps a still drawing. Cache geometry on resize/activation; avoid layout reads in
the animation loop. Bound the canvas to the viewport so the halo cannot introduce
sideways scrolling. Keep this experiment separate from `feat/fancy-default`.
Keep the 2.4-second universe formation on interactive activation. Start its motion
when the transition's new view is ready, so it forms during the 850ms wipe and
continues for roughly 1.5 seconds afterward. Retain font readiness before capture.
Desktop uses a CSS keyframe on the native new-view pseudo-element, registered
before capture rather than attached later through JavaScript. Set its coordinates
once per switch, never per frame. Narrow screens and coarse pointers instead use
`src/page-reveal.ts`: an inert temporary Shadow DOM copy of the old view with an
expanding radial-gradient mask. Paint the old layer before swapping the live
document. Animate only that layer's mask for 850ms, never inherited root values.
Android Chrome reported native capture cancellation
when the viewport changed during the mode swap. Freeze the copy's colours,
root-relative sizes and current canvas frame; remove it after the 850ms animation,
including on failure. Reuse loaded CSS and keep only one live universe renderer.
The Pixel still showed no wipe with the earlier compound clip-path despite a
finished timeline. Jannik confirmed the radial-mask version works on his Pixel 8
on 4 October 2026. Desktop emulation alone did not reproduce these device failures.
`data-reveal-result` and `data-reveal-reason` retain
the browser's outcome for diagnosis; do not silently label a skipped transition
as successful. Respect reduced motion. Every fresh load and refresh starts plain,
including old `?mode=fancy` links. Remove only the legacy `mode` parameter,
preserving other query parameters and fragments. Switching no longer serializes
the presentation into the URL or derives it from browser history.

## Local commands

Use `.nvmrc`: Node 24.15.0, tested with npm 11.12.1. Retain npm's committed lockfile.

```sh
nvm use
npm ci
npm run dev
```

Preview at `http://127.0.0.1:5000`. Use `PORT=5001 npm run dev` if occupied.
Run `npm run watch` in a second terminal while editing TypeScript, then refresh.
These commands use a POSIX shell. No Docker, credentials or global compiler needed.

Before handing off a change: `npm run build`, `npm test`, `git diff --check`.
For dependency changes, verify a fresh `npm ci` and review `npm audit`.

## Structure and design rules

- `public/index.html`: the shared content, external links, project descriptions and metadata.
- `public/css/style.css`: hides decorative/accessibility elements, keeps project headings inline, styles the mode switch and keeps plain mode light.
- `public/css/fancy.css`: optional presentation, loaded on demand. Scope rules to `.fancy`.
- `src/app.ts`: in-memory mode switching, lazy loading, legacy mode-query cleanup and the optional View Transition.
- `src/frontend-teaser.ts`: the bounded inline particle invitation in plain mode.
- `src/page-reveal.ts`: the temporary mobile circular reveal, independent of native viewport capture.
- `src/particle-palette.ts`: the shared universe and teaser colours.
- `src/fancy.ts`: fancy-mode lifecycle, single scroll zoom/orbit, reading-view framing, continuous and scroll rotation, pointer and motion controls. Return cleanup and a method to start motion once the transition's new view is ready.
- `src/space.ts`: the particle scene: sun, stream, project knots, stars and origin-centred camera.
- `public/js/*.js`: generated by TypeScript. Never edit or commit these files.
- `public/assets/`: local images. Decorative images live in inert HTML templates, instantiated only in fancy mode.
- `public/assets/fonts/`: locally hosted IBM Plex Sans with its SIL Open Font License. Fonts load only in fancy mode.
- `public/css/policy.css`: shared presentation for the four retained app policy/terms pages. Preserve their legal wording.
- `tests/site.test.mjs`: static hosting paths, policy URLs and progressive-enhancement checks.

Every initial load and refresh starts plain, regardless of old `?mode=fancy` links.
The switch keeps presentation in memory and does not update the URL. Remove legacy
`mode` parameters without losing other query parameters or fragments.
Do not add cookies or storage just to remember the presentation. Switching must keep
content, keyboard focus and reading position usable.

Plain mode uses browser-default layout, fonts, spacing and colours in light mode.
Do not centre it, constrain its width or introduce a visual theme. The mode switch
is the deliberate exception: an inline star window on the word "frontend" in the
introduction. Respect `prefers-reduced-motion` in CSS and JavaScript. Keep the
compact pause icon beside the fancy return control and stop
rendering when motion is paused, the tab is hidden or fancy mode is disabled. Always show content
while fancy assets load. Load both font weights before capturing a View Transition,
allow font failures to use sans-serif, and keep canvas motion stopped until the
new view is captured. Start motion when the transition is ready, so the live
universe is visible during the reveal. Log transition failures so browser-specific problems are visible.
Keep content readable if decorative loading or browser features fail. Do not add animation dependencies
for effects that native browser APIs can handle.

Fancy mode is always dark: IBM Plex Sans, blue links and amber accents over a
fixed canvas showing a glowing sun and a particle stream. Each project is a knot in
the stream. Scrolling performs one zoom to twice the opening size, a flatter viewing
angle and a sideways camera orbit, placing the sun beside the cards by the time the
first card is centred. Keep the reading angle low enough to show the particle stream.
The stream always rotates slowly; further scrolling adds rotation and a few degrees
of smooth camera angle drift while the sun's position and size stay steady.
The existing star pass includes a sparse, dim sky around the stream: 5400 additional
directions at full density, with tiny dots and rotation at 12% of the stream's rate.
Keep this backdrop cheap: no glow sprites, twinkle or wake physics. Cull offscreen
stars and stars overlapping the sun, including the dim narrow-screen disc.
Returning to the introduction reverses
the zoom and orbit. Keep the opening's formation, drift and name splitting. On narrow screens,
crop a dimmer sun at the right edge instead of narrowing the cards. Pause freezes
rotation, angle drift and twinkling, including scroll rotation, but the single zoom still follows
reading position. Reduced motion keeps a static overview. Fine, hover-capable mouse
pointers retain the camera tilt and sweep a dust wake through the scene, including
behind content. Movement changes nearby particles' orbital speed and spacing, with
radial/vertical scatter. Drag settles speed but keeps the new orbital phase; only
scatter returns to the band. Project knots have bounded phase shifts and their
highlight follows the disturbed cluster. Stationary pointers exert no force; there is no
hover brightness boost or content mask. Pause freezes the wake; reduced motion
clears it and touch does not activate it. No particle-to-particle physics or new draws.
Touch-only devices skip wake arrays, physics integration and pointer listeners.
Connecting a fine, hover-capable mouse enables them, and removing it clears the wake.
Keep the original 1.5x canvas backing-resolution cap on all devices.
The fixed artwork uses `100lvh` with a `100vh` fallback so mobile browser controls
do not resize the canvas or reframe the camera when a gesture stops.
Scrub the title's paused native opacity/transform animations in the same scroll loop.
Do not restore inherited root style updates during scrolling. Cancel animations
and release layer hints for reduced motion and when leaving fancy mode.
Desktop Safari smooths visual scroll steps in the existing animation loop with
time-based damping (40 ms time constant). Native page scrolling is untouched.
Name splitting, zoom/orbit and scroll rotation use the same visual position.
Pause, hidden tabs and initial framing snap to the current position instead of
keeping a smoothing tail. Reduced motion disables these effects. Exclude mobile
Safari and iPads with desktop user agents. Other browsers retain direct response.
Active animation reads the native scroll position before drawing each frame;
do not queue a separate scroll frame behind the scene. Paused views still schedule
one redraw per scroll frame. Touch scrolling remains native and passive.
Projects are glass cards with the text above the artwork. Keep text
at WCAG AAA contrast and give text outside cards a dark halo. Draw particles with
additive blending in pre-sorted batches and scale the particle count with the viewport.
The sun occludes rear particles, including their glow. Cull hidden sprites and clip
only sprites crossing its edge; keep foreground particles visible without depth sorting.
See `docs/fancy-design-review.md` for the design.

Keep the main document semantic and usable without JavaScript. Use native links,
buttons, visible keyboard focus and a skip link. Plain mode has no section navigation.
Fancy mode adds a numbered project contents list. Omit decorative link arrows.
Fancy anchor navigation uses native CSS smooth scrolling when reduced motion is
not requested. Preserve native hashes, history and focus behavior. Mode switches
and direct project links position immediately, without a scrolling tail.
Keep copy factual and concise. The introduction combines the name, about text,
AI sentence and contact links. Do not add a separate masthead
wordmark or repeat about/contact sections below the projects. Start with the name,
without a role eyebrow or punctuation after the surname. Use ordinary paragraphs
with linked project headings (inline in plain mode) and one short paragraph per project. All project text stays visible
in both modes. Do not add expandables, repeated technology tag lines or generic
"Read the source" links. Native horizontal rules separate the plain document's
intro, projects and footer. Fancy mode restyles this same content.

Project order is keep-mcp, split keyboards, the sponsor detector, feuer.io,
the Swift raytracer and Big Pond. Keep human-api and Vorsorge off the page for now.
Wilo, Twitch Rerun Filter, the Tarkov calculator and the website itself are retired
from the project list. The earlier Python contract-work paragraph is also removed.
The sponsor detector is a prototype with a public repository. The Scylla photos show
Jannik's own assembly and finished keyboard. Keep their WebP exports small and
free of metadata. Plain mode links to the photos without loading them. See
`docs/content-sources.md` for history references and artwork provenance.
Use authentic captures for project artwork. Keep's checklist and tool-call summary
come from recorded MCP evidence; the sponsor image is its actual settings popup.
Keep media areas consistent and bounded, preserve screenshot aspect ratios, and
do not enlarge the old raytracer capture. Images stay static and load only in fancy mode.

Maintain the footer's "Last updated" date manually in `public/index.html`. Update
both the visible date and the `<time datetime>` value when content changes.
The keep-mcp popularity claim refers to GitHub stars. Recheck it when updating copy.

Keep first-load resources local. The homepage CSP allows same-origin assets and blocks inline script/style.
Do not weaken it to add a widget. Plain mode has no analytics or external fonts.

## Verification and publishing

Check the branch and preserve unrelated changes before editing. Use a descriptive
`feat/`, `fix/` or `chore/` branch from `master`. Personal work needs no Jira ticket.
Merging and production deployment require user authorization.

For presentation changes, check desktop and narrow mobile layouts in light/dark,
keyboard navigation, project links, toggling both ways, legacy fancy URLs opening plain,
reduced motion, pause/resume, and JavaScript/decorative-download failure. Check the
browser console and network, not just screenshots. Automated accessibility checks
supplement manual inspection. Do not add tests that merely restate CSS properties.

Successful pushes to `master` publish `public/` through `.github/workflows/pages.yml`.
PRs only build and check. Keep actions pinned and deployment permissions restricted.
Run the TypeScript build before tests. Internal links must work both at the domain
root and under `/portfolio/`. Roll back by reverting and redeploying `master`.

Before publishing this redesign, review the draft copy and legacy project links.
The website privacy policy describes the static site and GitHub Pages hosting.
The Impressum still needs a genuine address authorised for this use. Do not invent
an address or copy one from another source. See `docs/publication-notes.md` for
the legal sources and unresolved publication details. App policy pages are separate
and must not be casually rewritten.

Use `npm run test:browser` with agent-browser installed and a preview running.
It defaults to port 5001. Set `PREVIEW_URL` to use another preview. The check covers
font readiness and failure, formation during the reveal, skipped native transitions,
the mobile mask under viewport resizing, mobile placement, offline recovery,
focus, plain refresh, legacy URL cleanup and lazy artwork. It also runs
`scripts/check-scroll.mjs` for steady sun framing, the stronger zoom and orbit,
continuous and scroll rotation, Pause, reverse zoom and narrow/reduced-motion views.
`scripts/check-occlusion.mjs` checks rear-particle occlusion, glow at the sun's edge,
foreground visibility and the dim sun.
`scripts/check-images.mjs` checks consistent media areas, image containment, mobile
sizing, the captured assets and the raytracer's original size. Failed fancy downloads
offer an explicit page reload because browsers retain failed module imports.

`scripts/check-pointer.mjs` checks orbital momentum, lasting spacing, speed settling,
stationary pointer behavior, Pause/resume, reduced motion, touch and cleanup.
`scripts/check-mobile-rendering.mjs` checks the original backing resolution,
disabled touch physics and mouse connection/removal.
`scripts/check-mobile-viewport.mjs` checks canvas, camera and title stability
under simulated toolbar insets, plus orientation resizing.
`scripts/check-title.mjs` checks fade/split appearance, reversal, orientation,
reduced motion and cleanup, and rejects inherited root style updates on scroll.
`scripts/check-safari-scroll.mjs` simulates stepped scrolling in Chromium with
desktop Safari identification. It checks intermediate name/zoom frames, native
scroll position, settling, reversal, Pause, reduced-motion entry and cleanup, plus
unchanged Chromium/iPad response. It does not replace a real Safari wheel check.
`scripts/check-scroll-timing.mjs` checks that an Android-identified Chromium scene
uses the current native position for the title and camera in the same frame. It
does not replace physical Android testing.
`scripts/check-universe.mjs` checks wide sky coverage, faded dots, viewport culling,
sun occlusion and rotation. `scripts/check-anchors.mjs` checks smooth project
navigation, hashes and Back, immediate direct URLs and reduced-motion jumps on
desktop and narrow layouts. For paired before/after timings, serve a copy of the
approved `public/js/space.js` under a separate local URL at `/js/space.js`, then run
`BASELINE_URL=http://127.0.0.1:5003/ node scripts/measure-universe.mjs` with
`PREVIEW_URL` pointing at the new preview. It alternates seeded renderer samples
at two desktop sizes and a narrow viewport, including moving pointer input on
desktop. Run measurements separately from other browser checks.
Run `node scripts/measure-pointer.mjs` separately for paired seeded active/inactive
renderer measurements at 1440×900 and 2560×1440 with a 1.5× backing scale. It reports
CPU render time separately from frame intervals and sun-edge clipping counts;
do not run other browser checks concurrently with the measurements.

Update this file when commands or behavior change, and the README when commands change. Private server
operations are out of scope and belong in `feuerdev/server-setup`. Never commit secrets.
