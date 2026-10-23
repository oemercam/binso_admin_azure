# BINSO ONE – FINANZANALYSE UX FINAL V1
## Verbindliche Implementierung nach freigegebener interaktiver Referenz

**Projekt:** Binso One  
**Repository:** `oemercam/binso_admin_azure`  
**Grundlage:** Global UX Master V4 und freigegebene interaktive Finanzanalyse-Vorschau.

## 1. Ziel

Optimiere die bestehende Finanzanalyse exakt nach der freigegebenen kompakten Darstellung.

Keine eigenständige Neugestaltung und keine neuen Finanzfunktionen entwickeln.

Verwende ausschliesslich die tatsächlich vorhandenen Finanzdaten, Services und zentralen UX-Komponenten.

Die Umsetzung gilt für Kunden-App und entsprechende Finanzanalysen der Admin-App, soweit die fachlichen Kennzahlen übereinstimmen.

## 2. Globaler Header

Mobile/PWA:
- Seitentitel «Finanzanalyse» links.
- Rechts Suche, Benachrichtigungen und Avatar.
- Kein Drei-Punkte-Menü.
- Keine vierte Header-Aktion.
- Keine doppelte Seitenüberschrift.

Bestehende Bottom-Navigation und blauen Floating-Plus-Button unverändert lassen.

## 3. Zeitraum und Werkzeugleiste

Direkt unter dem Header eine kompakte Steuerungszeile.

Links:
- Aktueller Zeitraum, beispielsweise «Oktober 2026».
- Chevron zum Öffnen der Zeitraumwahl.

Rechts:
- Einheitliches Schieberegler-Icon für tatsächlich vorhandene Analysewerkzeuge.
- Rechtsbündig an derselben Position wie auf anderen Fachseiten.

Mobile:
- Zeitraumwahl über das zentrale Bottom Sheet.

Desktop:
- Bestehende kompakte Zeitraumsteuerung beziehungsweise Popover.

Der Zeitraum muss sämtliche zugehörigen Finanzkennzahlen und Vergleichswerte konsistent steuern.

Keine doppelten Datumszeilen.

Keine funktionslosen Werkzeugmenüs.

## 4. Vier kompakte KPI-Karten

Darstellung in dieser Reihenfolge:

1. Einnahmen
2. Ausgaben
3. Saldo
4. Offen

Mobile: zwei Spalten.

Desktop: vier Spalten bei ausreichender Breite.

Jede Karte enthält ausschliesslich:
- Kurze Bezeichnung oben links.
- Kleine prozentuale Veränderung oben rechts, sofern berechenbar.
- Grossen Betrag darunter.
- CHF kompakt neben dem Betrag.

Keine zusätzlichen Beschreibungen.

Einheitliche Kartenhöhe, Rundung, Innenabstände und Typografie.

### Prozenttrends

- Einnahmen steigen: grundsätzlich grün.
- Ausgaben steigen: grundsätzlich rot.
- Saldo steigt: bei positivem fachlichem Ergebnis grün.
- Offene Forderungen sinken: grundsätzlich grün.
- Fachlich negative Entwicklungen rot.
- Nicht eindeutig bewertbare Veränderungen neutral.

Vergleiche den ausgewählten Zeitraum mit dem entsprechenden vorherigen Zeitraum.

Keine erfundenen Prozentwerte.

Bei fehlender Vergleichsbasis oder Vorperiodenwert null keine Prozentzahl anzeigen.

## 5. Finanzentwicklung – verbindlich Variante 3

Ersetze das bisherige grosse Linien- oder Balkendiagramm durch eine kompakte Karte mit horizontalen Vergleichsbalken.

**Aufbau:**

Kartenkopf:
- Links «Finanzentwicklung».
- Rechts der ausgewählte Zeitraum.

Einnahmen:
- Bezeichnung links.
- Tatsächlicher Betrag rechts.
- Darunter grüner horizontaler Balken.

Ausgaben:
- Bezeichnung links.
- Tatsächlicher Betrag rechts.
- Darunter roter horizontaler Balken.

