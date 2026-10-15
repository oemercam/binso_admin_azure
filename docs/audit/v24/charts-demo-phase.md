# V24 – KPI-/Diagramm- und isolierte Demo-Datenphase

## Zentrale Umsetzung

Die bestehende Statistics-Komponente verwendet jetzt MetricTiles/MetricTile aus derselben Foundation wie die übrigen Arbeitsbereiche. Höchstens vier Kennzahlen werden primär dargestellt; weitere Werte besitzen eine zugängliche Mehr-anzeigen-Steuerung. Keine neue UX-Foundation und keine zusätzliche Library.

Zeitreihen verwenden LineChart im bestehenden Statistik-Modul, mit gemeinsamer signierter Geometrie aus lib/statistics-period.ts, echter Nullachse, auswählbaren Datenpunkten und vollständigem horizontalem Hit-Testing. Negative Werte bleiben negativ. Ringe besitzen interaktive Segmente mit Klick/Touch, Enter/Leertaste, Fokus, Status-/Betragsausgabe und optionaler berechtigungsgeprüfter Detailaktion. Nullsegmente erzeugen keine unsichtbaren SVG-Tastaturziele.

Die zentrale Erstellen-Aktion hat eine reale 44px-Fläche. Nur eine erlaubte Quick-Create-Aktion öffnet unmittelbar. Der Quick-Create-Katalog übernimmt die Zielberechtigung, damit die unabhängig erlaubte Support-Aktion eines schreibgeschützten Mandanten nicht durch ein pauschales Seiten-Schreibrecht blockiert wird. Serverseitige Rechte bleiben unverändert.

## Verbindliche Finanzdefinitionen dieser Implementierung

| Kennzahl | Daten / Abgrenzung |
| --- | --- |
| Umsatz | Ausgestellte, nicht stornierte/archivierte Rechnungen abzüglich gebuchter Gutschriften; Belegdatum bzw. Gutschriftdatum; inkl. MWST; CHF im zentralen Finanzchart. Kein Zahlungseingang und kein Gewinn. |
| Zahlungseingänge | Zugeordnete, nicht archivierte Zahlungen; tatsächliches Zahlungsdatum. |
| Ausgaben-KPI / Auszahlungslinie | Nachgewiesene Erstattungen freigegebener/verbuchter Spesen; tatsächliches Erstattungsdatum in Europe/Zurich. Nicht als vollständige Erfolgsrechnung bezeichnet. |
| Offene Forderungen | Aktuell offener Rest nach Zahlungen und Gutschriften; unabhängig vom gewählten Zeitreihenzeitraum; sichtbarer Stichtag. |
| Überfällige Forderungen | Positiver offener Rest mit überschrittenem Fälligkeitsdatum am selben Stichtag. Vollständig ausgeglichene Beträge sind nie überfällig. |
| Ring bezahlt / offen / überfällig | Disjunkte Geldanteile des nach Gutschriften bereinigten Rechnungsvolumens: bereits zugeordneter Betrag, noch nicht überfälliger Rest, überfälliger Rest. Kein Ring aus Einnahmen plus Ausgaben. |
| Guthaben nach Gutschriften | Zahlung oberhalb des nach Gutschrift verbleibenden Rechnungsvolumens; gesonderte zusätzliche Kennzahl, keine negative Forderung. |

Die SQL-Eigentümer sind financialMetricsData und cashStatisticsData in lib/server/repositories/finance.ts. financialSummary verwendet dieselbe Definition für Kunden-/Währungsbestände und Jahresumsatz, statt eine zweite Formel zu behalten. Alle Aufrufer bleiben in bestehenden Tenant-/Permission-/Snapshot-Grenzen.

Nicht CHF-Währungen werden im globalen CHF-Chart nicht zusammengezählt. Finanzübersichten behalten ihre getrennten Währungsgruppen. Unbelegte Kosten-/Lohnzahlungen bleiben ausdrücklich als unvollständige Cash-Abdeckung gekennzeichnet.

## Drilldown

Die Überfällig-Detailaktion öffnet die bestehende Rechnungsliste mit einem whitelisted Statusfilter. Der zentrale Listencontroller übernimmt den Parameter vor gespeicherten Filtern, setzt die Seite zurück und entfernt den verbrauchten URL-Filter bei einer manuellen Filteränderung. Unbekannte Filter werden ignoriert.

Bezahlt-/Offen-Geldanteile dürfen nicht fälschlich als identische Dokumentstatus-Population dargestellt werden: Teilzahlungen tragen zum bezahlten Geldanteil bei, und der allgemeine Offen-Listenfilter umfasst auch Überfälliges. Diese beiden Segmente zeigen deshalb derzeit ihre Beträge ohne irreführenden Detail-Link. Die vollständige populationsgleiche Drilldown-Abnahme bleibt offen.

