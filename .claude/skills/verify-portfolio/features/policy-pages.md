# Policy pages

The imprint, the privacy policy and the policy and terms pages of the Impfalarm and Big Pond apps
stay at their published URLs.

## Sub-features

- `policy-site` serves `/impressum.html` and `/privacy-policy.html`, linked from the footer.
- `policy-apps` serves the four app pages.

## How to get to it (user POV)

- The footer links on `/`.
- Direct URLs from the app stores: `/impfalarm-privacy.html`, `/impfalarm-tos.html`,
  `/bigpond-privacy.html`, `/bigpond-tos.html`.

## Driving it with playwright-cli

Preconditions:

- None beyond the baseline.

- **Footer.** On `/`, run `playwright-cli click "getByRole('link', { name: 'Impressum' })"`. The
  imprint loads. Go back and do the same for the privacy policy link.
- **App pages.** Run `curl -s -o /dev/null -w '%{http_code}\n'` against each of the four app URLs.
  Each answers `200`. Open one with playwright-cli and screenshot it.

## Gotchas

- These URLs are linked from outside the site. Renaming a file breaks them even when the footer
  still works.
