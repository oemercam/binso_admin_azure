# BINSO ONE – GLOBAL MODULE, FUNCTION & UX OPTIMIZATION

## Auftrag

Analysiere und optimiere die gesamte Anwendung Binso One systematisch auf Basis des aktuellen GitHub-Repositories.

**Repository:** `oemercam/binso_admin_azure`
**Hauptbranch:** `main`
**Zuletzt gefundener Commit:** `c357eb59e7698db7ba37707d2c6919c2b0867036`

**Ziel:** Eine moderne, schnelle, einfach verständliche und konsequent Mobile-First entwickelte Schweizer KMU-Geschäftssoftware.

Es handelt sich ausdrücklich nicht nur um einen UX-Auftrag. Die gesamte Modulstruktur, Geschäftslogik, Funktionsverteilung, Navigation, Datenverknüpfung und Bedienung müssen überprüft und verbessert werden.

Die Arbeiten sollen tatsächlich im Code umgesetzt werden.

---

## PHASE 0 – Repository und Release-Basis verifizieren

1. GitHub-Repository und aktuellen `main`-HEAD ermitteln.
2. Prüfen, ob die vollständigen V8-Änderungen einschliesslich Migrationen `0109–0113` enthalten sind.
3. Aktuellen GitHub-Actions-Status prüfen.
4. Letzten erfolgreichen Azure-Deploy und tatsächlich laufenden Live-Commit ermitteln.
5. Bestehende offene Pull Requests und parallele Entwicklungsarbeiten berücksichtigen.
6. Relevante Architektur-, Implementierungs- und UX-Dokumentation lesen.
7. Keine historischen oder unveröffentlichten Änderungen überschreiben.

Einen separaten Arbeitsbranch auf Basis des verifizierten aktuellen Stands erstellen.

Keine Änderungen direkt auf `main`.

Keine produktiven Migrationen oder Deployments ohne ausdrückliche Freigabe.

---

## PHASE 1 – Vollständige Modul- und Funktionsinventur

Alle Seiten, Unterseiten, Komponenten, API-Endpunkte, Datenmodelle, Berechtigungen und Geschäftsprozesse untersuchen.

Für jedes Modul dokumentieren:

- Zweck und fachliche Verantwortung
- Angezeigte Informationen
- Globale Listenansicht
- Kontextbezogene Listenansicht
- Detailansicht
- Erstellungsprozess
- Bearbeitungsprozess
- Status und Statusübergänge
- Automatische Funktionen
- Datenverknüpfungen
- Plus-Aktionen
- Drei-Punkte-Aktionen
- Berechtigungen
- Bereits implementierte Funktionen
- Fehlende oder doppelte Funktionen

Erstelle eine Ist-Soll-Matrix mit konkreten Codefundstellen.

Jede Funktion erhält genau einen fachlichen Verantwortungsbereich.

---

## PHASE 2 – Klare Modulverantwortlichkeiten

Die Module müssen fachlich eindeutig getrennt werden.

### Übersicht

Zeigt relevante Kennzahlen, aktuelle Vorgänge und Handlungsbedarf.

Keine zweite Kunden-, Angebots-, Auftrags- oder Rechnungsverwaltung.

### Kunden

Zeigt standardmässig alle berechtigten Kunden der Firma.

Enthält Stammdaten, Kontakte und Verknüpfungen zu Angeboten, Aufträgen, Rechnungen, Zahlungen und Dokumenten.

Verknüpfte Datensätze öffnen das zuständige Fachmodul mit automatisch gesetztem Kundenkontext.

### Angebote

Zeigt alle berechtigten Angebote aller Kunden.

Verantwortlich für Angebotserstellung, Positionen, Preise, Versionen, PDF, Versand und Angebotsstatus.

### Aufträge

Zeigt alle berechtigten Aufträge aller Kunden.

Verantwortlich für Auftragsumfang, Status, Budget, Mitarbeiterzuordnung, Ausführung und Abrechnungsgrundlagen.

Aufträge müssen direkt oder aus einem geeigneten Angebot erstellt werden können.

### Rechnungen

Zeigt alle berechtigten Rechnungen.

Verantwortlich für Rechnungsstellung, Rechnungsarten, PDF, Versand, Korrekturen und Forderungen.

### Zahlungen

Verantwortlich für Zahlungseingänge, Zahlungszuordnungen und zulässige Korrekturen.

