# Binso One – Technologie- und Buildprüfung, 26. Oktober 2026

Die lokale Code-, Build- und Paketprüfung ist abgeschlossen. Die überprüfte Grundarchitektur ist konsistent; gefundene Probleme im Startprozess, in der Paketvalidierung und in einer veralteten Sicherheitsdokumentation sind korrigiert. Eine vollständige Produktionsfreigabe ist damit noch nicht belegt.

Geprüfter Code-Commit: 5b6c969225e6dbdd3dcf812ea82c01e1600635fb. ZIP-SHA256: 02471e28fc0a14a50b14e2786add785c31412108e81b379bbe533fed47041bd9. ZIP-Grösse: 203.3 MiB. Die Dateien liegen lokal; kein GitHub-Push, Merge, Azure-Deployment oder produktiver Schreibzugriff wurde durchgeführt.

## Technik und Abhängigkeiten

| Bereich | Ergebnis |
| --- | --- |
| Laufzeit | Node v24.22.1, bestehender Vertrag Node >=24 <25; pnpm 10.17.1 direkt geprüft |
| Framework/UI | Next 16.4.1, React/React DOM 19.3.0; deklarierte Next-Peeranforderungen werden erfüllt |
| TypeScript | 5.9.3, strict aktiv; allowJs aus; bestehendes skipLibCheck unverändert |
| Paketauflösung | Direkte Versionen, Lockfile und Integritäten festgelegt; CI und Produktion verwenden frozen-lockfile |
| Produktionsaudit | Null bekannte Registry-Advisories aller Schweregrade, 385 erfasste Abhängigkeiten |
| Gesamtaudit | Null bekannte Registry-Advisories aller Schweregrade, 579 erfasste Abhängigkeiten; zusätzlicher harter Audit-Gate erfolgreich |
| Browserdaten | Vorherige sprachweise Auslieferung und Cache-Optimierung bleiben erhalten; keine erneute UI-Umgestaltung |
| Geheimnisse | Keine privaten Konfigurationsdateien im geprüften Paket; keine gefundenen NEXT_PUBLIC-Secret-/Passwort-/Privatschlüssel-Deklarationen |

Die Audit-Ergebnisse sind ein zeitgebundener Registry-Snapshot, keine Garantie für unbekannte Schwachstellen. Es erfolgte kein pauschales Major-Upgrade. Die älteren Node-Typdefinitionen 22 und der gezielt gepatchte Next-ESLint-Stand 16.3.8 sind dokumentierte Wartungspunkte; die aktuellen Lint-/Typprüfungen bestehen. Ihre Versionsnummern allein sind kein Nachweis eines Laufzeitfehlers. Ein Upgrade muss zusammen mit dem Lockfile und dem Patch geprüft werden.

Der Windows-Workspace-Bootstrap runtime.ps1 ist hier nicht vorhanden. Geprüft wurde auf der vorhandenen Linux-/Node-24-Laufzeit, mit dem bereits verfügbaren pnpm 10.17.1 über einen auf diesen Auftrag begrenzten Pfad. Globale Werkzeugeinstellungen wurden nicht geändert.

## Korrekturen

1. Der Produktions-Launcher gibt Rückgabecodes und Signalstatus des Workers korrekt weiter, räumt den Scanner-Bridge-Lebenszyklus nur einmal auf und beendet einen hängenden Worker nach zehn Sekunden. Echte Kindprozesse prüfen Absturz, reguläres Ende, SIGTERM, SIGINT und ausbleibende Reaktion; es bleiben keine Worker-Prozesse übrig.
2. Das Packaging prüft vor der ZIP-Erstellung die erforderlichen Runtime-Dateien und die Übereinstimmung zwischen eingebauter Commit-Kennung und deployment.json. Versehentlich kopierte .env-Dateien, .git/.npmrc sowie reine Entwicklungswerkzeuge werden abgewiesen.
3. TypeScript wird nicht pauschal aus Produktionspaketen entfernt: swissqrbill deklariert es als Peer, und die eingefrorene Produktionsauflösung enthält es daher legitim. Die Prüfung umfasst einen positiven Gegenfall dafür.
4. Der ZIP-Smoke-Test arbeitet in einem eigenen mktemp-Verzeichnis, verwendet einen freien Port und startet den tatsächlichen Launcher als kontrollierten Kindprozess. Gesundheitsantwort, Metadaten und Build müssen denselben Commit nennen. Der Test prüft zusätzlich native Sharp-Verarbeitung sowie PDF-/QR-/Excel-Imports aus dem entpackten Paket.
5. Die Dependency-Sicherheitsdokumentation beschreibt keine alte Advisory-Ausnahme mehr. Die bestehenden High-/Critical-Gates bleiben ohne Ausnahme aktiv.

## Build und Auslieferung

