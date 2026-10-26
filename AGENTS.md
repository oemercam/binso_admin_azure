<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BINso One — binding product and UI rules

The user's original ZIP in docs/audit/v24/reference/ is the binding visual source.
Read docs/audit/v24/reference/IMPLEMENTIERUNG.md and
docs/architecture/reference-foundation.md before UI work.
The original Microsoft variant wins over historical Flow, Noir, Apple, grey or
permanent-toolbox instructions. Historical audit reports are evidence, not rules.

- app/design-system/manifest.json declares the ordered CSS owners. There is no
  fixed stylesheet count. Base, states and responsive rules share a component owner.
- Reuse the design-system components for headings, controls, lists, sheets,
  feedback and charts. Extend the common owner for reusable requirements.
- Current Microsoft material is opaque: no glass classes, glass tokens, backdrop
  blur or capsule/shadow containers around header actions. Historical appearance
  snapshots are archives, never authority to restore the retired material.
- Internal navigation keeps the shell and uses the common quiet LoadingState.
  Never render transient loading sentences in subtitles, counters or empty-state
  cards. Keep accessible status announcements, real errors and retry actions.
  AppStart with the original BINSO icon is for initial session bootstrap only.
- No route-local CSS, JSX style blocks or literal inline presentation. Dynamic
  measurements may pass CSS custom properties into the owning component.
- Business creation/editing uses the existing FormSheet modal owner: bottom sheet on
  mobile, centered dialog on desktop; expanded editors retain a scrollable body
  and bottom actions. Stable labeled navigation, contextual
  headers follow ux-current-approval.md. Creation belongs to the common content
  command bar beside search/filter on desktop, never the global header or navigation.
  The approved 19 October mobile CreateAction is one blue floating plus above the
  navigation/safe area, hidden in forms, dialogs, keyboard input and chat.
  See docs/architecture/ux-app-standardization.md for the current acceptance scope.
- New pages must follow a documented page pattern and include loading, empty,
  error, read-only, keyboard and narrow-screen states. Mark missing reference
  screens as derived in the review; never silently call them original-approved.
- Preserve real APIs, authentication, roles, financial calculations and files.
  Reference data is allowed only in isolated test fixtures, never tenant data.
- The latest explicitly approved Microsoft UX decision takes precedence, including
  navigation. The historical bottom-navigation baseline is not a permanent design
  freeze. Keep its regression tests until a concrete approved replacement and its
  rendered, keyboard, focus, safe-area and geometry evidence justify a controlled
  contract update. See docs/architecture/ux-current-approval.md; no blanket bypass.
- For visual acceptance, compare original and actual login/list/detail at equal
  content widths first. Cover affected route families and operator variants with
  rendered evidence; system-wide UX changes and releases require full coverage.
  A green build or static inventory is not visual acceptance.
- Keep incomplete work in a draft PR. Never disable failed gates, silently accept
  new screenshot baselines, or deploy production without explicit authorization.

## Current V25 approval (19 October 2026)

V25 is authorized for implementation: see docs/architecture/v25-requirements.md.
V25.1 corrections are authorized too: see docs/architecture/v25-1-requirements.md
and its acceptance matrix. Existing navigation and floating-plus freezes remain.
The existing navigation and blue floating plus remain unchanged in appearance,
position and behavior. This latest explicit freeze overrides older permissions
to redesign them. Reuse the current foundation; no glass/blur. Empty states use
short copy without clipping at zoom; security explanations and necessary primary
actions remain reachable. Business-rule changes need separate regression evidence.
Production deployment still requires separate explicit authorization.

## V25.4 approved additions (20 October 2026)

See docs/architecture/v25-4-ux-marketing-app-ready.md and the unchanged supplied
sources there. config/plans.ts is the canonical tariff source: Start includes
orders; Pro has no regular user cap; independent document management is Pro-only,
while domain attachments retain their existing module access. Prices stay fixed.
The owner explicitly approved D16: time_only members see authorized navigation
targets only, even fewer than five. Preserve material, icons, height, position and
the blue create action. This scoped permission exception supersedes the old fixed
slot requirement; no general navigation redesign is authorized. Historical visual
references remain archived; the new source reference needs rendered countercases.
Module profiles restrict roles, never replace backend authorization, assignment
scope or RLS. Public demo provisioning is closed; trusted isolated QA remains.
No production migration, merge, deployment or native-store release is authorized.

