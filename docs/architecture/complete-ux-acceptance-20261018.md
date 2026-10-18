# Complete Microsoft UX — acceptance ledger

## Resolved mobile material decision

The owner explicitly selected flat white Microsoft mobile navigation. The shared
navigation owner now uses opaque theme canvas, straight edges, no shadow/blur,
and blue active destinations for customer and operator. Historical markup,
destinations, permissions, icon paths, exact bounds, touch targets, safe-area and
motion tokens remain checked against the pre-change commit. Source and expected
geometry contracts are generated into new 20261018/v3 files; old references stay
unchanged. Browser checks reject injected gray/round/blur material, verify native
Tab order and retain the existing navigation/scroll/focus/permission checks.
Earlier paragraphs describing an unresolved dock choice are historical. Final
visual acceptance remains distinct from technical CI and from this material choice.

Focused material validation: customer/operator at 390px in Light/Dark passed (four
cases), with no failed compliance measurements. Injected gray, rounded, blurred
and shadowed variants are rejected after their real CSS transitions settle;
native Tab order is retained. Source material contracts and exact historical
non-material invariants, CSS ownership, integration inventory and compliance
adversaries passed. Full new-head integration checks remain required in GitHub.

Base: 7cf4cdda75e736f7e119ab4721b54a22e22d2c80. This supersedes any claim that PR #278 completed the full UX. No merge or deployment is authorized.

## Binding decisions

The original 15 October IMPLEMENTIERUNG.md requires an expandable left navigation on desktop. Mobile dock destinations, access checks, motion and safe areas remain preserved. Desktop begins at 761 px; tablets keep compact content grids where necessary. The prior 1100 px mobile shell incorrectly removed the desktop navigation. Dark mode, operator pages and absent reference states are derived and require explicit visual review. No new foundation.

## Acceptance scope per route

Every route below requires light/dark, 390/768/1024/1440 px, loading/empty/error/read-only, keyboard/focus, valid return paths and preserved real handlers. Settings additionally require reachable sibling pages and preserved dirty/save controls. CI status is evidence, never owner visual approval.

| Route | Existing family | Reference / derivation | Visual status |
|---|---|---|---|
| `/agb` | LegalPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/angebote/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/angebote/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/angebote` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/auftragsbearbeitung` | LegalPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/belege` | DashboardPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/benachrichtigungen` | AppPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/berichte` | AppPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/dashboard` | DashboardPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/datenschutz` | LegalPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/demo` | PublicPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/dev/ux-lab` | UxLabPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/einladung` | AuthenticationPage | desktop-login.html: auth | pending rendered comparison |
| `/einstellungen/abonnement` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/benachrichtigungen` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/darstellung` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/datenschutz` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/dokumente` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/firma` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/konto` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/sicherheit` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/sprache` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/team` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/einstellungen/zeiterfassung` | SettingsPage | mobile-app.html: settings/profile/security/appearance; subpages derived | pending rendered comparison |
| `/email-bestaetigen` | AuthenticationPage | desktop-login.html: auth | pending rendered comparison |
| `/finanzen/analyse` | DashboardPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/finanzen` | DashboardPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/impressum` | LegalPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/kunden/[id]/bearbeiten` | EditPage | desktop-login.html + mobile-app.html: customers/detail | pending rendered comparison |
| `/kunden/[id]` | DetailPage | desktop-login.html + mobile-app.html: customers/detail | pending rendered comparison |
| `/kunden/neu` | CreatePage | desktop-login.html + mobile-app.html: customers/detail | pending rendered comparison |
| `/kunden` | ListPage | desktop-login.html + mobile-app.html: customers/detail | pending rendered comparison |
| `/login` | AuthenticationPage | desktop-login.html: auth | pending rendered comparison |
| `/mitarbeiter/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/mitarbeiter/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/mitarbeiter` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/offline` | PublicPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/operator/[...section]` | OperatorPage | komponenten.html; operator layout derived | pending rendered comparison |
| `/operator/login` | AuthenticationPage | komponenten.html; operator layout derived | pending rendered comparison |
| `/operator` | OperatorPage | komponenten.html; operator layout derived | pending rendered comparison |
| `/operator/wallboard` | RedirectPage | komponenten.html; operator layout derived | pending rendered comparison |
| `/` | PublicPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/passwort-vergessen` | AuthenticationPage | desktop-login.html: auth | pending rendered comparison |
| `/passwort-zuruecksetzen` | AuthenticationPage | desktop-login.html: auth | pending rendered comparison |
| `/portal/login` | RedirectPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/portal` | RedirectPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/portal/registrieren` | RedirectPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/preise` | PublicPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/preview/dashboard` | DashboardPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/preview/rechnungen` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/preview/zeit` | AppPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/produkt` | PublicPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/produkte/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/produkte/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/produkte` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/projekte/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/projekte/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/projekte` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/rechnungen/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/rechnungen/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/rechnungen` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/registrieren` | AuthenticationPage | desktop-login.html: auth | pending rendered comparison |
| `/spesen/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/spesen/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/spesen` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/support/[id]` | ChatPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/support/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/support` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/unterauftragsbearbeiter` | LegalPage | landingpage.html; legal bodies derived | pending rendered comparison |
| `/wartung` | PublicPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/willkommen` | RedirectPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/zahlungen/[id]` | DetailPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/zahlungen/neu` | CreatePage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/zahlungen` | ListPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |
| `/zeit` | AppPage | mobile-app.html + komponenten.html; missing states derived | pending rendered comparison |

