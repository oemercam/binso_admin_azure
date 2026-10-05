# Binso One – Production Launch Checklist

Stand: 5. Oktober 2026

## Release Gate
- [ ] main Quality grün für den finalen Go-live-Commit
- [ ] Azure Deploy grün für den finalen Go-live-Commit
- [ ] Produktions-Healthcheck zeigt den finalen Commit
- [ ] /api/health/ready liefert status=ready
- [ ] Datenbankmigrationen erfolgreich
- [ ] Persistence Smoke Test erfolgreich
- [x] Rollback-Verfahren dokumentiert
- [ ] Rollback-Verfahren einmal praktisch verifiziert

## Automatisierte Produktionskontrollen
- [x] Dependency Audit mit pnpm audit --audit-level high in Quality
- [x] Regressionstest verhindert die Wiedereinführung eines ausgemusterten Mail-Providers
- [x] Microsoft Graph als einziger produktiver Mailpfad
- [x] Graph-Konfigurationsprüfung im Deploy
- [x] echter Microsoft-Graph-sendMail-Selbsttest als eigener Production-Workflow
- [x] Azure Architecture Audit prüft produktive Graph-/Security-Konfiguration
- [x] Stripe Live Configuration Audit prüft Konto, sechs Live-Prices, Webhook und Customer Portal ohne Zahlung auszulösen
- [x] tägliche automatische Bereinigung abgelaufener Auth-/Session-Artefakte
- [x] Retention Cleanup zusätzlich bei jedem produktiven Deploy
- [x] Readiness-Endpoint prüft DB, App-Verschlüsselung, Graph-Mail und Stripe-Konfigurationsvollständigkeit
- [x] kontrolliertes Tooling für mandantenbezogenen Datenexport und endgültige Löschung vorhanden
- [x] CI prüft die Lösch-Schutzbedingungen und ON-DELETE-CASCADE-Regeln
- [x] Azure Monitoring Readiness Workflow prüft Application Insights, Action Group und Alert-Regeln
- [x] PostgreSQL Backup Readiness Workflow prüft Serverzustand und konfigurierte Backup-Retention

## Recht / Vertrag
- [x] Impressum veröffentlicht
- [x] Datenschutzerklärung veröffentlicht
- [x] AGB veröffentlicht
- [x] Vereinbarung zur Auftragsbearbeitung veröffentlicht
- [x] Unterauftragsbearbeiter-Liste veröffentlicht
- [x] Versionierte Zustimmung bei Registrierung
- [x] Erneute ausdrückliche Bestätigung vor kostenpflichtigem Checkout
- [x] B2B-Ausrichtung und Trial-Mechanik transparent
- [ ] Finale juristische Prüfung von Haftung, Kündigung und DPA vor breiter kommerzieller Vermarktung

## Kunden-Authentifizierung
- [x] E-Mail + Passwort
- [x] 6-stellige E-Mail-Verifikation
- [x] kein produktiver Session-Zugriff vor Verifikation
- [x] zweiter Login-Faktor
- [x] TOTP + Recovery Codes
- [x] Authenticator-Pflicht für Owner/Admin/Finance
- [ ] Microsoft-Graph-Selbsttest in GitHub Actions grün
- [ ] echte Zustellung an ein externes Testpostfach kontrolliert bestätigt
- [ ] SPF, DKIM und DMARC für binso.ch geprüft

## Interne Binso-Administration
- [x] Microsoft Entra SSO im Code
- [x] bestehendes Binso Operator-RBAC angebunden
- [x] lokale produktive Operator-Passwörter deaktiviert
- [x] Tenant-Pinning wird im Deploy aus dem Azure-Tenant gesetzt
- [ ] Entra App Roles im produktiven Tenant mit echten Benutzerkonten verifiziert
- [ ] Microsoft Authenticator / Conditional Access mit echtem Mitarbeiter getestet
- [ ] Offboarding-Test: Rolle/Benutzer in Entra entfernen -> Adminzugriff endet
- [ ] Mail.Send Application Permission auf die erforderliche Mailbox/Scope nach Least-Privilege beschränken und prüfen

## Billing / Stripe
- [x] Checkout serverseitig
- [x] Webhook als Autorität
- [x] Customer Portal
- [x] 14-Tage-Trial ohne Kreditkarte
- [x] keine automatische Belastung ohne expliziten Aboabschluss
- [x] rechtliche Bestätigung vor Checkout
- [x] Trial-Ablauf -> read_only ist automatisiert auf Datenbankebene getestet
- [ ] Stripe Live Configuration Audit für finalen Stand grün
- [ ] Live-Kartenzahlung kontrolliert testen
- [ ] invoice.paid / invoice.failed mit echten Stripe-Testfällen verifizieren
- [ ] Kündigung zum Periodenende E2E testen
- [ ] MWST-/Steuerkonfiguration fachlich bestätigen

## Datenschutz / Betrieb
- [x] Bearbeitungsverzeichnis angelegt
- [x] TOM dokumentiert
- [x] Incident-Response-Ablauf dokumentiert
- [x] DPA/Subprocessor-Transparenz
- [x] technische Auth-/Session-Retention festgelegt und automatisiert
- [x] Backup-/Restore-Testverfahren dokumentiert
- [ ] PostgreSQL Backup Readiness Workflow grün
- [ ] Azure PostgreSQL Point-in-Time-Restore erfolgreich praktisch getestet
- [ ] Azure-/Application-Insights-Log-Retention verbindlich bestätigen
- [x] Kundendatenexport und endgültige Löschung technisch implementiert und abgesichert
- [ ] Kundendatenexport und endgültige Löschung mit einer echten Testorganisation E2E ausgeführt
- [ ] Production-Secrets/Permissions manuell nach Least Privilege reviewed
- [ ] Verantwortliche Person für Incident-Koordination organisatorisch bestätigt

## Monitoring / Betrieb
- [x] /api/health vorhanden
- [x] /api/health/ready vorhanden
- [x] Azure Architecture Audit inventarisiert App Insights, Alerts und Action Groups
- [ ] Production Monitoring Readiness Workflow grün
- [ ] Application Insights produktiv vorhanden und Telemetrie sichtbar
- [ ] mindestens ein produktiver Alert mit Action Group praktisch ausgelöst/getestet
- [ ] Alarmempfänger und Eskalationsweg bestätigt

## UX / Geräte
- [ ] Desktop Edge/Chrome/Safari prüfen
- [ ] iPhone Safari + installierte PWA prüfen
- [ ] Android Chrome + PWA prüfen
- [ ] Tablet prüfen
- [ ] Registrierung/OTP/Authenticator auf Mobile prüfen
- [ ] Checkout/Stripe Portal auf Mobile prüfen

## Domains
Die geplante produktive Domainumstellung wird bewusst separat durchgeführt und ist nicht Teil dieses Readiness-Hardening-Branches.

## Go-live Entscheidung
Kommerziell freigeben, wenn der finale Quality-/Deploy-Lauf grün ist und die offenen Security-, E-Mail-, Billing-, Restore-, Monitoring- und Geräte-E2E-Punkte praktisch bestätigt wurden.
