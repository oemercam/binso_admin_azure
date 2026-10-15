# V24 Release Readiness

**Nicht freigegeben. Gesamtauftrag nicht vollständig implementiert oder abgenommen.**

Review-Kandidat: PR #253; enthält die vorhandenen PR-#250-Funktionen, den Audit und die fortgesetzten zentralen Korrekturen. Nicht die alten PRs unabhängig voneinander mergen.

| Bereich | Nachweis | Status |
| --- | --- | --- |
| Architektur | Aktueller vorhandener Generator: 76 Seiten, 471 Module, keine lokalen Runtime-Importzyklen, keine unreferenzierten Komponenten | statisch geprüft |
| Security | Begrenzter lokaler Rate-Limiter, bestehende Auth-/Upload-/Runtime-Rollen-Gates | Implementierung teilweise; endgültige CI beachten |
| KPI / Diagramme | Gemeinsame KPI-Renderer, maximal vier primäre Werte, signierte Zeitreihen und interaktive Ringe | implementiert; visuelle Abnahme offen |
| Finanzdaten | SQL-Definitionen für Belegumsatz, Gutschriften, Forderungen und Cash getrennt | lokale Abfragetests bestanden; gesamte Fachprozess-Abnahme offen |
| Demo | Zwölf Monate mit positiven/negativen Szenarien; Idempotenz/FK/RLS/Zahlungsparität | lokale eingeschränkte Rolle geprüft; externe PostgreSQL-CI für diesen Commit offen |
| Browser | Frühere CI fand veraltete Selektoren/Verträge; korrigiert | neuer Commit muss Chromium/WebKit bestehen |
| Pflicht-Testlauf lokal | Scanner-Listener wird mit EPERM verweigert | blockiert; keine Umgehung |
| Browser lokal | Playwright-Modul gefunden, passendes Browser-Binary fehlt; Scanner-Listener ebenfalls gesperrt | keine lokale Browser-Abnahme |
| Geräte | Physisch installierte iPhone-/Android-PWA, Tastatur/Safe Areas/Offline | offen |
| Compliance / Betrieb | Öffentliche Standards-Versionen/erste Control-Matrix vorhanden; vollständige normative und operative Evidenz fehlt | offen |

Kritische vollständige Release-Gates und fachliche Restpunkte bleiben blockierend. Ein grüner Build ist keine vollständige V24-Abnahme. Main-Quality startet automatisch den Produktivdeploy: kein Merge ohne ausdrückliche Freigabe.

## Lokaler Prüfstand des aktuellen Quell-Fingerprints

37 von 38 unabhängig ausgeführten Test-Einträgen bestanden; ausschliesslich scripts/file-scan-test.mjs scheitert an listen EPERM. Die unabhängige Diagnose ersetzt das weiterhin blockierte vollständige pnpm-test-Gate nicht. Ergebnis samt Quell-Fingerprint: latest-local-test-results.json.

Bestanden: vollständiger Lint, TypeScript, CSS-Architektur, Build, Repository-/Dokumentations-/Release-Selbstprüfung und produktiver Dependency-Advisory-Scan. Protokolle liegen unter qa/v24-*.txt. Node 24.19.0, pnpm 10.17.1 auch für Unterprozesse über einen lokalen Corepack-Shim. Keine Dependency oder Lockfile geändert.

Der frühere GitHub-Stand 73cdcb85 bestand checks, echten PostgreSQL-Paralleltest, Build/HTTP-Gates, Scanner-Engine und CodeQL. Seine beiden Browserjobs scheiterten an überholten Dock-/Formular-Testannahmen; diese sind inzwischen geändert. Das ist keine Browser-Abnahme des neuen Quell-Fingerprints. Der neue CI-Lauf bleibt blockierend.

## Aktueller konsolidierter Stand

Massgeblicher Nachtrag: [consolidation-status.md](consolidation-status.md). Dieser enthält den aktuellen PR-/Main-Abgleich, alle 16 Auftragsabschnitte, verbleibende Implementierung und den neuen manuellen Deploy-/Full-QA-Ablauf. Frühere Aussagen zum automatischen Main-Deploy beschreiben die historische Baseline. Gesamtauftrag und Produktionsfreigabe bleiben offen.