## Complete V25 master (21 October 2026)

The byte-preserved docs/audit/v25-complete-master-20261021/source.md replaces the
truncated prompt. Follow docs/architecture/v25-complete-master-20261021.md for
implementation and evidence. Tenant MFA is voluntary for every tenant role;
opted-in TOTP/recovery remains enforced at login. Critical mutations require a
fresh session-bound password plus the enrolled factor, or session-bound email
verification when no factor is enrolled. Preserve operator authentication, RBAC,
RLS, revocation, audit and rate limits. Passkeys do not bypass an enrolled factor.
Registration and optional initial company setup are full pages; ordinary business
editors retain the existing FormSheet. Navigation and blue FAB remain frozen.
A green test is not evidence of real mail delivery, a human read or device approval.
New package merge, production migrations and deployment require exact-SHA approval.

## Revision 7 (21 October 2026) — current complete source

The byte-preserved docs/audit/v25-revision7/source.md supersedes earlier V25
masters and addenda. All 56 chapters and P0/P1/P2 are binding; P3 is excluded.
Use docs/architecture/v25-revision7.md and its generated requirement/route/state
registers. Old implementation reports remain evidence, not competing authority.
Retain navigation/FAB, server authorization, RLS and independent review rules.
Existing green PR305 evidence does not qualify new Revision7 changes. No new
package merge, production migrations or deployment without exact-SHA approval.
Legal translations, real devices, domains and provider configuration need actual
external evidence; do not present a generated register as executed acceptance.

# Codex workflow and context (canonical project instructions)

## UX Navigation Master V7.1 (25 October 2026)

The owner explicitly adopted the complete byte-preserved
`docs/architecture/ux-navigation-v7/source-v7-1.md`, including V7 chapters 1–11.
It supersedes conflicting older presentation/navigation rules: compact shared
14-px rows, eight-row customer hub without tabs, customer-scoped global lists,
personal-only avatar, categorized More, and ticket detail before conversation.
Preserve mobile dock/FAB appearance and geometry, authentication/MFA, RLS,
financial calculations and existing business processes. Reuse central owners;
no route-local styles or parallel design/data models. The full inventory and
findings are evidence, not acceptance. Keep missing TR/legal/device/provider
qualification explicit. Perform targeted changes and final mandatory gates;
no production migration, external mutation, GitHub push/merge or Azure deployment
without separate explicit authorization. Local commits for the final QA identity
are allowed. Historical migration files must not be rewritten.

## Customer-detail card material (25 October 2026)

The owner's subsequent explicit request extends the existing customer-detail
card, icon and separator pattern to content groups across customer and Admin
pages and subpages. `docs/architecture/ux-navigation-v7/content-cards.md` records
this addition. It supersedes older flat/open-section appearance contracts;
reuse the existing central components, tokens and CSS owners. Keep one perimeter
per group, no nested card chrome, and preserve navigation/FAB, data and security.
Derived views still require visual approval; this authorizes no external writes.

## Master Implementation Phase 1 (24 October 2026)

The user supplied the complete `docs/architecture/master-phase1/source.md` after
the initially truncated paste. It supersedes conflicting presentation and MFA
rules below: Navigation V2 changes the customer destinations to overview,
customers, orders, time and More with its named icons, retaining the existing
dock geometry/material/safe area and blue FAB. The typography table is binding.
Company administrators may require employee MFA; operator MFA is mandatory,
including direct APIs. Use existing identity and i18n infrastructure. Preserve
all financial, tenant, authorization and integrity boundaries. Update obsolete
UX contracts with explicit new requirements and real countercases, never blanket
bypasses. Work locally only: no production writes, pushes, merge or deployment.
Current matrix, implementation evidence and unresolved decisions are recorded in
`docs/architecture/master-phase1/implementation.md`. Real external provider/device
and legal approval remain evidence requirements, never invented passes.

V25.5 follows the existing V25.4 handoff, never an assumed integrated Main.
Use docs/architecture/v25-5-platform-lifecycle.md and its single traceability CSV.
One identity/one active company, submitted-before-independent-time-approval and
session-bound fresh authentication remain server/DB boundaries. The complete
21 October master supersedes the former mandatory tenant-role TOTP rule. Keep unapproved PL-G/D gates open; no production actions.
V25.5 expands the authorized-target exception to all roles and tariffs: show only
permitted destinations, fewer than five allowed; preserve existing navigation
material, icons, height, position and blue FAB. Historical references stay intact.

