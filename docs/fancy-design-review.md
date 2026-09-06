# Fancy design review

6 September 2026. Starting checkpoint: `29ab3f5`, committed before this pass.
Applied the requested [frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).

## Direction

Keep the personality of a programmer's homepage, with clearer typography and room
for the actual work. The existing particle sculpture carries the decorative part.
Blue links connect fancy mode to the plain page's academic-homepage references.
The project copy, order, links and plain presentation remain intact.

The old presentation used the same large pastel frame for every project. Alternating
text columns made the short descriptions harder to scan, and repeated fade-ins
added movement to content that was already simple. Those were the main things to change.

## Changes

- Locally hosted IBM Plex Sans, regular and medium, replaces Helvetica in fancy mode.
  The two Latin-1 subsets total 42,944 bytes. Their license and provenance are retained.
- The base palette is cool white `#f5f7fa`, ink `#233442`, slate `#526475` and link
  blue `#2057bf`. Dark mode uses deep blue `#152532` and pale ink `#eef4fa`.
  The original orange sculpture and colours within the project images remain.
- Project descriptions share one left column. Artwork keeps proportions suited to
  its source, including the complete game screenshot and the small raytracer output.
  Mobile places the description before its image.
- The Scylla photos use a larger main photograph with the assembly photo overlapping
  its lower edge. Removed the surrounding coloured panels, redundant artwork labels,
  crosses and decorative pond rings.
- Removed scroll reveals and image-hover transforms. Content is visible immediately.
  The mode transition, interactive sculpture, motion controls and reduced-motion
  support remain. This also removes one observer and its cleanup code.
- The introduction and project section use less vertical space. At the captured
  1440px desktop width, the page is 4,194px tall, down from 5,053px.

## Comparison and verification

The local comparison contains a frozen copy of the committed checkpoint and a copy
of this revision, both runnable. It offers desktop/mobile widths, light/dark themes
and matching project navigation. The comparison lives outside the deployment folder.

Build, four static tests and browser regressions passed. Chromium accessibility
scans at 320, 390, 701 and 1440px reported zero violations in both colour schemes.
Inspected desktop and mobile screenshots, checked the comparison controls, native
links, switching, pause/resume and reduced motion on page load. Normal page loading
produced no console errors or page exceptions.

A fresh plain page downloads no font. Blocking both font requests leaves fancy mode
and all six projects usable with the fallback font. The first-load content and
existing interaction regressions are preserved. These checks cover Chromium,
not a full cross-browser or screen-reader audit.
