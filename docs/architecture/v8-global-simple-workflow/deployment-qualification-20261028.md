# V8 Deployment-Qualifikation – 28. Oktober 2026

Der Eigentümer hat PR #330 zur Bereitstellung für echte Abnahme auf der vorhandenen
produktiven Azure-App freigegeben, einschliesslich Migrationen 0111–0113, jeweils
nach grünen Pflichtprüfungen und für den ausdrücklich genehmigten Commit.
Keine Aktivierung des Scanners oder neuer kostenpflichtiger Dienste.
Die vollständige Produktionsabnahme bleibt getrennt und offen.

## Zusätzliche GitHub-Gegenprüfung

Die früheren lokalen Exit-0-Nachweise aus quality-rsc-20261028.md bleiben
historisch korrekt. Sie waren jedoch kein Nachweis für sämtliche zusätzlichen
GitHub-Workflows und den vollständigen GitHub-Browserplan dieses Releases.
Der Lauf 40730401382 auf dem PR-Testmerge endete mit Fehlern; kein Deployment.

| Ursache | Nachgewiesene Korrektur, ausschliesslich Tests |
| --- | --- |
| Isolierter Rechnungs-Test ohne MutationObserver und sichtbare Elementgeometrie | Browseradapter ergänzt; zusätzliche Observer-Lifecycle-Assertions; lokal PGlite Exit 0 und GitHub native Rechnungsprüfung 40730401285 erfolgreich |
| Avatar-Test erwartete Dialog für bereits vorhandene FormPage | Präzise benannte Region statt Dialog; weiterhin alle Upload-/Crop-/Fehler-/Persistenzprüfungen |
| WebKit drückte End vor Aktivierung der Crop-Regler | Auf drei tatsächlich aktivierte Regler und geladenes Bild warten; Tastatur-Assertions unverändert. Unabhängiges natives Range-Minimalmodell besteht in beiden Engines; kein pauschaler WebKit-Ausschluss |
| PDF-Belegziel war ein nur lokal vorhandener Audit-Ordner | Bestehenden isolierten temporären PDF-Ordner verwenden; echte PDF-/Steuer-/Rabatt-Assertions bleiben erhalten |
| App-Header auf öffentlichen Seiten verlangt | App-Header-Vertrag an vorhandene AppShell binden; keine Änderung von Geometrie-Assertions. Öffentliche Seiten bleiben Teil der Route-/Layoutprüfung |
| Angelegter synthetischer Auftrag hatte keine Detailantwort | Detail-Fixture aus tatsächlich zuvor erstelltem Replay-Datensatz liefern; unveränderte Bereitschafts-, Wiederholungs- und Doppelanlageprüfungen |

Anwendungscode, Berechnungen, Budgets, Authentifizierung, Navigation und Migrationen
wurden für diese Testkorrekturen nicht verändert. Fehlerlogs bleiben erhalten.
Lokale Gegenbelege unter `v8-readiness-20261028/`: readiness-adapter-test.log,
document-presentation.log, avatar-{chromium,webkit}.log,
header-scope-{chromium,webkit}.log, time-diagnostic-{chromium,webkit}.log.
Diese Pfade liegen ausserhalb des Checkouts und werden nicht als GitHub-Belege
ausgegeben. Verbindliche endgültige GitHub-Resultate sind den tatsächlichen
Workflow-Läufen des freigegebenen finalen Commits zu entnehmen.

Ein Abnahme-Deployment ist keine bestandene reale E-Mail-, Geräte-, Wiederherstellungs-
oder Betriebsprüfung. Siehe release-readiness-device-acceptance.md. Ein neuer Commit
benötigt die genaue Freigabe vor Veröffentlichung; rote Gates werden nicht umgangen.
