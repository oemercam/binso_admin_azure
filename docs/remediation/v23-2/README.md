# V23.2 Central UX remediation — implementation and evidence

## Controlled baseline

- Repository: `oemercam/binso_admin_azure`.
- Baseline: `cbd0f03b0a6923bcc1506ae30f93bb190abd7f41` (`main`, checked 13.10.2026).
- No open PRs at baseline. Existing uncommitted changes in a different checkout were not reused or modified.
- Azure `/api/health`: status `ok`, exact same SHA, release `cbd0f03`, profile `development-20261012`.
- Baseline Quality run `38313604859` and Deploy run `38315391315`: successful.
- Work occurs in a separate branch from this exact commit. No production data, schema, authorization, scanner policy or deployment settings were modified.

## Fresh inventory, not acceptance by inheritance

`docs/architecture/ux-inventory.json` and `routes.md` were regenerated from the actual source. They contain 72 page routes, 13 operator dispatch variants, page/layout import graphs, component source lines, API dependencies, permissions, CSS declarations, media contexts and conditional render candidates. The integration inventory contains no runtime import cycles or unreferenced modules.

The CSS inventory still reports 400 repeated selector/context candidates and zero `!important` declarations. Repetition alone is not a defect or proof of non-use. These candidates are **not** all marked corrected or removed. Static reachability is not proof of visual acceptance on every device.

## Root causes and central corrections

| Finding / screenshot | Actual render/import path and cause | Central correction / affected consumers | New or existing checks |
| --- | --- | --- | --- |
| Update banner; IMG_0139–0153 | Root layout → `PwaRegister`; waiting/installing workers set React state and render the global banner. CSS cannot remove the trigger. | `components/pwa-register.tsx`: no visible state or UI, silent activation, update check on resume, listener cleanup, no forced reload. Banner CSS removed from both sheets. Existing `public/sw.js` network-first navigation, hashed-asset exclusion, owned-cache cleanup and offline route retained. Both portals and every route share this registration. | `pwa-lifecycle-test`, `runtime-integrity-test`, PWA browser gate |
| Dashboard plus; IMG_0139/0146/0147 | `/dashboard` → `DashboardPage` → `CreateAction` points directly at invoice creation. Dormant shell quick menu has a different action set and no trigger. | Existing `binso-ux.tsx` gets one `QuickCreateAction`, composed from existing `ActionSheet`/`ActionRow` and existing routes. Six actions filtered through access/module/write rules. Time uses its manual-entry mode. Obsolete shell quick variant and CSS removed. | `v23-2-ux-test`; header browser scenarios at 390/1440 px |
| Plus diameter; IMG_0141/0150 | `CreateAction` is hardcoded 44 px; the actual nested header avatar is 30 px, distinct from its 44 px touch target. | `--header-avatar-size` shared by the real avatar and create circle. Create button has square dimensions, 50% radius and an enlarged transparent touch target. Bottom-navigation selectors/tokens untouched. | Navigation foundation; browser compares actual avatar/create rectangles |
| Double field frame; IMG_0151/0153 | Global `:focus-visible`, native focus border/shadow, dark-theme border reset and late field outline offset compete. Dark reset restores the unfocused border while the shadow remains. | One inset 2 px focus outline without shadow; remove late offset override. Native input/select/textarea, central `Field` validation/read-only behavior and ARIA associations retained. Both portals consume the same base styles. | UI foundation; support browser computes shadow and outline offset |
| Sheet geometry/footer; IMG_0151/0152/0153 | Existing `Sheet` supports sibling footers but a footer nested in a native form remains inside its scrolling body. A second keyboard-offset rule competes with visual-viewport geometry. | Existing `Sheet` normalizes direct native forms into scrollable content and a non-shrinking footer **inside the original form**. Header, max-height, focus/dirty guards remain shared. Remove dead secondary keyboard-offset runtime/token. Existing wizard sheet geometry retained. Support heading uses its parent context to avoid repeating the sheet title. | Native form/draft/submit unit; existing manual-time/dialog tests; support keyboard-size browser case |
| Chat hidden by keyboard; IMG_0149 | `/support/[id]` → `SupportChat` → `useWorkspaceViewport`; page height shrinks but app-main remains in layout viewport. Keyboard pan offset has no enclosing workspace anchor. | Conversation workspace anchored to visual viewport top/height; header inside uses top zero so pan offset applies once. Messages alone scroll, composer remains in flex layout. Keep existing draft/send retry state. Do not change bottom navigation. | Existing send-failure tests; browser tests height 300 and offsetTop 40 separately |
| Gray/large chart and verbose warning; IMG_0139/0142/0146 | Shared `Statistics` owns `#17191d` background and 180 px plot. `CashStatistics` outputs a long warning paragraph. | Same Statistics owner uses page tokens in both themes. Ring chart shows explicitly named **payment volume** (received + paid flows), never net profit or unrelated KPIs. Three financial KPIs remain. Bounded time series, custom filters and detail controls retained behind a disclosure. Plot uses compact height. Short warning disclosure keeps the full qualification available. Customer development remains a time series. | Statistics unit/period tests; ring zero/negative/missing/decimal tests; updated background browser assertion |
| Admin visualization | `OperatorDashboard` support insight uses three mutually exclusive status counts, while monitoring is a measured continuous time series. | Same `RingChart` displays the expressly named subset “Offen / in Bearbeitung / gelöst” with counts and shares. Administrative monetary KPIs stay distinct. Monitoring history and null-gap handling are unchanged. | Operator contract, observability tests and browser gates |
| Timer order; IMG_0148 | `/zeit` → `TimePage`; customer/project DOM precedes timer/status/actions. | Reorder actual DOM: status/time/actions, customer/project, today, manual entry. Existing server timer persistence, navigation synchronization, context locks, pause/resume/finish and authorization untouched. | Existing timer/context tests and PWA browser scenarios |
| Technical ticket reference; IMG_0150/0152/0153 | `supportReference` only recognizes a bare UUID; demo fixture appends tenant UUID to case number. POST ignores deployed human-number sequence and creates `T-UUID`. | Shared display-only reference formatter in `lib/support-reference.ts`, used by both portals. New records use the **already deployed** sequence as `SUP-year-number`; numbers longer than four digits never truncate. No historical reference or ID is rewritten. Operator repository returns existing case_number. | Sequence uniqueness and 9999→10000 tests; operator contracts |
| Technical activity decimal; IMG_0145 | `customerActivity` SQL concatenates `hours::text` into presentation strings, carrying database precision to the UI. | `formatActivityDetail` formats display only: `12,5 h`, CHF grouping/2 decimals. Central ticket timestamps include full year and Swiss business timezone. Query permissions, limits, ordering, ownership filters and numeric storage unchanged. | Formatting tests, migration/data regression |
| Wizard auxiliary action; IMG_0147 | `DocumentPage` puts approved-times assistance after the wizard, outside its content/height ownership. | Move creation assistance into position step. Retain the same existing action for editing existing invoices. Four steps, original drafts, validation, save/cancel and native footer logic retained. | Document, process-recovery and wizard tests |
| Quick-action return context | Project/expense forms hardcode time or expense-list return; new manual-time mode must retain dashboard origin. | Allow only literal `/dashboard` return on existing workflows; no arbitrary redirect target. Customer/document existing return handling reused. | Navigation/handler tests and quick-create browser flow |

