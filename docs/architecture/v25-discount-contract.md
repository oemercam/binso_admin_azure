# V25 Paket 4 — verbindlicher Rabatt- und Berechnungsvertrag

Stand: 22.10.2026. Fachvertrag für neue Angebote/Rechnungen und ausdrücklich
bearbeitbare Entwürfe; **keine implementierte Rabattfunktion**. Grundlage:
[Revision 7, Kapitel 5](../audit/v25-revision7/source.md), der Paket-4-Auftrag und
die bestehende Dokument-/Finanzarchitektur. Die konkreten Regeln dieses Vertrags
präzisieren die bisher offene Rabattbasis aus der [Paketplanung](../audit/v25-revision7/phase1-fast-mode.md).

## 1. Arten, Basis und Grenzen

| Ebene | Genau eine wirksame Auswahl | Bemessungsgrundlage |
| --- | --- | --- |
| Position | kein Rabatt, Prozent oder fixer Betrag | Menge × Nettoeinzelpreis der gesamten Position; fixer Betrag gilt einmal je Position, nicht je Mengeneinheit |
| Dokument | kein Rabatt, Prozent oder fixer Betrag | Summe der verbleibenden rabattfähigen Nettopositionen nach Positionsrabatten |

Positions- und Gesamtrabatt dürfen kombiniert werden; sie wirken nacheinander,
nicht als addierte Prozentsätze. Alle regulären Leistungspositionen einschliesslich
steuerbefreiter Positionen sind rabattfähig. Es gibt in diesem Vertrag keine
zusätzlichen Ausnahmen je Produkt oder Steuergruppe. Negative Korrekturpositionen
sind keine Rabattbasis; deren Einführung und Gutschriftregeln gehören nicht zu
diesem Paket. Ein Rabatt auf negative Mengen/Preise wird abgewiesen.

Prozentwerte: 0 bis 100 einschliesslich, höchstens zwei Nachkommastellen. Fixbeträge:
nichtnegativ, höchstens zwei Nachkommastellen, höchstens die exakte verbleibende
Basis. Kein Clamping, keine stillschweigende Eingaberundung, kein negativer
Positionsrest und kein negatives Dokumenttotal. Ungültige Werte oder zwei
gleichzeitig belegte Rabattarten sind ein verständlicher Validierungsfehler.
Bei Basis null sind nur kein Rabatt, fixe 0 oder ein Prozentwert 0–100 zulässig;
Rabattwirkung und Steuer sind dann null. Es erfolgt keine Division durch null.

CHF-Fixrabatte gelten nur auf CHF-Dokumenten. Bei anderer Dokumentwährung wird
ein Fixrabatt ausdrücklich in dieser Währung eingegeben und gespeichert. Eine
CHF-Vorgabe darf nicht als EUR-Betrag interpretiert werden. Ohne ausdrücklich
bestätigte Umrechnung kein Transfer; bei einer später unterstützten Umrechnung
sind Ursprungsbetrag/-währung, Kurs, Kursdatum und übernommener Dokumentbetrag zu
speichern. Kein automatischer Kursabruf oder neues FX-Verfahren ist freigegeben.
Ein Wechsel der Dokumentwährung erfordert eine sichtbare erneute Festlegung oder
Entfernung vorhandener Fixrabatte; der numerische Wert wird nicht still übernommen.

## 2. Verbindliche Reihenfolge und zentrale Rundung

Menge, Nettoeinzelpreis und Steuersatz verwenden die bestehende Präzision von
höchstens zwei Nachkommastellen. Für jede Position i gilt mit exakter Dezimalarithmetik:

