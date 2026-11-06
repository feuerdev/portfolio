# Content sources

Reviewed 6 September 2026, with artwork updated 2 October 2026. This records evidence for the portfolio copy and the origins of its decorative artwork.

## Project selection

The project order is keep-mcp, human-api, llm-autobattler, split-keyboards, yt-sponsor-detect, agent-box, feuer-io, swift-raytracer and big-pond. Each entry has one short paragraph. On 6 November 2026, Jannik chose lowercase slugs for every heading: repository or component names for AI-era work and descriptive slugs for older projects. Paragraphs name Human API, Two Generals, feuer.io, Swift and Big Pond where the slug differs. Vorsorge is deferred. Wilo, Twitch Rerun Filter, the Tarkov calculator, the website itself and the tire testing contract entry were removed from the list.

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
- [Human API](https://human.feuer.dev): landing page and llms.txt reviewed on 5 November 2026. The repository is private, so the heading links to the live service. The question names the goal the service tests: agents finding, paying for and using a human answer on their own.
- [Two Generals](https://twogenerals.feuer.dev): the [llm-autobattler](https://github.com/feuerdev/llm-autobattler) README and PRD reviewed on 5 November 2026. Players buy an army within a points budget and describe tactics in free text. An LLM compiles them into a restricted program that runs the battle without further model calls. Two players can duel in a private room. The repository is private, so the heading links to the live game.
- agent-box: `proxmox/agent-box` in Jannik's private `setup` repository, reviewed on 6 November 2026. One unprivileged Proxmox container runs Claude Code and Codex as separate users. Jannik steers them from the Claude and ChatGPT apps. A 20-minute timer resumes one usage-limited Codex goal or turn once included usage is available again.
- [Sponsor detector](https://github.com/feuerdev/yt-sponsor-detect): README and classifier implementation reviewed. Local MobileBERT classification through Transformers.js, with remote model loading disabled. The README records unfinished segment boundaries and caption handling. Describe it as a prototype. Jannik made the repository public on 6 September 2026. GitHub's API reported public visibility and an anonymous HTTP request returned 200.
- [Scylla keymap](https://github.com/feuerdev/qmk_userspace/blob/main/keyboards/bastardkb/scylla/keymaps/feuerdev/keymap.c) and [Totem configuration](https://github.com/feuerdev/zmk-config-totem): personal configuration on top of upstream QMK and ZMK.
- [Raytracer](https://github.com/feuerdev/Raytracer) and [renderer code](https://github.com/feuerdev/feuerlib/tree/main/feuerlib/Raytracer): Swift pixel-buffer rendering, sphere intersections, shadows and recursive reflections, plus an iOS scene editor.
- [Big Pond](https://github.com/feuerdev/fish): existing source and portfolio material. Its former German App Store URL returned 404 during review, so the page links to source.

## Artwork

- `keep-checklist.webp` is the real Google Keep checklist capture from [keep-mcp PR #19](https://github.com/feuerdev/keep-mcp/pull/19), originally `checklist-title-before.png`. It shows the disposable fixture created by an actual MCP `create_list` call: Buy milk unchecked and Pack bag checked. The short tool-call summary below it repeats those recorded items and states, not the full JSON transcript. CSS crops the image to the open note, excluding account chrome and navigation. The original pixels and long evidence-run title are retained. Lossless WebP, 1280 by 720 pixels, 42,834 bytes, with metadata disabled. No new notes were created for this portfolio update.
- `human-review.webp` is Jannik's screenshot of the production reviewer UI on 5 November 2026. It shows question `fd80f07a-09ea-46f5-8eae-3b0f38c240e5`, a paid Base Sepolia question sent through the agent wallet tool for this artwork ([tx 0xdbfa…422e](https://sepolia.basescan.org/tx/0xdbfa89c0ba4bb9394b06ef91c8d66cd367aecdb0a9a13555b4aeafb399c5422e)). The selected option was not yet saved. No account details are visible. Lossless WebP, 699 by 644 pixels, 16,048 bytes, with metadata disabled.
- `llm-autobattler-battle.webp` is a battle at 18.6 seconds against the NPC army, captured on 5 November 2026 from llm-autobattler commit `7475647` running locally. The army's tactics were compiled by the configured model from "Archers keep their distance. Cavalry flanks enemy archers. Everyone else advances and attacks." The capture is cropped to the battlefield canvas with its countryside border. Lossless WebP, 966 by 805 pixels, 104,544 bytes, with metadata disabled.
- `agent-box-session.webp` is Jannik's Claude app screenshot from 6 November 2026, showing the agent-box device sheet with this portfolio session connected. Cropped to the sheet, excluding the status bar, the device list and the session list. Lossless WebP, 1080 by 900 pixels, 21,794 bytes, with metadata disabled.
- `sponsor-popup.webp` shows the actual extension popup at [commit 80a6fe0](https://github.com/feuerdev/yt-sponsor-detect/tree/80a6fe03fdb579c30cef45a1966a05f88806bb40/src). Captured from the unpacked extension in an isolated Chromium profile at 520 by 310 pixels, using its default categories and thresholds. Lossless WebP, 7,026 bytes, with metadata disabled. This is the implemented settings interface, not a claim about measured classifier accuracy or completed video skipping. The former placeholder SVG diagrams were removed.
- `scylla-built.webp` and `scylla-build.webp` are Jannik's photos of his finished Scylla and its assembly. Exported from the March 2025 originals at 904 by 1200 and 1200 by 904 pixels using cwebp quality 80 with metadata disabled. Their sizes are 50,922 and 97,738 bytes. The full-resolution JPEGs are not included. These replace the previous keymap diagram.
- `raytracer.png` is a static frame at 3 seconds from [Jannik's raytracer demo](https://i.imgur.com/vWO23AJ.gif), linked from his repository README. The original recording is 190 by 338 pixels. It is kept static so it respects motion preferences without adding a second animation system. The source link leads to the original demos.
- `feuer-map.webp` is the [May 2025 screenshot](https://github.com/user-attachments/assets/66ce532e-ec91-425a-bf6c-6ebaa3705e92) from the feuer.io README. It fits within the project media area without cropping.
- `screenshots_fish.webp` is an existing portfolio asset.
- The game and Fish images are exported from PNG at their original dimensions using cwebp quality 80 with metadata disabled. Their sizes are 20,290 and 51,560 bytes.

`og-image.png` is the link-preview image named by `og:image`. The page itself never loads it. It is a 1200 by 630 pixel agent-browser capture of the local fancy hero on 5 November 2026 from commit `f4c703d`, taken after the universe formed, with the mode controls and project contents hidden. PNG, 303,714 bytes. Recapture it when the hero changes.

All project images are decorative, local and loaded only in fancy mode. Plain mode provides the same project descriptions and links without fetching artwork.
Artwork shares a bounded media area, up to 400 pixels tall on desktop and 220 pixels
on narrow screens. Screenshots retain their aspect ratios. The small raytracer capture
is never enlarged, and the two keyboard photos retain their overlapping composition.

Fancy typography uses [IBM Plex Sans](https://github.com/IBM/plex/tree/master/packages/plex-sans),
regular and medium Latin-1 WOFF2 subsets. The two files total 42,944 bytes and are
served locally only when needed in fancy mode. Their SIL Open Font License is
retained in `public/assets/fonts/LICENSE.txt`.

## Plain-document review

The September 2026 review looked at [Fabrice Bellard](https://bellard.org/), [Brian Kernighan](https://www.cs.princeton.edu/~bwk/), [Simon Tatham](https://www.chiark.greenend.org.uk/~sgtatham/), [Donald Knuth](https://www-cs-faculty.stanford.edu/~knuth/), [Ron Rivest](https://people.csail.mit.edu/rivest/) and [Peter Norvig](https://www.norvig.com/).

Bellard's inline project links and short descriptions are the closest match. Tatham shows how native lists and direct descriptions can carry a substantial homepage. Knuth and Kernighan use horizontal rules to separate document sections. These references informed the content structure, not a copied visual theme.

The homepage now starts with the name, a short bio and contact links. Each project is a visible paragraph with links in context. The expandable notes, role eyebrow, repeated technology lines, numbered labels and generic source-link labels were removed. The detailed feuer.io history above is background evidence, with only a short summary on the homepage. Fancy mode presents the same text with its existing artwork. The footer date is maintained manually.
