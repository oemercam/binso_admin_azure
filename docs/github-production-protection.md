# Binso One – GitHub Production Protection

Stand: 5. Oktober 2026

## Ziel

Diese Einstellungen schützen den Weg von Quellcode zu Produktion zusätzlich zu den Workflow-Gates. Sie werden in GitHub selbst konfiguriert und können nicht vollständig durch Dateien im Repository erzwungen werden.

## 1. Main-Branch Ruleset

Für den Default-Branch `main` ein aktives Ruleset anlegen.

Empfohlene Regeln:

- Branch deletion blockieren.
- Force pushes blockieren.
- Änderungen nur über Pull Requests zulassen.
- Required status check: **Quality / quality**.
- Branch muss vor Merge auf aktuellem Stand mit `main` sein.
- Offene Review-Konversationen müssen vor Merge gelöst sein.
- Merge nur wenn alle erforderlichen Checks erfolgreich sind.
- Keine generelle Bypass-Liste für normale Entwicklung.
- Bypass nur für klar definierte Notfalladministration; jede Nutzung dokumentieren.
- Optional lineare History/Squash-Merge erzwingen, wenn dies dem Team-Workflow entspricht.

Bei einem Ein-Personen-Repository muss nicht künstlich eine zweite Freigabe verlangt werden, wenn keine zweite berechtigte Person verfügbar ist. Der Quality-Check und die Produktions-Gates dürfen jedoch nicht umgangen werden.

## 2. GitHub Environment: production

Das Environment `production` muss für alle produktiven Workflows verwendet werden.

Empfohlen:

- Deployment branches/tags auf `main` beschränken.
- Production-Secrets nur im Environment speichern, nicht als unnötig breit verfügbare Repository-Secrets.
- Bei Verfügbarkeit einer zweiten verantwortlichen Person: Required Reviewer für Production aktivieren.
- Bei Ein-Personen-Betrieb keine Selbstblockade erzeugen; dafür bleibt die explizite Manual-Deploy-Bestätigung im Workflow aktiv.
- Environment-Secrets regelmässig auf Notwendigkeit und Least Privilege prüfen.

## 3. Actions-Berechtigungen

Repository-Standard:

- GitHub Actions standardmässig **read-only** für Repository-Inhalte.
- Schreibrechte nur explizit pro Workflow/Job.
- Azure-Zugriff ausschliesslich über OIDC.
- Keine Azure Publish Profiles oder langlebigen Azure-Zugangsschlüssel in Workflows.
- Kein `pull_request_target` für Code aus nicht vertrauenswürdigen Branches verwenden.
- Secrets niemals an Pull Requests aus nicht vertrauenswürdigen Forks weiterreichen.

## 4. Azure-Berechtigungen

Die OIDC-Deployment-Identität erhält nur die Rechte, die für den produktiven Deploy und die dokumentierten Readiness-Prüfungen benötigt werden.

Nicht zulassen:

- Owner/Contributor auf Subscription-Ebene, wenn Resource-Group-/Ressourcenrechte genügen.
- unnötige Rechte auf andere Azure-Ressourcengruppen;
- dauerhafte Benutzerpasswörter/Client-Secrets für Azure Deployment, wenn OIDC möglich ist.

## 5. Datenbankrollen

Zielbild:

- Runtime-Anwendung mit eigener Datenbankrolle ohne Schema-DDL-Rechte.
- Migrationen langfristig über eine getrennte, nur im GitHub-Environment verfügbare Migration-Rolle.
- Runtime-Rolle darf RLS nicht umgehen und ist kein Superuser.
- Migration-Rolle nur für kontrollierte Deploys und nicht als App-Connection-String verwenden.

Die aktuelle Umstellung auf getrennte Runtime-/Migration-Rollen muss erst nach Prüfung der produktiven PostgreSQL-Rollen erfolgen. Sie darf nicht blind im Deployment geändert werden.

## 6. Production-Deploy-Gates im Repository

Der Workflow muss weiterhin folgende Eigenschaften erfüllen:

- nur aktueller `main`-Commit darf deployed werden;
- laufender Production-Deploy wird nicht durch einen neueren Commit abgebrochen;
- manueller Deploy nur von `main` mit expliziter Bestätigung;
- vollständige Quality-/Security-/Build-Gates auch bei manuellem Deploy;
- Build und Artefaktprüfung vor Datenbankmigration;
- immutable ZIP + SHA-256 als GitHub-Artefakt;
- Produktionskonfiguration wird validiert, nicht automatisch repariert oder rotiert;
- fehlender Encryption Key blockiert den Deploy;
- PostgreSQL-Serverzustand und Backup-Retention werden vor Migration geprüft;
- pending Migrationen werden auf destruktive/breaking SQL-Muster geprüft;
- Migrationen sind transaktional und durch Advisory Lock serialisiert;
- normale Deploys führen keine Retention-, Reset-, Datenlösch- oder synthetischen Geschäftsdaten-Schreibtests aus;
- Produktionsprüfung nach Deploy ist read-only.

## 7. Datenbank-Reset

`scripts/reset-db.mjs` darf die bekannte Produktionsdatenbank technisch nicht zurücksetzen. Ein Produktions-Reset ist kein zulässiger Recovery-Pfad.

Bei Schema-/Datenproblemen:

1. Incident bewerten.
2. Forward-Fix bevorzugen.
3. Falls notwendig Point-in-Time-Restore in getrennten Server.
4. Produktionsumschaltung nur nach expliziter DR-Freigabe.

## 8. Retention

Retention ist unabhängig vom Release-Prozess:

- täglicher geplanter Lauf;
- kein automatischer Start bei Code-Push;
- manueller Start nur mit expliziter Bestätigung;
- Produktions-DB-Identität wird geprüft;
- Kandidatenanzahl wird vor Mutation ermittelt;
- ungewöhnlich grosse Löschmenge blockiert den Lauf;
- Datenänderungen erfolgen in einer Transaktion;
- parallele Retention-Läufe werden verhindert.

## 9. Änderungen an Deployment-/Security-Workflows

Änderungen an folgenden Dateien sind besonders kritisch:

- `.github/workflows/deploy-azure.yml`
- `.github/workflows/retention-maintenance.yml`
- `scripts/migrate.mjs`
- `scripts/check-production-migration-safety.mjs`
- `scripts/reset-db.mjs`
- `scripts/organization-data-lifecycle.mjs`

Sie müssen immer über Pull Request und grünes Quality-Gate nach `main` gelangen.

## 10. Verbleibende Infrastruktur-Härtung

Vor breitem kommerziellem Go-live prüfen:

- Main-Ruleset tatsächlich aktiv.
- Production-Environment auf `main` beschränkt.
- Secrets und Azure-RBAC nach Least Privilege geprüft.
- getrennte Runtime-/Migration-Datenbankrolle bewertet und umgesetzt, falls betrieblich möglich.
- Azure App Service Deployment Slots für Blue/Green bzw. Swap-Deploy geprüft; erst aktivieren, wenn der aktuelle App-Service-Plan und die Konfiguration dafür bestätigt sind.
- echter PostgreSQL Point-in-Time-Restore praktisch bestanden.
