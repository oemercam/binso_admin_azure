# Standardprozess und Ausnahmen — V18

## Zielbild

Der Standardprozess für zeitbasierte Mandate ist:

Kunde → Vertrag → Auftrag → Leistungserbringer → tägliche Zeiterfassung beim Kunden → Monatsrapport → Kundenunterschrift/Freigabe → interne Prüfung → Kundenrechnung → Auszahlung.

Der Monatsrapport ist standardmässig die verbindliche Freigabe zwischen Leistung und Fakturierung/Auszahlung.

## Standardwerte

Unter **Einstellungen → Allgemein → Standardprozess Zeit und Monatsrapport** wird der Standard für neue Aufträge gepflegt.

Standard:
- führende Zeiterfassung: Kundensystem
- Monatsrapport erforderlich
- Kundenunterschrift erforderlich
- Kundenfreigabe erforderlich
- Fakturierung bis Rapportfreigabe gesperrt
- Auszahlung bis Rapportfreigabe gesperrt

## Vererbung

Die Konfiguration wird in dieser Reihenfolge aufgelöst:

1. globaler Standard
2. kundenspezifische Abweichung
3. vertragsspezifische Abweichung
4. Auftrag / Auftragsregeln
5. Zuweisung eines Mitarbeitenden oder externen Leistungserbringers

Eine speziellere Regel überschreibt nur die Werte, die dort tatsächlich geändert werden.

## Kunde

Im Kundeneditor kann **Eigener Zeit-/Rapportprozess** aktiviert werden.

Beispiel:
- Kunde A verlangt immer einen unterschriebenen Monatsrapport.
- Kunde B erlaubt Fakturierung ohne unterschriebenen Rapport.
- Kunde C verwendet Binso Admin statt sein eigenes Zeitsystem.

## Vertrag

Bei mehreren Verträgen desselben Kunden kann jeder Vertrag einen eigenen Prozess haben.

Beispiel:
- Vertrag 1: Monatsrapport, Unterschrift und Kundenfreigabe.
- Vertrag 2: nur Monatsrapport ohne Unterschrift.
- Vertrag 3: interne Zeiterfassung und kein externer Rapport.

Der aus dem Vertrag erzeugte Auftrag übernimmt diese Regel.

## Leistungserbringer / Zuweisung

Pro Auftrag und Person/Firma werden gepflegt:
- Verkaufssatz an Kunde
- Kosten-/Einkaufssatz
- eigene Rapportregel optional
- eigene Auszahlungsregel optional

Damit können im selben Kunden oder Vertrag unterschiedliche Margen abgebildet werden.

### Eigener Mitarbeitender im Stundenlohn
Beispiel:
- Einkauf/Kosten: CHF 75/h
- Verkauf: CHF 140/h
- freigegebener Monatsrapport vor Auszahlung erforderlich
- Buchhaltungsfreigabe erforderlich

### Externe GmbH
Beispiel:
- Einkauf: CHF 120/h
- Verkauf: CHF 140/h
- freigegebener Monatsrapport erforderlich
- Lieferantenrechnung erforderlich
- Buchhaltungsfreigabe erforderlich

## Monatsrapport

Im Auftrag unter **Nachweise** kann bei monatlicher Regel ein Monatsrapport nach Leistungserbringer und Monat hochgeladen werden.

Ein Monatsrapport kann:
- unterschrieben sein
- vom Kunden freigegeben sein
- intern geprüft werden

Bei monatlicher Regel gilt derselbe Rapport für alle Zeiteinträge derselben Person, desselben Auftrags und desselben Monats.

## Fakturierung

Wenn die Regel `Fakturierung bis Rapportfreigabe sperren` aktiv ist, sind die Stunden erst fakturierbar, wenn der passende Monatsrapport vollständig vorliegt.

## Auszahlung

Die Auszahlungslogik unterscheidet:
- Festlohn
- Stundenlohn
- Lieferantenrechnung

Bei Stundenlohn kann ein freigegebener Monatsrapport Pflicht sein.
Bei externen Firmen kann zusätzlich eine Lieferantenrechnung Pflicht sein.

Die Hilfslogik in `modules/workforce/settlement.ts` liefert dafür einen eindeutigen Bereitschaftsstatus. Die eigentliche Bankzahlung bzw. Lohnbuchung bleibt ein nachgelagerter Buchhaltungsprozess und wird nicht automatisch ausgeführt.

## Bestehende Aufträge

Bestehende Aufträge behalten ihre bereits gespeicherten Auftragsregeln. Änderungen am globalen Standard wirken auf neue Aufträge. Bestehende Aufträge können unter **Auftrag → Zeiterfassung → Regeln** individuell angepasst werden.
