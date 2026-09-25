# V71 – Multi-Tenant, RBAC und SaaS-Geschäftsmodell

V71 konsolidiert die Plattformgrundlage, bevor weitere Fachfunktionen ausgebaut werden.

## Mandantenmodell

- Benutzeridentität ist unabhängig von Unternehmen.
- Ein Benutzer kann aktive Mitgliedschaften in mehreren Organisationen besitzen.
- Jede persistierte Geschäftszeile gehört genau einer `organization_id`.
- Auch Child-Tabellen für Angebots-, Vertrags- und Rechnungspositionen tragen `organization_id`.
- Composite Foreign Keys verhindern Referenzen zwischen zwei Mandanten bereits auf Datenbankebene.
- PostgreSQL RLS bleibt die zweite Isolationsschicht zusätzlich zur API-/Repository-Autorisierung.

## Berechtigungen

Standardrollen bleiben `owner`, `admin`, `finance`, `employee`. Die Anwendung entscheidet über konkrete Permissions, nicht über UI-Namen. Der Zugriff kombiniert:

1. aktive Membership,
2. Rollen-Permission,
3. Plan-Entitlement,
4. Subscription-/Tenant-Lifecycle.

`organization_roles` und `organization_role_permissions` bilden die DB-Grundlage für spätere mandantenspezifische Rollen, ohne die bestehenden Standardrollen zu brechen.

## SaaS-Lifecycle

Unterstützte Zustände: Trial, Active, Past Due, Grace Period, Read Only, Suspended, Expired, Cancelled und Archived. Read-only blockiert schreibende Permissions. Suspended blockiert Tenant-Zugriff vollständig.

## Entitlements und Nutzung

Planlimits werden als Daten geführt. Dazu gehören Benutzer, Speicher sowie vorbereitete Limits für Dokumente und API-Aufrufe. `organization_usage_counters` ist mandantengebunden und RLS-geschützt.

## Supportzugriff

Plattformrollen erhalten nicht automatisch Kundendatenzugriff. Supportzugriff wird separat beantragt, zeitlich begrenzt und sowohl im Tenant-Audit als auch im Platform-Audit protokolliert.

## Plattform vs. Kundengeschäft

Binso-SaaS-Abrechnung und Kundengeschäftsdaten bleiben getrennte Domänen. Platform Billing verwaltet das Binso-One-Abo. Rechnungen, Zahlungen und Finanzen innerhalb eines Tenants gehören ausschliesslich zum Kundengeschäft.


## Zahlungs-Lifecycle

Bei `past_due` startet standardmässig eine 7-tägige Grace Period. Während `grace_period` bleibt der Tenant voll nutzbar. Nach Ablauf wechselt er auf `read_only`; schreibende Aktionen werden zentral blockiert. Eine Kündigung beendet den Zugriff gemäss Tenant-Lifecycle und wird nicht als Read-only-Zustand behandelt.
