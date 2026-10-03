# Fancy design review

2 October 2026. Fancy mode borrows the launch-page style of recent model
announcements, in particular the glowing sun and particle stream on OpenAI's
[GPT-6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/) page, and Anthropic's
[Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5) page for its full-screen
opening and numbered contents. Plain mode is unaffected.

## Direction

One cinematic scene carries the decoration, and the content stays calm and readable.
The opening fills the screen with the large name, the introduction, contact links and a
numbered contents list over the scene. The scene stays behind the whole page, so the
projects share a steady backdrop while reading.

## Scene

- A soft pale sun with an orange glow sits inside a tilted, clumpy particle stream of
  white, blue and amber particles. A few particles carry a soft glow.
- Each of the six projects is a bright knot in the stream. Hovering or focusing a
  contents entry circles its knot.
- Particles swirl in from all around and form the stream after the mode transition.
  The camera follows the pointer.
- Scrolling the introduction away splits the name apart and performs one zoom,
  a flatter viewing angle and a sideways camera orbit, finishing as the first project
  card is centred. The lower reading angle keeps more of the particle stream visible.
  The sun settles beside the cards at twice its opening size. It stays in place
  while the particle stream rotates slowly, with further scrolling adding rotation.
  Returning to the introduction reverses the zoom and orbit.
- The camera interpolates distance geometrically. Further scrolling gently varies
  its reading angle by about 1.4 degrees vertically and 2.9 degrees horizontally.
  The sun remains anchored; stopping to read stops angle drift while the stream
  keeps rotating.
