# Content sources

Reviewed 6 September 2026. This records evidence for the portfolio copy and the origins of its decorative artwork.

## Project selection

The project order is keep-mcp, split keyboards, the YouTube sponsor detector, feuer.io, the Swift raytracer and Big Pond. Each entry has one short paragraph. Human-api and Vorsorge are deferred. Wilo, Twitch Rerun Filter, the Tarkov calculator, the website itself and the tire testing contract entry were removed from the list.

The introduction combines the name, about text, AI sentence and contact links. Keep the wording concise and factual. Jannik supplied the Scylla build photos and confirmed that he assembled it and learned Colemak-DH. Do not imply that he designed the upstream hardware or firmware.

On 6 September 2026, Jannik chose to mention his current work at Ada Health in one sentence: "I'm a software engineer currently building regulated medical software at Ada Health." No separate Ada achievements or project entry are planned. He supplied the LinkedIn profile link and chose "I became proficient at software engineering before LLMs" for the AI sentence.

## feuer.io history

The current description treats the game as a continuing project, with the following evidence from its Git history. Dates use author dates where history was rewritten.

| Theme | Evidence |
| --- | --- |
| Started in 2018 | [Initial commit, July 2018](https://github.com/feuerdev/feuer/commit/d84faa6) |
| Docker and Jenkins | [Docker support, October 2021](https://github.com/feuerdev/feuer/commit/26e28be), [Jenkins pipeline](https://github.com/feuerdev/feuer/commit/140a878) |
| Browser code to React | [First React component, October 2022](https://github.com/feuerdev/feuer/commit/a8ad815) |
| Redux and sagas | [Auth refactor, July 2023](https://github.com/feuerdev/feuer/commit/54eb50f) |
| Next.js and shared-code monorepo | [Next boilerplate, November 2024](https://github.com/feuerdev/feuer/commit/1a44f63), [Monorepo setup](https://github.com/feuerdev/feuer/commit/6a7da21) |
| Vercel and Render deployment work | [Vercel build work](https://github.com/feuerdev/feuer/commit/8309c27), [Render preparation](https://github.com/feuerdev/feuer/commit/becb934) |
| Jotai | [Selection-state experiment, November 2024](https://github.com/feuerdev/feuer/commit/3e099f5) |
| Next.js back to Vite | [Replace Next with Vite, April 2025](https://github.com/feuerdev/feuer/commit/072a647) |
| Clerk and Zustand | [Clerk integration, May 2025](https://github.com/feuerdev/feuer/commit/0c4af2a), [dev state store](https://github.com/feuerdev/feuer/blob/dev/client/src/lib/state.ts) |

The README describes the hosting move from a VPS to Vercel and Render. This is a history of the project, not a claim that its old demo URLs are currently live. A separate microservices phase was not established in this review. Do not equate monorepo organisation with service architecture.

## Other copy

- [keep-mcp](https://github.com/feuerdev/keep-mcp): README and `src/server/keep_api.py`. On 6 September 2026, GitHub API searches for `"google keep" mcp in:name,description,readme` and `keep mcp in:name,description`, sorted by stars, found this to be the highest-starred dedicated Google Keep MCP server, with 94 stars. The next dedicated result, [davenicoll/google-keep-mcp](https://github.com/davenicoll/google-keep-mcp), had 10. Larger results were directories or unrelated products. The homepage qualifies popularity by GitHub stars, not downloads or users. Recheck this claim when updating the page.
- [Sponsor detector](https://github.com/feuerdev/yt-sponsor-detect): README and classifier implementation reviewed. Local MobileBERT classification through Transformers.js, with remote model loading disabled. The README records unfinished segment boundaries and caption handling. Describe it as a prototype. Jannik made the repository public on 6 September 2026. GitHub's API reported public visibility and an anonymous HTTP request returned 200.
- [Scylla keymap](https://github.com/feuerdev/qmk_userspace/blob/main/keyboards/bastardkb/scylla/keymaps/feuerdev/keymap.c) and [Totem configuration](https://github.com/feuerdev/zmk-config-totem): personal configuration on top of upstream QMK and ZMK.
- [Raytracer](https://github.com/feuerdev/Raytracer) and [renderer code](https://github.com/feuerdev/feuerlib/tree/main/feuerlib/Raytracer): Swift pixel-buffer rendering, sphere intersections, shadows and recursive reflections, plus an iOS scene editor.
- [Big Pond](https://github.com/feuerdev/fish): existing source and portfolio material. Its former German App Store URL returned 404 during review, so the page links to source.

## Artwork

- `keep-mcp.svg` and `sponsor-detector.svg` are explanatory diagrams authored for this page. They are not application screenshots or measured model outputs.
- `scylla-built.webp` and `scylla-build.webp` are Jannik's photos of his finished Scylla and its assembly. Exported from the March 2025 originals at 904 by 1200 and 1200 by 904 pixels using cwebp quality 80 with metadata disabled. Their sizes are 50,922 and 97,738 bytes. The full-resolution JPEGs are not included. These replace the previous keymap diagram.
- `raytracer.png` is a static frame at 3 seconds from [Jannik's raytracer demo](https://i.imgur.com/vWO23AJ.gif), linked from his repository README. The original recording is 190 by 338 pixels. It is kept static so it respects motion preferences without adding a second animation system. The source link leads to the original demos.
- `feuer-map.png` is the [May 2025 screenshot](https://github.com/user-attachments/assets/66ce532e-ec91-425a-bf6c-6ebaa3705e92) from the feuer.io README. CSS crops it to the project panel.
- `screenshots_fish.png` is an existing portfolio asset.

All project images are decorative, local and loaded only in fancy mode. Plain mode provides the same project descriptions and links without fetching artwork.

## Plain-document review

The September 2026 review looked at [Fabrice Bellard](https://bellard.org/), [Brian Kernighan](https://www.cs.princeton.edu/~bwk/), [Simon Tatham](https://www.chiark.greenend.org.uk/~sgtatham/), [Donald Knuth](https://www-cs-faculty.stanford.edu/~knuth/), [Ron Rivest](https://people.csail.mit.edu/rivest/) and [Peter Norvig](https://www.norvig.com/).

Bellard's inline project links and short descriptions are the closest match. Tatham shows how native lists and direct descriptions can carry a substantial homepage. Knuth and Kernighan use horizontal rules to separate document sections. These references informed the content structure, not a copied visual theme.

The homepage now starts with the name, a short bio and contact links. Each project is a visible paragraph with links in context. The expandable notes, role eyebrow, repeated technology lines, numbered labels and generic source-link labels were removed. The detailed feuer.io history above is background evidence, with only a short summary on the homepage. Fancy mode presents the same text with its existing artwork. The footer date is maintained manually.