1. Rohbasis `B_i = Menge_i × Einzelpreis_i` (Produkt darf mehr als zwei Dezimalstellen haben).
2. Positionsrabatt `L_i = B_i × Prozent_i / 100` oder fixer Positionsbetrag.
3. Positionsrest `N_i = B_i − L_i`; noch keine Cent-Rundung der Berechnungsbasis.
4. Dokumentbasis `B = Summe(N_i)`. Gesamtrabatt `D = B × Prozent / 100` oder Fixbetrag.
5. Bei `B > 0` exakte proportionale Zuteilung `D_i = D × N_i / B`;
   steuerliche Gruppen erhalten die Summe ihrer Anteile. Bei `B = 0`: alle Anteile null.
6. Rabattierte Steuerbasis `E_i = N_i − D_i`. Gruppe = gleicher Steuersatz **und**
   gleiche steuerliche Behandlung. Steuerbefreit und steuerpflichtig zu 0 % bleiben
   getrennt bezeichnet; auf steuerbefreite Positionen fällt keine Steuer an.
7. Exakte Gruppensteuer `T_g = Summe(E_i der Gruppe) × Steuersatz_g / 100`,
   bei Befreiung null. Netto `R(Summe(E_i))`, MwSt. `R(Summe(T_g))`;
   Dokumenttotal = diese beiden gerundeten Beträge addiert.

`R` ist die bestehende kaufmännische Rundung auf 0,01 der Dokumentwährung:
halbe Einheiten weg von null, entsprechend PostgreSQL `round(numeric, 2)` und
[lib/money.ts](../../lib/money.ts). **Keine automatische CHF-0,05-/Bargeldrundung.**
Keine vorzeitige Rundung von Produkten, Rabattanteilen oder Einzelsteuern.
Keine binären Floating-Point-Zwischenergebnisse: vorhandenen Decimal-/BigInt-Owner
erweitern und die bestehende SQL-Entsprechung synchron halten; periodische Anteile
als exakte Verhältnisse bis zur festgelegten Rundungsgrenze behandeln.
Mit allen Rabatten null müssen die bisherigen Dokumenttotale unverändert bleiben.

### Centgenaue Ausweise ohne zweite Berechnung

Proportionale Anteile werden intern exakt berechnet. Für die Rohbetragsausweise
werden positive Beträge zunächst auf volle Cents abgerundet, dann bis zur gerundeten
Rohsumme je ein Cent an die grössten Nachkommarestbeträge gegeben. Gleichstände:
persistierte Positionsreihenfolge, danach stabile Positions-ID; bei Gruppen erste
enthaltene Position. Steuergruppenausweise werden nach demselben Restverfahren
auf die Dokument-MwSt. abgeglichen. Steuerbefreite Gruppen erhalten niemals einen
Steuerrest.

Rohbasis, Positionsrabatt, Positionsrest und Gesamtrabatt-Abzug werden für die
Darstellung stufenweise abgeglichen: gerundete Rohsumme minus gerundete Summe der
Positionsreste = ausgewiesener Positionsrabatt; gerundete Summe der Positionsreste
minus Dokumentnetto = ausgewiesener Gesamtrabatt. Abweichungen gegenüber dem
isoliert gerundeten mathematischen Rabatt werden als **Rundungsausgleich** mit
Vorzeichen ausgewiesen, nicht versteckt in Preis, Prozentsatz oder Steuersatz.
Je Rabattstufe werden die so bestimmten Abzugs-Cents nach dem Restverfahren
proportional zu den exakten Rabattanteilen auf die Positionen verteilt, begrenzt
durch den jeweils angezeigten verfügbaren Positionsrest. Ausgeschöpfte Positionen
werden bei weiteren Rest-Cents übersprungen. Die nächste Nettostufe entsteht durch
Abzug dieser Ausweise; sie wird nicht noch einmal unabhängig auf Positionen verteilt.
So bleiben die Zeilenarithmetik und Dokumentzielsumme konsistent und kein
Positionsausweis negativ. Im Nullrabattfall wird kein Abzug verteilt.
Der Ausgleich ist reine Darstellung; er wird nie erneut besteuert oder abgezogen.
Ergebnis, Zuteilung und Ausgleich müssen in Editor, API, Listen, PDF und Auswertungen
identisch aus dem zentralen Resultat kommen. Separate Rundung jeder Zeilensteuer
oder jeder Steuergruppe ohne Summenabgleich ist ausdrücklich ausgeschlossen.

