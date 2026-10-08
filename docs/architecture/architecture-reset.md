# Central UX architecture — correction package

Baseline: main `04b02079d9e697fe5b2a5c544657b37c947e89cc` (PR #220). PR #215 is already integrated. Open PR #214 concerns CodeQL and remains separate.

## Actual-code inventory

`pnpm ux:inventory` regenerates `routes.md` and `ux-inventory.json`. The catalog contains 70 page files, their reachable functions/components, conditional widgets, API prefixes, collection names, permission requirements and CSS rule IDs. CSS entries retain file/line, selector, media/at-rule context and declarations. Dynamic paths are templates; operator sections below are additional runtime variants, not additional page files. Static reachability includes conditional branches and does not prove that a widget is visible.

Operator section variants from `operatorNav`: dashboard, tickets, customers, payments, finance, subscriptions, restrictions, monitoring, announcements, security/roles and audit. Customer detail IDs, document numbers, support IDs and employee IDs are dynamic data. Preview aliases are read-only variants. Public/authentication/legal pages retain their existing layouts and session rules.

| Page family | Existing canonical implementation | Migration |
| --- | --- | --- |
| DashboardPage | AppShell, MetricTiles, RevenueInsight, DocumentSummaryRow | Domain modules dashboard/finance; real data unchanged |
| ListPage | AppShell, RecordsView, ListSearch, ListRow | General entity and financial summaries share the same two-line mobile row; desktop table retained |
| DetailPage | AppShell detail header, Status, entity facts/tabs | Customer, employee, payment and document route imports isolated; contact menu/header status retained |
| CreatePage | AppShell, Field, Input/Select/Textarea, FormActions | Customer, employee, product, expense, payment, support, document and project controls consolidated |
| EditPage | Same controls and FormActions; existing authorization | Settings, document settings, team and security controls reuse native behavior |
| DocumentPreviewPage | DocumentModal, actual PDF renderer | Same PDF bytes as download; existing PDF/QR generator retained |
| ChatPage | Existing viewport-aware SupportChat | Header, composer and message-only scrolling retained |

## Confirmed causes and changes

| Cause | Evidence | Correction |
| --- | --- | --- |
| 1,828-line page implementation plus a seven-module runtime distributor broadens imports and QA scope | `app-pages.tsx`, `SimpleModule`, route imports | Thirteen domain/shared files; seven dispatcher routes call their actual module directly. Compatibility exports remain. Mechanical extraction preserved all 49 original function/type bodies before intentional UX edits. |
| Raw sheet wrappers duplicate header/focus/scroll/footer ownership | Expense reimbursement, subscription, team, operator account, document position editor | One Sheet implementation with ActionSheet/FormSheet/FilterSheet contracts. Existing actions, permissions and payloads retained. |
| General records and financial records use unrelated row structures | `RecordRow` five-column avatar/status/chevron layout vs financial two-line row | Shared ListRow; FinancialSummaryRow and RecordRow delegate to it. No new CSS overrides. |
| Old row CSS describes a component that no longer renders | Source usage search, PostCSS selector catalog | Removed 52 obsolete selector entries / 44 complete rules; shared avatar selectors still used by contacts/operator are retained. |
| Draft invoice shows an open payment balance | IMG_9828 and DocumentReadView payment condition | Draft/cancelled/paid views do not show an open payment demand. Issued partial invoices still show the correctly derived balance. |
| Organization policy is isolated under time entries | IMG_9833/9834 and TimePage policy block | `/einstellungen/zeiterfassung`; existing GET/PATCH API, owner/admin/read-only/demo restrictions. Existing approvals unchanged. |
| Time filter edits apply before pressing Apply | TimePage date setters | Pending dates are applied only on Apply; closing preserves the active range. |
| Team invite/role handlers lack an immediate mutation lock | Original handler inspection | Same-frame ref lock, disabled/busy sheet state, email validation, failure retry/input retention. |
| Large Chromium release scope is the longest Quality browser stage | Previous successful CI runs | Two disjoint shards inside the existing Chromium job; route and interaction coverage remain exact, separate servers/output, any failure blocks the existing required job. WebKit remains single. |

No schema or financial calculation rewrite. No production data writes/reset. No changes to AppShell or the bottom-navigation markup/styles. `navigation-contract-test.mjs` verifies the approved navigation contract and responsive declarations against the original main reference.

## CSS audit boundaries

Import order remains the existing six runtime stylesheets. Catalog after cleanup: 2,683 rules, 494 repeated selector/context candidates, zero `!important` declarations. Repetition alone is not a defect: several responsive cascade refinements intentionally share a selector. They were not deleted without evidence. No global overflow hiding, new fixed widths or additional specificity overrides were introduced. Existing tokens, safe-area handling, viewport hooks, permission context and focus manager remain authoritative.

The navigation-owned AppShell overlays retain their protected existing wrapper; they already use the shared sheet styles and focus manager. Changing that protected navigation container was deliberately excluded. This is an explicit remaining consolidation boundary, not a claim that every sheet wrapper was replaced.

## FAST / INTEGRATION / RELEASE

- FAST: changed-file cached lint, incremental typecheck, selected existing unit regressions, scoped Chromium dev preview at 390/768/1440; capture the 390px result. No Azure or full browser matrix.
- INTEGRATION: typecheck, selected unit/regression suites, one build and representative Chromium/WebKit pages. Use `pnpm qa:integration --files …`.
- RELEASE: existing mandatory CI lint/typecheck/build/security/business/PWA/accessibility checks and full 320/375/390/430/768/1024/1440 matrix. Use `pnpm qa:release`; required CI checks are unchanged and never bypassed.

`qa-plan.mjs` uses the generated dependency catalog for domain modules, with conservative representative/full fallback for global, infrastructure and unknown changes. A product-only change selects the three product pages. CI planning needs no dependencies installed because it reads JSON. Existing pnpm store cache, Next compiler cache, build/check parallel jobs and exact build-artifact promotion were already correct and are retained. Browser binaries are not cached speculatively. Production deployment concurrency remains non-cancellable.

Measured baseline: previous PR Quality 506s, main Quality 535s, Azure 557s. Local changed-file checks measured 11.23s; targeted production browser acceptance: 24 route/viewport cases + all eight interaction groups, two shards, 25.264s. These are different scopes and are not a claimed release speedup. New CI durations are recorded in the final acceptance report when available.

## Verification status before CI

- Passed: frozen dependency install, full lint, existing unit/integration suites, typecheck, production build, CSS coverage, release/documentation/cleanliness checks.
- Passed: initial 12 browser cases at 390/768/1440; customer/time/document interactions and short-height sheet checks.
- Passed: targeted production 24 cases and all eight interaction groups, including draft payment suppression, pending time filter, policy access/error/retry/double-save behavior.
- Passed: sharding coverage/isolation/failure propagation tests; navigation markup/responsive styles unchanged against baseline.
- Required next: final GitHub release gates, merge, Azure exact-commit and live/PWA checks. Do not report this package as deployed before those pass.
- Blocked: physical iPhone/Android installation, real OS keyboard and Safari browser-chrome behavior; no physical device is available. Browser emulation is labelled separately.

Original reference images and rendered results are compared in the separate acceptance artifact. Cosmetic whitespace caused by a short list and a viewport taller than its content is not treated as a fixed-height defect. The header/toolbar layering must be tested in rendered pages; no speculative header override was added.
