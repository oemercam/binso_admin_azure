# Testing

- `pnpm test:unit`: deterministische Geschäftslogik, Planregeln und Permissions.
- `pnpm test:integration`: Auth-/Tenant-/API-Grundregeln ohne Produktionsdaten.
- `pnpm test:integration:db`: isolierte PostgreSQL-Migrations- und RLS-Tests; nur mit Test-Datenbank.
- `pnpm test:e2e`: Playwright gegen eine lokale oder Staging-Umgebung (Desktop + Mobile-Projekt).
- `pnpm test`: Unit + Integration + bestehende V69-Regressionssuite.

## P0
Tenant A darf Tenant B weder lesen noch verändern. `organization_id` aus dem Browser ist nie Vertrauensquelle; der Server löst Membership und Tenant-Kontext auf. Der PostgreSQL-Test erzeugt zwei Organisationen und prüft den negativen Cross-Tenant-Zugriff unter RLS.

## E2E Kernwege
Bereits automatisiert: öffentlicher Einstieg, lokales Dashboard, Kunde mit Minimaldaten erfassen, Angebot im Kernflow erstellen, Rechnung mit einer freien Position als Entwurf erstellen sowie Mobile/PWA-Navigation und Quick-Create.

Login-/Redirect-Verhalten wird zusätzlich im isolierten Standalone-Smoke-Test geprüft. Tenant-Isolation wird absichtlich tiefer im PostgreSQL-Integrationstest geprüft, weil ein UI-Test allein keine Datenbankisolation beweist.

Für die Staging-Suite sind als nächste produktnahe Journeys vorbereitet: Kunde bearbeiten, Zeit erfassen, Rechnung erneut öffnen und Werte prüfen sowie ein Benutzer ohne Berechtigung. Diese benötigen stabile Staging-Fixtures/Rollen und werden nicht gegen Production ausgeführt.

## Regression
Bei einem relevanten Fehler gilt: Fehler reproduzieren → automatisierten Regressionstest ergänzen, wenn praktisch → Fehler korrigieren → Test muss grün sein.