## 3. Kundenstandard und Übernahme

`customers.discount` bleibt der bestehende **prozentuale** Standard (0–100), kein
zusätzlicher Rabattkanal. Beim neuen Dokument wird er sichtbar als Gesamtrabatt
vorgeschlagen; keine unsichtbare Preisänderung. Vor Speichern sind Art, Wert und
Wirkung sichtbar, änderbar oder entfernbar. Der erste ausdrücklich gespeicherte
Dokumentstand übernimmt den sichtbaren Vorschlag in einen eigenen Snapshot.

Ein bereits expliziter Gesamtrabatt, einschliesslich ausdrücklich 0 oder «entfernt»,
hat Vorrang. Weder erneutes Laden noch Kundenauswahl, spätere Kundenänderung oder
ein geänderter Kundenstandard dürfen ihn überschreiben oder den Standard addieren.
Bei Kundenwechsel darf ein neuer Vorschlag nur nach sichtbarer ausdrücklicher
Übernahme einen bisherigen Wert ersetzen. Ein altes Dokument/Entwurf erhält durch
blosses Öffnen keinen Kundenrabatt. Änderungen brauchen eine bestätigte Bearbeitung
mit Vorschau; bestehende Rollen-, Mandanten- und Dokumentsperren bleiben erhalten.

Duplikat sowie Angebot → Rechnung übernehmen die dokumenteigenen Rabatte genau
einmal; keine erneute Anwendung des Kundenstandards auf bereits rabattierte Preise.
Originalpreise und Rabattdefinitionen bleiben getrennt gespeichert.

## 4. Fachliche Zahlenfälle und erwartete Ergebnisse

Alle Beträge in CHF; Preise netto. «Basis» bezeichnet den exakten Rest nach beiden
Rabattstufen, «Netto» dessen Dokumentrundung. 8,1 % und 2,6 % sind explizite
Test-Steuersätze, keine neue steuerrechtliche Einstufung. `—` bedeutet kein Rabatt.

| Fall | Eingabe / nachvollziehbare Rechnung | Netto | MwSt. | Total |
| --- | --- | ---: | ---: | ---: |
| Kein Rabatt | 2 × 500 = 1’000; Steuer 1’000 × 8,1 % | 1’000.00 | 81.00 | 1’081.00 |
| Position 10 % | 1’000 − 100 = 900 | 900.00 | 72.90 | 972.90 |
| Position CHF 50 | 1’000 − 50 = 950; nicht 2 × 50 Rabatt | 950.00 | 76.95 | 1’026.95 |
| Gesamt 5 % | 1’000 − 50 = 950 | 950.00 | 76.95 | 1’026.95 |
| Gesamt CHF 100 | 1’000 − 100 = 900 | 900.00 | 72.90 | 972.90 |
| Kombination | Position 10 %: 900; darauf Gesamt 5 % = 45; Basis 855; Steuer 69.255 | 855.00 | 69.26 | 924.26 |
| Gemischte Sätze | 600 zu 8,1 % + 400 zu 2,6 %; Gesamt 100 → Anteile 60/40; Basen 540/360; Steuer 43.74 + 9.36 | 900.00 | 53.10 | 953.10 |
| Mit Befreiung | 600 zu 8,1 % + 300 zu 2,6 % + 100 befreit; Gesamt 100 → 60/30/10; Basen 540/270/90; Steuer 43.74 + 7.02 + 0 | 900.00 | 50.76 | 950.76 |
| Nur befreit | 1’000 befreit; Gesamt 5 % → 950 | 950.00 | 0.00 | 950.00 |
| Produkt-Rundungsgrenze | 2 Positionen je 0.03 × 33.50 = 1.005; Summe 2.010; Steuer 2.010 × 8,1 % = 0.16281 | 2.01 | 0.16 | 2.17 |
| Halber Cent Rabatt | 1 × 0.01; Position 50 % → Rabatt 0.005, Basis 0.005; Steuer 0.000405 | 0.01 | 0.00 | 0.01 |
| Steuergruppen-Rundung | 0.05 zu 8,1 % + 0.15 zu 2,6 %; Steuer 0.00405 + 0.00390 = 0.00795 | 0.20 | 0.01 | 0.21 |
| Rabatt 0 % | Position 0 %, Gesamt 0 % auf 1’000 | 1’000.00 | 81.00 | 1’081.00 |
| Position 100 % | 1’000 − 1’000; weiterer Gesamt 5 % auf null | 0.00 | 0.00 | 0.00 |
| Gesamt 100 % | Position 10 % → 900; Gesamt 100 % → 0 | 0.00 | 0.00 | 0.00 |
| Fixbetrag gleich Basis | Position 10 % → 900; Gesamt CHF 900 | 0.00 | 0.00 | 0.00 |

