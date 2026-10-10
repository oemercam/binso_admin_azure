# Binso One – Authentifizierungs- und Sicherheitsablauf

Stand: 10. Oktober 2026 (V22.2, noch keine produktive Gesamtabnahme)

## Registrierung
1. Alle Registrierungs-CTAs führen zu `/registrieren`, das dieselbe zentrale `RegistrationSheet` mit `FormSheet`, `FormWizard` und `Field` verwendet. Firmenname, Zugang und Vertragsprüfung sind drei Schritte; Tarif und Intervall stammen aus dem serverseitigen Registrierungskontext. Ohne Tarif wird ausdrücklich eine kostenlose Testphase angeboten, kein kostenpflichtiger Abschluss.
2. Vor der E-Mail-Bestätigung wird keine produktive Benutzersitzung freigegeben.
3. Binso One verwendet Microsoft Graph für einen Bestätigungslink (24 Stunden) und einen sechsstelligen E-Mail-Bestätigungscode (10 Minuten). Der Link wird als SHA-256-Hash in der bestehenden Tabelle `auth_tokens` gespeichert. Beide Methoden laufen ausschliesslich über `/api/auth/verify-email`. Ein nicht bestätigter Versand wird nicht als Erfolg angezeigt.
4. Der Code ist rate-limitiert, wird nur als keyed Hash gespeichert und nach fünf Fehlversuchen oder erfolgreicher Verwendung ungültig.
5. Nach erfolgreicher Bestätigung wird die E-Mail-Adresse als verifiziert markiert und die 14-tägige Testphase startet.
6. Owner-Konten werden vor dem Zugriff auf geschützte Produkt-APIs zur Authenticator-Einrichtung geführt. Danach erfolgt die Übergabe an die bestehende Firmeneinrichtung. Der explizite Abschluss schreibt transaktional den vorhandenen `onboarding_completed`-Meilenstein; später führt der Einstieg zum Dashboard.
7. Ein HttpOnly-/SameSite-Receipt erlaubt die Wiederaufnahme der angelegten, unbestätigten Registrierung im selben Browser. Es erzeugt keine authentifizierte Sitzung und enthält kein Passwort. Gerätewechsel erfolgt über den E-Mail-Link oder die bestehende Anmeldung.
8. Link-Verbrauch und Bestätigung werden gemeinsam gesperrt und transaktional geschrieben. Erneute Link-Verwendung bestätigt den bereits verarbeiteten Zustand, erzeugt aber keine neue Sitzung. Der Trial wird nicht verlängert. AGB-/DPA-Version, Datenschutzhinweis, Intervall und Zeitnachweis liegen im bestehenden Audit-Event; die AGB-Version bleibt zusätzlich im Benutzerprofil.
9. Die deutsche, französische, italienische, englische und türkische Registrierung sowie ihre Mailtexte nutzen den zentralen Katalog `lib/i18n.ts`. Die bisherige `mail-i18n`-Schnittstelle re-exportiert diesen Katalog.

## Anmeldung
1. E-Mail-Adresse und Passwort sind immer erforderlich.
2. Konten ohne aktiviertes Authenticator-MFA erhalten einen neuen sechsstelligen E-Mail-Anmeldecode.
3. Konten mit aktiviertem Authenticator-MFA müssen einen gültigen TOTP-Code oder einen einmaligen Recovery Code eingeben.
4. Owner, Admin und Finance können geschützte Produkt-APIs erst verwenden, nachdem Authenticator-MFA eingerichtet wurde.
5. Nicht privilegierte Benutzer können E-Mail-OTP als zweiten Faktor verwenden oder Authenticator-MFA freiwillig aktivieren.

## Authenticator-Einrichtung
- Das TOTP-Secret wird serverseitig erzeugt und verschlüsselt gespeichert.
- Eine begonnene Einrichtung verfällt nach 15 Minuten.
- Die Einrichtung wird erst nach Prüfung eines gültigen sechsstelligen TOTP-Codes abgeschlossen.
- Es werden acht einmalig verwendbare Recovery Codes erzeugt; gespeichert werden ausschliesslich deren Hashes.
- Die Recovery Codes werden dem Benutzer nur einmal angezeigt.

## Produktive Voraussetzungen und Tests
- `APP_ENCRYPTION_KEY` muss produktiv gesetzt sein.
- Microsoft Graph benötigt `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` und `GRAPH_SENDER_USER_ID`. Produktiver Absender ist `one@binso.ch`; SPF, DKIM und DMARC für `binso.ch` müssen operativ geprüft werden.
- Production tests must cover registration, erneute Code-Zustellung, ungültige/abgelaufene Codes, Versuchslimits, E-Mail-OTP-Login, TOTP-Login, Recovery-Code-Login und MFA-Pflicht für privilegierte Rollen.
