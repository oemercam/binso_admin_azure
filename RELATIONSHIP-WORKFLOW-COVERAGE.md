# Binso One v0.7.0 – Relationship & Workflow Pass

## Implementiert
- Suchbare relationale Auswahl statt Freitext für zentrale Beziehungen.
- Kunden werden in Offerten/Rechnungen gesucht und als ID verknüpft.
- Kundenstammdaten übernehmen E-Mail, Adresse, Kontakt, Sprache, Zahlungsfrist/Rabatt-Grundlage.
- Produkte/Leistungen können in Rechnungs-/Offertpositionen gesucht und übernommen werden.
- Projektbezug für Dokumente.
- Verrechenbare Projektzeiten und Spesen können in Rechnungen übernommen und anschliessend als fakturiert markiert werden.
- Auftrag → Projekt übernimmt Kunde, Positionen und Referenz.
- Projekt → Rechnung übergibt Projekt- und Kunden-ID.
- Kunde → Offerte übergibt Kunden-ID.
- Zahlungen referenzieren Rechnung/Kunde und aktualisieren den offenen Rechnungsstatus.
- Lieferant → Eingangsrechnung via Suchauswahl.
- Freigegebene Eingangsrechnung erzeugt Buchhaltungsbuchung.
- Mitarbeiterreferenzen für Zeit, Spesen, Abwesenheiten, Aufgaben und Projektleitung.
- Dokumente können Kunde, Projekt, Mitarbeiter oder Lieferant referenzieren.
- Verträge können Kunde oder Lieferant referenzieren und Wiederholung kennzeichnen.
- Aufgaben können Kunden, Projekt, Rechnung und verantwortliche Person referenzieren.
- Dashboard-Kennzahlen werden für lokal erfasste Rechnungen, Zeiten und Spesen dynamisch berechnet.
- Beziehungen werden in `meta.relations` über IDs gespeichert; Namen dienen nur der Anzeige.

## Lokale Demo-Grenze
Die ID-Beziehungen sind eine lokale Vorstufe für die spätere Datenbank. In Produktion gehören diese Relationen in echte Fremdschlüssel mit `organization_id`, RLS und serverseitiger Autorisierung.