Zusätzliche exakte Ausweiserwartungen:

- Produkt-Rundungsgrenze: Zeilennetto 1.01 / 1.00 nach stabilem Restverfahren;
  nicht 1.01 + 1.01. Das Originalprodukt bleibt intern zweimal 1.005.
- Halber Cent: mathematischer Rabatt 0.005, isoliert gerundet 0.01; ausgewiesener
  Abzug 0.00 und Rundungsausgleich +0.01 gegenüber diesem gerundeten Rabatt.
  Rohbetrag 0.01 − Rabatt 0.01 + Ausgleich 0.01 = Netto 0.01.
- Steuergruppen-Rundung: Ausweis 0.01 für 8,1 %, 0.00 für 2,6 %; kein zusätzliches
  Runden der Gruppen auf insgesamt 0.00.
- Gesamtrabatt-Verteilung: drei Positionen je CHF 1.00, Gesamt CHF 0.01 → intern
  je 1/3 Cent Rabatt; Abzugsausweis 0.01 / 0.00 / 0.00. Nettoausweise
  0.99 / 1.00 / 1.00, Summe 2.99; Steuer zu 8,1 %: 0.24219 → 0.24; Total 3.23.

| Negativ-/Bestandsfall | Erwartung |
| --- | --- |
| Prozent −1 oder 100.01; fixer Betrag −0.01 | Validierungsfehler, keine Speicherung/Ausstellung |
| Positionbasis 1’000, fix 1’000.01 | Fehler; Basis exakt vergleichen, nicht zuerst aufrunden |
| Nach Position 10 % verbleiben 900; Gesamt fix 900.01 | Fehler, auch wenn ursprüngliche Rohbasis 1’000 war |
| Basis 0.005; Fixrabatt 0.01 | Fehler trotz gerundetem Netto 0.01 |
| Positions- oder Gesamtrabatt gleichzeitig Prozent und fix | Fehler; keine Prioritätswahl und keine doppelte Anwendung |
| EUR-Dokument, Fixrabatt CHF 50 ohne bestätigte Umrechnung | Fehler; ausdrücklich EUR 50 erfasst ist dagegen EUR 50, keine Umrechnung |
| Kunde Standard 5 %, expliziter Gesamtrabatt 7 % auf 1’000 | Nur 70 Rabatt; Netto 930, MwSt. 75.33, Total 1’005.33 |
| Kunde Standard 5 %, ausdrücklich entfernt | Kein Rabatt; Total 1’081.00; Reload füllt 5 % nicht nach |
| Kundenstandard später 10 % statt 5 % | Bereits gespeichertes Dokument mit 5 % bleibt Netto 950, MwSt. 76.95, Total 1’026.95 |
| Ausgestellte Rechnung / versendete Angebotsversion | Beträge, Snapshot und archivierte PDF-Bytes/Hash unverändert; Bearbeitung/Rabattänderung verweigert |

