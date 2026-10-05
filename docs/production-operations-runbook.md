# Binso One – Production Operations Runbook

Stand: 5. Oktober 2026

## Zweck

Dieses Runbook ist die zentrale betriebliche Einstiegsseite für Binso One. Es ersetzt keine Detaildokumente, sondern beschreibt die Reihenfolge und Zuständigkeit für normale Releases, Störungen, Rollbacks, Monitoring, Backup/Restore und Security-Ereignisse.

## 1. Normaler Produktionsrelease

1. Änderungen in einem Branch abschliessen.
2. Pull Request erst dann für Quality verwenden, wenn der Stand prüfbereit ist.
3. Quality muss vollständig grün sein:
   - Release Gates
   - Tests
   - ESLint
   - Security Scan
   - vollständiger Dependency Audit
   - CSS Architecture
   - TypeScript
   - Production Build
   - Runtime Smoke Test
4. Pull Request nach `main` mergen.
5. Main-Quality muss grün sein.
6. Der Azure-Deploy startet danach automatisch.
7. Nach Deployment prüfen:
   - `/api/health`
   - `/api/health/ready`
   - angezeigter Produktions-Commit
   - Demo-Session
   - zentrale Kundenrouten
   - zentrale Admin-/Operator-Routen
8. Erst danach gilt ein Release als produktiv freigegeben.

## 2. Monitoring und Alarmierung

Primäre technische Signale:

- Azure Application Insights
- Azure Monitor / Alert Rules
- konfigurierte Action Group
- `/api/health`
- `/api/health/ready`
- One Admin → Monitoring
- GitHub Workflow **Production Monitoring Readiness**

Bei einem Alarm:

1. Auswirkung und betroffene Komponente bestimmen.
2. Prüfen, ob Liveness oder Readiness betroffen sind.
3. Letzten erfolgreichen Deploy und aktuellen Commit vergleichen.
4. Kundenwirkung und Datenintegrität einschätzen.
5. Falls notwendig Incident-Verfahren starten.
6. Bei Release-Ursache Rollback oder Forward Fix wählen.

Detail: `docs/incident-response-and-retention.md`

## 3. Incident Response

Bei Security-, Verfügbarkeits- oder Datenintegritätsvorfällen:

1. Incident eröffnen und Zeitpunkt dokumentieren.
2. Betroffene Systeme, Kundenorganisationen und Datenkategorien bestimmen.
3. Ursache eindämmen.
4. Kompromittierte Sessions, Secrets oder Zugänge widerrufen.
5. Datenintegrität und Wiederherstellbarkeit prüfen.
6. Geschäftsführung und technische Verantwortung informieren.
7. Kunden-/Behördeninformation nach Risiko und rechtlicher Pflicht beurteilen.
8. Recovery durchführen.
9. Post-Incident-Review und Folgemassnahmen dokumentieren.

Security Reports werden nach `SECURITY.md` behandelt.

## 4. Rollback

Ein Code-Rollback darf keine Datenbankmigration blind rückwärts ausführen.

1. Letzten nachweislich grünen Produktions-Commit bestimmen.
2. Seitdem ausgeführte Migrationen prüfen.
3. Anwendung auf einen geprüften Commit zurückführen oder Forward Fix erstellen.
4. Normalen Quality-/Deploy-Pfad verwenden.
5. Health, Readiness und Smoke Tests erneut prüfen.

Detail: `docs/production-rollback.md`

## 5. PostgreSQL Backup und Restore

Backups werden durch Azure Database for PostgreSQL bereitgestellt. Vor kommerziellem Go-live muss ein echter Point-in-Time-Restore praktisch verifiziert sein.

Restore-Grundsätze:

- nie direkt über Produktion restaurieren;
- Restore zuerst in einen separaten temporären Flexible Server;
- Daten und Migrationstand read-only prüfen;
- Produktionsumschaltung nur bei echtem DR-Fall und separater Freigabe;
- temporäre Restore-Ressource nach Test entfernen.

Detail: `docs/azure-postgresql-backup-restore.md`

## 6. Kundendaten-Lifecycle

Für Export und endgültige Löschung gelten die kontrollierten Werkzeuge:

```bash
pnpm data:export
pnpm data:delete
```

Endgültige Löschung ist fail-closed und darf nur unter den dokumentierten Schutzbedingungen erfolgen.

Detail: `docs/customer-data-lifecycle.md`

## 7. Security und Zugriffe

Kunden:
- E-Mail/Passwort
- E-Mail-Verifikation
- zweiter Faktor
- TOTP/Recovery Codes
- rollenabhängige MFA-Pflicht

Interne Binso-Administration:
- Microsoft Entra ID
- App Roles
- Microsoft Authenticator / Conditional Access
- keine lokalen produktiven Operator-Passwörter

Microsoft Graph Mail:
- nur Microsoft Graph als produktiver Mailpfad
- Least Privilege / Exchange Application RBAC beachten

Details:
- `docs/auth-security-flow.md`
- `docs/entra-operator-sso.md`
- `docs/graph-mail-least-privilege.md`
- `docs/security-review-2026-10-05.md`

## 8. Billing

Produktives Billing erfolgt über Stripe.

Vor Freigabe eines Billing-relevanten Releases:
- Stripe Live Configuration Audit grün
- Webhook-Konfiguration korrekt
- Customer Portal aktiv
- relevante Webhook-Szenarien getestet
- keine Zahlung nur aufgrund einer Checkout-Rückkehr als erfolgreich behandeln

Detail: `docs/stripe-billing-setup.md`

## 9. Recht und Datenschutz

Verbindliche betriebliche Dokumente:
- Datenschutzerklärung
- AGB
- Impressum
- DPA / Auftragsbearbeitung
- Unterauftragsbearbeiter
- Bearbeitungsverzeichnis
- TOM

Interne Dokumentation:
- `docs/privacy-processing-register.md`
- `docs/technical-organizational-measures.md`
- `docs/incident-response-and-retention.md`

Eine finale juristische Prüfung vor breiter kommerzieller Vermarktung bleibt organisatorisch erforderlich.

## 10. Go-live Quelle der Wahrheit

Der aktuelle Freigabestatus wird ausschliesslich in

`docs/production-launch-checklist.md`

geführt.

Andere Dokumente beschreiben Verfahren und dürfen keine konkurrierende Go-live-Checkliste pflegen.

## 11. Domainumstellung

Die geplante Umstellung auf die finalen Binso-One-Domains ist ausdrücklich ein separater Arbeitsschritt und wird nicht automatisch durch Release-, Readiness- oder Betriebsarbeiten ausgelöst.