## Demo in PostgreSQL

Der vorhandene seedDatabaseDemo bleibt Eigentümer. Er kopiert jetzt auch bestehende Gutschriften und ergänzt ausschliesslich private, ausdrücklich is_demo-markierte Zielmandanten um zwölf abgeschlossene Kalendermonate mit stabilen Tenant-/Monats-/Szenario-IDs:

- Je Monat bezahlte, teilbezahlte und überfällige Rechnungen samt Positionen und exakt passenden Zahlungen.
- Rückläufige monatliche Beträge sowie mindestens drei negative Cash-Monate durch nachvollziehbar hohe, erstattete Demo-Auslagen.
- Projekt mit Stunden-/Kostenüberschreitung und negativem Stundendeckungsbeitrag, zugehörige Zeiten und Ausgaben.
- Aktuell offene und stornierte Rechnung, abgelehntes und abgelaufenes Angebot, Gutschrift nach Zahlung, inaktiver Kunde und lange offene Support-Anfrage.
- Keine erzwungenen ungültigen Status; bestehende FK-/RLS-/CHF-/MWST-Regeln werden verwendet.

Erneutes Seeding erzeugt keine Duplikate und verdrängt keine bestehenden Daten. Nicht-Demo-Ziele und die feste gemeinsame Vorlage sind als Schreibziele abgewiesen. Generierte Demo-Identitäten verwenden reservierte example.invalid-Adressen. Der Seed importiert weder Mail-/Stripe-/Webhook-Transport noch führt er DDL aus.

Ein expliziter POST auf /api/demo/session?reset=1 bzw. startDemoClientSession({reset:true}) erstellt eine neue private Demo statt produktive Daten zu löschen. Rate-/Origin-Prüfungen bleiben aktiv; fehlgeschlagene Provisionierung beendet die alte Demo nicht. Ein sichtbarer Reset-Einstieg samt Bestätigung/Dirty-Draft-Verhalten ist noch nicht abgenommen.

## Nachweise

- statistics-test: tatsächliche Ring-/Linien-Handler, signierte Koordinaten, Nullachse, negativer Wert, vier primäre KPIs und Disclosure; tatsächliche PostgreSQL-Abfragen in PGlite mit fremden Mandanten, Währungen, zukünftigen/archivierten/stornierten/Entwurfsbelegen, Teilzahlung und Gutschriften.
- migration-test: vollständiges bestehendes Schema; zwölf Monate/36 Szenariorechnungen; Zahlungsparität; mindestens drei negative Monate einschliesslich der vorhandenen Template-Einnahmen; Wiederholung unter binso_runtime mit ausgeschaltetem Plattformkontext; Fremdmandanten-/Vorlagenschutz.
- demo-session-test: tatsächlicher Handler mit isolierten Provider-Doubles; Resume/Reset, Origin/Rate-Limit, Fehler-Recovery, reservierte Adressen und Schutz produktiver Session-Cookies. Keine echte Nachricht/Zahlung.
- Bestehende Navigation-Referenztests bleiben unverändert und bestanden.
- Browser-Suite und Compliance-Messung sind auf den V24-Vertrag aktualisiert. Die alten Tests für Dock-Plus, Link statt Button und genau drei Finanz-KPIs wurden gezielt ersetzt; keine Pflichtprüfung deaktiviert.

## Offene Abnahme / Grenzen

V24 ist nicht abgeschlossen. Insbesondere offen: endgültige Chromium-/WebKit-Messungen und Screenshots dieses Commits, installierte iOS-/Android-PWA, vollständige Vereinheitlichung aller Statistikbereiche/Diagrammarten, vollständige Ausgaben-/Erfolgsrechnung, Gutschrift-/Rückerstattungs- und Mahnungsprozesse über alle Dokumentaktionen, vollständiges Demo-Reset-UI, ISO-/CIS-Volltextabdeckung sowie operative Azure-/Restore-/Mail-/Billing-Nachweise.

Wichtiges fachliches Restrisiko: Die neuen Finanzmetriken berücksichtigen Gutschriften, während der gesamte bestehende Rechnungs-/QR-/Zahlungs-/Mahnungsprozess noch auf konsistente Gutschriftverrechnung durchzuprüfen ist. Das ist ein Release-Blocker für eine vollständige Gutschrift-Freigabe; keine produktive Abnahme daraus ableiten.

Keine Produktivmigration, kein Deployment, kein Merge auf main, keine Infrastrukturänderung. Die historischen Baseline-Dateien bleiben unverändert als Baseline gekennzeichnet; der aktuelle Architektur-Generator bildet den neuen Quellstand ab.
