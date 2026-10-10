# Auth-Zustand zwischen Prüfung und Sitzungserstellung

## Nachgewiesener Fehler

Am Review-Stand `0c7947f4cab7e9b1c93a0a684f59f4fdbf246ea8` wurde der tatsächliche Login-Handler nach dem Lesen der alten Passwort-/MFA-Daten kontrolliert angehalten. Ein tatsächlicher Passwort-Reset wurde vollständig abgeschlossen; danach lief der Login weiter. Mit dem alten Passwort und einem gültigen synthetischen TOTP lieferte der Handler HTTP 200. Die tatsächliche `createSession`-Implementierung legte anschliessend eine neue Sitzung in der isolierten Datenbank an: **eine persistierte Sitzung nach abgeschlossenem Reset**. Datenbank, Benutzer, Schlüssel, Request-Metadaten und Cookies waren ausschliesslich Testfixtures; es wurde kein produktives Konto verwendet.

Ursache: Die Prüfung eines gelesenen Passwort-/MFA-Zustands war nicht mit dem späteren `auth_sessions`-Insert synchronisiert. Der atomare Reset widerrief nur die bis dahin vorhandenen Sitzungen. Die angemeldete Passwortänderung schrieb ebenfalls unabhängig vom zuvor geprüften Passwort-Hash.

## Zentrale Korrektur

- `lib/server/session.ts#createSession` sperrt den Benutzer mit `FOR UPDATE` und fügt die Sitzung in derselben Transaktion ein. Inaktive Benutzer werden für alle Aufrufer abgewiesen.
- Der Login übergibt den tatsächlich geprüften Passwort-Hash und den MFA-Zustand. Ein inzwischen geänderter Passwort-/MFA-Zustand ergibt HTTP 401, ohne neue Sitzung und ohne neues Sitzungscookie.
- Reset, MFA-Aktivierung und Sitzungserstellung verwenden damit denselben Benutzer-Lock. Wenn die Sitzung zuerst angelegt wird, widerruft der anschliessende Reset sie; wenn der Reset zuerst abgeschlossen ist, kann die alte Anmeldeprüfung keine Sitzung mehr anlegen.
- Eine angemeldete Passwortänderung bindet das UPDATE an den zuvor geprüften Hash und den aktiven Benutzerstatus. Ein konkurrierender Reset gewinnt und die veraltete Änderung ergibt HTTP 409.
- Andere legitime Sitzungsersteller bleiben unterstützt. Eine E-Mail-Verifizierung verwendet ihren eigenen Token-Nachweis; die neue aktive-Benutzer-Prüfung ersetzt diesen nicht durch eine erfundene Passwortprüfung.

Keine Schemaänderung, historische Migration oder Änderung produktiver Passwörter/Sitzungen wird durch diesen Commit ausgeführt. Cookie-Attribute und bestehende Navigation bleiben unverändert.

## Regression und Grenzen

`scripts/auth-integrity-test.mjs` verwendet die tatsächlichen Auth-Handler, die tatsächliche Sitzungserstellung und echte SQL-Transaktionen. Ein kontrollierter Read-Barrier erzwingt die Reihenfolge; feste Verzögerungen entscheiden nicht über die Assertions. Der Barrier besitzt lediglich eine begrenzte Fehler-Deadline.

Geprüft werden veralteter Login nach Reset (HTTP 401, **null** neue Sitzungen), neuer gültiger Login, veraltete Passwortänderung nach Reset (HTTP 409, Reset-Passwort unverändert), geänderter MFA-Zustand, inaktiver Benutzer, Recovery-Code-Nebenläufigkeit und Reset-Rollback/Retry. PGlite serialisiert seine tatsächlichen Transaktionen über seinen Transaktionsadapter; der vorhandene PostgreSQL-CI-Dienst prüft dieselben Fälle mit physisch getrennten Clients.

Dies ist kein vollständiger Nachweis aller Authentifizierungs-, E-Mail-Token-, Azure-Ingress- oder nativen PWA-Grenzen. Eine Release-Abnahme bleibt separat erforderlich.
