# Binso One – Authentifizierungs- und Sicherheitsablauf

Stand: 5. Oktober 2026

## Registrierung
1. Die Firma erfasst Firmenname, E-Mail-Adresse, Passwort, Tarif und die erforderlichen rechtlichen Zustimmungen.
2. Vor der E-Mail-Bestätigung wird keine produktive Benutzersitzung freigegeben.
3. Binso One versendet über Microsoft Graph einen sechsstelligen E-Mail-Bestätigungscode, der 10 Minuten gültig ist.
4. Der Code ist rate-limitiert, wird nur als keyed Hash gespeichert und nach fünf Fehlversuchen oder erfolgreicher Verwendung ungültig.
5. Nach erfolgreicher Bestätigung wird die E-Mail-Adresse als verifiziert markiert und die 14-tägige Testphase startet.
6. Owner-Konten werden vor dem Zugriff auf geschützte Produkt-APIs zur Authenticator-Einrichtung geführt.

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
