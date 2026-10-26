# Binso One – Performance-Optimierung vom 26. Oktober 2026

Die Code-Optimierung ist lokal implementiert und geprüft. Beim deutschen Login sinkt das anfängliche JavaScript von 460,0 auf 218,7 kB gzip, also um 52,5 %. Die Übertragung von HTML und deklarierten Startdateien sinkt von 558,2 auf 318,7 kB, also um 42,9 %. Das ist eine gemessene Datenersparnis, keine behauptete Verkürzung der sichtbaren Browserladezeit.

Implementierung: f632a928eae774e057c97531f97f970e00c16d99. Build-ID: dn_rsZD4AixiROCLPBffD. Das geprüfte Artefakt enthält die Quellen dieses lokalen Code-Commits; kein Push oder Deployment wurde durchgeführt.

## Änderungen

- Die vollständigen fünfsprachigen Kataloge werden aus dem Client-Importgraphen entfernt. Die gewählte Sprache wird beim ersten Server-Render direkt an den bestehenden LocaleProvider übergeben. Deutsche Standardtexte und die bisherigen Korrekturen/Pluralformen bleiben verfügbar.
- Andere Sprachen liegen in separaten, beim Build generierten Dateien. Sie werden erst bei einem Wechsel geladen. Alle Dateien werden aus den kanonischen Quellen abgeleitet; es gibt keine unabhängig gepflegten Parallelübersetzungen.
- Während eines Downloads bleibt die bisherige Sprache sichtbar. Wechsel übernehmen Sprache und Übersetzungen zusammen. Gleichzeitige Wechsel, fehlgeschlagene Downloads, erneute Versuche und spätere Antworten sind abgesichert.
- Bereits geladene Sprachen und die initial mitgelieferte Sprache werden wiederverwendet. Übersetzungsfunktionen und Pluralregeln werden pro aktivem Katalog wiederverwendet.
- Ein Benutzerwechsel während des Downloads verhindert, dass die alte Absicht in das neue Konto geschrieben wird. Benutzertexte, Dokumentberechnungen, Zugriffskontrollen und Sitzungsgrenzen bleiben bei ihren bisherigen Besitzern.
- Öffentliche Schriftdateien erhalten wie die Markenressourcen einen Tag Browsercache und anschliessende Hintergrundvalidierung. Private Seiten/API-Antworten bleiben no-store.
- Eine transitive Prüfung aller Client-Einstiege verhindert, dass der gesamte Server-Katalog versehentlich wieder in den Browser gelangt. Die Messung kann ausserdem ein JavaScript-Budget prüfen.

## Vergleich unter denselben lokalen HTTP-Bedingungen

Produktionsbuild über Loopback, gzip, je 20 wiederholte Anfragen pro URL. Die Datenmengen beziehen sich auf den ersten Aufruf der jeweiligen Route für moderne Browser. Legacy-nomodule-Skripte, Bilder, dynamische Folgeimporte und spätere API-Anfragen sind nicht enthalten. Serverseitige Zeitwerte sind wegen Laufzeitrauschen und anderer Bedingungen keine Aussage über die sichtbare Ladezeit auf Mobilfunk.

| Route | JavaScript vorher | JavaScript nachher | Weniger JavaScript | HTML und deklarierte Startdateien |
| --- | --- | --- | --- | --- |
| / | 453,3 kB | 211,9 kB | 53,3 % | 555,3 → 315,7 kB |
| /login | 460,0 kB | 218,7 kB | 52,5 % | 558,2 → 318,7 kB |
| /registrieren | 463,9 kB | 222,5 kB | 52,0 % | 561,6 → 322,1 kB |
| /preise | 453,4 kB | 212,0 kB | 53,2 % | 553,7 → 314,1 kB |
| /produkt | 453,4 kB | 211,9 kB | 53,3 % | 553,8 → 314,2 kB |

Zusätzlich wurden die Login-Aufrufe mit EN/FR/IT/TR einzeln geprüft. Die erste ausgelieferte HTML-Überschrift entspricht jeweils der gewählten Sprache; es ist kein Nachladen erforderlich, um sie richtig darzustellen. Alle neun gemessenen URLs bleiben unter dem geprüften Budget von 300 kB anfänglich deklariertem JavaScript gzip. Fremdsprachige Kataloge erhöhen die HTML/RSC-Nutzlast, weil genau die gewählte Sprache mitgeliefert wird; dieser Transfer ist im jeweiligen Rohwert enthalten.

