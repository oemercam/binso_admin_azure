<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

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
- All creation/editing uses the existing FormSheet modal owner: bottom sheet on
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

# Codex workflow and context (canonical project instructions)

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
