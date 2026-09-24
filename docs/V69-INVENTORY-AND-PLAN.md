# V69 – Bestandsaufnahme und Umsetzungsplan

Datum: 24.09.2026. Ausgangspunkt: bestehender main-Checkout, unveränderte Arbeitskopie; Umsetzung auf `v69-production-completion`.

## Tatsächliche Architektur

Next.js App Router, React 19, Node 24 und pnpm 10.17.1. Kein ORM; PostgreSQL über `pg`, SQL-Migrationen 0001–0007. Easy Auth liefert die Identität, Memberships die Organisationsrolle. Stripe wird über HTTP angesprochen. Graph ist bisher nur an Einladungen angebunden. Gemeinsame Navigation, Overlay-Komponenten und Provider bedienen Desktop, Mobile und PWA.

Geschäftsmodule: Firmen, Kontakte, Angebote, Aufträge, Verträge, Zeiten/Nachweise, Mitarbeitende/Lieferanten, Rechnungen, Zahlungen, Gutschriften, Spesen, Finanzen, Buchhaltung, Einstellungen, Organisation, Konto, Daten und Betreiberbereich. Geschäftsregeln liegen teils in `modules`, überwiegend im grossen Client-BusinessStore. Produktive Persistenz ist ein versioniertes JSON-Dokument pro Organisation; relationale Fachtabellen sind nicht die kanonische Quelle dieser Module. Die Dokumentation darf das nicht als vollständige relationale Facharchitektur darstellen.

## Befunde vor Umsetzung

| Bereich | Befund / Risiko |
| --- | --- |
| Tenant-State | GET gibt kompletten Zustand aus, PUT prüft Membership, aber keine Fachberechtigungen. Initiales Insert kann konkurrieren. Client-Audit vertraut Actor/Zeit aus dem Browser. |
| Client-Persistenz | Nach 409 wird nur die Version aktualisiert: späteres Speichern kann neuere Änderungen überschreiben. |
| Auth | Easy-Auth-Claims werden unscharf gesucht; Plattformrollen nur aus userRoles. Vertrauensgrenze des Azure-Headers muss extern abgesichert sein. |
| Memberships | Seat-Zählung und letzter Owner nicht organisationsweit serialisiert; Admin kann bestehende Owner verändern. |
| Stripe | Ein fehlgeschlagenes Event ist dauerhaft als Duplikat registriert. Keine Absicherung gegen vertauschte Ereignisse; Invoice-Fehler kann neueren Status zurücksetzen. |
| Mail | Einladungen senden synchron, ohne dauerhafte Warteschlange. Dokumente markieren nur Versand. Graph 202 ist Annahme, kein Zustellnachweis. |
| Jobs | Nur Trial-Ablauf; Vertragsrechnungen und Mahnungen sind Browseraktionen. Kein Job-Verlauf. |
| Dateien | Kein produktiver Dateispeicher, keine Upload-/Download-Autorisierung. |
| Betreiber | Tenant-/Planänderung und aggregierter Health vorhanden; keine zentrale Einsicht in Job-/Versandfehler. |
| Import/Export | CSV zerlegt mehrzeilige Felder; Formel-Injection beim Export; unbeschränkte Dateigrösse und schwache Zahlenprüfung. |
| Dokumente | Browserdruck vorhanden; kein serverseitiges PDF oder validierter Swiss-QR-Zahlteil. |
| UI | Mail-/Payroll-Optionen suggerieren Fähigkeiten, die nicht angebunden sind. Demoseeds und alte Patchdateien sind weiterhin vorhanden. |
| Deployment | Standalone mit dereferenzierten pnpm-Abhängigkeiten vorhanden. Kein HTTP-Smoke-Test des Artefakts; automatischer main-Deploy; npm-Lockfile parallel vorhanden. |
| Prüfungen | Viele Checks sind Text-/Strukturprüfungen, keine Integrationstests. Vorhandene fachliche Core-Tests fehlen im verify-Gate. |

## Reihenfolge und Abnahme

1. Autoritative Rollen, Feld-/Datensatzschutz, serialisierte Speicherung, serverseitiger Audit und Konfliktstopp.
2. Membership-Sperren, robuste Auth-Auswertung, begrenzte Requests, Stripe-Wiederholung und Statusabgleich.
3. Dauerhafte Dokumentversand-Warteschlange mit Graph-Annahme-/Fehlerstatus, Scheduler für Vertragsentwürfe und Mahnungen, Betriebsprotokoll. Keine Nachricht während der Entwicklung versenden.
4. Mandantengebundene Speichervorbereitung, Betreiber-Betriebsübersicht, Gesundheitsprüfungen und sichere Deployment-Gates.
5. CSV-Härtung, neutrale Voreinstellungen, Kennzeichnung tatsächlich noch nicht unterstützter Optionen, Swiss-QR-Vorbereitung ohne Konformitätsbehauptung.
6. Alle angeforderten Befehle ausführen, Fehler beheben, gesamten Diff reviewen, externe Abnahme und Migrationen dokumentieren.

Bestehende Fachmodule und UI-Struktur bleiben erhalten. Keine Production-Migration, kein Deployment und kein Push. Provider-, Datenbank- und Browser-End-to-End-Abnahme sind getrennt von lokalem Build/Tests auszuweisen; ein grüner Build beweist keine Produktionsreife.