Abschluss:
- Dezente Trennlinie.
- Links «Saldo».
- Rechts tatsächlicher Zahlungssaldo.

### Farben

- Einnahmen: `#16A34A`.
- Ausgaben: `#DC2626`.
- Balkenhintergrund: zentraler neutraler Surface-Token.

### Balken

- Höhe: ungefähr 8 px.
- Sanft gerundete Enden.
- Keine Achsen.
- Keine Legende.
- Keine zusätzlichen Beschreibungen.
- Keine zusätzlichen Aktionsbuttons.

Die Balkenlänge wird proportional zum grösseren der beiden Beträge berechnet.

Der grössere Betrag erhält maximal 100 % Balkenbreite.

Bei beiden Beträgen null neutrale leere Balken anzeigen.

Keine negativen Balkenbreiten oder Überläufe.

### Fachliche Berechnung

- Einnahmen = tatsächlich erfasste Zahlungseingänge.
- Ausgaben = tatsächlich erfasste Auszahlungen gemäss bestehender Finanzlogik.
- Saldo = Einnahmen minus Ausgaben.
- Saldo ist kein Bankkontostand.

Bestehende Finanzservices und Berechnungsregeln unverändert erhalten.

Keine Neuberechnung aus formatierten UI-Texten.

## 6. Forderungen – kompaktes Accordion

Direkt unter der Finanzentwicklung.

**Standardmässig geschlossen.**

Geschlossene Darstellung:
- Links «Forderungen».
- Daneben beziehungsweise rechts der fachlich korrekt bezeichnete Gesamtbetrag.
- Rechts Chevron nach unten.
- Eine einzige kompakte Zeile.

Beim Antippen öffnet sich der Bereich.

### Geöffnete Darstellung

- Stichtag, soweit fachlich relevant.
- Kleines Ringdiagramm von ungefähr 90 px.
- Drei Statusgruppen:
  - Bezahlt – Grün.
  - Offen – Orange.
  - Überfällig – Rot.
- Betrag pro Status.
- Prozentualer Anteil, soweit berechenbar.

Keine grossen Erklärungen.

Keine zusätzlichen Drei-Punkte-Menüs.

### Interaktion

Antippen eines Status öffnet die bestehende Rechnungsliste mit dem entsprechenden Filter.

Zurücknavigation erhält:
- Zeitraum.
- Filter.
- Scrollposition.
- Aufgeklappten Zustand.

### Datenintegrität

Offen und überfällig dürfen nicht doppelt gezählt werden.

Definiere die Statusgruppen anhand des vorhandenen Rechnungsmodells eindeutig und überschneidungsfrei.

Bezahlt ist nicht mit einer noch offenen Forderung gleichzusetzen. Wenn der bestehende Bereich einen gesamten Rechnungsbestand zeigt, muss dies fachlich korrekt beschriftet werden.

Der geschlossene Gesamtbetrag muss exakt zur verwendeten Definition passen.

Bei fehlenden Daten neutrales Ringdiagramm ohne künstliche 100-%-Anzeige.

## 7. Angebote – kompaktes Accordion

Direkt unter «Forderungen».

**Standardmässig geschlossen.**

Geschlossene Darstellung:
- «Angebote» links.
- Relevante Gesamtanzahl rechts beziehungsweise neben der Bezeichnung.
- Chevron ganz rechts.

Geöffnete Darstellung:
- Entwürfe.
- Versendet.
- Angenommen.
- Weitere tatsächlich vorhandene fachliche Status, sofern sinnvoll.

Einzeilige Informationszeilen.

Status und Anzahl klar ausrichten.

Antippen einer Statuszeile öffnet die vorhandene Angebotsliste mit entsprechendem Filter.

Keine verstreuten Aktionsbuttons.

Keine Drei-Punkte-Menüs innerhalb des Bereichs.

## 8. Globale UX-Regeln