## Removed legacy, with evidence of non-use

- PWA banner JSX/state/controller reload path and all `.pwa-update` declarations; no runtime banner users remain.
- Dormant `sheet === "quick"` alternative: no `setSheet("quick")` call existed. New action is composed from the canonical sheet owner, not a new modal library.
- Its `.quick-create-menu` selectors after removal of the last render path.
- `--sheet-keyboard-offset` and its ThemeRuntime listeners after removing the last consumer; one visual-viewport modal geometry remains.
- Dark statistics palette override and late form outline-offset patch after migration to their central tokens.
- Unused focus-hook import in expense form.

No stylesheet, package, business module or history is deleted merely because an inventory labels it a candidate.

## Verification and limits

Local evidence on the changed working tree:

- Full ESLint and TypeScript check: passed.
- Production webpack build: passed.
- Full repository unit/component/PGlite integration chain: passed using the **pre-existing** in-memory scanner transport because this environment rejects Unix socket creation. This is protocol coverage, not real socket or antivirus-engine evidence.
- Native-form submit/draft preservation, real sequence allocation boundary, permission filtering, legacy references and honest ring data: passed.
- `navigation-foundation-test`: customer and operator bottom-navigation markup, logic, icons, CSS and transitive tokens match the frozen reference.
- CSS architecture, release consistency and dependency audit: passed; existing exact dev-only security exception is unchanged.
- Route/CSS HTTP check: 57 routes / 5 produced CSS assets passed against a local production server. This validates delivery, not browser layout.

The local environment has no Chromium/WebKit binaries; the permitted installation attempt returned invalid download archives. Browser tests therefore remain **unexecuted locally**. CI must run the real socket/scanner gates, Chromium/WebKit, the new quick-action/native-sheet/viewport scenarios and existing functional regressions without skipping security checks.

Real iPhone standalone PWA, iPhone browser and Android device keyboard behavior are not signed off by a simulated viewport. The full application-wide visual release acceptance remains **pending** until fresh browser evidence and device checks exist. No previous acceptance report substitutes for these checks. No production merge/deploy is claimed by this report.

## Publication state

Local commit prepared; GitHub push was rejected by automatic approval review because publishing the complete branch to the destination was not explicitly authorized. No workaround was attempted. A PR, GitHub CI and production merge/deployment are pending permission to publish this exact branch to the user-named repository.