## Work order

1. Shared desktop shell/header, navigation and overlay breakpoints.
2. All settings destinations and subpage navigation; forms, security, notifications, appearance and subscription states.
3. Dashboard metrics and document rows; all list/detail/edit families through existing owners.
4. Auth, marketing, operator, startup, theme, loading/navigation states.
5. Focused regressions and regenerated inventories, then one integration PR with full CI and per-family visual evidence. Pending comparisons may not be marked accepted solely because a test passed.

## Implemented central corrections

Desktop navigation/header/overlays and real controls now switch together at 760/761 px, including operator and details. Existing compact tablet content layouts remain. Settings use the existing ActionRow, SettingsGroup and a shared SettingsWorkspace across all 11 subpages; full personal/company/process catalogue with permission filtering, active-route state and keyboard-native phone disclosure. Profile/company outer duplicate borders are removed, without changing their real save/upload handlers.

Product readability tokens: label 12→13px, metadata 11→12px, caption 10→11px, control 13→14px. Mobile inputs stay at least 16px, touch targets at least 44px. Reference prototype microtext is not product text. Money always displays two decimals; recent invoices are accurately labelled by the API's existing updated-at ordering. Shared document metadata spacing now applies on desktop too.

Targeted initial local captures: dashboard and account at 1024px, synthetic fixtures, both passed. These preceded the final typography/border refinement; final visual acceptance requires current-head CI renderings. Existing original-icon startup, theme persistence, query/session fences, APIs, roles and workflows remain unchanged.

## Reference reconciliation and CI root cause

20 original mobile reference views were captured unchanged, network blocked, with phone preview chrome excluded (344px content). They are structural references; no pixel-identity claim against differently sized product content. Profile and account identity now use the reference's centred phone arrangement with actual identity. Security uses existing ActionRow/FormSheet for compact password/MFA entry, retaining current/new/confirm password handlers, required-role MFA, one-time recovery codes and real session revocation confirmation. Mandatory MFA setup with a return target opens explicitly. Appearance uses semantic keyboard radio controls with a circular indicator. Missing desktop/security variants remain derived.

Initial CI head b9a27716: static/tests/build/scanner passed. Parallel matrix tabs raced the genuine shared desktop-navigation localStorage preference; expanded/collapsed expectations conflicted across tabs in both engines. The correction serializes preference mutations without removing any original assertion or changing geometry tolerances. Additional serial 768/1024/1440 checks retain exact 68px rail/content offset, persisted value and keyboard focus. No workflow, gate, screenshot baseline, timeout or permission is weakened.

## Compact content and error-state regressions

Second CI found real 768px overflow in timer and subscription content beside visible desktop navigation, plus a hidden MFA-fetch error after the new dialog composition. Timer panels now auto-fit by actual content width; settings content uses intrinsic column sizing and container queries. The primary sidebar/dock boundary stays 760/761. The additional in-page settings explorer folds only when its own container is too narrow; it never replaces the primary desktop sidebar. Completion actions wrap instead of clipping. Both concrete 768px failures passed a two-view local fixture rerun, with unchanged overflow assertions.

