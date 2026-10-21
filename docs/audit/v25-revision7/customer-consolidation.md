# Kontrolliertes Kundenzusammenführen — Revision 7

Bezug: R7-32-002. Dies ist ein begrenztes Implementierungspaket, keine
Gesamtabnahme aller 56 Kapitel und keine Produktionsmigrationsfreigabe.

## Verhalten und Grenzen

- Nur Owner/Admin mit bestehenden Kunden-Lese-, Schreib- und Löschrechten,
  aktivem Kundenmodul und frischer sitzungsgebundener Bestätigung.
- Zwei aktive Datensätze desselben Mandanten; übereinstimmende normalisierte
  UID, E-Mail oder Name. Widersprüchliche UID oder Kundentypen blockieren.
- Vorschau mit genauer Zieldaten-Erhaltung, Ergänzungen, Kontakt-/Aktivitätszahl
  und Sperrgründen. Die Bestätigung bindet den vollständigen geprüften Zustand.
- Nur bislang geschäftlich unbenutzte Dubletten mit eindeutiger Herkunft.
  Rechnungen, Angebote, Aufträge, Zeiten, Zuordnungen, Dateien und andere
  Fremdschlüssel oder alte polymorphe Verknüpfungen blockieren den Vorgang.
  Historische Belege und Berechtigungen werden nicht umgeschrieben.
- Bestehende nichtleere Zieldaten bleiben erhalten. Kontakte und Aktivitäten
  behalten ihre IDs; eine vorhandene primäre Zielkontaktperson hat Vorrang.
- Der Quellkunde bleibt mit seinen ursprünglichen Angaben archiviert und mit
  dem Ziel verknüpft. Keine einzelne Wiederherstellung oder Zusammenführungskette.
  Alte Dossierlinks werden nur bei weiterhin berechtigtem, aktivem Ziel umgeleitet.
- Transaktion, Audit und unveränderlicher Zusammenführungsbeleg gehören zusammen.
  Datenbankwächter verhindern neue Verknüpfungen auf die zusammengeführte Quelle.
- Gleiche Anfragekennung liefert das gespeicherte Ergebnis. Bei unklarer Antwort
  zuerst Status prüfen, kein automatischer neuer Schreibversuch. Abbrechen sperrt
  denselben noch nicht abgeschlossenen Vorgang; es rollt keinen Abschluss zurück.
- Gemeinsames FormSheet, DirectorySelect, Feld-, Listen-, Status- und Fehler-Owner;
  vier Anwendungssprachen. Keine neue CSS-, Icon- oder Navigationsfoundation.

## Tatsächlich ausgeführte Prüfungen

- `migration-test.mjs` mit vollständig migrierter isolierter Datenbank und
  tatsächlichem Repository/API: Rollen, Read-only, Mandantentrennung unter
  `binso_runtime`, frische Bestätigung, unbestätigte/ungültige API-Anfragen,
  Zieldatenerhaltung, Kontakte/Aktivitäten, Wiederholung und Abbruch,
  veraltete Vorschau, UID-Konflikt, Rechnungsverknüpfung, Wiederherstellungssperre,
  neue Rechnungsverknüpfung und alte Dossierlinks: bestanden.
- `client-session-test.mjs`: fehlerhafte oder fremde Ergebnisquittungen melden
  keinen Erfolg und veröffentlichen kein Mutationsereignis; bestätigte Ergebnisse
  veröffentlichen den tatsächlichen Abschluss: bestanden.
- Gezieltes ESLint, Typecheck, Übersetzungsabdeckung und bestehender
  Datenlebenszyklus-Schematest: bestanden vor den zuletzt ergänzten CI-Hilfen;
  abschliessende Prüfung des Paketstands bleibt erforderlich.

## Noch auszuführen

- Echte PostgreSQL-Parallelprüfung: gleiche Kennung, konkurrierende Ziele,
  Abbruch gegen Abschluss und gleichzeitiges Anlegen eines Geschäftsbelegs.
  `customer-merge-concurrency-contract.mjs` ist in der bestehenden CI registriert.
- Browserprüfung Hell/Dunkel, 390/1440px, Chromium/WebKit: explizite Vorschau,
  Bestätigung, unklare Antwort, Statusabfrage ohne Mutation und identischer
  Abbruchschlüssel. `customer-merge-browser-test.mjs` ist registriert.
- Vollständiger visueller Referenzvergleich und reale Geräte sind offen.
- Kunden mit bestehender Geschäftsnutzung werden absichtlich nicht automatisch
  zusammengeführt. Ein weitergehender fachlicher Übertragungsprozess ist damit
  nicht implementiert oder abgenommen.

## Qualifizierter Vorgängerstand

Commit `c237999f693287348c45cda1beb6a11ab1776b25`: Quality und CodeQL erfolgreich;
[vollständige Entwicklungsprüfung 39681144599](https://github.com/oemercam/binso_admin_azure/actions/runs/39681144599)
einschliesslich aller acht Browserjobs erfolgreich. Diese Nachweise qualifizieren
den Vorgängerstand, nicht die danach ergänzte Kundenzusammenführung.
