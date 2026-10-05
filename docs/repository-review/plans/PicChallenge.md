# Piccy: private photo-selection utility

Status: deferred to the later native-app phase together with Fish, 5 October 2026. No revival schedule is committed. The implementation milestones below are conditional on starting that phase; do not schedule them as current work. `feuerdev/PicChallenge` is the SwiftUI Piccy implementation. The separate lowercase `pic-challenge` repository is an earlier UIKit experiment; do not continue both.

## Existing system and cleanup

SwiftUI staging grid, image picker, pairwise choices through feuerlib's tournament tree, winner and share sheet. A share extension hands images to the app using app-group UserDefaults. Source predates modern PhotosPicker and uses `Set<UIImage>` plus whole image blobs in defaults; app tests are placeholders. Workspace expects sibling feuerlib and includes a Pods reference; Podfile still names the previous PicChallenge targets. No current Mac build or App Store availability is established.

Cleanup adds purpose/setup/status documentation and the spec. It preserves the current native project and entitlements because signing, dependency removal and target repair need a real Mac build; static inspection cannot prove those changes work. No claim of build readiness is made.

## Customer and hypothesis

An iPhone user has 8–32 similar photos and cannot choose the one to post, print or send. Pairwise comparison should reduce the decision to a series of taps while keeping originals on-device. Test holiday/burst shots and creator/product shots separately; do not assume one segment serves both.

Differentiation hypothesis: explicit human choice, private local operation and undo, without AI scores or uploading photos. Existing photo-comparison products such as [WhichOne AI](https://apps.apple.com/us/app/photo-comparison-whichone-ai/id6744938398) show competition, not proof of demand for this approach.

## MVP flow and requirements

Select 2–32 images with the system picker → show ordered thumbnails and allow remove/reorder → start comparison → choose left/right or undo previous choice → see winner and optionally runner-up → export/share without changing or deleting originals → start over or discard local session. Handle empty/one-image selection explicitly before a bracket starts.

Non-goals: social voting, uploads, AI judging, library cleanup/deletion, subscriptions, collaborative galleries, desktop app and unattended selection of every photo in the library. Share-extension support is a second milestone after picker-only flow is reliable.

| Component | Technical contract | Acceptance |
| --- | --- | --- |
| PhotoItem | Stable UUID/source identifier, local file reference, orientation and bounded thumbnail; preserve selection order in an array | Same ordered inputs create the same bracket; duplicates have a defined import policy |
| Tournament | Pure Swift core decoupled from UIImage/UIKit; explicit participants, rounds, byes, decisions and undo history | Counts 0/1/2/3/5/16/32 covered; no image lost; final winner came from an actual user choice except single-item case |
| Selection fairness | Describe single-elimination/order bias; show runner-up only with its actual meaning | UI does not call winner objectively “best”; no fabricated ranked list |
| Import/render | Downsample off main thread; limit simultaneous decode; fetch full resolution only for display/export when needed | 32 twelve-megapixel inputs stay within a proposed <200 MiB app-memory target on the chosen supported device; measured result recorded |
| Persistence | Versioned local session JSON + app-private files; atomic write and discard cleanup | Terminate/relaunch resumes decisions; corrupt manifest gives recoverable reset; discarded files reclaimed |
| Share extension | App-group file handoff, serialized metadata, async completion/cancellation; no bulk blobs in defaults | Multiple attachments imported once, failed/cancelled import leaves no half-session, extension fits tested memory budget |
| Accessibility | Native buttons with image context/position, visible focus, Dynamic Type, VoiceOver left/right/undo | Complete import→winner→share with VoiceOver; no gesture-only essential action |
| Privacy | System picker access, no account/cloud/analytics in MVP; never change library assets | Offline completion works; network inspection finds no app-origin data upload |
| Export | Share/export original selected image respecting orientation; preview confirmation | Exported winner matches input asset; sharing cancellation does not reset session |

Recommended dependency strategy: first reproduce the existing sibling-workspace build on a Mac. Then extract only TournamentTree/Node/needed collection helpers to a tested Swift package or local module. Avoid modernizing all feuerlib consumers at once. Replace outdated Podfile references only after confirming whether the app actually needs CocoaPods; do not simply run pod install against stale target names.

## Deferred work packages

1. **P1 — discovery and native baseline (1–2 days + participant scheduling).** Observe 6–10 users choosing from real photo sets without recording/uploading personal images; ask about repeat use and price. Fresh Mac clone, inspect signing/targets/workspace, document supported iOS and Xcode. Done when picker-to-winner path is reproduced or blockers are ticketed with evidence.
2. **P2 — deterministic core/import (2–3 days).** Pure tournament/session model with stable IDs, byes and undo; bounded thumbnail import. Add meaningful unit fixtures and stop allowing empty tournament starts. Done when edge counts, order, undo and duplicate policy pass.
3. **P3 — complete utility (2–3 days).** Persistence/discard, original-image export, accessibility and help. Done when a fresh tester selects 16 photos and shares a winner in <90 seconds after import, without coaching or original modification.
4. **P4 — beta and optional share extension (1–2 days).** Five device testers over a week, failure/memory review; migrate handoff if still demanded. Evidence and TestFlight/store materials require actual native verification and authorized account access.

Estimate: 5–10 focused engineering days after Mac/dependency setup; store review is additional. Do not implement billing until discovery gates pass.

## Release and business gates

Portfolio: clean native build, deterministic tests, actual app walkthrough, accessibility and memory evidence; a case study on choosing IDs/file-backed media/undo is enough without commercial release.

Paid utility: of 10 target users, at least six finish unaided, four report an actual weekly reuse opportunity and three explicitly accept a proposed EUR 4.99–9.99 one-time unlock. These are proposed gates/prices. Start with a small free selection limit and a larger-selection pro unlock only after value is demonstrated; no subscription unless repeat value warrants it. Price/market research, store terms and applicable tax handling are release tasks, not asserted facts here. If demand is weak, stop at a polished free portfolio demo.

## Verification and rollout

Requires macOS/Xcode: fresh clone with sibling feuerlib, `xcodebuild -list` on the workspace, then a simulator build/test using an available destination. Verify real-device picker cancellation, limited photo access, orientation, high-resolution imports, low-memory behavior, background resume, undo and share cancellation. TestFlight is optional and needs explicit distribution authorization. No Xcode tests were run on this Linux VPS. Ship incremental PRs; session schema migration must be versioned and preserve an export/discard path. No changes to original photo assets are allowed.

## Shared native-app phase

Reproduce both Piccy and Fish native builds on Mac before choosing milestones. Share Mac/Xcode setup, dependency repairs, signing preparation and device testing while preserving each app's purpose. Piccy remains private local photo selection; Fish remains marine-life discovery with provenance/uncertainty review and separate evidence for swimming-safety claims.
