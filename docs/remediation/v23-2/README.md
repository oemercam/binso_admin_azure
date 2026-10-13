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

## Fresh CI findings — first published candidate

Published PR #246 at `6e5c7b2ebf5d2b3268ff9245c763f20cc35ebb09` after explicit user authorization. Quality run `38364606762`: checks, real scanner engine and production build/artifact passed; CodeQL run `38364606832` passed. Both browser gates correctly blocked acceptance.

- WebKit identified a real empty-state regression: `Keine Buchungen` was inside the collapsed trend container. The central Statistics owner now keeps the empty status visible independently of trend disclosure. The test still requires visible empty text and additionally expands the plot before testing zero-height bars.
- Chromium identified a real CSS-cascade conflict: `.page-head:not(.page-head-detail) .page-actions .button` overrode the canonical create circle with 40 px height. Excluding `.bo-create-action` from that generic sizing rule restores the shared 30×30 avatar geometry without a local page patch. The existing exact rectangle comparison remains unchanged.

Fresh WebKit screenshot/DOM evidence was inspected for dashboard, support conversation and keyboard-sized manual entry. No browser or deployment success is claimed for the first candidate. The follow-up candidate must complete the full current gates.

### Zweiter CI-Lauf – 38366231346

Build, vollständige Checks, echte Scannerqualifizierung und CodeQL erfolgreich. Beide Browser kamen über die korrigierten Plus- und Statistikprüfungen hinaus und scheiterten an der alten Erwartung von drei Support-KPI-Kacheln. Der Supportanteilstest prüft jetzt den gemeinsamen RingChart mit expliziten Fixture-Werten 2/3/5, Gesamtzahl 10, Anteilen 20/30/50 % und auswählbarer Detailzahl. Keine Browserprüfung oder Release-Sperre wurde deaktiviert.

## Screenshot follow-up IMG_0161–0170 (13.10.2026)

Live health was read again: `cbd0f03b0a6923bcc1506ae30f93bb190abd7f41`, status ok. The visible update banners are from that deployed baseline, not the unpublished V23.2 branch.

Additional centrally owned corrections:

- `Sheet` recognized direct HTML action rows by `className` but missed the `FormActions` component before React rendered it. Component-based actions now become direct footer siblings of the scroll body. Native form submit ownership remains unchanged.
- The shared two-column footer left a single company-save action at half width. A single action now spans the existing grid; multi-action rows retain their layout.
- Company logo upload sat outside the existing company-field grid, losing the shared field-group gap. It now occupies a full-width cell in that grid.
- The plan block's bottom border and subscription grid's top border drew duplicate lines; the grid's bottom border paired with the invoices section's top border. The subscription grid no longer draws outer borders; existing neighboring blocks own the separators.
- Team settings rendered the database plan key directly. It now reads the display name from the existing plan catalog, with explicit trial/unknown labels.
- IMG_0170 shows the PDF viewer initialization loader, after the PDF blob has loaded. The viewer had no deadline for a pending module import/worker handshake. Its complete startup attempt is now bounded at 20 seconds, with a retry action, cleanup and suppression of late results. This is a proven missing failure path; the specific iPhone stall trigger is **not yet identified or claimed fixed**. CI/browser/device evidence is required before accepting the reported PDF failure.

Validation of this follow-up: actual compiled Sheet and PDF hook lifecycle tests passed, including stalled module/worker startup, timeout, late completion and unmount. TypeScript, targeted ESLint, CSS architecture and frozen navigation contract passed. The unit/component/PGlite chain passed with the existing in-memory scanner transport; the source inventory was regenerated after its expected fingerprint mismatch, and the remaining integration/process/operator suites then passed. No real local socket/engine result is claimed. Production build passed for the final Sheet correction. New browser checks cover the company footer/gap/width and a stalled worker followed by a real canvas-rendering retry. Local WebKit was downloaded but cannot launch due to missing native libraries; Chromium downloads were truncated. Browser results are therefore pending CI. No production deployment or device acceptance is claimed.

