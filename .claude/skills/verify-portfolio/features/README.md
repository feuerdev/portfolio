# feuer.dev verification map

This directory maps what a visitor does on feuer.dev. Read it before driving the site, then use the
matching feature file as the recipe.

## Baseline preconditions

- The site runs as `SKILL.md` launches it, at `http://127.0.0.1:5011`.
- The playwright-cli session is new, at desktop size unless a recipe says otherwise.

## Driving conventions

- Start every recipe from a fresh load: every load starts plain.
- Use roles and accessible names. Project sections are `article` elements with the project slug as
  their id.

## Proof and skip reporting

- Capture the action and the resulting state, not only the final screen.
- Record the feature, the entry point and the viewport with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition. Do not report
  it as verified through a different path.

## Features

- [Plain mode](./plain-mode.md) covers the default document, its links, the project order and the
  legacy `mode` parameter.
- [Fancy mode](./fancy-mode.md) covers switching through the "frontend" rift, the reveal, pausing
  motion and switching back.
- [Policy pages](./policy-pages.md) covers the imprint, the privacy policy and the app policy pages.
