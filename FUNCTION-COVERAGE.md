# Function coverage – Binso One v0.4.0 local demo

| Bereich | Lokaler Teststatus |
|---|---|
| Dashboard | Implementiert – lokale Kennzahlen/Verknüpfungen |
| Kunden | Implementiert – CRUD-artig lokal, Kontakte, Notizen, Anhänge, Beziehungen |
| Offerten | Implementiert – Erstellung, Positionen, Rabatt, Vorschau, Druck/PDF, Versand-Simulation, Bearbeitung, Duplikat/Version, Annahme/Ablehnung, Auftrag |
| Aufträge | Implementiert – Erstellung/Bearbeitung, Status, Positionen aus Offerte, Bestätigungsdruck, Projekt |
| Projekte | Implementiert – Stammdaten, Team/Budget, Aufgaben/Meilensteine, verknüpfte Zeit/Spesen, Aufwand, Rechnung |
| Zeiterfassung | Implementiert – manuell, Start/Ende/Pause, Live-Timer, Woche/Monat, Freigabe/Zürückweisung |
| Spesen | Implementiert – Erfassung, lokaler Beleg, Vorschau, Freigabe/Ablehnung/Verbuchen, Weiterverrechnung |
| Rechnungen | Implementiert – Positionen, MWST, Rabatt, Vorschau, Druck/PDF, Versand-Simulation, Bearbeitung, Teilzahlung, bezahlt, Mahnung, Gutschrift, Storno, Wiederholung, Duplikat |
| Zahlungen | Implementiert – manuell, Zuordnung, Teilzahlung, Demo-CAMT-Import, Rückzahlung, Export |
| MWST | Implementiert – lokale Berechnung, Methode, Korrektur, Plausibilisierung, Export, Einreichungs-Simulation |
| Personal | Implementiert – Stammdaten, AHV/IBAN/Pensum/Ferien, Abwesenheiten, Anhänge, Status |
| Lohn | Implementiert – vereinfachter Demo-Lohnlauf, Abzüge/Zulagen/Quellensteuer, Abrechnung, CSV, Freigabe/Auszahlung-Simulation |
| Berichte | Implementiert – dynamische lokale Kennzahlen, Periodenansicht, CSV |
| Einstellungen | Implementiert – Firma, Benutzer/Rollen, Nummernkreise, Vorlagen, Benachrichtigungen, Integrationen, Audit, Reset |
| Globale Suche | Implementiert |
| Filter/Sortierung/Ansichten | Implementiert |
| CSV-Exporte | Implementiert |
| Mobile/PWA Mehr-Menü | Implementiert |
| Firmen-/Testbenutzerwechsel | Implementiert |

## Absichtlich nur simuliert

Die folgenden Funktionen benötigen für eine produktive Version externe Systeme oder rechtlich/technisch geprüfte Backend-Logik und werden deshalb lokal nur simuliert: echter E-Mail-Versand, scannbarer Swiss QR Bill, Bank-/CAMT-Verarbeitung gegen ein echtes Konto, ESTV-Übermittlung, rechtlich vollständige Schweizer Lohnabrechnung, produktive Rollen-/Berechtigungsdurchsetzung, unveränderbares Audit-Log und gemeinsame serverseitige Datenhaltung.
