# Publication notes

Reviewed 6 September 2026. This branch is for review and has not been deployed.

## Remaining decision

An Impressum needs a genuine address suitable for the applicable disclosure and
service-of-documents requirements. Jannik does not want to publish his home address.
No alternative address has been supplied. Do not publish a fabricated address,
a PO box presented as a compliant address, or an employer's address without authority.
Once the address is resolved, add an `impressum.html` page with name, address and
contact details, link it from the homepage and privacy page, and complete the
controller contact details in the privacy notice. Confirm any additional DDG
requirements if the site is used to offer freelance or other business services.

The privacy notice is a draft for this redesign. Check that its email retention
description matches actual practice. Public MX records point to Google, but the
mailbox arrangement and any forwarding have not been confirmed. The notice uses
the recipient category of email providers rather than guessing the account contract.

## Legal basis and sources

- [Article 13 GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) requires information about personal-data processing. Necessary website delivery and security are assessed here under Article 6(1)(f). Contract-related enquiries use Article 6(1)(b). No consent banner is introduced for this static, untracked site.
- [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection) confirms that GitHub logs visitor IP addresses for security. Production DNS and response headers match GitHub Pages, without a separate Cloudflare proxy in front.
- [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) describes retention criteria and international-transfer safeguards. It does not give a fixed Pages visitor-log retention period. The old seven-day claim was removed.
- [Section 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) concerns storage/access on users' devices. This site does not add cookies or local-storage tracking. The mode selection lives in the URL.
- [Section 18 MStV and the media authority's guidance](https://www.medienanstalt-nrw.de/aufsicht/transparenz-im-internet.html) cover provider identification outside exclusively personal/family use. Given the professional bio and résumé, do not assume the exemption applies. The guidance rejects PO boxes and describes authorised recipients, including address services, as an alternative to publishing a home address.
- [Section 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) adds information duties for business digital services. Exact application depends on how this portfolio is used.

These notes document the implementation assessment, not a legal opinion or a claim
that the site meets every applicable legal requirement.

## Follow-ups handled in this branch

- The Ada mention is one sentence, with no separate achievements entry.
- Project selection, feuer.io history and the plain-document layout were reviewed.
- Both keyboard photos were compressed and stripped of metadata. Copy now mentions ergonomic keyboards and Colemak-DH.
- The mobile switch is fixed at the bottom right and does not push the introduction down.
- The transition starts at the actual button centre.
- Fancy-mode failure was reproduced with a real browser's offline setting. After connectivity returns, Chromium retains the failed import in the same document. The control now explicitly reloads the page with `mode=fancy`, preserving other query parameters and the fragment. There is no automatic retry loop or cache-busting library.
- The website privacy notice was rewritten for the current implementation. The four app policy/terms pages retain their legal wording, with accessible headings, language declarations and a shared stylesheet.

Run `npm run build`, `npm test`, `npm run test:browser` and `git diff --check`
before handing off. Browser checks require agent-browser and a running preview.

## Verification on 6 September 2026

The TypeScript build, four static tests and browser regression script passed.
Chromium checks covered 320px and 390px mobile layouts, a 701px viewport and a
1440px desktop viewport, plus light/dark fancy mode. Keyboard switching works
without View Transition support. Blocked JavaScript leaves all six projects visible.
Blocked fancy CSS preserves plain content and the reload control recovers after
unblocking. A fresh plain load requests only the local base stylesheet, app module
and favicon, with no cookies or local/session storage entries.

Both WebP files decode at their declared dimensions and contain no EXIF/XMP chunks.
Automated accessibility scans reported no violations for plain mode, the privacy
page and both fancy colour schemes. Contrast checks involving artwork needed
manual visual inspection. This is not a cross-browser accessibility certification.
