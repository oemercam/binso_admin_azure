# Ausgeführte Prüfungen und offene Gates

Stand: 29. Oktober 2026. Getestete geänderte Codebytes: [Git-Blob-Identitäten](evidence/tested-code-blobs.json), unveränderte Dateien von Basis `c357eb59e7698db7ba37707d2c6919c2b0867036`. Der Branch ist ein Draft-Kandidat, keine vollständige App-/Produktionsabnahme.

| Prüfung | Tatsächliches Ergebnis | Nachweis / Grenze |
|---|---|---|
| Node / pnpm | Node 24.22.1, pnpm 10.17.1 | Cloud-Laufzeit; Windows-`../runtime.ps1` hier nicht vorhanden. Kein Werkzeug auf dem Notebook des Nutzers installiert |
| Vollständiges ESLint | Exit 0 | `evidence/lint.txt`; zusätzliche Syntax-/Lintprüfung der neuen Browserprogramme bestanden |
| TypeScript | Exit 0 | `evidence/typecheck.txt`; Produktionsbuild prüft Typen zusätzlich |
| Produktionsbuild | Exit 0 | `evidence/build.txt`, 177 statische Seiten generiert, bestehende dynamische Routen und Standalone-Ausgabe |
| Alle 94 Pflichtprogramme einzeln vollständig weitergeführt | **93 bestanden, 1 durch Umgebung blockiert** | `evidence/test-results.json` und `test-output.txt`; es wird kein grüner `pnpm test`-Gesamtlauf behauptet |
| Datei-Scanner-Protokoll | **Blockiert / Exit 1** | `file-scan-test.mjs`: `listen EPERM` für einen isolierten Unix-Socket. Keine Teständerung, kein Gate deaktiviert, kein Scanner-Pass behauptet |
| Echte API-/PGlite-/RLS-Regression | Bestanden im vorhandenen Testspektrum | Einschliesslich Registrierung, Billing, Teil-/Sammel-/Akonto, Quellen, Budget, Tenant-/Rollen-/Audit-Gegenfälle. PGlite ist kein nativer PostgreSQL-Konkurrenznachweis |
| Navigation / FAB | Statische Schutzprüfungen bestanden | Historischen Referenzcommit `fc596c4e` gezielt nachgeladen, Geometrie/Material/Icon-Negativtests bestanden. Navigation/FAB-Quelldateien unverändert |
| Architektur / CSS / UX-Verträge | Bestanden | Keine statischen Runtime-Importzyklen, aktuelle Quellen-/Routenmatrix, bestehende 40 UX-Owner, 14 CSS-Owner. Sechs bereits ungeprüfte Routen erhalten nur aktuelle Komponentenlisten; Status und leere Abnahmeevidenz unverändert |
| Produktivabhängigkeiten | Kein gemeldeter Hinweis | `evidence/dependency-audit.json`: 0 in allen Schweregraden, 385 produktive Abhängigkeiten; keine Paket-/Lockfileänderung |
| Neuer Workflow, Chromium | 20 Fälle bestanden | 390/1440 px × Light/Dark × DE/FR/IT/EN/TR. Direkter Kunde samt Pflichtkontakt und Idempotenzheader ohne Routenwechsel; Produktpreis-/Einheitenübernahme; drei Angebotsschritte; kein leerer Editorrahmen; sechs geordnete Plus-Aktionen; Desktopzeilen mindestens 44 und unter 86 px mit genau einem Zwischentrenner |
| Bestehende Formularregression, Chromium | Vier gezielte Fälle | Firma, Kunden-Draft/Fehler/Abbruch, Tastatur-/Fokus-/Footer-Verhalten, Zeiterfassung, Auftragsanlage und Abrechnungsmodellwahl bei 390/1440 px und Light/Dark; synthetische HTTP-Daten |
| Vollständige bestehende Browsermatrix | **Blockiert** | Start verlangt tatsächliche isolierte PostgreSQL-UI-Sessiondatenbank; `ECONNREFUSED 127.0.0.1:5432`. Keine Authentifizierungsumgehung als Ersatz eingeführt |
| WebKit / reale Geräte | **Nicht ausgeführt** | Regulärer Browserdownload hier fehlgeschlagen. Chromium wurde separat isoliert verfügbar gemacht. Keine physische iPhone-/iPad-/iOS-PWA- oder Softwaretastaturabnahme behauptet |
| Reale externe Provider / Zustellung | **Nicht ausgeführt** | Keine echte Mail-/Authenticator-/Stripe-/Scanner-/Restore-Abnahme aus synthetischen Fixtures ableitbar |

Textprotokolle sind ausschliesslich in Zeilenenden und abschliessendem Leerraum normalisiert; Diagnosen und Ergebnisse bleiben erhalten. Der letzte reine EOF-Leerraumabgleich am gemeinsamen Kundeneditor wurde zusätzlich durch die fokussierten Prüfungen bestätigt.

## Konkrete Release-Empfehlung

Draft-PR beibehalten. Keine Zusammenführung oder Produktion, solange Scanner-Gate, vollständige Browser-/Rollen-/Zustandsmatrix und die vorgesehenen Geräte-/Provider-/nativen DB-Nachweise fehlen. Vor einem Release müssen die unveränderten verpflichtenden GitHub-Gates auf der exakten finalen Commit-SHA laufen. Die fehlenden lokalen Nachweise werden nicht durch frühere grüne Main-Prüfungen ersetzt.

Keine neue Migration, keine Änderung an Datenbankrechten/RLS/Tarifen/Finanzformeln und kein produktiver Daten-/Schemaeingriff. Produktive Migrationen, Merge und Azure-Deploy bleiben ausdrücklich freizugeben. Vollständige Modulmatrix und verbleibender App-Abnahmeumfang: [matrix.md](matrix.md).