- Einheitliche zentrale Kartenkomponenten.
- Einheitliche Inter-Typografie.
- Einheitliche Abstände und Seitenränder.
- Keine doppelten Überschriften.
- Keine unnötigen Erklärungen.
- Keine grossen Leerflächen.
- Keine verstreuten Aktionsbuttons.
- Keine zusätzlichen Werkzeug-Icons ausserhalb der zentralen Steuerungszeile.
- Keine künstlichen Daten oder Demo-Werte in produktiven Ansichten.
- Hell- und Dunkelmodus.
- DE, FR, IT, EN und TR.

Die bestehende Bottom-Navigation und der blaue Floating-Plus-Button bleiben unverändert.

## 9. Zentrale technische Umsetzung

Prüfe zuerst die tatsächlich vorhandenen Komponenten, Finanzservices, Routen und Datenprojektionen.

Verwende bestehende zentrale Owner für:
- KPI-Karten.
- Zeitraumfilter.
- Finanzanalyse.
- Vergleichsbalken.
- Accordion.
- Statusanzeigen.
- Navigation und Filter.

Keine zweite Analytics-Foundation entwickeln.

Keine neuen Datenbankmodelle.

Keine Änderungen an Finanzberechnungen oder Berechtigungen.

Nachweislich ersetzte alte Diagrammkomponenten und CSS-Regeln kontrolliert bereinigen, sofern sie nicht anderweitig benötigt werden.

## 10. Regressionstests und GitHub-CI

Prüfe vorhandene Tests vor der Änderung.

Aktualisiere ausschliesslich veraltete UX-Assertions.

Ergänze gezielte Tests für:

- Vier KPI-Karten und deren Reihenfolge.
- Prozenttrends mit echten Vergleichsdaten.
- Fehlende Vergleichsbasis.
- Einnahmen-/Ausgabenfarben.
- Proportionale Balkenbreiten.
- Nullwerte.
- Negativen Saldo.
- Zeitraumwechsel.
- Korrekte Saldoberechnung.
- Forderungsstatus ohne Doppelzählung.
- Accordion öffnen/schliessen.
- Statusnavigation und Filter.
- Rücknavigation mit erhaltenem Zustand.
- Responsive Darstellung.
- Alle fünf Sprachen.
- Hell- und Dunkelmodus.

Bestehende Finanz-, Rollen-, Mandanten- und Datenintegritätstests unverändert erhalten.

Keine Tests deaktivieren oder Sicherheitsregeln abschwächen.

Keine vollständige Browsermatrix während kleiner lokaler UX-Korrekturen.

## 11. Visuelle Abnahme

Zeige die tatsächliche Work-Live-Vorschau für:

- Mobile 390 px.
- Schmale Mobile-Ansicht 320 px.
- Tablet 768 px.
- Desktop 1440 px.

Prüfe:
- Alle vier KPI-Karten.
- Horizontale Vergleichsbalken.
- Aufgeklappte und geschlossene Forderungen.
- Aufgeklappte und geschlossene Angebote.
- Werkzeugposition.
- Header.
- Responsive Abstände.
- Korrekte Betragsdarstellung.

Vergleiche die Implementierung mit der freigegebenen interaktiven Referenz.

## 12. Abschluss

Liefere:
- Geänderte Dateien und Komponenten.
- Entfernte beziehungsweise migrierte Legacy-Implementierungen.
- Bestandene gezielte Tests.
- Noch offene fachliche oder visuelle Abweichungen.
- Tatsächliche Live-Vorschau.

Keine GitHub-Pushes, keine Azure-Deployments und keine produktiven Datenänderungen.

**Nach visueller Freigabe stoppen.**

## Endziel

Eine professionelle, kompakte Finanzanalyse, die auf Mobile ohne unnötiges Scrollen die wichtigsten Informationen zeigt.

Vier KPI-Karten, kompakte Vergleichsbalken und zwei aufklappbare Detailbereiche bilden den verbindlichen Aufbau.

Keine grossen Diagramme, keine verstreuten Aktionen und keine Abweichungen von der freigegebenen Binso-One-UX.