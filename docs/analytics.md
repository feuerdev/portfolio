# Portfolio analytics

The HTTPS homepage at `feuer.dev` loads the hosted
[GoatCounter tracker](https://www.goatcounter.com/help/js) asynchronously from
`https://gc.zgo.at/count.js`. It sends counts to
`https://feuerdev.goatcounter.com/count`. The public collector URL grants no
administrative access. Local previews, Pages mirrors and policy pages do not load
analytics. Do Not Track and Global Privacy Control prevent loading and counting.

## Counts

| Path | Meaning |
| --- | --- |
| `/` | Homepage visit, combined across plain and fancy mode |
| `project-keep-mcp` | keep-mcp links |
| `project-keyboards` | Split keyboard photos, QMK and ZMK links |
| `project-sponsor-detector` | yt-sponsor-detect links |
| `project-feuer-game` | feuer.io links |
| `project-raytracer` | Swift raytracer links |
| `project-big-pond` | Big Pond links |
| `contact-email` | Introduction email link |
| `contact-github` | Introduction GitHub profile link |
| `contact-linkedin` | Introduction LinkedIn link |
| `contact-resume` | Introduction résumé link |
| `mode-fancy` | Completed explicit switch into fancy mode |
| `mode-plain` | Completed explicit switch into plain mode |

Project and contact events combine both presentations. Mode changes do not send
another homepage visit. All counts retain GoatCounter's
[session deduplication](https://www.goatcounter.com/help/sessions), so repeated
activations of the same event in a session do not represent every click.
Navigation remains native, including middle-clicks. Early clicks, disabled
JavaScript and blocked analytics leave gaps. No events are buffered or replayed.

The page path is always `/`. Event paths and titles are fixed. Referrers contain
only HTTP(S) origins. Queries and fragments are excluded before transmission,
including the tracker's separate `q` field. This also prevents
[automatic campaign attribution](https://www.goatcounter.com/help/campaigns).
The CSP permits only the tracker script and this account's collector, including
the tracker's built-in image fallback when `sendBeacon` fails.

## Hosted account setup

Sign into the [dashboard](https://feuerdev.goatcounter.com/) and open Settings.
These private settings must be applied and checked in the account. They cannot
be verified or changed through the public collector URL.

1. Set **Dashboard viewable by** to **Only logged in users**.
2. Set **Data retention in days** to **730**, the two-year retention window.
3. Under **Data collection**, enable **Sessions**, **Referrer**, **User-Agent**,
   **Size** and **Country**.
4. Disable **Individual pageviews**, **Region** and **Language**.
5. Save and reopen Settings to confirm the values. Verify that a signed-out
   request to the dashboard cannot read statistics.

Campaign collection is prevented by the client payload, rather than a separate
account checkbox. Hiding the Campaigns or Language dashboard widget alone does
not disable collection. The provider's
[settings form](https://github.com/arp242/goatcounter/blob/main/tpl/settings_main.gohtml)
and [collection definitions](https://github.com/arp242/goatcounter/blob/main/settings.go)
provide the labels and units above. Keep the website privacy notice aligned with
the saved values.

## Publication requirements

Apply the account settings and review the processing basis before merging.
The automatic integration reads screen width and the hosted tracker checks a
local-storage opt-out. A cookieless implementation does not itself establish an
exemption from [§25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html), which
covers access to information on the visitor's device. The provider's
[GDPR rationale](https://www.goatcounter.com/help/gdpr) explicitly leaves national
law to a separate assessment. The privacy notice uses Article 6(1)(f) GDPR for
the stated analytics purpose. Confirm that basis and any consent requirement for
this actual configuration before publishing. If consent is required, gate the
tracker behind consent and align the notice before deployment.

## Verification

Run `npm run build`, `npm test` and `git diff --check`. The unit tests exercise
loading preferences, payload sanitization, visibility, native link events,
session flags and tracker errors. Browser verification also needs to cover the
real hosted script, CSP, successful and failed mode switches, native navigation
and the production-only guard. Intercept collector requests during verification
to avoid adding artificial visits to the private dashboard. Live dashboard
receipt requires a separate check after an authorised deployment.