Rechnungszahlungsstatus aus den tatsächlichen Zahlungen ableiten.

### Zeiterfassung

Timer, manuelle Erfassung, Zuordnungen und Freigaben.

Keine zweite unabhängige Zeiterfassung innerhalb der Aufträge.

### Spesen

Auslagen, Belege, Zuordnung, Einreichung, Genehmigung und Erstattung.

### Produkte

Zentrale Verwaltung von Leistungen, Produkten, Preisen und Einheiten.

### Mitarbeiter

Mitarbeiterdaten, Zuordnungen und berechtigte Personalprozesse.

### Finanzen

Finanzielle Kennzahlen, Forderungen und Analysen.

Keine zweite Rechnungs- oder Zahlungsverwaltung.

### Berichte

Betriebliche Auswertungen und Exporte.

### Support

Supportanfragen, Nachrichten, Anhänge und Statusverwaltung.

### Einstellungen

Firma, Konto, Team, Sicherheit, Sprache, Darstellung, Dokumente, Abonnement und weitere Konfigurationen.

### Administration

Interne Plattformverwaltung, Rollen, Audit, Sicherheit, Monitoring und Governance.

Die bestehende Trennung zwischen Kunden-App und interner Administration erhalten.

---

## PHASE 3 – Globale Navigation und Aktionen

Die bestehende mobile Bottom-Navigation unverändert erhalten.

Den vorhandenen schwebenden blauen Plus-Button in Gestaltung und Position unverändert erhalten.

### Globales Plus-Menü

Auf der Übersicht öffnet das Plus „Neu erstellen“ mit berechtigungsabhängigen Aktionen:

- Kunde
- Angebot
- Auftrag
- Rechnung
- Zeiteintrag
- Ausgabe

In Fachlisten öffnet das Plus den kontextspezifischen Erstellungsprozess.

### Drei-Punkte-Menü

Das Drei-Punkte-Menü enthält ausschliesslich zulässige Aktionen für den aktuellen Datensatz oder die aktuelle Liste.

Beispiele:

- Bearbeiten
- PDF anzeigen
- PDF herunterladen
- Versenden
- Datei hinzufügen
- Duplizieren
- Archivieren
- Stornieren
- Weitere fachlich zulässige Aktionen

Keine verstreuten zusätzlichen Aktionsbuttons auf Detailseiten.

Normale Navigation und Formulareingaben bleiben davon ausgenommen.

Keine funktionslosen Menüpunkte anzeigen.

---

## PHASE 4 – Einheitliche Listen und Detailansichten

Implementiere einen globalen Standard für:

- Mobile Listenkarten
- Desktop-Tabellen
- Suche
- Filter
- Sortierung
- Statusanzeigen
- Detailseiten
- Aktionsmenüs
- Leere Zustände
- Seitenübergänge

### Mobile

Kompakte, einheitliche Karten mit:

1. Titel oder Nummer und Status
2. Kontextinformationen und gegebenenfalls Betrag

### Desktop

Einheitliche Tabellen mit fachlich passenden Spalten.

### Suche

Eine kompakte Suchzeile und ein gemeinsamer Filter-/Sortiereinstieg.

Suche nach relevanten Feldern, beispielsweise Nummer, Kunde und Beschreibung.

Aktive Filter sichtbar und einzeln entfernbar.

### Abstände

Die bestehenden übermässigen vertikalen Abstände zwischen Text und Trennlinien zentral korrigieren.

Doppelte Abstände durch `margin`, `padding` und `gap` vermeiden.

Zentrale Designsystem-Komponenten verwenden.

Keine lokalen CSS-Patches.

Touch-Flächen müssen ausreichend gross bleiben.

### Leere Zustände

Maximal zwei kurze Textzeilen.

Keine übergrossen Empty-State-Karten.

---

## PHASE 5 – Vereinfachte Erstellungsprozesse

Alle häufig verwendeten Prozesse Mobile First optimieren.

Ziel: Möglichst wenige Eingaben, Entscheidungen und Seitenwechsel.

### Angebot erstellen

Ein gemeinsamer Ablauf mit drei Schritten:

**1. Kunde**

Bestehenden Kunden suchen und auswählen oder neuen Kunden direkt erfassen.

Neuen Kunden ohne separaten Kundenassistenten anlegen.

**2. Positionen**

Leistung oder Produkt erfassen.

Kompakte Preisfelder mit:

- Preis
- Einheit: Pauschal, Stunde, Tag, Stück oder Monat
- Menge nur bei Bedarf