Der Produktionsbuild wurde mit BINSO_BUILD_SHA=5b6c969225e6dbdd3dcf812ea82c01e1600635fb erstellt. Next Standalone wird mit öffentlichen Dateien und .next/static kombiniert. Die Produktion startet server.js über den bestehenden Launcher und führt keinen Entwicklungsserver aus. Das entspricht dem dokumentierten Standalone-Grundaufbau von Next.js.

Die vorhandene Packaging-Strategie installiert die eingefrorenen Produktionsabhängigkeiten ohne pnpm-Verzeichnislinks erneut in einer hoisted-Struktur. Das sichert die Modulauflösung nach ZIP-Extraktion ab, erzeugt aber ein relativ grosses Paket von 203.3 MiB. Diese Grösse ist kein Browserdownload; der Website-JavaScript-Transfer bleibt separat gemessen. Eine spätere Verkleinerung auf ausschliesslich getracte Dateien braucht denselben Native-/QR-/PDF-/Artefaktnachweis und ist kein Grund, jetzt blind Runtime-Abhängigkeiten zu löschen.

Bestehende CI-Sicherungen wurden geprüft: unveränderliche Action-SHAs, begrenzte Job-Laufzeiten, sparsame Berechtigungen, OIDC nur im autorisierten Job, explizite Produktionserlaubnis auf main und Übernahme derselben SHA- und SHA256-gebundenen ZIP-Datei nach vollständiger Quality-Prüfung. Es wurde kein Gate abgeschwächt und kein neuer CI-Lauf ausgelöst.

## Tatsächlich ausgeführte Prüfungen

Bestanden: Produktionsbuild; vollständiges pnpm lint; css:check; typecheck; release:check einschliesslich Dokumentations-/Repository-/Freigaberesolver; Produktions- und Gesamtaudit; Workflow-Sicherheits-, Artefaktintegritäts-, Patch-Packaging-, Deployment-Settings-, Build-Cache-, Asset-/Auth-Vertrags-, Runtime-Integritäts-, Launcher- und Produktionspakettests; Architektur-Integration und Diff-Prüfung.

Das finale ZIP wurde entpackt und zusätzlich ohne Scanner-Bridge im separaten HTTP-/Native-Diagnoselauf gestartet. Erfolgreich: passende Runtime-SHA, Next/PDFKit/SwissQRBill/ExcelJS-Imports, native Sharp-PNG-Erzeugung, Prüfung der tatsächlichen ausgelieferten Build-Dateien, öffentliche Seiten, Login/Registrierung, Schriftdatei, geschützte Weiterleitungen und API-Ablehnung, nicht authentifizierter Sitzungsstatus und Prozessende. Dieser Diagnoselauf ist ausdrücklich keine Ersatzfreigabe für den Scanner-Test.

## Offene Release-Nachweise

- pnpm test wurde vollständig gestartet, bricht hier aber bei file-scan-test.mjs mit listen EPERM für einen Unix-Socket ab. Die nachfolgenden Teile dieses konkreten Gesamtlaufs sind deshalb nicht als bestanden gewertet.
- Der unverändert scannerpflichtige ZIP-Smoke-Test wurde ausgeführt und wird ebenfalls durch listen EPERM am privaten Scanner-Socket blockiert. Der Gate wurde nicht übersprungen oder auf TCP umgestellt.
- Vollständige Quality-Prüfung mit den echten isolierten PostgreSQL-, Scanner- und Browser-Lanes auf demselben finalen Quellstand steht aus. Vorherige CI-Ergebnisse ersetzen sie nicht.
- Die tatsächlichen Azure-Runtime-Einstellungen und die aktuellen Provider-/Backup-/Mail-Konfigurationen wurden in diesem Auftrag nicht aus Azure ausgelesen. Die CLI ist hier nicht verfügbar. Die Workflow- und Konfigurationsquellen wurden geprüft; das ist kein Live-Infrastrukturnachweis.
- Browser-/iPhone-/4G-Abnahme und reale Mail-/Zahlungs-/Gerätenachweise bleiben getrennt. Es gibt keinen pauschalen Nachweis, dass jede Funktion in Produktion bereits vollständig abgenommen ist.

Vor einem später ausdrücklich autorisierten Deployment müssen die offenen Gates für den dann tatsächlich freizugebenden Commit vorliegen.

## Quellen und Belege

- [Strukturierte lokale Zusammenfassung](20261026-technology-summary.json)
- [HTTP-/Native-Diagnose des entpackten ZIP](20261026-artifact-http.json)
- [Next.js: Standalone Output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Node.js: Prozesssignale und Signal-Exitcodes](https://nodejs.org/api/process.html#signal-events)
- Projektquellen: package.json, pnpm-lock.yaml, next.config.ts, .github/actions/setup-node/action.yml, Quality-/Deploy-Workflows und die genannten Packaging-/Launcher-Skripte.
