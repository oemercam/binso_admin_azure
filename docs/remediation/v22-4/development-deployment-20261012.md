# Autorisierter Entwicklungsstand vor der Produktfreigabe

Am 12.10.2026 um 21:25:03 Europe/Istanbul hat der Repository-Nutzer die Bereitstellung und zugängliche Dateien ausdrücklich verlangt: „Ja mach alles damit wir entlich deployen können und sperrendie dateien nicht wir machen später scanner richtig“. Zusätzliche laufende Kosten sind weiterhin abgelehnt. Die Geräteprüfung wurde zuvor auf später verschoben.

Diese Entscheidung führt zu einem eigenen, sichtbaren **Vorab-Entwicklungsumfang**, nicht zu einer erfundenen vollständigen Produktionsabnahme. Die maschinenlesbare Entscheidung steht in `ux-compliance/release-scope.v1.json`. `ledger.releaseReady` und vollständiges `report.compliant` bleiben false, solange die entsprechenden Nachweise fehlen.

## Dateien bleiben benutzbar

Nur die Kombination `BINSO_RELEASE_PROFILE=development-20261012`, `BINSO_FILE_ACCESS_MODE=authenticated-unscanned` und **kein** `FILE_SCAN_SOCKET` erlaubt den Zugriff auf `pending`-Dateien. Anmeldung, Rolle, Mandant, Beleg-Eigentümer und bestehende Dateizuordnungen werden weiterhin geprüft. Downloads bleiben private/no-store, attachment, nosniff und mit einer Sandbox-CSP versehen; der tatsächliche Scanstatus wird als Antwortheader ausgewiesen.

Die 209 vorhandenen Dateien werden nicht auf clean umgeschrieben. Neue ungeprüfte Uploads bleiben pending, ohne erfundenen Engine-Nachweis. Pending-Bilder können in diesem ausdrücklich gewählten Modus als eigenes Logo/Avatar genutzt werden; PDF-Logos bleiben an Mandant, Dateizweck, erlaubte Rasterformate, Größen- und Decoder-Pixellimits gebunden. Es werden keine alten Rechnungs-, Datei- oder Brandingbestände im Bulk verändert.

Rejected-Dateien bleiben gesperrt. Wenn ein Scanner konfiguriert ist, entfällt die Ausnahme für ungeprüfte Dateien; Scannerfehler bleiben Fehler und schädliche Uploads werden abgelehnt. Auch das Entfernen des Entwicklungsprofils oder Dateimodus stellt die strikte Quarantäne wieder her. Das spätere Scannerprojekt muss reale Engine, Signaturen, Limits, Ausfallverhalten und den kontrollierten Bestands-Rescan nachweisen.

**Die Dateien sind in diesem Modus nicht auf Schadsoftware geprüft.** Diese Funktionseinschränkung bleibt dokumentiert, auch wenn die Dateinutzung möglich ist.

## Zwei getrennte Freigaben

Das vollständige Release-Gate `--release` wird nicht aufgehoben: Es verlangt weiterhin vollständige ursprüngliche Quellen, alle 432 Einzelabnahmen sowie visuelle/physische Nachweise.

Für diesen Vorabstand gibt es `--deployment-release`. Es verlangt die exakte autorisierte Scope-Datei, keine gemessene Regression, keine verworfenen/stalen Nachweise, bestandene geschützte Navigation-/Fixture-/Architekturverträge, aktuelle Header-Messung in Chromium **und** WebKit, Chromium-Runtime-Evidenz für alle anwendbaren Quellrouten und alle neun synthetischen Zustände. Die zwei expliziten Ausnahmen sind ausschließlich die Entwicklungs-Laborroute und der Operator-Wallboard-Redirect. WebKit behält repräsentative Anwendungsrouten und erhält zusätzlich die Desktopbreite 1024px. Beide Engine-Jobs, native Datenbank-/Auth-/Mandantenprüfungen, Lint, TypeScript, Build/exakter ZIP-Smoke, Scanner-CI und CodeQL bleiben erforderlich.

Der Entwicklungsumfang wird bereits im vollständigen PR-Lauf geprüft, danach erneut auf dem exakt aktuellen Main-Commit. ZIP, Scope-Datei und veröffentlichte Metadaten sind über SHA-256 gebunden. Nur das vollständig erfolgreiche aktuelle Main-Artefakt darf deployt werden; kein Neubau und kein Branchschutz-Bypass.

Die offenen vollständigen Produktionsnachweise werden nicht als bestanden markiert: Live-Scanner/Rescan, vollständige 432er-Abnahme, benannte Pixel-/PWA-Prüfung, vollständige Ingress-Spoof-Beweismatrix, Performance-/historische Domainprüfung und Alarmzustellung bleiben im Issue/Ledger sichtbar. Die Entwicklungsentscheidung ist keine technische Abnahme dieser Punkte.

## Datenbank und Ablauf

Der vorhandene kanonische produktive Migrationsprozess führt additive Migration 0048 aus. Historische Migrationschecksummen werden weder ersetzt noch übersprungen. Die bereits gespeicherte separate Runtime-Verbindung wird vor Auslieferung tatsächlich als `binso_runtime` angemeldet und durch Rechte-/Ownership-/Schema-/RLS-Gates geprüft. Die neue Verbindung wird erst **nach** Auslieferung des neuen Anwendungscodes zur laufenden `DATABASE_URL` promotet, gemeinsam mit dem expliziten Dateimodus. Das Profil wird danach aus der tatsächlich gestarteten Health-Antwort geprüft; vorhandene Demo-/API-/Team-/PDF-Smokes laufen unter der neuen App-Verbindung.

Geheimnisse verbleiben in einer privaten temporären Datei bzw. im Prozess-Environment, werden maskiert und nicht als Artefakt veröffentlicht. Eine neue Registry, ein Planupgrade, neue IAM-Rollen oder Scanneraktivierung werden nicht ausgeführt. Ein unerwartet aktivierter permanenter Sidecar stoppt diesen Deploy-Ablauf.

Dieser Text dokumentiert den geplanten Ablauf. Commit-Prüfung, Main-Merge, Migration, Runtime-Promotion und Live-Smoke sind erst nach ihren tatsächlichen erfolgreichen Läufen bestätigt.

## Offene CodeQL-Gespräche vor dem Merge

Der kontrollierte Rescan liest das private Manifest nun über einen einzigen mit O_NOFOLLOW geöffneten Descriptor. Eigentümer, regulärer Dateityp, private Rechte und maximal 1 MiB werden an diesem Descriptor geprüft; der Pfad wird zum Lesen nicht erneut geöffnet. Ein echter Dateiaustausch zwischen Öffnen und Prüfung/Lesen muss weiterhin den ursprünglichen Inhalt liefern. Symlinks, öffentliche Rechte, Verzeichnisse und übergroße Dateien werden negativ getestet.

Scanner-CI-Ergebnisse werden in einem neu erzeugten privaten Verzeichnis bzw. einem eindeutigen mkdtemp-Verzeichnis erstellt und über den bestehenden privaten atomaren Writer veröffentlicht. Ein vorab angelegtes Zielverzeichnis wird nicht übernommen. Die Korrekturen betreffen Test-/Operatorwerkzeuge und geben keine Produktionsdateien frei.
