# V8 – verbleibende Integration der Abrechnungsmodelle

`lib/billing-model.ts` ist der gemeinsame typisierte Entwurfsvertrag, noch keine
aktivierte Abrechnungsfunktion. `scripts/billing-model-test.mjs` prüft diesen
Vertrag gegen unvollständige, mehrdeutige und fehlerhafte Eingaben. Die Freigabe
zur lokalen Umsetzung liegt vor; es ist keine weitere Fachfreigabe für dieses
beschriebene Paket einzuholen. Produktive Eingriffe bleiben separat gesperrt.

## Bestehende führende Stellen

- `lib/money.ts`: einzige exakte Betrags-/Rabatt-/Steuerberechnung.
- `lib/server/repositories/business-api.ts`: atomare Dokumentanlage/-änderung,
  Quellsperren, Positionen, Reservierungen, Audit und Idempotenz.
- `lib/server/document-process.ts`: Phasenübergänge und Ausstellung.
- `lib/server/offer-versions.ts`: historische Angebots-/Dokumentsnapshots.
- `lib/server/repositories/project-workspace.ts`: Auftragsversion und Bearbeitung.
- Vorhandene Zeit-/Minuten-/Spesenreservierungen behalten ihre Integritätsregeln.

## Noch nicht implementierte Grenzen

1. Versionierte, nach Freigabe unveränderliche Vereinbarungen mit erzwungener
   Mandanten-RLS. Ein angenommener Angebotsstand wird beim Auftrag übernommen,
   ohne einen zweiten abrechenbaren Leistungsumfang zu erfinden. Historische
   Belege ohne Modellzuordnung bleiben unverändert und ohne erfundene Zuordnung.
2. Eine gemeinsame Leistungsreferenz über Angebot, Auftrag und Rechnungen.
   Reservierungen konkurrierender Rechnungsentwürfe müssen dieselbe Referenz
   sperren. Eine Änderung der Auftragskonfiguration darf alte Rechnungen weder
   umpreisen noch nachträglich ungültig machen.
3. Phasenprüfung aus dem gespeicherten aktuellen Vereinbarungsstand. Fehlende
   Modellangaben im Request dürfen keine Beschränkung umgehen. Drafts dürfen
   unvollständig bleiben. Ausstellung benötigt gültige, unveränderliche Quellen.
4. Fixpreis-/Perioden-/Meilenstein-Kapazitäten aus den tatsächlich berechneten
   Nettobeträgen nach bestehenden Rabatten. Keine zweite Steuerberechnung,
   keine Umdeutung einer Anrechnung als Rabatt und keine erfundenen Negativzeilen.
5. Fixpreis, Wiederkehrend und Meilenstein dürfen interne Zeiten nicht zusätzlich
   automatisch fakturieren. Gemischt benötigt eine ausdrücklich vereinbarte
   Zusatzaufwandskomponente; vorhandene Freigabe-/Restminutenprüfungen bleiben.
6. Wiederkehrende Perioden werden an der ursprünglichen Kalendergrenze berechnet
   und eindeutig reserviert. Keine automatische Ausstellung. Meilensteine
   benötigen stabile IDs und explizite Erfüllung/Abrechenbarkeit.
7. Akonto, Teil- und Schlussrechnung benötigen eindeutige Referenzen, bestehende
   Preis-/Steuersnapshots und korrekte Restbeträge. Storno/Gutschrift dürfen eine
   bereits erbrachte Leistung nicht stillschweigend erneut abrechenbar machen.
   Unterschiedliche Währungen werden nicht verrechnet oder automatisch umgerechnet.
8. Gemeinsame UI-Auswahl in Angebot/Auftrag/Rechnung erst zusammen mit diesen
   serverseitigen Grenzen. Umfangreiche Editoren verwenden den zentralen FormPage-
   Owner; keine lediglich kosmetischen Auswahloptionen als fertige Funktion.

## Noch erforderliche Gegenfälle

Gleiche Quelle über Angebot und Auftrag, zwei konkurrierende Entwürfe, wiederholte
Requests, veraltete Revision, fremder Mandant, fehlende Rolle/Zuweisung, Nur-Lesen,
unvollständiger Entwurf, Währungswechsel, ausgeschöpfte Kapazität, Zeitraum doppelt,
Meilenstein unerfüllt, verlorener Audit-Write, verworfener Entwurf, nachträgliche
Quelländerung, historischer Beleg und Gutschrift/Storno. Die vorhandenen exakten
Finanz-/Zeitreservierungstests müssen weiterhin bestehen. PGlite ersetzt keinen
nativen Test überlappender PostgreSQL-Transaktionen oder fachliche Rechtsabnahme.
