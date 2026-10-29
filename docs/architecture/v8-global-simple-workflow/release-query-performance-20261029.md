# Release-Korrektur: Dokument-Vorgängerabfrage, 29. Oktober 2026

## Nachgewiesener Blocker

PR #330 bestand auf `15acf65357a95c94cdd37b864cc9d2e53910f7aa` vollständig.
Der Merge `dd53c44408d2d15ef779c4fe954fe8616a5daf78` besitzt denselben Git-Dateibaum.
Seine manuelle Release-Prüfung 40802507012 scheiterte jedoch erneut beim echten
HTTP-GET `/api/documents` als Firmeninhaber am unveränderten 15-Sekunden-Limit.
Die vorausgehende Messung zeigte aktive SQL-Verarbeitung ohne blockierende
Transaktionen. Der tatsächlich erfasste Plan schätzte Kosten 522.2 / zwei Zeilen;
ein JIT-Plan war darin nicht ausgewiesen. Das ist kein Beleg für einen Lock oder
eine Browser-/CORS-Ursache.

## Eng begrenzte Korrektur

Rechnungen ohne direkte Abrechnungsvereinbarung **und** ohne sichtbaren
Vereinbarungsbereich können keine Vorgänger über eine Vereinbarung haben.
Die Abfrage gibt für genau diesen Fall das unveränderte leere JSON-Array zurück,
ohne die korrelierten Scope-Ansichten wiederholt zu verbinden. Bei direkter
Vereinbarung oder vorhandenen Sammelrechnungsbereichen läuft dieselbe bisherige
Vorgängerabfrage weiter. RLS, API-Berechtigungen, Filter, Sortierung, Summen,
Steuern, Berechnungsengine, Budgets und Migrationen wurden nicht geändert.

## Tatsächliche Gegenprüfungen

Die Originalabfrage wurde aus dem freigegebenen Repository-Stand erzeugt und
gegen den vollständigen SQL-Text des fehlgeschlagenen CI-Laufs verglichen.
Die neue Abfrage wurde aus derselben tatsächlichen Repository-Funktion erzeugt.
Beide liefen lesend in einem identischen Transaktionssnapshot über denselben
ausschliesslich synthetischen Datenbestand. Alle zurückgegebenen Felder waren
in jeweils 16 Rollen-/Mandantenkontexten unverändert:

| Umgebung | Ausführung vorher | Ausführung nachher | Leere Vorgänger-Gruppierungen vorher / nachher |
| --- | --- | --- | --- |
| Isoliertes PostgreSQL 18 unter Windows | 513.688 ms | 91.794 ms | 74 / 0 |
| Derselbe synthetische Bestand unter Linux/PostgreSQL 18.6, zwei CPUs | 311.097 ms | 57.328 ms | 74 / 0 |

Diese SQL-Messungen sind keine HTTP-Lastmessung und keine Produktionsmessung.
Die Linux-Testkopie ist kein produktiver Azure-Wiederherstellungsnachweis.
Belege ausserhalb des Checkouts: `v8-readiness-20261028/predecessor-query-comparison.json`
und `predecessor-query-comparison-linux.json`, jeweils mit vollständigen Plänen,
Rollenzeiten und Query-Prüfsummen.

Die gezielte Registrierungs-/Fachintegration endet mit Exit 0
(`predecessor-guard-registration.log`): Eine direkte Teil-/Schlussrechnung behält
ihren 40er-Vorgänger; eine Sammelschlussrechnung ohne primäre Einzelvereinbarung
behält den Vorgänger aus zwei Vereinbarungsbereichen mit insgesamt 120, genau
einmal. Bestehende sechs Modelle, Akontos, Rabatte, gemischte Steuern, Rundungen,
Rollen und Fremdmandanten-Negativfälle bleiben aktiv. Der native HTTP-Vertrag
prüft zusätzlich das leere Vorgängerfeld alter Rechnungen.

Typprüfung, Lint und Build enden jeweils mit Exit 0. Der echte native HTTP-Vertrag
gegen den neu gebauten Server und eine frische Linux/PostgreSQL-18-Instanz endet
ebenfalls mit Exit 0 (`predecessor-guard-native-http.log`): zwei Mandanten, direkte
IDs, alle acht Rollen, Vertrags-/Rabattmutationen, parallele Revisionen, tatsächlicher
Sitzungsablauf und unveränderte Fehlergrenzen. Erfolgreiche Dokumentlisten lagen
in den erfassten Beispielen bei 77–141 ms. Die 15-Sekunden-Grenze blieb unverändert.

Der getrennte Azure-Backup-Konfigurationslauf 40802850811 ist erfolgreich:
Server Ready, sieben Tage Aufbewahrung, Geo-Redundanz Disabled. Er war ausschliesslich
lesend und ist kein Wiederherstellungs- oder Datenintegritätsnachweis.

## Freigabe und noch offene Nachweise

Der neue Quellstand benötigt erneut exakte Freigabe und grüne GitHub-/Release-Gates.
Der frühere Release-Lauf bleibt rot; die Ursache gilt erst nach erfolgreicher
nativer HTTP- und Release-Gegenprüfung dieses Standes als technisch geschlossen.
Keine produktive Migration oder Azure-Bereitstellung wurde ausgeführt.

Die vollständige neue Migrationsliste gegenüber der zuletzt laufenden Version
`f0b01b727204965555c57bfcf1eb74113b6ec7fd` lautet **0109–0113**:
Budget-Präsenz, gemeinsame Abrechnungsvereinbarungen, Einheiten-Erweiterung,
Sammelrechnungen und variable Akonto-Anwendungen. Frühere Freigabefragen nannten
unvollständig nur 0111–0113. Vor produktiver Ausführung ist die korrigierte
vollständige Freigabe erforderlich, einschliesslich der darin enthaltenen
eng begrenzten Tabellenrechte und der separat bestätigten Rechte auf die beiden
neuen Scope-/Akonto-Tabellen und Scope-Ansichten. Keine neuen Dienste, kein
Scanner und keine administrative oder RLS-umgehende Runtime-Rolle.

Echte E-Mail-, Safari-/iPhone-/iPad-/PWA- und betriebliche Abnahmen bleiben offen.