## Präzisierung der ersten Live-Messung

Die ursprüngliche Messung startete für jede Anfrage einen neuen curl-Prozess. Dabei gingen Verbindungsaufbau und TLS in die ungefähr sieben Sekunden bis zur ersten Antwort ein. Die Folgemessung verwendet einen Prozess und wiederverwendete HTTP/2-Verbindungen:

| Route | Neue Verbindungen | TLS bis abgeschlossen | Bis erste Antwort | Nach bereitstehender Verbindung |
| --- | --- | --- | --- | --- |
| /api/health | 1 | 7144 ms | 8014 ms | 869 ms |
| /login | 0 | 0 ms | 243 ms | 242.5 ms |
| /brand/icon-black.svg | 0 | 0 ms | 198 ms | 198.4 ms |
| /api/health | 0 | 0 ms | 202 ms | 201.8 ms |
| /login | 0 | 0 ms | 348 ms | 347.5 ms |
| /brand/icon-black.svg | 0 | 0 ms | 416 ms | 415.9 ms |
| /api/health | 0 | 0 ms | 207 ms | 206.7 ms |
| /login | 0 | 0 ms | 220 ms | 219.7 ms |
| /brand/icon-black.svg | 0 | 0 ms | 180 ms | 179.9 ms |

Mit wiederverwendeter Verbindung benötigt der Login in dieser Stichprobe etwa 220–348 ms bis zur ersten Antwort. Die lange TLS-Phase der ersten Anfrage stammt aus dem gesamten Netzwerk-/Proxyweg dieser Ausführungsumgebung und darf nicht ausschliesslich Azure oder der App zugeschrieben werden. Die Zahlen rechtfertigen keine ungeprüften Hosting-/TLS-Änderungen. Die Live-Seite enthält laut vorheriger Health-Prüfung weiterhin den älteren Stand cddc57f; sie wurde durch diesen Auftrag nicht verändert.

## Ausgeführte Prüfungen

Erfolgreich: Produktionsbuild einschliesslich TypeScript, fokussiertes ESLint, vollständiger Vergleich der kanonischen Texte in allen fünf Sprachen, Plural-/Template-/Whitespace-/Nutzerdaten-Parität, tatsächlicher Provider und Chunk-Loader bei Erfolgs-/Fehler-/Nebenläufigkeitsfällen, Initialdaten-/Cache-Wiederverwendung, Kontowechsel vor Sprachspeicherung, Katalog-Generierungsprüfung und transitive Client-Importgrenze.

Ebenfalls erfolgreich: bestehende Localization-Coverage, Sitzungs-/Logout-, Query-/Navigations-, Scroll-Rückkehr-, Startup-/PWA-Übergangs-, PDF-/QR-/Dokument-, UI-/Navigations-Foundation-, Workspace-, Consent-/Telemetry-, Cache-Build-, Runtime-/QA-Plan-, Architektur- und UX-Vertragsprüfungen. Keine Gate-Abschwächung und keine neue visuelle Baseline.

Die finale HTTP-Messung wurde mit folgendem Aufruf erfolgreich ausgeführt:

```bash
node scripts/performance-measure.mjs --all-locales --budget-kb 300 --output docs/audit/performance/20261026-optimized.json
```

Verbindungsdiagnose, nur öffentliche Leseanfragen:

```bash
node scripts/performance-live-diagnostic.mjs --base https://binso-admin-prod-asctesfvhnd5b6ay.switzerlandnorth-01.azurewebsites.net --output docs/audit/performance/20261026-live-connection.json
```

## Offene Abnahme

Nicht ausgeführt: echte Browser-Ladezeitmessungen des geänderten lokalen Builds, LCP/INP/CLS, angemeldete produktive Geschäftsdaten und iPhone/4G. Der vorhandene lokale Playwright-Browser fehlte; der offizielle Browserdownload lieferte ein unvollständiges Archiv und konnte nicht eingerichtet werden. Der Cloud-Browser konnte die ältere veröffentlichte Anmeldung darstellen, bietet hier aber kein auslesbares Navigation-/Paint-Timing. Das ersetzt keine Interaktions- oder Geräteabnahme der lokalen Änderung.

Rohdaten: [vorher](20261026-local.json), [nachher](20261026-optimized.json), [Live-Verbindungsdiagnose](20261026-live-connection.json).