MFA read failures remain visible/retryable outside a closed dialog. The original seven server read/mutation handler bodies remain unchanged. Exact monetary expectations now require CHF 400.00/640.00/200.00, retaining the actual aggregation and period checks. Shared settings routes preserve sanitized accountReturn across sibling navigation. AccountPanel reuses the same personal destination catalogue instead of a parallel list.

Third CI: both functional engines, build, checks and scanner passed; responsive checks found the customer command bar overflowing at 768px and two interaction scripts still assuming permanently expanded settings/password controls. Shared detail actions now shrink/wrap; desktop detail containers at most 720px stack content without hiding primary navigation. This compact desktop arrangement is derived, not an original-approved reference state. The exact 768px dossier fixture passed locally; wide desktop column and phone ordering assertions remain, with additional strict compact ordering/width checks. The compact explorer test checks its closed visible summary and current destination after navigation. Security retry tests hold the real fixture GET responses until a draft is entered in the actual password dialog, then verify both successful responses and the unchanged draft. No password write is sent, no failure assertion is removed, and no gate is bypassed.

The same CI compliance report identified 56 false action-clearance failures on phone settings: nested links inside closed native details retain CSSOM rectangles in Chromium while not painting. An isolated nested-flex reproduction confirmed `getClientRects().length === 1` but `checkVisibility() === false`. The common visibility measurement now uses the platform visibility check as well as existing rectangle/inert/hidden checks. New closed/open disclosure adversaries pass and genuine open-menu overlap still fails; existing delayed-scroll, blocked-scroll, real-overlap and header/palette adversaries remain. No clearance threshold or route exclusion changed. The exact mobile account fixture also passed a one-case local capture; full current-head CI measurements remain mandatory.

Twenty original reference views additionally render with 346px content, matching a 390px product viewport with 22px side insets. Only the presentation renderer omits the prototype phone's outer 1px border; original source, typography and content are unchanged. Profile-hub and personal-data detail are distinct states, not interchangeable screenshots. Theme option order follows the reference: System, Light, Dark; persistence and semantic keyboard cycling are unchanged. Phone dock appearance remains pending the owner's explicit choice between the preserved glass dock and the white navigation proposal.

Fourth CI reached the confirmed-payment cross-tab ledger checks in both engines: one remaining dashboard expectation still required `CHF 1'000` while the central currency contract now correctly displays `CHF 1'000.00`. That exact expected amount is updated, with the eight-consumer refresh, failed/incomplete/lost-response checks and idempotent payment assertions retained. No financial calculation changed.

Visual review of the successful 46ef779c CI captures found a genuine shared legacy seam: Records containers added leading/trailing borders on top of the line-tab and table-row separators. Those outer borders are removed from the existing collections owner, preserving row and column-heading separators. New computed-style assertions require no duplicate outer frames, a retained 1px table-heading/interior-row separator and no final-entry line. This follows the original explicit no-double-border/no-terminal-line rule, not a new screenshot baseline. Published-head visual evidence before this correction remains historical, not final acceptance.

The customer list at 390/1440px passed the focused local rerun with these strict separator assertions; five associated compliance measurement records contain no failed checks. Foundation integration, UI ownership/read-only validation and CSS/style-contract adversaries passed after generation. This is targeted evidence, not a replacement for the current-head integration matrix or owner approval.

The subsequent full matrix exposed the same inherited leading border on operator DataTable variants; its existing operator CSS owner now removes that redundant outer line too. Header/interior/final-row preservation assertions cover both variants. It also caught the desktop chat's exact before/after scroll assertion overlapping another tab's genuine sidebar preference mutation (x changed 221→94px while y/height were identical). The chat measurement now acquires the existing shared preference lock and settles expansion before taking either box; the exact deep-equality assertion and real scroll operation are retained. No chat behavior or tolerance changes.

The two exact operator-security/support-chat 768px fixtures passed together locally. The strengthened operator row assertion additionally established that the no-terminal-line rule had previously applied only inside the phone media query; that existing rule is now shared at every width, retaining 1px interior separators. No scope exclusion or alternate baseline is introduced.
