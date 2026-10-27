# Lokale Prüfung und offene Abnahmen — 27. Oktober 2026

Branch: `feat/passkey-authentication-20261027`, Ausgangsbasis Main
`63e12ef1108098484889ece7c4276b1619475cd3`. Die endgültige Quellcode-Commit-ID
steht im Übergabebeleg neben dem ZIP. Keine produktive Migration oder Aktivierung.

| Prüfung | Ergebnis / Grenze |
| --- | --- |
| Vollständiges Lint | Erfolgreich; spätere Korrekturen zusätzlich gezielt geprüft |
| TypeScript | Erfolgreich; auch im abschließenden Next-Produktionsbuild geprüft |
| Testsuite mit89Skripten | Durchlauf bis zur letzten UX-Vertragsprüfung erfolgreich; diese beanstandete veraltete Komponenten-Zuordnungen und bestand nach Aktualisierung des Registers. Keine Prüfung deaktiviert. |
| Nachträgliche Auth-/Client-Korrekturen | Betroffene Passkey-, Session-, Auth-Integritäts-, Daten- und Architekturprüfungen erneut erfolgreich |
| Produktionsbuild | Erfolgreich; nach Browserbefunden betroffene Korrekturen neu gebaut |
| Abhängigkeiten | Bestehende Produktions- und vollständige Sicherheitsprüfung erfolgreich |
| Schema / Migration |125Tabellen,109Migrationen; additive0108, vollständiger Vertrags- und RLS-Test erfolgreich |
| Sprachen / Dokumentation / CSS / Release-Vertrag | Erfolgreich; DE/EN/FR/IT/TR; keine neue lokale CSS-Regel |
| Virtuelles FIDO2-Gerät in Chromium | Registrierung, starke Bestätigung, Umbenennen, genau eine Anmeldung ohne TOTP und Passwort-Fallback erfolgreich |
| Conditional Mediation | Abstimmung mit wartendem synthetischem Auswahldialog und anschließend echter expliziter WebAuthn-Anmeldung erfolgreich; echte native Autofill-Auswahl offen |
| Schmale Darstellung |320Pixel inklusive vollständiger Aktionsbeschriftung und Wiederherstellungscodes geprüft; Desktop-Login ebenfalls gerendert |
| Native PostgreSQL18-Parallelprüfungen | Bestehende GitHub-Pflichtprüfung erhalten; für diesen lokalen Stand noch nicht in GitHub ausgeführt |
| Reale Geräte / PWA | Face ID, Touch ID, Windows Hello, Android, Sicherheitsschlüssel sowie installierte iOS-/Android-PWA nicht als ausgeführt behauptet |
| Reale Zustellung | Keine produktive Sicherheits-E-Mail versendet; Tests verwenden isolierten Versandadapter |

Die Backend-Prüfung führt echte P-256-Signaturen, SimpleWebAuthn und die tatsächlich
migrierte Datenbank mit eingeschränktem Runtime-RLS aus. Ablehnungen umfassen UV,
Signatur, Origin/RP, Benutzerkennung, abgelaufene/wiederverwendete Challenges,
Zählerwiederholung, veränderte Backup-Eignung, fremde Tenants und alte Nachweise.
Synchronisierte Schlüssel mit Nullzähler, mehrere Schlüssel, letzter starker
Zugang, Transaktions-Rollback, Code-Wiederverwendung und Session-Widerruf sind
abgedeckt. Erwartete Fehler bei absichtlich gestörten Audit-Transaktionen sind
negative Testfälle, keine erfolgreichen produktiven Aktionen.

Der Browser verwendet die echte WebAuthn-Schnittstelle und einen virtuellen
CTAP2-Authenticator. Seine HTTP-Daten sind ausdrücklich synthetische UI-Fixtures.
Der lokale Testzugang ist kein produktiver Authentifizierungs-Bypass. Die
automatischen Screenshots sind technische Nachweise, keine menschliche
Design-/Gerätefreigabe: [320Pixel](evidence/registered-320.png),
[mobiler Login](evidence/login-mobile.png), [Desktop-Login](evidence/login-desktop.png).
Der [maschinelle Browserbeleg](evidence/result.json) nennt diese Grenzen ebenfalls.

Gefundene Fehler wurden korrigiert: Ein globaler Session-Neuaufbau ließ einmalige
Codes verschwinden; Passkey-Metadaten aktualisieren jetzt nur Sicherheitsdaten.
Eine zu breite Beschriftung wurde durch die vorhandene umbrechende Aktionszeile
ersetzt. Die jeweils neuen Regressionen prüfen den konkreten Fehler weiter.

Vor einer Veröffentlichung sind die bestehenden vollständigen GitHub-Gates für
die konkrete Quellcode-SHA auszuführen. Erst danach gilt die vorhandene Freigabe-
und Deploymentlogik. Der lokale Build ist kein bereits qualifiziertes Azure-
Releaseartefakt und die Quellcode-Lieferung ist keine ASVS-Zertifizierung.