The subscription screenshot captures content behind the fixed navigation while scrolling. Reachability at the end of scrolling still needs browser/device verification; a static screenshot alone cannot prove the final section is inaccessible. No bottom-navigation declaration, markup, behavior or shared navigation token was changed.

## Outlook reference follow-up IMG_0171–0175

The user explicitly requested the reference navigation/interaction pattern for Mobile/PWA. Main mobile pages now show the compact Binso emblem and page title together, with the existing search/notification/account actions grouped in one capsule. The duplicate content title is hidden only on main mobile pages; the visible header title remains an h1. Detail headers retain back/title/context actions. Running timers stay in the header flow rather than overlapping the title.

The existing shared HeaderPanel now fills the visual viewport on mobile. Search opens directly with its focused field, Cancel and permission-filtered type selectors from the canonical search source catalog. Notification/account views have one central Back control. Desktop remains anchored; mobile filter/sort sheets use the same existing form owner below the header. No data source, permission, portal-switch rule or bottom-navigation contract was changed. These are web/PWA views; native Outlook animations or platform material rendering are not claimed.

Browser tests were updated to assert mobile full-view bounds and return before switching global views, while retaining desktop anchoring and keyboard-height checks. An actual component test verifies search types and module permissions. Real local browsers remain unavailable; CI and physical iPhone acceptance remain required.

Prior candidate 78e138c: CodeQL, checks, scanner and build passed. Both browsers rejected the new company single-action width assertion because it compared the button against the footer's outer box, including deliberate mobile page-gutter padding. The assertion now compares against the available content box, subtracting computed padding and borders, while still rejecting a half-width action. No assertion or browser gate was removed. This corrects test geometry, not business permissions or the desired full content width.

## Grouped settings reference IMG_0176–0177

The user requested the reference layout/colors as the Mobile/PWA standard. A reusable SettingsGroup owns section labels and one rounded, outline-free group surface. Settings navigation, account groups, appearance/language, notification preferences and time-approval preferences now consume it. Mobile settings navigation adds a real local search that filters only accessible existing destinations and omits empty groups. No Outlook-specific setting, Face ID feature or placeholder capability was introduced.

Mobile grouped surfaces have a light and dark palette scoped to their component: dark surface #141414, label #a0a0a5, text #dedee2, separators #2b2b2e, icons #929297 and active-switch accent #48a7ff. Light equivalents are explicit. Titles sit above groups; existing action rows gain inset dividers, 52px minimum height and 22px container corners. Mobile settings headers and their search field have a separate quiet neutral surface. Global theme/navigation tokens are not changed. Other business lists/workspaces are not claimed visually migrated by this focused update.

Targeted lint, TypeScript, production build, CSS architecture, navigation, UI foundation and component/architecture tests were exercised locally. The browser gate now measures group surfaces and tests local search/empty-group restoration. Real Chromium/WebKit evidence and physical iPhone acceptance remain pending. This report does not claim a deploy or pixel-identical native Outlook rendering.

## CI follow-up on 7767a9

Quality 38379260498: checks, scanner engine, build, CodeQL and measured compliance passed; browsers blocked promotion. WebKit's account assertion compared total row heights despite the newly requested inset-group layout wrapping a long label at 320px. The test retains exact icon/text columns and typography and requires growth rather than clipping, while allowing the text-driven height.

Chromium's authenticated operator regression reached the second ticket reply with a disabled Send button. The ticket send completion unconditionally cleared the composer; a refreshed message can become visible before that completion, allowing the next draft to be erased. The actual handler now clears only if the current draft is still the submitted raw text, and a synchronous ref lock prevents same-frame duplicate requests. A compiled-handler test exercises pending completion with a new draft, unchanged successful input, failed writes and duplicate clicks. Permissions and API persistence are unchanged. Fresh browser evidence is still required; no merge/deploy is claimed.
