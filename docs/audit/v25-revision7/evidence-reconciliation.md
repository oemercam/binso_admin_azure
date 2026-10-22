# Quellstandgebundene Abschlussbewertung

Stand: 22.10.2026. Alle nachfolgend genannten Läufe wurden anhand der tatsächlichen
GitHub-Run-Metadaten dem jeweiligen Head zugeordnet. Originalquelle Revision7:
SHA256 `23bc8bffd954cabb0b265a723e9fde2a713ad42d4e7150a5cb2765c7c367a363`.

| Quellstand | Tatsächlicher Nachweis | Verwendbarkeit |
| --- | --- | --- |
| `7bc770a43bc3215ae5dba956dbb617c56d391c5c` | [Full Development39691829176](https://github.com/oemercam/binso_admin_azure/actions/runs/39691829176), erfolgreich; [Originalreport-Zusammenfassung](ci-7bc770a4.json) | Archiv, keine Freigabe später geänderter Quellen |
| `a9b7e1fcdd0920fa9cb636ca535bdf9a96a2ebb6` | [Quality39697355253](https://github.com/oemercam/binso_admin_azure/actions/runs/39697355253), [CodeQL39697355232](https://github.com/oemercam/binso_admin_azure/actions/runs/39697355232), [Full Development39697429990](https://github.com/oemercam/binso_admin_azure/actions/runs/39697429990): erfolgreich | Neuester vollständig qualifizierter historischer Ausgangsstand; [hashgeprüfte Report-Zusammenfassung](ci-a9b7e1fc.json) |
| Folgeänderungen einschliesslich braces-Korrektur | Gezielte aktuelle lokale Nachweise in [Sicherheitsbehebung](security-braces.md) | Neue Commit-CI erforderlich; nicht durch ältere grüne Läufe abgedeckt |

Zwischen7bc unda9b wurden unter anderem Übersetzungsgrenzen, gemeinsame Formatierung,
Desktop-Header und die Bindung der Compliance-Klauseln korrigiert. Die Source-Digests
unterscheiden sich: `531208287c85b06261cd261cd3a2c8d004e188e0e687fce43e4ea4ef34e54856`
gegen `88a381177c3dd1c6c79ae677ce64518df7d2b68c48d80064877b337fb626b43d`.
Ergebnisse dürfen nicht zwischen diesen Quellen zusammenkopiert werden.

Der a9b-Originalreport wurde vor Übernahme seines Inhalts gegen SHA256
`501dfb8ada411219bda017efb7451fdadb876d0ea4453dd819821427ede1b510` geprüft.
Er enthält6825 Messdatensätze,76 von78 Routen und613 aktive Einträge:573 Klauseln
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
