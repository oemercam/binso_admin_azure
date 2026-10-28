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

## Weiterer GitHub-Gegenlauf

Auf Commit 16a9bca7 bestanden Build, native HTTP-/PostgreSQL-Prüfung, vollständige
Pflichtprogramme, Sicherheitsanalyse, beide Avatar-Browser, Rabatt-/Rechnungsprüfung
und die zusätzliche Responsive-Stichprobe. Die breite Browsermatrix meldete noch
einen unzutreffenden Header-Vertrag: Vorschauen unterdrücken ihren App-Header
absichtlich, aktive Erfassungsseiten dürfen einen Titel ohne Headeraktionen haben.
Der zentrale Test unterscheidet diese Zustände nun ausdrücklich: Vorschauheader
muss verborgen sein; eine aktive Erfassung ohne Headeraktionen muss ein sichtbares
Formular mit sichtbaren Bedienelementen besitzen. Alle vorhandenen Headeraktionen
behalten die unveränderte 44-Pixel-Mindestprüfung. Die zwölf gezielten Erfassungs-/
Vorschaufälle bestanden lokal in Chromium und WebKit.

Die wiederholte GitHub-Zeitüberschreitung der Dokumentliste ist nicht als ursächlich
behoben zu deklarieren: Windows- und Linux-PostgreSQL 18.6 sowie ein späterer
GitHub-Lauf bestanden; frühere Läufe scheiterten nach 15 Sekunden. Eine Messung
zeigte aktive Verarbeitung ohne blockierende Transaktion. Die nur im isolierten
Testserver geladene SQL-Sonde erhält unveränderte Zeitlimits und erfasst bei einem
erneuten langsamen Aufruf den tatsächlichen SQL-Plan. Diese Einschränkung bleibt
im abschliessenden Release-Nachweis sichtbar.

Auf Stand 4361d9e0 bestanden erneut Build/native HTTP-Prüfung und die vollständigen
Pflichtprogramme. Die breitere Browsersteuerung deckte danach dieselbe fehlende
Fixture-Verknüpfung für neu erstellte Kunden auf: Der gespeicherte Replay-Datensatz
wurde im Detail-GET bisher nicht gefunden. Der Detail-GET verwendet nun den
tatsächlich zuvor erstellten synthetischen Kunden aus demselben Replay-Speicher.
Die Warte-, Fehler-, Wiederholungs- und Doppelanlageprüfungen bleiben unverändert.
Der gezielte Kundenablauf besteht mit dieser Korrektur in Chromium und WebKit
(customer-created-{chromium,webkit}.log, jeweils Exit 0).
Im abgeschlossenen GitHub-Lauf 40746218475 waren beide funktionalen Browsergruppen,
vier der sechs breiten Seitenmatrixgruppen, Build, Pflichtprogramme, Sicherheit,
Avatar, Rabatt/Rechnungsprüfung und UX-Compliance grün. Nur die beiden Gruppen mit
dem oben nachgewiesenen Kunden-Fixture-Fehler und damit der Quality-Aggregator
waren rot. Diese Ergebnisse werden nicht rückwirkend als bestanden umgeschrieben.

## Bestehende produktive Runtime-Rolle

Die Freigabe von Migrationen allein installiert noch keine Objektrechte für eine
bereits vorhandene Runtime-Rolle. `provision-runtime-role.sql` ist ausdrücklich für
neue Rollen vorgesehen und setzt keine Standardrechte für zukünftige Tabellen.
Der manuelle Deployment-Workflow bietet deshalb eine separate, standardmässig
ausgeschaltete Option `apply_v8_runtime_grants`. Nur bei ausdrücklicher Zustimmung
für den konkreten Commit führt er nach den Migrationen das vorhandene
`database/operations/grant-v8-billing-completion.sql` aus, vor Runtime-Validierung
und App-Deployment. Keine Rollen-Neuanlage, Eigentumsänderung oder RLS-Umgehung.

Geprüft wurden tatsächliche SQL-Rechte, idempotente Wiederholung, fehlender Zugriff
auf eine fremde Tabelle, unveränderte Rollenflags, weiter erzwungene RLS sowie die
Abweisung einer BYPASSRLS-Rolle. Die Gegenprüfung besteht mit PGlite und nativem
PostgreSQL 18 in einer leeren, getrennten Loopback-Testdatenbank. Belege:
`v8-grants-workflow-test.log` und `v8-grants-native.log` im externen Nachweisordner.
Der YAML-Vertrag prüft Default-false, False/True-Fälle, verifiziertes TLS und die
Reihenfolge nach Migration und vor Runtime-Validierung. Produktiv nicht ausgeführt;
eine neue genaue Freigabe muss diese gesonderten Objektrechte ausdrücklich umfassen.
