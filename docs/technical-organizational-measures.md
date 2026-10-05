# Binso One – Technische und organisatorische Massnahmen (TOM)

Stand: 5. Oktober 2026

## Zugriff und Identität
- Kundenkonten mit E-Mail-Verifikation.
- Passwort-Hashes statt Klartextpasswörtern.
- Zweiter Faktor: E-Mail-OTP oder TOTP; privilegierte Kundenrollen mit Authenticator-Anforderung.
- Interne Binso-Administration über Microsoft Entra ID; lokale produktive Operator-Passwörter deaktiviert.
- Microsoft Authenticator / Conditional Access werden durch Entra gesteuert.
- Rollenbasierte Rechteprüfung auf API-Ebene.

## Mandantentrennung
- Geschäftsdaten sind Organisationen zugeordnet.
- Serverseitige Tenant-Kontexte und PostgreSQL-RLS werden eingesetzt.
- Demo-Daten sind von produktiven Kundendaten getrennt.

## Kryptografie und Transport
- HTTPS/TLS für produktive Kommunikation.
- Secrets werden nicht im Repository gespeichert.
- OTPs und Sessiontokens werden nur als Hash bzw. geschützte Referenz persistiert.
- TOTP-Secrets werden verschlüsselt gespeichert.

## Sessions
- httpOnly Cookies.
- secure Cookies in Produktion.
- SameSite-Schutz.
- Ablaufzeiten und serverseitig persistierte Sessions.
- Operator-Sessions werden zusätzlich gegen die aktuelle Entra-Identität und Rolle geprüft.

## Datenbank und Infrastruktur
- Azure Database for PostgreSQL.
- TLS-gesicherte Datenbankverbindung.
- Produktionsmigrationen laufen kontrolliert im Deployment.
- Backups und Restore-Fähigkeit sind vor dem Launch operativ zu testen und regelmässig zu prüfen.

## Software-Lieferkette
- GitHub Pull Requests.
- Quality Pipeline mit Tests, Lint, CSS Check, Typecheck, Build und Runtime Smoke Test.
- Deployment erst nach erfolgreicher Quality Pipeline.
- Azure Deployment per OIDC statt statischer Azure-Zugangsdaten.

## Logging und Audit
- Kritische Operator-Aktionen werden auditiert.
- Billing-Webhooks und relevante Plattformereignisse werden persistiert.
- Logs dürfen keine Passwörter, OTP-Klartexte oder vollständigen Kartendaten enthalten.

## Dienstleister
- Microsoft Azure
- Stripe
- Microsoft Graph / Microsoft 365
Aktuelle Liste und Transferinformationen: /unterauftragsbearbeiter

## Organisatorische Kontrollen
- Least Privilege für interne Rollen.
- Rollenänderungen für interne Mitarbeitende über Microsoft Entra ID.
- Zugriffsentzug bei Austritt/Rollenwechsel.
- Security-Incidents werden dokumentiert, bewertet und eskaliert.
- Datenschutz-/Security-Review bei neuen externen Integrationen.

## Offene operative Nachweise vor Go-live
- Backup-Restore-Test dokumentieren.
- Entra App Roles und MFA-/Conditional-Access-Policy live testen.
- SPF/DKIM/DMARC und E-Mail-Zustellung live testen.
- Stripe Live Checkout/Webhook/Kündigung/Failed Payment testen.
- Security-/Access-Review aller Production Secrets und Azure-Rollen abschliessen.
