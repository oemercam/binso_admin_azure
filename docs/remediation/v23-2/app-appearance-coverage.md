# App appearance coverage — 2026-10-13

Source/dependency inventory for the requested mobile/PWA/tablet appearance. Both themes use the shared compact-view standard up to 1100 px. Navigation retains its frozen baseline. Public marketing/legal/auth screens are separate flows. Generated PDF document paper retains document styling.

This register records implementation scope; **visual acceptance is pending** for every row until the fresh browser matrix and device checks finish. Route placeholders are exercised through deterministic browser fixtures.

| Route | Existing page family | Appearance owner | Visual acceptance |
| --- | --- | --- | --- |
| `/angebote/[id]` | DetailPage | page-container / shared portals | Pending |
| `/angebote/neu` | CreatePage | page-container / shared portals | Pending |
| `/angebote` | ListPage | page-container / shared portals | Pending |
| `/belege` | DashboardPage | page-container / shared portals | Pending |
| `/benachrichtigungen` | AppPage | page-container / shared portals | Pending |
| `/dashboard` | DashboardPage | page-container / shared portals | Pending |
| `/einstellungen/abonnement` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/benachrichtigungen` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/darstellung` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/datenschutz` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/dokumente` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/firma` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/konto` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/sicherheit` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/sprache` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/team` | SettingsPage | page-container / shared portals | Pending |
| `/einstellungen/zeiterfassung` | SettingsPage | page-container / shared portals | Pending |
| `/finanzen/analyse` | DashboardPage | page-container / shared portals | Pending |
| `/finanzen` | DashboardPage | page-container / shared portals | Pending |
| `/kunden/[id]/bearbeiten` | EditPage | page-container / shared portals | Pending |
| `/kunden/[id]` | DetailPage | page-container / shared portals | Pending |
| `/kunden/neu` | CreatePage | page-container / shared portals | Pending |
| `/kunden` | ListPage | page-container / shared portals | Pending |
| `/mitarbeiter/[id]` | DetailPage | page-container / shared portals | Pending |
| `/mitarbeiter/neu` | CreatePage | page-container / shared portals | Pending |
| `/mitarbeiter` | ListPage | page-container / shared portals | Pending |
| `/operator/[...section]` | OperatorPage | operator-app-content | Pending |
| `/operator` | OperatorPage | operator-app-content | Pending |
| `/preview/dashboard` | DashboardPage | page-container / shared portals | Pending |
| `/preview/rechnungen` | ListPage | page-container / shared portals | Pending |
| `/preview/zeit` | AppPage | page-container / shared portals | Pending |
| `/produkte/[id]` | DetailPage | page-container / shared portals | Pending |
| `/produkte/neu` | CreatePage | page-container / shared portals | Pending |
| `/produkte` | ListPage | page-container / shared portals | Pending |
| `/projekte/neu` | CreatePage | page-container / shared portals | Pending |
| `/rechnungen/[id]` | DetailPage | page-container / shared portals | Pending |
| `/rechnungen/neu` | CreatePage | page-container / shared portals | Pending |
| `/rechnungen` | ListPage | page-container / shared portals | Pending |
| `/spesen/[id]` | DetailPage | page-container / shared portals | Pending |
| `/spesen/neu` | CreatePage | page-container / shared portals | Pending |
| `/spesen` | ListPage | page-container / shared portals | Pending |
| `/support/[id]` | ChatPage | page-container / shared portals | Pending |
| `/support/neu` | CreatePage | page-container / shared portals | Pending |
| `/support` | ListPage | page-container / shared portals | Pending |
| `/zahlungen/[id]` | DetailPage | page-container / shared portals | Pending |
| `/zahlungen/neu` | CreatePage | page-container / shared portals | Pending |
| `/zahlungen` | ListPage | page-container / shared portals | Pending |
| `/zeit` | AppPage | page-container / shared portals | Pending |

| Operator variant | Component owner | Visual acceptance |
| --- | --- | --- |
| `/operator/tickets` | `components/operator.tsx#TicketsView` | Pending |
| `/operator/kunden` | `components/operator.tsx#CustomersView` | Pending |
| `/operator/zahlungen` | `components/operator.tsx#PaymentsView` | Pending |
| `/operator/finanzen` | `components/operator.tsx#OperatorFinanceView` | Pending |
| `/operator/abonnemente` | `components/operator.tsx#SubscriptionsView` | Pending |
| `/operator/sperrungen` | `components/operator.tsx#RestrictionsView` | Pending |
| `/operator/monitoring` | `components/operator.tsx#MonitoringView` | Pending |
| `/operator/ankuendigungen` | `components/operator.tsx#AnnouncementsView` | Pending |
| `/operator/sicherheit` | `components/operator.tsx#SecurityView` | Pending |
| `/operator/audit` | `components/operator.tsx#AuditView` | Pending |
| `/operator` | `components/operator.tsx#OperatorDashboard` | Pending |
| `/operator/tickets/[id]` | `components/operator.tsx#TicketDetail` | Pending |
| `/operator/kunden/[id]` | `components/operator.tsx#OperatorCustomerDetail` | Pending |

Shared owners: page/detail headings, action/selection rows, settings groups, list/table primitives, metrics/statistics, form controls, bottom sheets, confirmation dialogs, global header panels and message bubbles. Their business behavior remains unchanged by this appearance pass.

Automated evidence: complete local non-browser suite and production build pass; text palette contrast passes for all three surfaces in both modes; bottom-navigation fingerprint passes. Browser assertions cover overflow, field geometry, grouped surfaces, list/filter positioning, modal focus, chat keyboard/pan and existing process interactions. Their execution remains a release gate, not an inferred result.
