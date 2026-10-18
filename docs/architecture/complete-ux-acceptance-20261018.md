# Complete Microsoft UX — acceptance ledger

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
