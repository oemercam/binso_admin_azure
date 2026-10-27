# Kundenzugang mit E-Mail und Passwort – 27. Oktober 2026

Originalauftrag: „nein dann für Kunden nur registierung mail mit mail bestätigung und danach mail und passwort anmeldung. implementieren.“

Die jüngste Owner-Entscheidung ersetzt die früheren zusätzlichen TOTP-/Passkey-
Anmeldeverfahren für Kunden. Registrierung und einmalige E-Mail-Bestätigung
bleiben erhalten. Bestätigte Kunden melden sich danach nur mit E-Mail/Passwort
an, auch bei bereits aktiviertem Authenticator oder historischen Firmenregeln.
Falsche Passwörter, unbestätigte Adressen, gesperrte Konten/Firmen und mehrdeutige
Mitgliedschaften bleiben abgesichert. Keine neue Migration oder bezahlter Dienst.

Der Login startet keine WebAuthn-Zeremonie und enthält keinen Authenticator-
Schritt. Öffentliche Passkey-Loginmodi antworten mit HTTP 410; sitzungsgebundene
Sicherheitsbestätigungen bleiben getrennt. Veraltete Clients können die frühere
Firmen-Anmeldepflicht nicht erneut aktivieren. Historische Daten bleiben erhalten.

Interne Administratoren verwenden unverändert platform_auth_sessions und die
Entra-Identität mit explizitem MFA-Nachweis. Kunden verwenden auth_sessions.
Passwortwiederherstellung und kritische Kontoänderungen behalten ihre bisherigen
zusätzlichen Nachweise; vorhandene Authenticator-/Passkey-Daten werden weder
gelöscht noch automatisch deaktiviert. Die Sicherheitsoberfläche beschreibt
diese Verfahren deshalb als Bestätigung kritischer Änderungen.

Die automatische Sicherheitsprüfung beanstandete zunächst einen zu breiten
Wirkungsbereich. Die Kundentrennung wurde über separate Sitzungen/Operatorrouten
belegt; Änderungen an kritischen Faktor-Verwaltungsrouten wurden zurückgenommen.
Operator-MFA-Regressionsprüfung erfolgreich. Keine Produktivänderung erfolgt
ohne genaue Quellfreigabe und vollständige Release-Prüfung.

## Lokale Prüfnachweise

- Vollständiges `pnpm test`, `pnpm lint`, `pnpm typecheck` und abschließendes
  `pnpm build` erfolgreich. PGlite-Prüfungen verwenden isolierte, tatsächlich
  migrierte Datenbanken; native PostgreSQL-Prüfungen verbleiben in GitHub.
- Bestehendes Konto mit aktiviertem Authenticator meldet sich ohne MFA-Code an.
  Übermittelte alte Codes werden beim Login nicht verbraucht. Wiederherstellungs-
  nachweise bleiben atomar und einmalig; Passwortreset und Sitzungssperren getestet.
- Historische Firmenpflicht: Zugriff mit gültiger Kundensitzung möglich; direkte
  Rollen-/Tenant-Verletzungen weiterhin verweigert. Öffentliche Passkey-Loginmodi
  mit 410 abgewiesen; fremde Origins weiterhin mit 403.
- Chromium und WebKit: ausgefüllter Passwortlogin bei 390/1440px, exakte
  Identitätsreferenz und keine Passkey-Anfragen. Bestehende sitzungsgebundene
  Schlüsselverwaltung/Bestätigung zusätzlich mit virtuellem CTAP2 geprüft.
- Fünf Sprachkataloge, UI-Verträge, aktualisierte Inventare und Quellfingerabdruck
  geprüft. Keine visuelle Abnahme durch bloße Inventaraktualisierung vergeben.
- Keine echte E-Mail, Registrierung eines Kunden, Face-ID-/native Passwortmanager-
  Geräteabnahme, Zahlung oder produktive Änderung für diese Tests ausgeführt.
