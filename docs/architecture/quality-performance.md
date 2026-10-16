# Quality performance — 2026-10-16

Scope: workflow and test orchestration only. No production deployment, application,
business logic, screenshot baseline or acceptance-profile changes.

## Measured baseline

[Quality #1399](https://github.com/oemercam/binso_admin_azure/actions/runs/38950640955),
commit `db3f377884ee5ba1bd21beaad6fb4b8c843f1d8a`, full/development, succeeded.
Reported total 25m47s; Chromium 19m57s; WebKit 22m23s; checks 2m13s;
build 2m11s; scanner 1m11s. These are elapsed times, not summed runner minutes.

The downloaded job logs independently establish these step intervals:

| Step | Chromium | WebKit |
| --- | ---: | ---: |
| Responsive routes + process scenarios | 11m55.6s | 13m45.6s |
| Authenticated observability/wallboard | 3m02.2s | 3m07.7s |
| Localization | 1m16.3s | 1m53.2s |
| Critical time/draft/export | 43.3s | 1m04.7s |
| Registration | 33.5s | 31.6s |

Intervals use the step-start timestamp through the next step-start timestamp;
minor runner transition overhead is included. Browser setup/cache restoration
already existed. Dependency installation was about 2s; browser installation
14s/36s. Neither is the dominant bottleneck.

## Preserved coverage and orchestration

This repository uses custom Node/Playwright scripts, not Playwright Test projects.
`--shard`/`workers` from the Playwright Test CLI therefore do not control this suite.
The tested `partition` helper assigns routes and interaction groups to runners.

Full runs now use three responsive runners and one functional runner per engine.
Previously Chromium used two child processes on one runner and WebKit used one.
Each distributed shard uses one server/browser process; every assigned route
retains every width and both themes. All 14 interaction groups execute once per
engine across responsive shards. Functional suites execute once per engine, with
existing Chromium-only fixtures/lab/PWA restrictions preserved. Browser jobs need
the exact built candidate and plan; they no longer wait for independent checks.
The final required `quality` job still waits for every mandatory job.

Full Chromium: 85 routes × 7 widths × 2 themes = **1,190** cases.
Full WebKit: the existing 17 routes × 6 widths × 2 themes = **204** cases.
The pre-existing WebKit subset is retained, not described as 85-route coverage.
The separate critical suite retains 4 route/width/theme cases per engine plus
time/draft/export interactions. Its overlap with the full matrix is intentional:
it guarantees critical flows even for module-scoped PRs. Full runs retain axe,
screenshots, DOM and compliance evidence. No new baseline is automatically accepted.

The previously cited **255** cases describe a local visual audit, 85 routes ×
390/1065/1440 × light. They do not describe #1399's CI coverage. Two routes
(`/dev/ux-lab`, `/operator/wallboard`) are production denial/404 checks, not rendered
positive page captures; the development lab and authenticated wallboard have
separate positive suites. Shared list/form shells do not make their individual
page content/permissions redundant. No route or breakpoint is deleted based on
visual similarity. The 1065px local audit width is not one of CI's seven widths.

Standard PRs keep affected-module routes and interactions with narrower width
sets; all functional security/critical browser suites remain mandatory whenever
browser coverage is required. Shared UI/CSS/client changes now force full coverage,
as do unknown files, CI/dependencies, auth and schema changes. Manual full runs,
scheduled checks and published releases retain full coverage. Documentation-only
changes still run mandatory static/security/build/scanner checks; draft browser
deferral is unchanged. `qa-plan-test` and `quality-browser-plan-test` guard selection
and loss/duplication of route, width, theme and interaction coverage.

## Reuse, waiting and duplicate work

* Locked pnpm store, Next compiler cache and pinned OS/architecture/engine browser
  cache remain. Completed builds are never reused across source SHAs.
* Each custom harness already reuses its browser/context across route cases.
  Fresh pages are deliberate: fixtures mutate state and WebKit must not inherit
  an old Next RSC scheduler. Cross-suite server reuse is unsafe for authenticated
  observability/registration/PWA environments without further isolation work.
* Real 60-second refresh/outage/recovery waits remain. Blanket removal of
  `networkidle`, page restarts or screenshots would change assertions/evidence.
* Duplicate runtime/rate-limit/demo/navigation static commands were removed from
  the workflow's compliance step: `pnpm test` already executes them. The two unique
  compliance suites and the new orchestration contracts still run explicitly.
* Conversion to draft no longer triggers a second full checks/build run. Newer PR
  updates cancel obsolete PR checks. Main push and manual runs serialize in the
  same ref/profile concurrency group; pushes cannot cancel release qualification
  or execute identical qualification concurrently. GitHub retains only one pending
  run per group. PR branch pushes do not also trigger the main-only push workflow.
  Different acceptance profiles have separate groups; a completed standard run
  must never substitute for full release qualification.

Tradeoff: more concurrent runners and repeated setup can increase total runner
minutes. The target is elapsed feedback time with unchanged assertions. Account
concurrency/queueing can limit the gain; measure actual runs rather than extrapolate.

## Optimized comparison

[Quality #1400](https://github.com/oemercam/binso_admin_azure/actions/runs/38966070430)
succeeded with full planned coverage (the run title says `standard`, while the
conservative plan selects **full** for workflow changes). PR head
`e8434f5ded8c0b0ce11c472e5a952dc7f80ad8f5`; tested merge commit
`bb28dffae7c9c12942e6521ca959908b2103456c`. Application source equals #1399.

| GitHub displayed elapsed time | #1399 | #1400 |
| --- | ---: | ---: |
| Entire workflow | 25m47s | **11m22s** |
| Chromium critical browser path (longest job) | 19m57s | **8m09s** |
| WebKit critical browser path (longest job) | 22m23s | **8m29s** |
| Checks | 2m13s | 2m27s |
| Build | 2m11s | 2m00s |
| Scanner | 1m11s | 1m21s |

Measured total reduction: **14m25s / 55.9%**. This compares full browser coverage
against full browser coverage, not a smoke run against a full release. Hosted
runner variability and existing cache hits apply; one pair is not a percentile
benchmark. Summing parallel browser durations would answer a different question:
#1400 used about 54 browser runner minutes against 42m20s previously, including
the unnecessary Lab/PWA duplicates discovered below. Shorter feedback can cost
more runner minutes. Account concurrency limits can reduce the benefit.

Responsive shard results from the actual logs:

| Engine | Shard 0 | Shard 1 | Shard 2 | Total |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 406 | 392 | 392 | **1,190** |
| WebKit | 72 | 72 | 60 | **204** |

All 14 interaction groups passed in both engines, plus the independent critical,
localization, real PostgreSQL observability, registration and startup suites.
The required `quality` and `ux-compliance` jobs succeeded. Compliance reported
zero individual failed checks and 74/76 source routes with runtime evidence;
the existing physical-device, reviewed-pixel and individual approval gaps remain
explicit. A successful Quality run does not claim full production UX approval.

Inspection of #1400 logs found Lab/PWA executing on every Chromium shard as well
as the functional runner. The final workflow restricts both to the functional
lane; a parsed-YAML contract now checks every browser suite's unique owning lane.
The final revision also serializes main/manual checks per ref/profile while only
PR updates cancel stale runs. Its confirming full run is available in
[PR #262 checks](https://github.com/oemercam/binso_admin_azure/pull/262/checks).
Machine-readable baseline/comparison data is in `quality-performance-runs.json`.
No smoke-only GitHub runtime is claimed: it cannot be measured on this workflow
PR without bypassing its deliberately mandatory full selection.
