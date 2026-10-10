# Binso One V22.4 – implementation and remaining evidence

Baseline: `b398ff7400eb1b2ea90016c25e596261d58c822b`. No production merge/deployment is claimed. This is a review candidate, not complete platform compliance.

The existing Quality pipeline and PR236 compliance engine are extended; no parallel design components or test framework. The strict main/release gate intentionally rejects missing approvals and coverage. Pending/rejected file access is now denied and requires a real scanner before release.

| Finding | Status | Implementation / remaining action | Verification |
|---|---|---|---|
| V224-SEC-001 | implemented | Existing MFA replacement denied by both handlers. First enrollment verifies a row-locked pending secret, revokes other sessions and writes an audit event in the same transaction. | scripts/auth-integrity-test.mjs; PostgreSQL CI repeat required |
| V224-SEC-002 | implemented | Atomic conditional removal from the current recovery hash array; same code succeeds once, distinct codes cannot resurrect each other. | scripts/auth-integrity-test.mjs --postgres |
| V224-DATA-001 | implemented | Token consumption, active-user password change and session deletion share one transaction; bounded hashing happens first. | scripts/auth-integrity-test.mjs: injected deletion fault, rollback, retry and consumed-token denial |
| V224-SEC-003 | partial-blocker | Download and PDF-logo quarantine enforced. Central fail-closed local ClamAV INSTREAM integration added; clean-only logo/avatar publication and tenant/purpose-scoped company references protected. Scanner infrastructure, real-engine detection, deployed limits/signatures and legacy pending-file rescan remain unproven. | scripts/file-scan-test.mjs (protocol peer only; OS socket in CI), scripts/auth-integrity-test.mjs and settings browser cases; docs/security/file-scanning.md defines remaining live scanner acceptance. No production release claim. |
| V224-SEC-004 | implemented | Provider free text/recipient/subject removed from mail logs; API errors log category only; logger redacts sensitive payload fields. | scripts/runtime-integrity-test.mjs |
| V224-SEC-005 | blocked-live-proof | Forwarded host/IP trust depends on Azure ingress configuration. No configuration assumptions or blind auth change made. | Read-only Azure ingress proof and origin/IP-spoof tests still required |
| V224-SEC-006 | implemented | JSON, multipart uploads and signed Stripe webhook are bounded during stream reads, including chunked bodies. | scripts/runtime-integrity-test.mjs plus actual upload handlers |
| V224-SEC-007 | blocked-live-proof | Actual EasyAuth ingress/header stripping and operator bypass boundaries require Azure access. Existing identity and tenant checks preserved. | Live ingress/direct-path operator-negative tests |
| V224-DATA-002 | implemented | Shared apiUpload assigns replay keys per File and purpose/entity. Existing transaction-bound business replay owner stores response and content hash. | Actual upload replay/conflicting-body tests on migrated PGlite and PostgreSQL CI |
| V224-DB-001 | blocked-live-proof | No blind FORCE RLS migration or production-role alteration. Existing non-superuser tenant tests retained. | Inspect deployed role, owner/BYPASSRLS and applicable policies before adding scoped migration |
| V224-CI-001 | implemented | Automatic and manual deploy resolve a successful Quality push run for exact current main SHA, download and validate its artifact before migration. Manual rebuild bypass removed. | Workflow review plus initial non-deploy artifact-resolution validation still needed |
| V224-CI-002 | upstream-watch | No unsupported major upgrade. Current production audit passed; reevaluate affected version ranges when the announced upstream advisories are published. | Current upstream range/patch review at release time |
| V224-CI-003 | implemented | Existing dev exception bound to braces 3.0.3, exact ESLint path/dev root and expiry 2026-10-24 UTC. Production audit independently blocks. | scripts/security-exception-test.mjs; pnpm security:scan:all |
| V224-CI-004 | implemented | All third-party Actions use upstream-resolved full commit SHAs; same major versions retained in comments. | git ls-remote upstream tag and peeled commit resolution; current CI execution |
| V224-UX-001 | partial-review | Latest light Statistics instruction implemented with app tokens and updated browser assertions; existing dark palette retained pending variant approval. | Chromium/WebKit per-theme Statistics measurements; dark variant review open |
| V224-CSS-001 | review-candidates | CSS cascade inventory retained. No blanket selector deletion or ban based on literal reachability. | Per-state CSSOM and consumer proof before removing candidates |
| V224-ARCH-001 | partial-review | Unused generic updateCompany mass-assignment writer removed after reviewing actual settings owner, named imports, runtime conventions and database consumers. Other candidate exports retained. | Updated dependency inventory plus whole tests/build; remaining candidates need individual proof |
| V224-PERF-001 | implemented | Finance app consumers explicitly request view=cash. Cash-only handler does 3 queries instead of 8. Default external legacy contract remains. | Actual handler SQL counting and default-response preservation in auth-integrity-test.mjs |
| V224-PERF-002 | measurement-required | No blind route-group or CSS repartition. Shared public/operator payload needs further profiling before changing root boundaries. | Cold bundle measurements, route transitions and before/after asset budgets |
| V224-PERF-003 | implemented | Session lookup expires only its authenticated non-demo tenant; invalid sessions do no global trial cleanup. Scheduled bulk maintenance API remains. | Migrated tenant-specific expiry and existing trial/paid/read-only regression |
| V224-PWA-001 | implemented | SW v7 deletes only obsolete binso-one-shell caches; fallback lookup uses its own namespace. Foreign same-origin caches retained. | scripts/runtime-integrity-test.mjs; actual PWA lifecycle browser |
| V224-TEST-001 | implemented | Partial invoices/status and payment amounts now agree; offers have zero payments. Variant fixtures enforce legal draft/cancelled/paid/partial balances. | scripts/compliance/selftest.mjs and current browser suites |
| V224-TEST-002 | implemented | Browser assertion waits replaced with DOM/font/finite-animation readiness and controlled search-response barriers; deliberate network fault latency remains labelled simulation. | Current representative interactions and loading browser; no flake-rate claim |
| V224-TEST-003 | partial-blocker | Existing PR236 engine integrated with current owners and corrections. 432-entry registry, source-bound measurement/reporting and strict release acceptance remain explicit. | Incomplete original approvals, individual case bindings, reviewed pixel baselines and native evidence still block full acceptance |
| V224-DB-002 | blocked-historical-proof | NOT VALID historical constraint preserved; no historical data correction or migration performed. | Read-only deployed historical violation count and domain decision before VALIDATE |

