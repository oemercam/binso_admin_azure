# Binso One – Kundendaten-Export und endgültige Löschung

Stand: 5. Oktober 2026

## Grundsatz
Kundendaten werden nicht über einen ungeschützten Self-Service-Endpunkt vollständig gelöscht. Export und endgültige Löschung sind kontrollierte Betreiberprozesse mit expliziten Freigaben.

## Export
Voraussetzungen:
- direkter administrativer Zugriff auf die produktive PostgreSQL-Datenbank,
- ein lokales, verschlüsseltes und nicht im Repository liegendes Zielverzeichnis,
- die UUID der betroffenen Organisation.

Beispiel:

```bash
export DATABASE_URL='...'
export BINSO_ORGANIZATION_ID='<uuid>'
export BINSO_EXPORT_DIR='/secure/binso-exports'
pnpm data:export
```

Der Export:
- läuft in einer PostgreSQL-`REPEATABLE READ`-Transaktion und verwendet dadurch einen konsistenten Snapshot,
- ermittelt alle Tabellen mit `organization_id`,
- exportiert die Datensätze mandantenbezogen,
- ergänzt die zugehörigen `app_users`,
- entfernt Authentifizierungsgeheimnisse, Passwort-Hashes, Tokens und Recovery-Material aus dem Export,
- erzeugt ein Manifest mit Tabellen- und Datensatzanzahlen,
- schreibt Dateien mit restriktiven Dateirechten.

Der Export darf niemals in GitHub Actions Logs, normale Support-Tickets oder unverschlüsselte Cloud-Ordner kopiert werden.

## Endgültige Löschung
Vor der endgültigen Löschung müssen alle folgenden Bedingungen erfüllt sein:

1. Export wurde erstellt, geprüft und sicher übergeben bzw. archiviert.
2. Organisation ist in Binso One auf `archived` gesetzt.
3. Es besteht kein aktives, laufendes oder im Trial befindliches Abonnement.
4. Die Organisation-ID wurde nochmals unabhängig geprüft.
5. Gesetzliche Aufbewahrungspflichten wurden beurteilt.
6. Falls externe Azure-Blob-Objekte vorhanden sind, wurden diese anhand des gesicherten Exports kontrolliert gelöscht.

Ausführung:

```bash
export DATABASE_URL='...'
export BINSO_ORGANIZATION_ID='<uuid>'
export BINSO_DELETE_CONFIRM='<dieselbe uuid>'
export BINSO_DELETE_EXPORT_CONFIRMED='true'
export BINSO_EXTERNAL_BLOBS_PURGE_CONFIRMED='true' # nur setzen, wenn externe Blobs tatsächlich gelöscht wurden
export BINSO_EXPORT_DIR='/secure/binso-exports'
pnpm data:delete
```

Die Löschung läuft in einer Datenbanktransaktion. Direkte organisationsbezogene Tabellen mit restriktiven Fremdschlüsseln werden innerhalb derselben Transaktion kontrolliert vorgelöscht; Cascades übernehmen die übrigen Abhängigkeiten. Anschliessend wird geprüft, dass keine mandantenbezogenen Zeilen verbleiben. Bei jedem Fehler wird die gesamte Transaktion zurückgerollt, damit kein teilweise gelöschter Mandant entsteht.

## Dateien / Blob Storage
Aktuell in PostgreSQL gespeicherte Datei-Inhalte werden durch die Tenant-Cascade mit entfernt. Falls ein Datensatz auf externen Azure Blob Storage verweist, blockiert das Löschtool die Datenbanklöschung, bis die externe Blob-Bereinigung explizit mit `BINSO_EXTERNAL_BLOBS_PURGE_CONFIRMED=true` bestätigt wurde. Blob-URLs werden nicht in CI-/Konsolenlogs ausgegeben.

## E2E-Abnahmetest vor Go-live
Mit einer eigens dafür angelegten Testorganisation durchführen:

1. Kunde, Mitarbeiter, Rechnung, Zahlung, Zeit, Spese, Supportfall und Datei anlegen.
2. Export erstellen.
3. Manifest und Stichproben aus allen Kategorien prüfen.
4. Testorganisation archivieren und allfälliges Testabonnement beenden.
5. Endgültige Löschung mit den beiden Bestätigungsvariablen ausführen.
6. Datenbank prüfen: keine Zeile mit dieser `organization_id` darf mehr vorhanden sein.
7. Prüfen, dass andere Testorganisationen vollständig unverändert geblieben sind.
8. Allfällige externe Blob-Objekte kontrollieren.
9. Ergebnis mit Datum, ausführender Person und Testorganisation dokumentieren.
