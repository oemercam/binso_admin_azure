# Temporäre Berichtskopien — Ablauf und vorbereitete physische Bereinigung

`report_exports` enthält abgeleitete PDF-Kopien, keine ausgestellten Rechnungs-
oder Angebotsoriginale. Die bestehende Gültigkeit ist sieben Tage. Zugriff nach
Ablauf war bereits gesperrt; die bisherige Wartung bereinigte jedoch nur
Authentifizierungsartefakte, nicht diese PDF-Bytes und zugehörige Freigabecodes.

## Vorbereiteter Ablauf

Das bestehende `retention-cleanup.mjs` kann nach gesonderter Betriebskonfiguration
auch abgelaufene Berichtskopien bereinigen. Es gibt keine neue Identität, Rolle,
Schreib-API, Federation oder ungeschützte Wartungsroute.

- `REPORT_SNAPSHOT_RETENTION_ORGANIZATION_IDS`: explizite, geprüfte UUID-Liste,
  maximal1000 Mandanten, dedupliziert. Standard leer: neue Bereinigung deaktiviert.
- Jeder Mandant erhält eine eigene Transaktion mit bestehender RLS; keine
  mandantenweite Suche und kein Bypass. Ein tatsächlich ausgeliehener DB-Client
  bleibt bis Commit/Rollback derselbe.
- Der bestehende `RETENTION_DRY_RUN` gilt ebenfalls. Trockenlauf liest nur die
  Anzahl abgelaufener Kopien und rollt den lesenden Kontext zurück.
- Pro Mandant maximal200 Kopien im Standardbatch. `FOR UPDATE SKIP LOCKED`
  begrenzt konkurrierende Arbeit; verbleibende abgelaufene Kopien werden ausdrücklich
  gezählt. Wiederholte Läufe löschen keinen aktiven Bericht.
- Löschen nur bei `expires_at<=now()`. Vorhandene FK-Cascades entfernen abgelaufene
  Freigabelinks und Empfängercodes. Geschäftsdokumente und Mailhistorie bleiben erhalten.
- Audit und Batch-Löschung sind atomar. Auditfehler: kein abgeschlossener Batch.
  Ausgabe nur aggregierte Zähler, keine IDs, Empfänger, Tokens oder PDF-Inhalte.
- Migration0076 ergänzt nur einen passenden Index, keine Berechtigung.

## Tatsächliche lokale Nachweise

Der bestehende `data-lifecycle-schema-test.mjs` führt nun den echten
`report-retention-contract.mjs` gegen alle Migrationen und `binso_runtime` aus.
Bestanden: lesender Trockenlauf ohne Byteverlust, Ablaufgrenze und Batchlimit,
offener Restbestand, vollständiger Folge-Batch und leerer Replay, unveränderte
aktive/eigene und nicht konfigurierte fremde Kopien, tatsächliche Link-/Code-Cascade,
erhaltene Mailhistorie sowie vollständiger Rollback bei Auditfehler. Gezieltes ESLint
und Syntaxprüfung bestanden. Es wurde keine produktive Bereinigung ausgeführt.

## Konkrete verbleibende Betriebsfreigabe

Der geschützte Production-Wartungsworkflow wurde nicht verändert und exportiert
die neue Scope-Liste noch nicht. Nötig sind eine separate Freigabe der Zielmandanten
und der expliziten Environment-Zuordnung sowie zunächst ein geprüfter echter
Trockenlauf mit der vorhandenen Wartungsidentität. Falls diese bestehende Identität
die erforderlichen Operationen nicht erlaubt, muss der Lauf blockieren; dieses
Paket legt keine neuen Rechte an. Eine vollständig automatische Ermittlung aller
heutigen und zukünftigen Mandanten ist damit ausdrücklich noch nicht eingerichtet.
Auch Änderungen an Wartungskonfiguration, produktiver Indexmigration und tatsächlicher
Bereinigung sind nicht aus einer Codeprüfung als freigegeben abzuleiten.
