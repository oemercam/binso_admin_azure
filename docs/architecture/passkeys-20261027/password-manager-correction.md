# Gewohnte Anmeldung mit Passwortmanager – 27. Oktober 2026

Die jüngste Owner-Korrektur ersetzt den separaten Passkey-Einstieg: E-Mail und
Passwort aus dem vorhandenen Passwortmanager auswählen, auf dem Gerät mit Face ID
oder Geräteentsperrung freigeben und über «Anmelden» anmelden. Kein eigener
Passkey-Button, keine zusätzliche Trennlinie, kein automatisches Einrichtungsangebot.
Das Loginformular benennt username/current-password ausdrücklich. Bestehende
Passkeys bleiben über die optionale native Zugangsauswahl erreichbar; Verwaltung,
Recovery, Firmenrichtlinien, freiwillig aktivierte Faktoren und serverseitige
Sicherheitsgrenzen bleiben erhalten. Keine Migration, keine neuen Kosten.

Die App kann Face ID nicht selbst für ein gespeichertes Passwort erzwingen.
Das übernimmt der konfigurierte Passwortmanager auf dem jeweiligen Gerät.
Virtuelle Browserprüfungen belegen keine physische Face-ID-/Autofill-Abnahme.

Diese Korrektur supersediert die frühere Passkey-Button-Reihenfolge im UI-Vertrag;
Referenzgeometrie, Inter, gemeinsame Controls und Navigation/FAB bleiben erhalten.

Lokale Prüfung: Build, Typecheck, gezieltes ESLint, Auth-Request- und kryptografische
Passkey-Regression erfolgreich. Chromium-Browser: Passwortformular mit ausgefüllten
Zugangsdaten, genau ein Login ohne zusätzliche Passkey-Prüfung, vorhandener Schlüssel
über synthetisch ausgewählten nativen Chooser mit echter virtueller CTAP2-Signatur,
Unsupported-Fallback, Referenzgeometrie und schmale Ansicht erfolgreich.
Quellinventare und Komponentenzuordnungen aktualisiert; keine Abnahme neu vergeben.
Physischer Passwortmanager/Face ID bleibt auf dem Benutzergerät zu prüfen.
