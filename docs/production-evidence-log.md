# Binso One – Production Evidence Log

Stand: 5. Oktober 2026

## Zweck

Dieses Dokument ist die Vorlage für manuelle Produktionsnachweise, die nicht durch einen grünen CI-/Readiness-Workflow ersetzt werden können.

Keine Secrets, Passwörter, OTPs, Recovery Codes, vollständigen Zahlungsdaten oder Kundendaten in dieses Dokument eintragen. Bei Screenshots und Logs sensible Inhalte vor Ablage entfernen.

## Statuswerte

- **offen** – noch nicht durchgeführt
- **bestanden** – praktisch durchgeführt und Ergebnis bestätigt
- **fehlgeschlagen** – durchgeführt, Abweichung vorhanden
- **nicht anwendbar** – mit Begründung

## Nachweise

| Prüfung | Status | Datum | Verantwortlich | Referenz / Ergebnis |
| --- | --- | --- | --- | --- |
| Main Quality finaler Go-live-Commit | offen | — | — | Run-ID / Commit |
| Azure Deploy finaler Go-live-Commit | offen | — | — | Run-ID / Commit |
| /api/health/ready produktiv | offen | — | — | Zeitpunkt / Commit |
| PostgreSQL Backup Readiness | offen | — | — | Workflow-Run |
| PostgreSQL Point-in-Time-Restore | offen | — | — | Restore-Zeitpunkt / Dauer / temporärer Server |
| Production Monitoring Readiness | offen | — | — | Workflow-Run |
| Praktischer Azure-Alert an Action Group | offen | — | — | Alert / Empfänger / Zeit |
| Microsoft Graph Mail Readiness | offen | — | — | Workflow-Run |
| Externe E-Mail-Zustellung | offen | — | — | Empfänger-Domain / Zeit, keine Mailinhalte |
| SPF/DKIM/DMARC | offen | — | — | Prüfdatum / Ergebnis |
| Entra App Roles mit echten Mitarbeitenden | offen | — | — | Rollen / Testdatum |
| Microsoft Authenticator / Conditional Access | offen | — | — | Testdatum |
| Entra Offboarding / Zugriffsentzug | offen | — | — | Testkonto / Zeit bis Zugriffsentzug |
| Graph Mail.Send Least Privilege | offen | — | — | bestätigte Senderbegrenzung |
| Stripe Live Configuration Audit | offen | — | — | Workflow-Run |
| Kontrollierte Live-Kartenzahlung | offen | — | — | Stripe-Testreferenz ohne Kartendaten |
| Stripe invoice.paid | offen | — | — | Event-/Testreferenz |
| Stripe invoice.payment_failed | offen | — | — | Event-/Testreferenz |
| Stripe Kündigung Periodenende | offen | — | — | Testreferenz |
| MWST-/Steuerkonfiguration fachlich geprüft | offen | — | — | Prüfperson / Datum |
| Kundendatenexport E2E | offen | — | — | Testorganisation / Exportmanifest |
| Kundendatenlöschung E2E | offen | — | — | Testorganisation / Ergebnis |
| Sitzungswiderruf auf zweitem Gerät | offen | — | — | Geräte / Ergebnis |
| Desktop Chrome/Edge | offen | — | — | Version / Gerät |
| Desktop Safari | offen | — | — | Version / Gerät |
| iPhone Safari | offen | — | — | Gerät / iOS |
| iPhone installierte PWA | offen | — | — | Gerät / iOS |
| Android Chrome | offen | — | — | Gerät / Android |
| Android installierte PWA | offen | — | — | Gerät / Android |
| Tablet Hoch-/Querformat | offen | — | — | Gerät / OS |
| Mobile Registrierung/OTP/TOTP | offen | — | — | Gerät / Ergebnis |
| Mobile Stripe Checkout/Portal | offen | — | — | Gerät / Ergebnis |
| Rollback praktisch verifiziert | offen | — | — | Commit / Dauer / Ergebnis |

## Restore-Nachweis

Bei einem Point-in-Time-Restore zusätzlich dokumentieren:

- produktiver PostgreSQL-Server;
- gewählter Restore-Zeitpunkt;
- Start- und Endzeit;
- temporärer Restore-Server;
- Migrationstand;
- geprüfter nicht sensitiver Testdatensatz;
- Ergebnis;
- Löschzeitpunkt der temporären Ressource.

## Alert-Nachweis

Bei einem praktischen Monitoring-Test zusätzlich dokumentieren:

- ausgelöste Regel;
- betroffene Ressource;
- erwartete Action Group;
- tatsächliche Empfänger;
- Auslösezeit;
- Empfangszeit;
- ob Eskalationsweg funktioniert hat.

## Abschluss

Ein manueller Punkt in docs/production-launch-checklist.md darf erst auf **erledigt** gesetzt werden, wenn der entsprechende Nachweis hier oder in einem gleichwertigen kontrollierten Betriebsnachweis dokumentiert ist.
