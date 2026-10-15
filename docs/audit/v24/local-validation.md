# Lokale Validierung – 15.10.2026

## Nachgewiesene Ursachen

1. Unix-Socket: minimaler `node:net`-Server auf `/tmp/binso-local-diagnostic.sock` scheitert beim `listen` mit `EPERM`. TCP auf explizitem `127.0.0.1` und dynamischem Port funktioniert. Dies ist keine nachgewiesene Störung des Scanner-Produktcodes. Echter Engine-Job in GitHub-Lauf 38773637661 erfolgreich.
2. HTTP: der frühere getrennte Prüflauf erhielt `ECONNREFUSED`. Gemeinsamer Prozess-Lifecycle von Next-Server und Prüfer mit explizitem Loopback-Host funktioniert. Keine HTTP-/Proxy-Sicherheitskontrolle deaktiviert.
3. Browserdownload: HEAD auf die von Playwright verlangte Downloadadresse liefert HTTP 200, `content-type: text/html`, `content-length: 195`, statt Browserarchiv. Installation kann damit nicht erfolgreich sein. Kein Browser vorhanden; lokale Browserprüfung weiter blockiert. Netzfreigaben oder Laufzeitinstallation müssen von der Umgebung bereitgestellt werden; keine Umgehung vorgenommen.

## Umsetzung

`pnpm qa:local:http` startet nach vorhandenem Produktionsbuild einen eigenen Server auf einem freien Loopback-Port, wartet auf dessen Ready-Signal und erfolgreiche Login-Antwort, führt die vorhandene Route-/CSS-Prüfung aus und räumt den Server bei Erfolg/Fehler/Signal auf. Es verbindet sich nicht absichtlich mit einem fremden bereits laufenden Server. Neue Skriptprüfung per ESLint bestanden. Default-Tests und CI-Releasegates bleiben unverändert.

## Ergebnisse

- `pnpm qa:local:http`: bestanden; 57 Routen, fünf Stylesheets, Demo-Flow und Initial-Theme-Prüfungen.
- Vollständige Testsuite mit explizitem `BINSO_FILE_SCAN_PROTOCOL_TEST_TRANSPORT=memory`: bestanden. Der bereits vorhandene In-Memory-Testadapter prüft das echte Protokollmodul gegen kontrollierte Duplex-Peers. **Zusätzliche Diagnose, kein Bestehen des vorgeschriebenen echten Unix-Socket-/Engine-Gates.** Kein Standardtest entfernt oder automatisch auf Ersatztransport umgestellt.
- Echtes unverändertes lokales `pnpm test`: Socket weiterhin blockiert. GitHub führt weiterhin die echten Tests aus.
- `foundation-integration-test`: nach abschliessender Regenerierung des Inventars bestanden. Der in CI gefundene veraltete Source-Fingerprint ist korrigiert, nicht als Umgebungsproblem eingeordnet.
- Lokale Browser-/Pixelprüfung und reale Geräte weiterhin offen. Kein produktiver Deploy oder Infrastrukturwechsel.

## Gebündelte GitHub-Browserprüfung

Head `a2a06c6615c68df2adc22c0a9f91a2c131fcbd38`, Quality 38774822114: echte Testsuite, Build und Scanner erfolgreich. Chromium und WebKit installieren/starten erfolgreich; beide erreichen dieselbe Rückerstattungsregression und scheitern am exakten Einzeltext-Selektor. Der vorhandene `<p>` enthält Datum, Betrag und Begründung gemeinsam. Korrektur beschränkt die Suche auf den Historieneintrag unter „Rückerstattungen“ und prüft zusätzlich Datum, Betrag und Einmaligkeit. Keine Produktlogik/Produktdarstellung geändert; keine Assertion entfernt. Lint und aktualisiertes Architekturinventar bestanden. Korrigierter Browsernachweis ausstehend.

Zweiter Browserlauf 38776614916: Rückerstattungsprüfung überschritten; Chromium scheitert später im Support-Ring des Operator-Dashboards an einem ebenfalls veralteten Testvertrag (`img` statt vorhandenem `group`, alter Output ohne Label). Selektor und erwarteter Output auf die zentrale interaktive RingChart-Semantik korrigiert; Tastaturauswahl eines echten Segments zusätzlich geprüft. Bestehende Statistik-/Komponenten-/PostgreSQL-Metriktests und Architekturprüfung bestanden. Keine Chart-Produktänderung, kein Referenzbild neu freigegeben. Neuer Browserlauf erforderlich.
