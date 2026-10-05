# Binso One – Production Launch Checklist

Stand: 5. Oktober 2026

## Release Gate
- [ ] main Quality grün
- [ ] Azure Deploy grün
- [ ] Produktions-Healthcheck zeigt aktuellen Commit
- [ ] Datenbankmigrationen erfolgreich
- [ ] Persistence Smoke Test erfolgreich
- [ ] Rollback-Verfahren geprüft

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
- [ ] echte E-Mail-Zustellung inkl. Resend Live-Konfiguration getestet
- [ ] SPF, DKIM, DMARC geprüft

## Interne Binso-Administration
- [x] Microsoft Entra SSO im Code
- [x] bestehendes Binso Operator-RBAC angebunden
- [x] lokale produktive Operator-Passwörter deaktiviert
- [ ] Entra App Roles im produktiven Tenant verifiziert
- [ ] Tenant-Pinning konfiguriert
- [ ] Microsoft Authenticator / Conditional Access mit echtem Mitarbeiter getestet
- [ ] Offboarding-Test: Rolle/Benutzer in Entra entfernen -> Adminzugriff endet

## Billing / Stripe
- [x] Checkout serverseitig
- [x] Webhook als Autorität
- [x] Customer Portal
- [x] 14-Tage-Trial ohne Kreditkarte
- [x] keine automatische Belastung ohne expliziten Aboabschluss
- [x] rechtliche Bestätigung vor Checkout
- [ ] alle sechs Live-Preisvarianten testen
- [ ] Live-Kartenzahlung kontrolliert testen
- [ ] invoice.paid / invoice.failed testen
- [ ] Kündigung zum Periodenende testen
- [ ] Trial-Ablauf -> read_only testen
- [ ] MWST-/Steuerkonfiguration fachlich bestätigen

## Datenschutz / Betrieb
- [x] Bearbeitungsverzeichnis angelegt
- [x] TOM dokumentiert
- [x] Incident-Response-Ablauf dokumentiert
- [x] DPA/Subprocessor-Transparenz
- [ ] Azure Backup-Restore erfolgreich getestet und dokumentiert
- [ ] Retention-Werte technisch verbindlich festgelegt
- [ ] Kundendatenexport und endgültige Löschung E2E getestet
- [ ] Production-Secrets/Permissions reviewed

## UX / Geräte
- [ ] Desktop Edge/Chrome/Safari prüfen
- [ ] iPhone Safari + installierte PWA prüfen
- [ ] Android Chrome + PWA prüfen
- [ ] Tablet prüfen
- [ ] Registrierung/OTP/Authenticator auf Mobile prüfen
- [ ] Checkout/Stripe Portal auf Mobile prüfen

## Go-live Entscheidung
Erst freigeben, wenn Release Gate komplett grün ist und die mit [ ] markierten Security-/Billing-/E-Mail-Kernpunkte getestet sind.
