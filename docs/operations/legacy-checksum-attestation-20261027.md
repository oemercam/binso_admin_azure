# Kontrollierte Nachregistrierung historischer Migrationsprüfsummen

## Anlass und Nachweise

Deployment `40420290596` stoppte am 27. Oktober vor der Auslieferung, weil die
ersten 16 kanonischen Migrationen keine gespeicherte Prüfsumme haben. Seit
Commit `a7d60c475533c5bcd48e8c05b2411576821eeab9` vom 3. Oktober ließ der
Migrationsrunner solche historischen NULL-Einträge ausdrücklich zu. Der neue
vollständige Integritätscheck akzeptiert sie nicht mehr.

Der echte Point-in-Time-Restore vom 27. Oktober wurde gegen die aktive Datenbank
`binso_platform` geprüft (Restorepunkt `2026-10-27T06:43:31Z`). Über TLS waren
die zentralen Tabellen lesbar, alle 125 Tabellen entsprachen dem Schema-Vertrag,
alle 108 kanonischen Migrationen waren vorhanden und 92 Prüfsummen stimmten.
Genau 0001–0016 hatten NULL-Prüfsummen. Beide temporären Testserver sind gelöscht.
Die [technische Zusammenfassung](restore-technical-evidence-20261027.json) enthält
die ausgeführten Prüfergebnisse und den SHA256-Verweis auf den vollständigen Nachweis.
Workspace-Nachweise: `audit-20261026/restore-read-verification-20261027.json`,
`restore-test-20261027.json` und `Wiederherstellungstest-20261027.txt`.
Die separate ältere Preview-Datenbank wurde nicht als aktive Anwendung abgenommen.

Dies beweist den aktuellen Schema-Zustand, nicht die ursprünglich ausgeführten
SQL-Bytes oder alle historischen Datenänderungen. Deshalb wird die Ergänzung
als **heutige, ausdrücklich genehmigte Quellen-/Schema-Attestierung** dokumentiert.
Sie darf nicht als nachträglich wiedergefundene historische Prüfsumme gelten.

## Enge Korrekturgrenze

`legacy-checksum-attestation.mjs` plant standardmäßig nur lesend. Der Plan bindet
den exakten Quellen-Commit, Datenbanknamen, Akteur, vollständige Migrationstabelle,
bestehende Zeitstempel, Schema-Vertrag und genau 16 neue Prüfsummen. Das Apply
verlangt die SHA256 eines separat geprüften Plans und eine exakte Quellenfreigabe.

Der gemeinsame Migrationslock, eine Transaktion und eine Tabellensperre verhindern
konkurrierende Migrationsänderungen. Alle anderen 92 Prüfsummen müssen vorher
stimmen; der vollständige Schema-/RLS-/Policy-Vertrag muss passen. Unbekannte
historische Metadaten bleiben unverändert. Nur die fest benannten 16 NULL-Felder
werden gesetzt. Vor Commit werden sämtliche Prüfsummen erneut streng geprüft.
Jede Abweichung oder ein Teilfehler führt zum vollständigen Rollback.
Geschäftsdaten, SQL-Migrationsdateien, Rollen und RLS werden nicht geändert.
Ein bereits erfolgreich ausgeführter Plan kann nicht erneut angewendet werden.

## Durchführung

1. Änderung prüfen und mit exakter Quellen-SHA freigeben; bestehende Gates bleiben.
2. Auf Main den Workflow `Controlled legacy checksum attestation` mit
   `source_sha=<aktueller Main>` und `apply=false` starten. Vorhandene
   Production-Umgebungsfreigabe bleibt erforderlich.
3. `plan.json` und die protokollierte SHA256 prüfen. Genau 16 NULL-Änderungen,
   unveränderte restliche Prüfsummen, Datenbank `binso_platform` und Quellen-SHA
   bestätigen. Der Plan enthält keine Verbindungsdaten oder Kundeneinzelwerte.
4. Denselben Workflow mit derselben Quellen-SHA, `apply=true` und der geprüften
   `plan_sha256` ausführen. Das ist eine produktive Metadatenänderung und braucht
   deren ausdrückliche Freigabe; ein grüner Test allein erteilt sie nicht.
5. Plan und Transaktionsquittung aus dem GitHub-Artefakt sichern. Die temporäre
   Runner-Firewallregel wird auch bei Fehlern entfernt.
6. Nach erfolgreicher Nachregistrierung das vollständig qualifizierte Deployment
   erneut ausführen. Geänderte Quellen erfordern neue vollständige Qualification.

Keine Prüfsumme wird im normalen Migrationsrunner automatisch ergänzt. Die
bestehenden Integritäts- und Deployment-Gates bleiben unverändert streng.
Virenscanner und kostenpflichtige Infrastruktur sind nicht Teil dieser Korrektur.