- Desktop Safari uses a short visual smoothing layer for discrete mouse-wheel
  input, matching the behavior described in [WebKit's wheel-scrolling report](https://bugs.webkit.org/show_bug.cgi?id=70198).
  Name splitting, camera framing and scroll-driven rotation share the eased
  position. Native scrolling is preserved. Other browsers and mobile Safari keep
  direct response. Pause bypasses smoothing and reduced motion disables the effects.
- If there is insufficient space beside the cards, the sun is dimmed and partially
  cropped at the right edge. Card widths and content layout are unchanged.
- Fine, hover-capable mouse pointers retain camera tilt and sweep a dust wake
  through particles, including behind text and cards. Movement transfers momentum
  into orbital, radial and vertical velocities. Drag settles orbital speed while
  retaining new spacing; radial/vertical scatter sways back into the band rather
  than restoring each particle's original position. A stationary pointer exerts no force.
- The swept brush reaches up to 110 CSS pixels around the pointer path. Velocity
  and displacement are bounded. Particle offsets persist as the camera moves;
  leaving the pointer stops input while existing momentum settles naturally.
  Particle brightness and twinkle retain their ordinary behavior.
- Pause freezes the wake. Reduced motion clears it; touch does not activate it.

## Layout and accessibility

- Fancy mode is always dark. A glowing particle field does not work on a light page.
- Projects are glass cards with the number, linked title, description and artwork.
- Static, authentic screenshots replace the Keep and sponsor placeholder diagrams.
  Keep pairs a real checklist with its recorded MCP call summary; sponsor shows the
  actual extension settings. All projects share a media area up to 400 pixels tall,
  reduced to 220 pixels on narrow screens. Screenshot proportions are preserved,
  the keyboard keeps two overlapping photos, and the raytracer is not enlarged.
- Text colours meet WCAG AAA (7:1) on the background and on cards. Link blue is
  10:1, and 6.5:1 in the worst case of a card over pure white.
- Text outside cards has a dark halo. The desktop reading view keeps the sun's bright
  disc outside the cards; narrow views dim the cropped disc behind them.
- A compact pause icon beside the mode switch satisfies WCAG 2.2.2. It is a toggle
  button named "Pause motion" with `aria-pressed`. Pause freezes rotation and
  angle drift and twinkling, including scroll-driven rotation; the single zoom still follows reading
  position. Reduced motion shows a static stream without scroll effects.

## Performance

- Particles use additive blending, so there is no per-frame depth sort. Colours are
  pre-sorted into batches, and a few hundred glow sprites are pre-rendered.
- The sun hides rear particles. Fully hidden sprites are skipped; sprites crossing
  the sun's edge are clipped, including their glow. Foreground particles remain visible.
- The particle count scales with viewport area, down to 45% on small screens.
- There is no texture generation or animation dependency. Continuous rendering
  stops when motion is paused, the tab is hidden or fancy mode is disabled.
- Safari scroll damping runs in the existing frame loop only while the visual
  position differs from the target, with a 40 ms time constant. Hero dimensions
  are cached on resize so interpolation does not read layout on every frame.
- Wake contact uses a squared-distance rejection against the swept pointer path
  within the existing particle loop. Only disturbed particles integrate their
  orbital phase/velocities, with orbital drag, damped radial/vertical sway and a
  sleep threshold. Project knot phase shifts are bounded and highlights follow
  the disturbed cluster.
  There is no particle-to-particle physics, new drawing pass or depth sorting.

## Verification

3 October 2026: the Safari scroll-smoothing trial passed the build, static tests
and full browser suite. Discrete-input checks use Chromium with desktop Safari
identification and cover interpolation, native scroll position, settling, reversal,
Pause, reduced-motion entry, motion resume, cleanup and mobile exclusion. Safari
remote automation is disabled, so judging the actual mouse-wheel feel requires
a manual Safari preview check. The title's horizontal split and fade are smoothed;
its vertical movement with native page scrolling is preserved.

Chromium checks on 1 October 2026 at 1440×900 and 390×844: no long tasks during the
switch and a 95th-percentile frame time of 16.8 ms in both viewports. The build,
static tests and browser regressions passed. No horizontal scrolling, console
messages or page errors. The pause icon works with Enter and Space. These checks
ran headless on a desktop machine, not on a phone or in other browsers.

2 October 2026: the build, static tests and browser checks passed for the calm
scroll iteration. Canvas checks cover steady sun position and size across projects,
continuous and scroll-driven rotation, the stronger zoom, sideways orbit and scroll
angle drift, Pause,
reverse zoom and reduced motion.
Canvas pixel checks also cover rear-particle occlusion, glow clipping at the sun's
edge, foreground visibility and the dim mobile sun.
Framing was checked at widths 1440, 1100, 700, 390 and 320 pixels. Desktop and mobile
screenshots were reviewed; no console messages or page errors appeared, and Pause
worked with Enter and Space. No new real-phone or cross-browser measurements.

2 October 2026: authentic project imagery checked at widths 1440, 700, 390 and
320 pixels. The build, static tests and full browser suite passed. Media areas are
consistent, images stay inside their cards, and the raytracer remains at or below
its original size. Desktop and mobile screenshots were reviewed, including dark
reduced-motion mode, with no console messages or page errors. Axe reported no
violations and one incomplete contrast rule requiring manual review. These checks
used desktop Chromium; no new real-phone or cross-browser measurements.

2 October 2026, orbital wake: pointer movement changes orbital momentum and leaves
particles in new spacing. The user approved this interaction for publication.
Build, static tests and the full browser checks passed, including scrolling, sun
occlusion, orbital momentum, lasting spacing, speed settling, stationary pointers,
Pause/resume, reduced motion, touch and cleanup.

Final paired headless Chromium measurements used seeded particles, three
180-frame samples per active/inactive case, opening and reading views at 1440×900
and 2560×1440, and a 1.5× canvas backing scale. Inactive p95 CPU render time was
1.1–1.6 ms and active was 1.2–1.6 ms, with at most .3 ms added in a paired case.
P95 frame intervals stayed at 16.7–16.8 ms. CPU timing covers Canvas command
submission, not GPU completion or the live page's glass-card compositing. These
are development-machine Chromium measurements, not real-phone or cross-browser
results. The reproducible check is `node scripts/measure-pointer.mjs`.