## Release blockers

- Local scanner integration exists; actual deployed engine/signatures/limits and historical pending-file release not proven
- Original complete V21 approval sources and 432-requirement bindings incomplete
- Reviewed pixel baselines and physical installed iOS/Android keyboard/PWA evidence missing
- Azure ingress/EasyAuth, deployed database role/RLS and historical data not inspected

## Next order

1. Verify PostgreSQL physical-client auth races and current full browser/Quality results.
2. Operate and prove scanner quarantine/release, Azure ingress and production role constraints.
3. Reconcile approval provenance; bind each remaining applicable route/state/role requirement; review pixel/native variants.
4. Profile shared public payload and review CSS/export candidates individually.
5. Review historical constraint violations without editing invoices; only then propose a migration.

Bottom-navigation markup/logic/icons/styles/transitive tokens unchanged; no productive customer or invoice rows edited

## Measurement integrity follow-up

The first GitHub run passed both browser jobs but its combined report blocked one dashboard/demo 320px dark action-clearance measurement. The original adapter assumed two animation frames established the scroll endpoint. A delayed route reset can invalidate that assumption. The adapter now proves a stable current document endpoint, records scrollY/endpoint/proof and remains blocking if it cannot establish the endpoint or the actual action overlaps navigation. Chromium/WebKit adversarial fixtures cover a late reset, restoration, genuine overlap and blocked scrolling. No production navigation or padding was changed. The superseded run remains historical evidence; current source-bound measurements must be rerun after this adapter change.

## V22.6 scanner extension

The existing quarantine finding remains a release blocker until the deployed engine is proven. See [central file-scanning contract](../../security/file-scanning.md). This extension adds no production migration, merge or deployment.
