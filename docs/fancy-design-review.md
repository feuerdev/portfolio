# Fancy design review

1 October 2026. Fancy mode borrows the launch-page style of recent model
announcements, in particular the glowing sun and particle stream on OpenAI's
[GPT-6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/) page, and Anthropic's
[Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5) page for its full-screen
opening and numbered contents. Plain mode is unaffected.

## Direction

One cinematic scene carries the decoration, and the content stays calm and readable.
The opening fills the screen with the large name, the introduction, contact links and a
numbered contents list over the scene. The scene stays behind the whole page, so the
projects read as stops on a journey through it rather than a separate section.

## Scene

- A soft pale sun with an orange glow sits inside a tilted, clumpy particle stream of
  white, blue and amber particles. A few particles carry a soft glow.
- Each of the six projects is a bright knot in the stream. Hovering or focusing a
  contents entry circles its knot.
- Particles swirl in from all around and form the stream after the mode transition.
  The camera follows the pointer.
- Scrolling the introduction away tilts and zooms the camera and splits the name
  apart. The camera then flies along the stream from knot to knot as each project
  card is centred. Nearby particles become soft out-of-focus glows.
- The camera interpolates distance geometrically, so zooming feels steady.

## Layout and accessibility

- Fancy mode is always dark. A glowing particle field does not work on a light page.
- Projects are glass cards with the number, linked title, description and artwork.
- Text colours meet WCAG AAA (7:1) on the background and on cards. Link blue is
  10:1, and 6.5:1 in the worst case of a card over pure white.
- Text outside cards has a dark halo, and the sun scrolls away with the name, so
  text does not sit on the bright disc.
- A compact pause icon beside the mode switch satisfies WCAG 2.2.2. It is a toggle
  button named "Pause motion" with `aria-pressed`. Reduced motion shows a static
  stream without scroll effects.

## Performance

- Particles use additive blending, so there is no per-frame depth sort. Colours are
  pre-sorted into batches, and a few hundred glow sprites are pre-rendered.
- The particle count scales with viewport area, down to 45% on small screens.
- There is no texture generation or animation dependency. Rendering stops when
  motion is paused, the tab is hidden or fancy mode is disabled.

## Verification

Chromium checks on 1 October 2026 at 1440×900 and 390×844: no long tasks during the
switch and a 95th-percentile frame time of 16.8 ms in both viewports. The build,
static tests and browser regressions passed. No horizontal scrolling, console
messages or page errors. The pause icon works with Enter and Space. These checks
ran headless on a desktop machine, not on a phone or in other browsers.
