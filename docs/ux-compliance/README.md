# Central UX Compliance Engine 1.0.0

Starting commit: `b398ff7400eb1b2ea90016c25e596261d58c822b`, main / merge PR #235. Open PR #231 and #222 were inspected; their unmerged changes were not substituted for main. Product code, business logic and bottom-navigation code were not changed.

## Architecture

The existing TypeScript AST/PostCSS `scripts/ux-inventory.mjs`, `qa-plan.mjs`, sharded `ux-browser-test.mjs`, navigation contracts and Quality workflow are extended. No replacement browser framework or design component was introduced.

- `ux-compliance/requirements.v1.json`: versioned requirements, IDs, owners, routes/component types, standards, priorities, methods, cases, acceptance and review obligations. The current instruction is bound to engine adapters. Available V22.1/V22.2 registers are imported with prior acceptance discarded. Imported entries remain manual until their approval, route, owner and individual test bindings are reconciled. Original complete V21.1–V21.5 approval artifacts are unavailable; the registry is not claimed to contain unseen approvals.
- `identity.mjs`: source/registry/baseline fingerprint, stable across staged/untracked status. Reports and outputs do not affect identity. An old source fingerprint can never be promoted by a screenshot or suite pass.
- `measure.mjs`: stable-font/finite-animation layout measurements. Only visible, unclipped, non-inert fields of the foreground dialog count toward overlap checks. Legitimate chart/viewport variants are scoped. Inline bar heights and ordered CSS overrides remain candidates rather than blanket errors.
- `report.mjs`: fresh inventory, individual failed measurements, source/CSS candidates, source-route/state matrix, JSON/Markdown/CSV, stale-evidence rejection and remediation plan. A sampled passing browser requirement stays partial. Native device requirements and reviewed visual baselines remain explicitly open.
- `fixtures.mjs`: independent objects, synthetic tenant A/B IDs, empty/few/500-row lists, shared-customer invoices with status variants and partial payment, positive/negative/missing expenses, invalid input, roles and interrupted response/replay metadata. Browser fixture variants reuse the existing fail-closed API interception. `employee` maps to the actual repository role `member`; it is not a new product role. Alternative matrix fixtures cannot be combined with mutation interaction suites. Existing process suites own their invalid/recovery scenarios; pure fixture existence is not a browser pass.
- `visual.mjs`: exact decoded RGBA comparison with explicit reviewed per-case tolerances and dimensions. `visual-baselines.v1.json` intentionally has no automatically approved pixel snapshots. Missing baselines are untested. Initial protected navigation geometry was captured from unchanged baseline product code after both source contracts passed; tests never regenerate it. Pixel-level visual approval and physical PWA approval are separate.

## Run

```sh
pnpm ux:compliance:fast
pnpm lint
pnpm typecheck
pnpm build
BINSO_UX_COMPLIANCE=1 BINSO_UX_ROUTES=/dashboard,/finanzen,/kunden BINSO_UX_WIDTHS=390,768,1440 BINSO_UX_OUTPUT=/tmp/binso-compliance node scripts/ux-browser-test.mjs
node scripts/compliance/report.mjs --static --gate /tmp/binso-compliance --out docs/ux-compliance
```

Use the existing `qa-plan.mjs --base <base> --level standard` output and `browser-shards.mjs` for conservative affected-route plus central regression selection. Shared or unknown changes broaden coverage. Set `BINSO_PLAYWRIGHT_MODULE` to the installed Playwright module if it is installed outside this repository, as in the current workflow. Browser capture requires a local isolated server, mocked APIs and synthetic IDs. Never point the compliance harness at production. The alternative fixture setting requires `BINSO_UX_MATRIX_ONLY=1`. Examples: `BINSO_UX_FIXTURE_CASE=empty`, `negative`, `large`, `partial`, `no-expenses`, `admin`, `finance`, `employee`.

`--gate` blocks individually measured failures. `--release` additionally blocks every unresolved or partial requirement. This strict release gate is deliberately not currently green: imported approvals, route/state coverage, pixel baselines and physical-device evidence remain incomplete. Do not treat ordinary Quality success or an empty diagnostic report as a full UX acceptance.

## CI stages

Fast: existing lint/typecheck/unit checks plus registry/isolation/adversarial reporting/pixel-comparator and protected navigation contracts. PR: existing conservative route scope and central interactions with additional per-case measurements. Release: full existing responsive regression plus all registry coverage; it cannot pass unresolved requirements. `ux-compliance` aggregates uploaded browser evidence even after browser failure and becomes part of the existing final `quality` aggregator. It uploads reports including omissions; it does not auto-merge or deploy.

Diagnostic measured failures may make the PR gate red until a separate central remediation corrects the product. Do not weaken the expectations, approve new baselines automatically or suppress missing requirements to make this engine appear green.

## Review process

A CSS cascade, duplicate reachable wrapper or possibly unused declaration is a candidate. Compare actual JSX conditions, route/props, matching active CSSOM rules (`BINSO_UX_DOM_EVIDENCE=1`), computed values and stable geometry. Identify the owner and root cause before accepting a defect. Check dynamic references and Lab usage before deleting any component. Exact CSS consumers and breakpoints remain in the existing inventory.

For each imported requirement, obtain the original approval, resolve scope/owner/state, bind an individual executable assertion and add evidence. A representative interaction-suite pass is partial evidence only. For visual approval record route/state/engine/theme/viewport, reviewer, approval reference and a justified per-case threshold. For native approval record physical OS/device/browser/PWA installation, keyboard show/hide, safe-area/orientation and actual footer/back-navigation recordings. Desktop emulation cannot replace this.

Statistics conflict: the existing `.bo-statistics` and old browser assertion enforce `#17191d`; the later explicit white/app-background instruction governs light theme. Dark-theme treatment remains a declared variant review. The engine reports the light-theme mismatch; it performs no product palette change.

## Completing acceptance later

Requirements may register explicit `expectedCases` (route/state/theme/width/engine). They pass only when every registered applicable case has individual passing evidence. Review/device checks require named `reviewer` and `approvalReference`; a physical check additionally requires `device.physical=true` and `device.installedPwa=true`. Reconcile the full approval scope and set `approvalScopeComplete=true` only with that approval evidence. Current unspecified case matrices remain partial; the engine does not hardcode perpetual failure or manufacture full coverage.

Main-push promotion, published releases and an explicitly full workflow dispatch use the strict release acceptance gate. Missing collection artifacts do not suppress reporting; coverage remains untested and the existing final Quality job still blocks any failed required check/browser job.