Diese Beispiele sind fachliche Sollfälle, keine ausgeführten Anwendungstests.
Die 18 numerischen Fälle einschliesslich Verteilung und Kunden-Override wurden
mit Dezimalarithmetik und der bestehenden Rundungsart rechnerisch abgeglichen;
Dokumentlinks und Diff wurden geprüft. Spätere
Implementierung muss SQL-/Client-/PDF-Parität und bestehende Finanzsicherungen testen.

## 5. Auswirkungen auf Modelle, PDF und Bestand

Vorhandene Owner: [money.ts](../../lib/money.ts), [Dokument-SQL](../../lib/server/document-amount-sql.ts),
[Business-Repository](../../lib/server/repositories/business-api.ts), [PDF](../../lib/server/document-pdf.ts),
[Dokumentsnapshots](../../database/migrations/0045_document_snapshots.sql) und
[Versionierung](../../lib/server/offer-versions.ts). Keine zweite Berechnungsengine.

Spätere additive Modellerweiterung braucht je Position und Dokument einen
diskriminierten Rabatt (`none`/`percent`/`fixed`, Wert, bei fix Währung), expliziten
Übernahmestatus inklusive «entfernt», Herkunft des Vorschlags und versionierten
Berechnungsvertrag. Exakte Grundlagen, Rabattanteile, Steuerbehandlung/-gruppen,
gerundete Resultate und Rundungsausgleiche müssen reproduzierbar eingefroren werden.
Feldnamen/SQL-Migration sind noch nicht festgelegt oder implementiert. Die bisherige
Snapshot-`version` wird nicht stillschweigend als neue Berechnungsrevision umgedeutet.

PDF zeigt Originalpreis, Positionsrabatt (Art/Wert/Abzug), verbleibende Positionen,
Gesamtrabatt samt Basis, Steuergruppen/Befreiung, MwSt., Total und gegebenenfalls
Rundungsausgleich verständlich. Keine Rabattierung von Zahlungen/Gutschriften oder
erneute Rabattierung eines bereits rabattierten Saldos. Ein Total null erzwingt
keine Status-/Zahlungsänderung; bestehende Ausstellungs-/QR-Grenzen bleiben separat.

Keine Rückrechnung, Migration oder PDF-Neuerzeugung historischer Ausstellungen.
Bestehende Legacy-Dokumente ohne neue Berechnungsrevision bleiben im bisherigen
Vertrag. Neue Funktion gilt nur bei expliziter Erstellung/Bearbeitung berechtigter
Entwürfe. Änderungen an Entwurf/Positionen/Resultaten werden später unter den
bestehenden Transaktions-, Audit-, Replay-, Rollen- und Mandantengrenzen gespeichert.

## 6. Aufgelöste Unklarheiten und Abgrenzung

Die bisher offene Rabattreihenfolge ist entschieden. Der scheinbare Konflikt
«CHF-Rundung» gegen mögliche 5-Rappen-Rundung wird durch Beibehaltung der vorhandenen
0,01-Regel gelöst. Die bestehende aggregierte MwSt.-Rundung bleibt erhalten;
Steuergruppenausweise werden daran abgeglichen, nicht unabhängig aufsummiert.
Es bleibt kein fachlicher Widerspruch innerhalb dieses Umfangs offen.

Steuerbefreiungsgründe und gültige Steuersätze folgen der bestehenden steuerlichen
Konfiguration; dieser Vertrag trifft keine neue rechtliche Einstufung. Allgemeine
FX-Automation, Bargeldzahlung, negative Korrekturpositionen und neue Gutschriftlogik
sind nicht freigegeben. Paket 4 implementiert keine Berechnung, keine Migration,
keine Produktivdatenänderung und kein PDF-Rendering. Paket 5 bleibt separat.
