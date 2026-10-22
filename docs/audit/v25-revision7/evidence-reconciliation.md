# Quellstandgebundene Abschlussbewertung

Stand: 22.10.2026. Alle nachfolgend genannten Läufe wurden anhand der tatsächlichen
GitHub-Run-Metadaten dem jeweiligen Head zugeordnet. Originalquelle Revision7:
SHA256 `23bc8bffd954cabb0b265a723e9fde2a713ad42d4e7150a5cb2765c7c367a363`.

| Quellstand | Tatsächlicher Nachweis | Verwendbarkeit |
| --- | --- | --- |
| `7bc770a43bc3215ae5dba956dbb617c56d391c5c` | [Full Development39691829176](https://github.com/oemercam/binso_admin_azure/actions/runs/39691829176), erfolgreich; [Originalreport-Zusammenfassung](ci-7bc770a4.json) | Archiv, keine Freigabe später geänderter Quellen |
| `a9b7e1fcdd0920fa9cb636ca535bdf9a96a2ebb6` | [Quality39697355253](https://github.com/oemercam/binso_admin_azure/actions/runs/39697355253), [CodeQL39697355232](https://github.com/oemercam/binso_admin_azure/actions/runs/39697355232), [Full Development39697429990](https://github.com/oemercam/binso_admin_azure/actions/runs/39697429990): erfolgreich | Neuester vollständig qualifizierter historischer Ausgangsstand; [hashgeprüfte Report-Zusammenfassung](ci-a9b7e1fc.json) |
| `1567eff4cf42830d58098be95022c73adeef1723` | [Full Development39726655822](https://github.com/oemercam/binso_admin_azure/actions/runs/39726655822), PR-Quality39726546798 und CodeQL39726546806 erfolgreich | Aktuelle Codequalifikation einschliesslich Überzahlung/Status/Ladezustand; [Originalreport](ci-1567eff4.json), keine573-Klausel-Freigabe |

Zwischen7bc unda9b wurden unter anderem Übersetzungsgrenzen, gemeinsame Formatierung,
Desktop-Header und die Bindung der Compliance-Klauseln korrigiert. Die Source-Digests
unterscheiden sich: `531208287c85b06261cd261cd3a2c8d004e188e0e687fce43e4ea4ef34e54856`
gegen `88a381177c3dd1c6c79ae677ce64518df7d2b68c48d80064877b337fb626b43d`.
Ergebnisse dürfen nicht zwischen diesen Quellen zusammenkopiert werden.

Der a9b-Originalreport wurde vor Übernahme seines Inhalts gegen SHA256
`501dfb8ada411219bda017efb7451fdadb876d0ea4453dd819821427ede1b510` geprüft.
Sein Original-Markdown zählt6001 akzeptierte Messdateien. Die6825 Routen-Zuordnungen
verweisen auf5993 unterschiedliche zugeordnete Dateien; geteilte Messungen werden
mehreren passenden Routen zugeordnet. Er enthält76 von78 Routen und613 aktive Einträge:573 Klauseln
plus40 technische Verträge.8 passed,21 partial,580 review-required,3 not-tested,
1 manual-required,0 fehlgeschlagene Checks. `compliant:false` bleibt bestehen.
Die zwei nicht vermessenen Routen sind `/dev/ux-lab` und `/operator/wallboard`;
ein separater funktionaler Wallboard-Test ersetzt nicht sämtliche visuellen Fälle.
Rollen und Sprache sind keine vollständigen Dimensionen dieser Messdatensätze.

Der Development-Gate-Status ist keine Produktions- oder573-Klausel-Abnahme.
Die5588 geplanten Rollen-/Zustandsfälle sind ebenfalls keine ausgeführten Tests.
Das Register trennt deshalb `implementationStatus` von `acceptanceStatus`:
`ungeprueft` bedeutet weder fehlende Implementierung noch erfolgreiche Abnahme.
Ein quellhashgebundener Teilnachweis bleibt `teilweise_belegt`, bis alle Pflichten
der jeweiligen zusammengesetzten Klausel nachgewiesen sind.

## Geschlossene Lücke der Quellidentität

Die bisherige Sammlung band Anwendung, Tests und ausgewählte Verträge, aber nicht
direkt alle Migrationen, Betriebs-SQL, Patchdateien und Workflow-/Root-Konfigurationen.
Ein ausschliesslich dort geänderter Stand durfte deshalb nicht über denselben
Fingerprint mit früheren Nachweisen bewertet werden. Die zentrale Identität bindet
diese tatsächlichen Git-Quellen nun ebenfalls, einschliesslich `proxy.ts`, der
verbindlichen Anweisungen und des Originalreferenzpakets. Das V2-Protokoll ist
ausdrücklich von der bisherigen Hashfolge getrennt; ältere Digests werden nicht
nachträglich umgedeutet oder manuell ersetzt.

Positive/negative Prüfungen laufen sowohl auf den tatsächlichen Repositorypfaden
als auch in einem isolierten Git-Repository mit mehr als1MiB generierten
Evidence-Pfaden. Schema-, Rechte-, Patch-, Workflow- und Konfigurationsänderungen
ändern den Digest vor und nach Staging. Ergebnisarchive bleiben ausgeschlossen;
die normative573-Klausel-Projektion bleibt gebunden. Gefälschte Klauseln,
Prioritätsänderungen und veränderte Originalbytes bleiben ausdrücklich Fehler.
Diese verbesserten Messregeln erteilen weiterhin keine fachliche Freigabe.

## Historische Zwischenqualifikation d052a3be

Code-Commit `d052a3be539a0cf358f550a54eecb33e7c0451f2`, V2-CI-/Git-Blob-Digest
`dddf66c6b614d9bd077720f3f3d70329de69714c46446f394accaf932eea3e19`:
PR-Quality39715765343 und CodeQL39715765346 sind erfolgreich. Die separate
vollständige Development-Prüfung39715830625 ist ebenfalls erfolgreich, einschliesslich
aller acht Browserjobs und des abschliessenden Quality-Gates. Die [Report-Zusammenfassung](ci-d052a3be.json)
enthält die tatsächlich geprüften ZIP-/Report-Hashes, Messzahlen und weiterhin offenen Freigaben.
Der vorherige Lauf39713295626 auf `d11a847b` ist fehlgeschlagen, seine grünen
Teiljobs ersetzen die neue Gesamtprüfung nicht. Die isolierte Testrollenvorbereitung
und die falsche Angebots-Datumsprojektion wurden gezielt korrigiert, nicht übersprungen.

Der damalige native Checks-Job119619903410 besteht einschliesslich sechs physisch
paralleler Reminder-Verarbeiter, Rollen-/RLS-Gegenfällen und vollständigem Audit.
Nachträgliche reine Ergebnis-/Reviewnotizen ändern den Source-Digest nicht. Diese
Quellgleichheit wird tatsächlich berechnet; ein Dokumentations-Head ist deshalb
nicht stillschweigend derselbe Commit wie der geprüfte Code-Head.

Die lokale Rohbyte-Identität lautet abweichend
`9190cf3c0091660bb7fff418ee9b7c4c57e7e7bcafb8e97d6e2c165bebcaa77e`.
69 bestehende lokale Dateien enthalten CRLF, ihre eingecheckten Git-Blobs LF.
[Der konkrete Vergleich](ci-d052a3be-source.json) liest alle865 relevanten Git-Blobs,
reproduziert daraus exakt den CI-Digest und weist für jede abweichende Datei
ausschliesslich CRLF→LF bei ansonsten identischen Bytes nach. Keine andere
Inhaltsabweichung wurde akzeptiert. Die unveränderten Originalbytes der Revision7
bleiben separat geprüft. Keine pauschale Normalisierung, keine Massenänderung der
Dateien, kein manuell eingesetzter Hash und keine Aufweichung des CI-Gates.

## Aktueller geprüfter Folgequellstand1567eff4

Der neue Full-Lauf ist vollständig erfolgreich. Der Originalreport nennt6001
akzeptierte Messdateien,6825 Routen-Zuordnungen zu5993 unterschiedlichen Dateien,
76/78 Routen,613 Einträge und keine fehlgeschlagenen Checks.573 Klauseln bleiben
individuelle Review-Pflichten; compliant:false und productionAcceptance:false.

Der [Git-Blob-Abgleich](ci-1567eff4-source.json) bindet alle868 relevanten Dateien
an exakt e9fe648a99886d78bd8c3f600f54132a2ca31ca10476e61cbf85e59a437e1df6.
Die69 älteren lokalen CRLF/LF-Unterschiede sind einzeln belegt, andere
Inhaltsunterschiede:0. Der ursprüngliche Revision7-Quellhash bleibt unverändert.
ZIP- und Report-SHA sowie Run/Artefakt sind in [ci-1567eff4.json](ci-1567eff4.json)
festgehalten. Fehlgeschlagene Zwischenstände bleiben historische Fehlversuche;
keine Messungen daraus werden in die aktuelle Freigabe kopiert.
