# Central UX enforcement — 10 October 2026

Base: `f35374de95e4fecb92b9fd5d0684c90661d2ac2e`, current remote main checked before work. No older ZIP was imported. Branch: `fix/central-ux-enforcement-20261010`.

## Evidence scope

The code-derived register covers 71 source page routes, 165 JSX component candidates, 13 operator dispatch variants and all API route files. The import analysis scans 376 local source modules, finds no static runtime import cycle and no unreferenced component file. Conditional layout branches remain candidates until exercised. A static register is not a complete visual or business-process acceptance.

- `routes.md`: route, owner, family, permissions and data dependencies.
- `ux-inventory.json`: import/render paths, source lines, conditions, JSX props (including inline styles), ordered CSS rule declarations and media contexts.
- `ux-state-register-20261010.json`: every source route with Normal, Loading, Error, Empty, Create, Edit, Read-only, Denied, Offline, Saving, Success and Discard candidates. No state is passed solely because a prior report said so.
- `v21-5-integration-inventory.json`: fresh dependency/source fingerprint and static integration graph.

## Root-cause matrix

| ID | Render path / owner | Proven cause on base | Central correction | Verification |
| --- | --- | --- | --- | --- |
| UX-01 | AppShell → HeaderPanel → AccountPanel → PanelLink | `.sheet-secondary :is(button,a)` has greater specificity than `.action-row`; switches grid to flex, fonts and height. Mobile override changes these again. | PanelLink delegates to existing ActionRow; personal/company/session groups share its DOM. Legacy secondary rules exclude ActionRow and preserve the protected navigation sheet. | Browser header interaction compares font, weight, grid, height, icon and text coordinates at 320/390/768/1440. |
| UX-02 | SettingsNavigation → settings-list | Page-specific grid columns, font sizes and 68/64px row heights compete with the central row. | Settings links use ActionRow; remove its page-specific child row overrides. Retain responsive container columns. | Typecheck, CSS ownership, route matrix and responsive browser checks. |
| UX-03 | OperatorShell → HeaderPanel account | Separate sheet-menu link and raw logout button use unrelated layouts. | Existing ActionRow for portal and logout; session operation retained. | Existing operator logout failure/focus checks plus navigation snapshot. |
| UX-04 | HeaderPanel → SearchPanel | Central heading X and child Abbrechen both close the same panel. Search input border plus enclosing focus shadow produces layered focus decoration. | One heading close control; keep the separately labelled query clear action. Central searchbox uses one focus border, no extra shadow. | Existing focus/Escape/backdrop/scroll restoration plus new no-Abbrechen assertion. |
| UX-09 | HeaderPanel → SearchPanel results | Legacy broad `.search-results span` makes central quick links muted 11px; result-specific 30px columns reserve too little room for a 34px activity-icon. | Result links and quick links both use ActionRow; delete obsolete direct-link and section-child layout/typography rules after checking the only runtime owner. | Header query/stale-result/browser viewport and shared row evidence. |
| UX-05 | AppearanceSettingsPage | Three separate appearance-card/theme-preview renderers and desktop/mobile rules; misplaced Sprache wählen link. | SelectionRows extends ActionRow with description, checked indicator and roving radio keyboard focus. Separate language section reuses Field/Select. Delete verified-unused card/preview CSS. | Browser equal-height selection rows, ArrowDown, immediate theme, device changes and reload. |
| UX-06 | AppShell + AppearanceSettingsPage → theme API | Parallel theme loads; UI waits for PATCH before rendering; concurrent PATCH completion can reorder persistence. | Settings observes central binso-theme event; load coalescing, immediate central application, serialized writes and rollback to last confirmed preference. | Executed resolver tests: stale reads, slow writes, ordered rapid choices, successive failures, deduplicated loads and system resolution. |
| UX-07 | LanguageSettingsPage / AppearanceSettingsPage | Language page lists disabled unfinished languages; de-CH UI value differs from persisted de enum. | One reused LanguagePreference, only actually translated German; normalize de ↔ de-CH at UI/persistence boundary. | Release language normalization gate, typecheck and browser option-count assertion. |
| UX-08 | NotificationPanel / NotificationsPage | Header notification grid reserves 24px for a 34px activity-icon. Full page has a separate 36px grid, fonts and spacing. | Extend existing ActionRow with a distinct title element, metadata/end adornment; both notification surfaces use the same icon/text/indicator contract. Remove old notification row rules; central loading/error states. | Shared renderer tests and existing notification read/filter/error/permission browser interactions. |

CSS import order remains tokens → base → marketing → app → operator → responsive. The central corrections remove competing owner rules rather than append specificity patches. CSS audit contains 429 repeated-selector contexts; these are candidates, not 429 proven defects. They include intentional responsive and protected navigation cascades and were not indiscriminately deleted.

## Removed / consolidated implementations

- Standalone PanelLink markup: delegates to ActionRow.
- Separate account logout rows in customer/operator panels: ActionRow.
- Settings-specific link grid/typography/height rules: central row owns them.
- All appearance-grid/card/theme-preview desktop/mobile selectors and preview DOM: no remaining runtime use.
- Separate notification-center-row and notification-list child row layouts: ActionRow.
- Search child close button and unused child close style; direct-link/section-child search result row grids and broad typography overrides.
- Second appearance-owned profile theme fetch/state application: central event observation.

Protected Bottom-Navigation and its navigation sheets are not migrated. The unchanged navigation snapshot gate checks JSX, access/display/scroll logic, icons, responsive declarations and transitive theme/safe-area tokens. Its baseline is not updated to accommodate changes.

## Existing foundations inspected

FormWizard already renders Cancel/Next on the first step and Back/Next or Back/Save subsequently. FormSheet owns guarded close and unchanged values do not trigger discard. Existing component/process tests are rerun; no new parallel wizard is introduced.

DocumentPageViewer renders exactly one PDF canvas/page and switches by the actual PDF page count. Preview/download/mail use the same PDF generator. Existing tests execute that generator and inspect A4 size, company/customer snapshots, introductions/closings, totals, partial payments and dedicated QR page. Long documents may legitimately require additional content pages before the final QR payment page; truncating them to two pages would lose information.

Startup/PWA code is retained where no new failure is demonstrated. Existing lifecycle tests and release browser checks remain required. No artificial timing delay is added.

## Release and limitations

The final local `pnpm test` suite and optimized production build passed. Lint, typecheck, CSS ownership, release gates and production security audit passed; full dependency audit retains only the existing documented dev-tool advisory. The navigation reference and all mandatory tests remain enabled. Remote responsive/PWA/browser and real PostgreSQL CI evidence must still complete before merge. Browser binaries could not be downloaded locally (the archive response is invalid). No browser check is disabled to bypass that limitation. CI's existing Chromium/WebKit jobs and PWA tests remain blocking.

An actual installed iPhone/Android PWA and actual production tenant workflows require a device/session check; synthetic browser/API fixtures do not prove those environments. This report does not certify all historical requirements or every conditional state as accepted. Any unresolved release failure blocks merge and deployment.

The first remote WebKit run (38036202499) caught the merged-title DOM regression in the new descriptive ActionRow. The production renderer was corrected to retain a separately addressable title; the exact-title browser assertion remains enabled. The entire final candidate must pass remote release checks again.

The second remote run (38036728571) reproduced unequal selection-row heights in both Chromium and WebKit at narrow widths: descriptions wrap to different line counts. SelectionRows now owns a grid with equal fractional row tracks, sized by the longest description without truncation or fixed-height clipping. General menu and bottom-navigation sizing remain unchanged; the equal-height assertion stays enabled.
