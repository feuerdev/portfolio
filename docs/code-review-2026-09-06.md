# Portfolio code review, 6 September 2026

Reviewed the feature branch starting at `db8a17c`, covering the shared document,
both presentations, TypeScript, assets, policy pages, tests and deployment workflow.
The implementation fits the site: readable static HTML, two small script modules,
and optional artwork. There are no runtime package dependencies. The useful fixes
were accessibility semantics and mode-switching edge cases.

## Findings addressed

| Priority | Finding | Change |
| --- | --- | --- |
| P2 | Completing a mode switch always focused the toggle, even if the visitor had since focused another link. | Restore toggle focus only when focus has fallen back to the document body. |
| P2 | Back navigation during a pending switch could be ignored, then have its URL overwritten by the old switch. | Preserve the latest navigation request and apply it after the pending operation finishes. |
| P2 | The four app policy/terms pages lacked a language declaration, main landmark and heading structure. | Add `lang`, `main`, native headings and distinct page titles. Their legal body text is unchanged. |
| P3 | Project titles looked like headings in fancy mode but were absent from heading navigation. | Use linked `h3` headings, styled inline in plain mode to preserve its appearance. |
| P3 | Decorative images used `img` elements without `src` or `srcset`. | Keep valid images inside inert HTML templates until fancy mode starts. Repeated toggles reuse the images. |

The Split keyboards heading now links to the completed Scylla photo. The assembly
link still opens the build photo. Repeated policy styles now share one stylesheet.
Stale reveal selectors and duplicate artwork-label rules were removed.

Heading structure follows the [WAI page-structure guidance](https://www.w3.org/WAI/tutorials/page-structure/content/).
The [HTML image specification](https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element)
requires an image source. [Templates](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template)
let the document retain valid image markup without fetching decorative media in plain mode.

## Verification

- TypeScript build and all four static tests passed. Local links/assets resolve at both `/` and `/portfolio/`.
- Browser regressions passed for mobile button placement, offline reload recovery, URL preservation, transition origin, reduced motion, heading navigation and artwork loading. Added deterministic regressions for focus preservation and Back navigation, reproduced failing before the fixes and passing afterward.
- Chromium layouts were inspected at desktop and narrow mobile sizes. Keyboard navigation did not reveal links hidden behind the floating control. Checked toggling, direct fancy URLs, pause/resume, blocked application JavaScript and the fallback without View Transition support.
- The completed Scylla link opens a decodable WebP. Fancy mode instantiates seven images once. A fresh plain load requests only local base CSS, the app module and favicon in addition to the HTML.
- axe-core 4.12.1 reported zero violations on plain mode, settled desktop fancy mode in both colour schemes, mobile fancy mode in both schemes, and all five policy pages. Mobile contrast checks involving artwork had incomplete results and were inspected visually. A scan during a fade reported transient low contrast, so desktop scans were repeated after each reveal settled.
- The four app pages' body text was compared before and after, ignoring markup and whitespace: identical.
- Normal page loading and switching produced no browser console errors or page exceptions. `npm audit` reported zero known vulnerabilities.
- Anonymous HTTP checks returned 200 for the homepage's GitHub destinations and résumé URL. LinkedIn rejected the automated HEAD request, so that check does not establish profile availability.

## Decisions and limits

Keep the current static architecture. Content does not need a separate data layer,
and the two script modules have clear responsibilities. The animation already
honours reduced motion, offers pause/resume and stops its rendering loop when
hidden, offscreen or disabled. Existing published asset URLs were retained.

The homepage has a restrictive same-origin CSP, native navigation, a canonical URL,
basic social metadata and no tracking storage. Deployment actions are pinned and
write permissions are limited to the deployment job. The browser regression command
is optional locally and is not currently run by CI.

TypeScript 4.4.3 is old, but the strict build passes. Updating the development
toolchain can be a separate maintenance change. No dependency upgrade was needed
for these fixes.

This was a source review and Chromium verification, not a full screen-reader or
Safari/Firefox audit, nor a production performance measurement. The existing
Impressum/address and privacy publication decisions remain in
[publication notes](publication-notes.md).