- Work toward one clearly bounded objective per assignment. State the outcome,
  affected area and validation scope briefly; do not add cleanup, audits, PRs,
  monitoring or deployment beyond the agreed scope. Respect explicit time limits;
  at the limit, document completed work, remaining checks and blockers, then stop.
- First activate the project-local runtime described in the workspace AGENTS.md
  (`. ../runtime.ps1` from this checkout; Git 2.55, Node 24.20.0, pnpm 10.17.1).
  Repeat activation in each new shell invocation; do not install replacement tools
  or change global settings. If this checkout lacks that workspace bootstrap,
  report the limitation rather than inventing a path or silently using other tools.
- Inspect `git status`, unstaged/staged diffs and the affected files first. When a
  committed branch change is relevant, inspect the diff against the agreed base;
  do not fetch or scan the whole repository just to establish routine context.
  Preserve unrelated changes and existing branches; never reset them to get clean.
- Use README.md's project orientation to select sources. Historical audits are
  dated evidence, not current instructions or current CI/release status. Read large
  inventories, screenshots and audit archives only for a specific question.
- Do not repeat whole-repository analysis or reread unchanged files already known
  in the assignment. Reopen only relevant ranges after changes or when evidence
  is missing. Use targeted `rg` searches and bounded output. `.rgignore` excludes
  generated evidence from normal searches; explicitly scope `rg --no-ignore` to
  the needed evidence/inventory path for an audit. It is not a security boundary.
- Batch related reads and independent read-only tool calls where useful. Keep
  edits, dependent operations and approvals sequential. Do not repeat successful
  checks without new changes, a failure or a concrete unresolved concern.
- During longer work, give a brief update at least every 60 seconds with findings,
  uncertainty and next step. Finish with changed files, checks and open points.
- For a new substantial development objective, recommend a new chat with a short
  handoff: objective, branch/commit, changed files, decisions, checks and blockers.
  Do not automatically create chats or discard context for the current objective.

## Development checks versus integration and release

- During development, run focused tests for affected behavior. Use `qa:fast` only
  when its planned suites are relevant; `pnpm qa:plan --files <paths>` previews
  scope without running suites. Use actual affected paths, not a narrower selection
  that hides dependencies. Paths in `--files` are comma-separated.
- Run `pnpm typecheck` for relevant TypeScript/type-contract changes, or use
  `pnpm qa:fast --typecheck --files <paths>` to include it. Plain `qa:fast` does not
  typecheck automatically. `qa:fast` and `qa:integration` have no browser by default;
  `--browser` explicitly requests one. `qa:integration` includes a production build.
- Use targeted browser checks when a visual/interactive change needs them. Do not
  run the complete browser matrix after each individual edit. At integration,
  preserve every existing required Quality, Security and acceptance gate. Full
  browser validation remains mandatory for system-wide UX changes and releases;
  a deferred or unexecuted check is never a pass or final visual acceptance.
- Failures must be investigated and reported. Never suppress failures, weaken
  gates, accept new baselines silently, or claim completion with required checks
  missing. If the assignment excludes a required expensive check, report the
  validation gap and leave final acceptance pending rather than expanding scope.
- `qa:standard`, `qa:full`, `check` and `ci` are broad verification commands, not
  the default feedback loop for small edits. Documentation-only changes normally
  need consistency/link/diff checks, not app builds or browser regressions.

## GitHub, CI and external systems

- Bundle GitHub status reads for the same commit/run. Do not use tight polling or
  repeatedly download unchanged logs. Without an explicit monitoring/wait request,
  report the current run/link and pending checks, then finish without waiting for CI.
  When waiting is requested, use bounded waits/backoff, respect the time budget and
  notify only on meaningful progress, failure or required action.
- GitHub/Azure writes, PR lifecycle changes and CI reruns must stay within the
  agreed assignment. Productive interventions require explicit user authorization.
  Preserve existing workflow configuration and mandatory gates unless a change
  to those is itself authorized. A green check alone never authorizes production.

## Current V26 implementation (22 October 2026)

