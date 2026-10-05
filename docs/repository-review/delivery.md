# Cleanup delivery and verification

The selected cleanup is intentionally bounded: accurate status/onboarding, reproducible lightweight checks, build/config hygiene and implementation-ready specs. The proposed products are not implemented by this pass.

| Repository | Cleanup | Verified here | Remaining checks |
| --- | --- | --- | --- |
| keep-mcp | Correct label-based write-scope explanation; status/spec; local pytest-cov dependency; ignore local checkpoints | Python 3.11.17/MCP 2.3.0/gkeepapi 0.17.1: 58 tests, 97.41% coverage, Ruff, compileall; actual stdio initialization discovers 24 tools without credentials | Live Google Keep scenarios/screenshots and Python 3.10/3.12 compatibility not rerun; no Keep tool called |
| feuer (dev) | Sequential builds; explicit workspace package names; setup/status docs; generated/env ignores; Tailwind ESM plugin import; bounded demo spec | npm ci (497 packages), client TypeScript completed before Vite; server build; client lint after config fix; focused PostCSS animation generation | Full client bundle exceeds deliberate 256 MiB Node heap on this VPS; no larger retry. Multiplayer/browser/manual playtest and production auth/persistence not run |
| PicChallenge | README with correct repository/app identity, dependency/target blockers and product spec; ignore local checkpoints | Workspace XML and 13 plist/entitlement files parse | Native build/tests require macOS/Xcode; stale Pods workspace/Podfile targets and signing need real native verification |
| yt-sponsor-detect | Correct repo/package name; honest prototype/setup docs; no-ML validation separate from exploration; spec; ignore checkpoints | Fast validation passes 10 JavaScript files and package/manifest entries; npm ci --ignore-scripts installs 252 packages; heap-capped webpack compiles source modules | Webpack exits1 because model/ assets are absent (minification disabled for this check). Standard production bundle/model loading blocked; no inference, accuracy or browser behavior verified |
| portfolio | Versioned review, full 25-repository ranking, inventory and four plan snapshots under docs/repository-review | Build passes; all4 existing static site tests pass; documentation links, inventory coverage, score arithmetic and four snapshot copies verified; whitespace checks pass | Browser checks not run (documentation-only change); no presentation/source behavior modified |

`make` is absent on this VPS, so Keep checks used equivalent `.venv/bin/python -m pytest`, `ruff`, and `compileall` commands. A task-local uv/Python runtime was installed under ignored repository-review/.tools; no host packages/services were changed. Node is the installed 24.15.0; feuer's requested Node 22.11.0 was not installed/tested. A production-dependency audit was cancelled to keep checks sequential; no dependency-audit success is claimed.

No deployments, merges, store submissions, model training, live trading, credential changes or messages to potential customers were performed. No browser or preview was started. Existing portfolio artifacts were preserved.

## Review location and publication

[keep-mcp draft PR #22](https://github.com/feuerdev/keep-mcp/pull/22) is open. Its remote tree exactly matches the reviewed local tree. No merge or release was performed.

The consolidated snapshot is committed locally in `portfolio/docs/repository-review/`. The feuer, PicChallenge, sponsor and portfolio PR descriptions/patches are prepared locally. Remote branch creation in feuer returned GitHub 403, “Resource not accessible by integration”; the installed-repository listing exposes only keep-mcp. Shell Git also lacks a GitHub credential. No access-control bypass was attempted. The remaining PRs can be opened after those personal repositories are available to the connection.

The standalone review bundle contains the complete ranking, public metadata/commit inventory, all four plan snapshots, this validation report, PR descriptions and applicable cleanup patches. It contains no auth state, dependency directories or run-specific live-account evidence.

The repository review covers 25 visible repos (24 scored personal candidates and one work-origin exclusion). Human-api and Vorsorge are mentioned in existing portfolio notes but could not be fetched; they are not assigned fictional scores. Private-repository clarification remains unanswered at delivery.