Automatische Berechnung von:

- Netto
- MwSt.
- Total inkl. MwSt.

MwSt.-Standard aus Firmenkonfiguration und korrekter Steuerregel übernehmen.

Steuerliche Sonderfälle müssen weiterhin korrekt unterstützt werden.

Weitere Angaben nur bei Bedarf anzeigen.

**3. Prüfen**

Zusammenfassung anzeigen.

Das tatsächlich serverseitig generierte Angebots-PDF öffnen.

PDF muss exakt dem später versendeten Dokument entsprechen.

Entwurf speichern oder Angebot versenden.

Vor dem Versand alle notwendigen Pflichtangaben prüfen.

Keine doppelte PDF-Berechnungslogik.

### Weitere Prozesse

Dieselben Vereinfachungsprinzipien für Aufträge, Rechnungen, Zahlungen, Zeiterfassung, Spesen und Kunden anwenden.

Bestehende komplexe Abrechnungsmodelle, Budgets, Akonto, Teilrechnungen, Sammelrechnungen und Gutschriften vollständig erhalten.

Komplexe Optionen nur anzeigen, wenn sie fachlich benötigt werden.

---

## PHASE 6 – Technische Architektur

Bestehende gemeinsame Komponenten wiederverwenden und bei Bedarf zentral erweitern.

Insbesondere prüfen:

- `RecordList`
- `RecordCard`
- `RecordTable`
- `SearchFilterBar`
- `RecordDetailHeader`
- `ActionsMenu`
- `FormSheet`
- `FilterSheet`
- `AppShell`
- zentrale Formularelemente
- bestehende Designsystem-CSS-Dateien

Die Namen sind Zielkonzepte, keine Anweisung, vorhandene Komponenten unnötig zu duplizieren.

Keine zweite Geschäftslogik im Frontend.

Keine parallelen Berechnungs-Engines.

Bestehende APIs, Datenbankrechte, RLS, Audit, Tenant-Isolation und historische Dokumente schützen.

---

## PHASE 7 – Implementierung und Qualitätssicherung

Implementiere die Verbesserungen in fachlich zusammenhängenden, überprüfbaren Paketen.

Nach jedem Paket:

1. Betroffene Komponenten und Module prüfen.
2. Bestehende Regressionstests ausführen.
3. Neue Tests für korrigierte Funktionen ergänzen.
4. Rollen- und Mandantengrenzen prüfen.
5. Mobile und Desktop prüfen.
6. Alle unterstützten Sprachen berücksichtigen.
7. Light/Dark und responsive Darstellung kontrollieren.
8. Keine bestehenden Funktionen stillschweigend entfernen.

Mindestens folgende Prüfungen für die abschliessende Gesamtintegration durchführen:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- vorhandene Security- und Architekturprüfungen
- relevante Browser- und API-Tests

Physische iPhone-/iPad-Prüfungen dürfen nur als bestanden gelten, wenn sie tatsächlich durchgeführt wurden.

---

## PHASE 8 – Abschluss und Übergabe

Erstelle:

1. Vollständige Ist-Soll-Matrix.
2. Übersicht aller korrigierten Module und Funktionen.
3. Liste beseitigter Doppelungen.
4. Dokumentation der zentralen Komponenten.
5. Testergebnisse mit konkreten Nachweisen.
6. Liste verbleibender fachlicher oder technischer Einschränkungen.
7. Übersicht aller Commits und des Implementierungsbranches.
8. Konkrete Release- und Deployment-Empfehlung.

Keine Änderungen direkt in Produktion.

Kein Merge nach `main` und kein Azure-Deployment ohne meine ausdrückliche Freigabe.

## Verbindliches Endziel

Binso One soll sich auf dem Handy so einfach bedienen lassen, dass ein Benutzer einen Kunden, ein Angebot, einen Auftrag, eine Rechnung oder einen Zeiteintrag mit wenigen klaren Schritten erstellen kann.

Jede Seite besitzt eine eindeutige Aufgabe.

Jede Funktion hat einen klaren Verantwortungsbereich.

Alle Module verwenden dieselbe globale Bedienlogik.

Bestehende Daten, Geschäftsregeln, Berechtigungen und Funktionen bleiben erhalten.

**Beginne mit der Prüfung des tatsächlichen Repository- und Deployment-Stands und führe danach die Implementierung auf einem isolierten Branch durch.**