The user authorized implementing the packages from docs/architecture/v26-gap-and-packages.md
locally on a separate feature branch, reusing the V25 foundation. The unchanged
docs/architecture/v26-source/BINSO_ONE_V26_MODULAR_MASTERKONZEPT.md is the V26
Revision3 business target. See docs/architecture/v26-module-contracts.md for
module ownership and docs/architecture/v26-execution.md for actual progress.
The current branch is feat/v26-modular-revision3, based on a64582c7, including
the unpublished V25 IBAN fix 00bfe5ce. Do not overwrite the V25 branch or treat
it as merged Main. Local commits per package; no pushes in this development
block. Bundle relevant tests per coherent block; do not rerun full suites,
builds or browser matrices after small edits. Relevant P0 authorization,
RLS, audit rollback and integrity checks remain required. No per-package
permission question when implementation is already authorized. Unanswered
business decisions are not approval: new sensitive HR/payroll/family fields,
commercial changes and unvalidated payroll stay closed. Existing tariffs,
Identity, finance/document engines, mobile navigation and blue FAB remain.
No merge, production migration, deployment, bank transfer, paid service or
productive payroll without the separate applicable approval.

## Confirmed V26 release and access decisions

The user explicitly chose completing V26 before preparing its release. Preserve
current prices and existing rights. New supplier/resource functions use the
existing Business/Pro supplier module; payroll uses the existing Pro payroll
module. No new paid add-ons or automatic subscription changes. The user approved
explicit additional grants for new sensitive HR/family/payroll data: owner/admin
roles do not inherit them automatically. Self-service payslips require a separate
identity-bound policy. Implement these approved decisions without per-package
confirmation; legal payroll validation and productive actions still need their
actual evidence and applicable authorization.

## Current UX Master V4 (23 October 2026)

The user explicitly adopted docs/architecture/ux-master-v4/source.md and the two
filter/sorting reference screenshots. V4 supersedes conflicting V3/V3.3 action,
header and selection rules. Preview only: no push, merge, production migration or
deployment is authorized in this implementation block. Existing bottom navigation
and blue floating plus remain unchanged. Simple sorting and status filters use
anchored dropdowns at their own icons on every viewport; complex filters may keep
the existing mobile sheet. Separate active-state rows reset only their own filter
or sort, preserving search and the other selection. No obsolete V3 header-menu
exception or mobile sorting-sheet assertion may override this newer approval.
Keep financial, tenant, permission, historical document, mail/outbox and integrity
checks. docs/architecture/ux-master-v4/implementation-status.md records actual
implementation/evidence gaps; a source inventory never grants visual acceptance.

## UX Master V4.1 (23 October 2026)

The byte-preserved docs/architecture/ux-master-v4-1/source.md and contract.md
record the latest scoped request. Full native language names were explicitly
confirmed by the user. The supplied source is truncated in chapter 25; do not
invent its tail. implementation-status.md records the time-boxed partial result,
not global acceptance. Preserve all release gates, navigation/FAB and business
logic. No push, merge or deployment is authorized by this implementation block.

## Finance analysis Final V1 (23 October 2026)

The byte-preserved docs/architecture/finance-analysis-final-v1/source.md and
contract.md supersede the older finance-analysis presentation. Preserve existing
ledger calculations and status/filter meanings; current receivables have no
historical comparison snapshot. implementation-status.md records actual local
checks and remaining drilldown/reference/Admin limitations. No GitHub push,
merge, production write or deployment is authorized.

## UX Master V5 (23 October 2026)

The byte-preserved docs/architecture/ux-master-v5/source.md and contract.md are
the newest UX authority; chapters 28–36 take precedence, including short language
triggers with full native option names. Preserve navigation/FAB and every
financial/security/tenant/consent boundary. Reuse existing legal clauses and
version IDs; missing translation approval is not permission to invent legal
text. The implementation-status records the partial 15-minute result and open
Admin/route/legal approval gaps. No GitHub or production actions authorized.

## Systemaudit corrections (26 October 2026)

The user authorized implementing all system-audit corrections. docs/current-state.md
is the current orientation and documents the Phase1/V7 precedence over historical
latest-V5 claims. Earlier dated branch/status statements are historical context.
Keep security, tenant and financial boundaries, existing mandatory gates, original
source archives and exact-SHA production approval. Never treat prepared scanner,
network, restore, legal, device or delivery work as executed acceptance.
See docs/operations/system-hardening-20261026.md and the evidence register.
