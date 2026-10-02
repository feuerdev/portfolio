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
- If there is insufficient space beside the cards, the sun is dimmed and partially
  cropped at the right edge. Card widths and content layout are unchanged.
- Pointer movement is unchanged in this iteration and will be reviewed separately.

## Layout and accessibility

- Fancy mode is always dark. A glowing particle field does not work on a light page.
- Projects are glass cards with the number, linked title, description and artwork.
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

## Verification

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
