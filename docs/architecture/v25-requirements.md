> Ergänzung 19.10.2026: [V25.1-Korrekturauftrag](v25-1-requirements.md) mit präzisierten Abnahme-, Aktions-, Finanz- und Evidenzregeln ist aufgenommen. Seine Codeumsetzung ist anschliessend ausdrücklich freigegeben; separate Merge-/Deployment-Freigaben bleiben erforderlich. Weiterhin gültige Fachanforderungen bleiben erhalten.

> Aktueller Status, 19.10.2026: Die Implementierung wurde ausdrücklich freigegeben. Die im übernommenen Anforderungstext enthaltene Sammel-Stoppregel ist damit aufgehoben. Navigation und Plus-Button bleiben unverändert. Ein Produktivdeployment benötigt weiterhin eine separate Freigabe.

# BINSO ONE – V25 FINAL MASTER IMPLEMENTATION
## Global UX Standardisation, Architecture Cleanup, Navigation, Forms, Business Flows & Quality Assurance

**Repository:** `oemercam/binso_admin_azure`

**Status:** Verbindlicher, vollständiger Implementierungsauftrag.

**Wichtig:** Dieser Auftrag ersetzt den bisherigen unvollständigen V25-Prompt. Er ergänzt die weiterhin gültigen fachlichen Anforderungen aus V24, ersetzt jedoch alle widersprüchlichen oder überholten UX-Vorgaben.

---

# 1. ZIEL UND AUFTRAG

Analysiere, korrigiere, bereinige und standardisiere Binso One vollständig auf Basis der aktuellen, freigegebenen UX-Foundation.

Der Auftrag umfasst die gesamte Anwendung:

- Sämtliche Seiten, Unterseiten und Routen
- Alle Navigationspunkte
- Alle Profil- und Unternehmenseinstellungen
- Alle Formulare und Assistenten
- Alle Listen, Tabellen und Detailansichten
- Alle Aktionsmenüs und Schnellaktionen
- Alle Dialoge, Bottom Sheets und Overlays
- Alle CSS-Dateien und Design-Tokens
- Alle gemeinsamen UI-Komponenten
- Alle relevanten Geschäftsprozesse
- Rollen und Berechtigungen
- Mobile, Desktop, Browser und PWA
- Tests, Qualitätssicherung und Dokumentation

Es genügt nicht, einzelne Screenshots nachzubauen oder lokale CSS-Korrekturen vorzunehmen.

**Ziel ist eine technisch saubere, zentral standardisierte und vollständig funktionierende Anwendung mit dem bereits freigegebenen UX-Design.**

Arbeite die nachfolgenden Phasen tatsächlich ab. Eine Planung allein gilt nicht als Implementierung.

# 2. VERBINDLICHER UX FREEZE

Die zuletzt freigegebene Binso-One-UX-Foundation ist die einzige gültige visuelle Grundlage.

## 2.1 Unverändert beibehalten

- Bestehendes klares, reduziertes Weiss-Blau-Design
- Bestehende zentrale Typografie
- Freigegebene Abstände und Komponentenformen
- Bestehende Bottom-Navigation mit allen fünf Navigationspunkten
- Moderner, schwebender, runder blauer Floating-Plus-Button
- Dessen bestehende Gestaltung und Position
- Einfache Liste im Menü «Mehr»
- Bestehende grundlegende Mobile-first-Navigation

## 2.2 Ausdrücklich verboten

- Glassmorphism und Glass-Effekte
- Neue Blur- und Transparenzeffekte als Gestaltungsmittel
- Eigenmächtige neue Farbpaletten
- Neue dekorative Schatten
- Unnötige Animationen
- Unnötige neue Kartenlayouts
- Zweite UX-Foundation
- Parallele Designsysteme
- Lokale CSS-Workarounds
- Übernahme älterer, nicht mehr gültiger UX-Entwürfe
- Eigenmächtiges Redesign

Technisch notwendige Overlays, beispielsweise zur Hintergrundabdunklung, sind keine dekorativen Glass-Effekte.

## 2.3 Priorität der Anforderungen

Bei Widersprüchen gilt:

1. Sicherheit, Datenschutz und zwingende rechtliche Anforderungen
2. Ausdrücklich zuletzt freigegebene UX-Entscheidungen
3. Aktuelle funktionale Geschäftsanforderungen
4. Bestehende freigegebene UX-Foundation
5. Weiterhin gültige Anforderungen aus V24
6. Ältere Konzepte nur, soweit sie nicht widersprechen

Bei einem echten fachlichen Konflikt keine Geschäftsregel stillschweigend ändern. Konflikt dokumentieren und eine sichere Lösung erarbeiten.

# 3. VOLLSTÄNDIGES REPOSITORY-AUDIT

Untersuche zuerst den aktuellen Repository-Stand.

Erfasse sämtliche:

- Routen und Navigationsziele
- Seiten und Unterseiten
- Komponenten und Varianten
- CSS-Dateien und Design-Tokens
- Formulare und Assistenten
- Hooks und State-Management-Strukturen
- API-Aufrufe und Validierungen
- Datenmodelle
- Berechtigungsprüfungen
- Geschäftsprozessfunktionen
- Tests und Testlücken

Erstelle eine nachvollziehbare Audit-Matrix mit:

- Modul
- Datei beziehungsweise Komponente
- Bestehendem Verhalten
- Sollverhalten
- Festgestellter Abweichung
- Root Cause
- Erforderlicher Änderung
- Betroffenen Tests
- Implementierungsstatus

Prüfe den tatsächlichen Code und verlasse dich nicht ausschliesslich auf Screenshots oder alte Dokumentationen.

# 4. ARCHITEKTUR- UND ALTLASTENBEREINIGUNG

Suche systematisch nach:

- Doppelten Komponenten
- Parallelen Implementierungen
- Veralteten Hooks
- Redundanten API-Aufrufen
- Doppelter Validierungslogik
- Widersprüchlichen Zustandsberechnungen
- Veralteten Routen
- Ungenutzten CSS-Regeln
- Unnötigen Abhängigkeiten
- Nicht mehr verwendeten Hilfsfunktionen
- Unnötigen Zwischenkomponenten
- Redundanten Datenabfragen

Identifiziere auch Funktionen, die unter verschiedenen Namen denselben Zweck erfüllen.

Vorhandene korrekte Lösungen haben Vorrang.

Erweitere oder korrigiere sie zentral, statt neue parallele Implementierungen zu erstellen.

Entferne Altlasten erst nach Prüfung ihrer tatsächlichen Verwendung und nach Absicherung gegen Regressionen.

# 5. CSS-ARCHITEKTUR UND DESIGN-TOKENS

Prüfe sämtliche Styles auf:

- Doppelte Selektoren
- CSS-Spezifitätskonflikte
- Widersprüchliche Deklarationen
- Unnötiges `!important`
- Unkontrollierte globale Selektoren
- Feste Höhen und Mindesthöhen
- Overflow-Probleme
- Z-Index-Konflikte
- Veraltete Media Queries
- Unnötige Layout-Wrapper
- Fehlerhafte Safe-Area-Berechnungen
- Unterschiedliche Styles identischer Komponenten

Verwende die bestehenden zentralen Design-Tokens.

Prüfe und ergänze nur, was tatsächlich fehlt:

- Typografie
- Farben
- Abstände
- Border
- Radius
- Fokuszustände
- Statusfarben
- Komponentenabmessungen
- Responsive Breakpoints
- Overlay-Ebenen

Keine freie Neugestaltung.

Alle CSS-Korrekturen müssen die tatsächlichen Ursachen beheben.

# 6. ZENTRALE KOMPONENTEN-FOUNDATION

Prüfe und vereinheitliche die vorhandenen Komponenten für:

- PageHeader
- SectionHeader
- FormField
- Input
- Select
- Combobox
- Textarea
- Checkbox
- RadioGroup
- Switch
- DatePicker
- TimePicker
- FormWizard
- FormFooter
- BottomSheet
- Modal
- Popover
- ActionMenu
- ListItem
- StatusBadge
- EmptyState
- FileList
- KPI-Anzeige
- Diagramme
- LoadingState
- ErrorState

Die Namen sind konzeptionell; verwende nach Möglichkeit die tatsächlich vorhandenen Komponenten.

Keine parallelen Implementierungen allein aufgrund anderer Bezeichnungen.

# 7. GLOBALES AKTIONSSYSTEM

Alle Aktionen müssen nach einem einheitlichen Prinzip funktionieren.

## 7.1 Drei-Punkte-Menü (…)

Für Aktionen an bestehenden Objekten:

- Bearbeiten
- Duplizieren
- PDF anzeigen
- PDF herunterladen
- Versenden
- Anhang hinzufügen
- Datei verwalten
- Zahlung erfassen
- Mahnung erstellen
- Stornieren
- Löschen

Aktionen sind kontext-, status- und berechtigungsabhängig.

## 7.2 Bestehender Floating-Plus-Button

Für die Erstellung neuer Objekte und Einträge.

Der bestehende runde blaue Button bleibt in Design und Position unverändert.

Auf der Startseite öffnet er das zentrale Schnellaktionsmenü «Neu erstellen».

Innerhalb von Fachlisten öffnet er die passende kontextspezifische Erstellung.

## 7.3 Verstreute Aktionsbuttons entfernen

Insbesondere:

- Kein separater PDF-Button
- Kein quadratisches Plus bei Anhängen
- Kein zusätzliches Plus bei Dateien
- Kein zusätzliches Plus neben Abschnittsüberschriften
- Keine unnötigen separaten Bearbeiten-Buttons
- Keine doppelt angebotenen identischen Aktionen

Primäre Formularsteuerungen wie Speichern, Weiter, Zurück und Abbrechen bleiben direkt sichtbar.

Timer Start/Pause/Stop bleiben direkt sichtbar.

Navigation, Tabs, Suche und Filter bleiben eigenständig bedienbar.

# 8. DATEIEN, ANHÄNGE UND DOKUMENTE

Standardisiere die Darstellung über alle Module.

Unterscheide zwischen:

- Systemgenerierten Geschäftsdokumenten
- Hochgeladenen Dateien und Anhängen

Vermeide unnötige Verschachtelungen wie «Dateien → Anhänge».

Die Dateiliste soll kompakt und direkt verständlich sein.

Ein vorhandenes Dokument kann durch Auswahl geöffnet werden.

Weiterführende Aktionen erfolgen über das Drei-Punkte-Menü.

Upload und Hinzufügen erfolgen über das passende zentrale Aktionssystem.

Prüfe:

- PDF-Vorschau
- PDF-Download
- Upload
- Dateitypen
- Dateigrössen
- Berechtigungen
- Ladezustände
- Fehlerbehandlung
- Sichere Dateiverarbeitung

# 9. EMPTY STATES – MAXIMAL ZWEI TEXTZEILEN

Alle leeren Zustände müssen zentral standardisiert werden.

Verbindlich:

- Maximal zwei Textzeilen
- Bevorzugt eine Zeile
- Keine grossen Empty-State-Karten
- Keine Illustrationen
- Keine unnötigen Erklärungen
- Keine zusätzlichen Aktionsbuttons
- Keine grossen vertikalen Leerflächen

Beispiele:

«Keine Dateien vorhanden.»

«Keine Kontakte vorhanden.»

«Keine Einträge gefunden.»

«Keine Aktivitäten vorhanden.»

«Keine Suchergebnisse.»

Diese Regel gilt ausnahmslos für alle Module, sofern keine zwingenden Sicherheits- oder Fehlermeldungen zusätzliche Informationen erfordern.

# 10. GLOBALE FORMULARSTANDARDISIERUNG

Überprüfe jedes Formular und jedes Eingabefeld.

Standardisiere:

- Labels
- Feldhöhen
- Feldabstände
- Fokuszustände
- Fehlerzustände
- Disabled-Zustände
- Pflichtfeldmarkierungen
- Hilfetexte
- Tastaturtypen
- Eingabeformate
- Formularabschnitte
- Footer-Aktionen

Keine doppelten Rahmen.

Keine überlappenden Labels.

Keine unnötigen Formularüberschriften.

Keine riesigen Leerflächen.

# 11. MUSTERTEXTE UND EINGABEHILFEN

Prüfe sämtliche Eingabefelder der gesamten Anwendung.

Ergänze geeignete Mustertexte beziehungsweise Format- und Auswahlhinweise.

Beispiele:

| Feld | Mustertext |
|---|---|
| Firmenname | Muster AG |
| Vorname | Max |
| Nachname | Muster |
| E-Mail | max.muster@beispiel.ch |
| Telefon | +41 31 555 12 34 |
| Strasse | Bahnhofstrasse |
| Hausnummer | 12 |
| PLZ | 3000 |
| Ort | Bern |
| IBAN | CH93 0076 2011 6238 5295 7 |
| Zahlungsfrist | 30 Tage |
| Beschreibung | z. B. IT-Beratung und Support |
| Stundensatz | z. B. 150.00 |
| Suchfeld | Kunden suchen … |

Verwende Schweizer Formate für Datum, Uhrzeit, Telefonnummern, Adressen, CHF, MWST und IBAN.

Mustertexte sind niemals echte gespeicherte Werte.

Bei Selects und DatePickern passende Auswahl- beziehungsweise Formathinweise verwenden.

Labels bleiben dauerhaft sichtbar.

Keine künstlichen Placeholder bei Feldern, bei denen diese technisch oder fachlich ungeeignet sind.

# 12. FORMULARVALIDIERUNG

Prüfe:

- Pflichtfelder
- Formatvalidierung
- Plausibilität
- Serverseitige Validierung
- Duplikaterkennung
- Abhängige Felder
- Fehlermeldungen
- Datenverlustschutz
- Mehrfaches Absenden
- Race Conditions
- Berechtigungen

Fehler müssen verständlich direkt beim betroffenen Feld erscheinen.

Bestehende fachliche Pflichtfelder dürfen nicht eigenmächtig entfernt werden.

# 13. KUNDEN-WIZARD – ZWEI SCHRITTE

Die bisherige Akkordeonlösung «Weitere Angaben» wird durch einen einheitlichen zweistufigen Erfassungsprozess ersetzt.

## Schritt 1 – Grunddaten

Bei Firmenkunden:

- Kundentyp
- Firmenname: Pflicht
- Vorname der primären Kontaktperson: Pflicht
- Nachname der primären Kontaktperson: Pflicht

Bei Privatpersonen:

- Kundentyp
- Vorname: Pflicht
- Nachname: Pflicht

Prüfe die bestehende Datenmodell- und Validierungslogik für unterschiedliche Kundentypen.

Die Pflichtkontaktperson bei Firmenkunden bleibt erhalten.

## Schritt 2 – Ergänzende Angaben

Je nach Kundentyp:

- E-Mail
- Telefon
- Strasse
- Hausnummer
- PLZ
- Ort
- Land
- Zahlungsfrist
- Weitere fachlich vorhandene optionale Angaben

Nur tatsächlich optionale Angaben dürfen übersprungen werden.

Wenn weitere Angaben aufgrund bestehender Geschäftsregeln zwingend erforderlich sind, müssen diese korrekt gekennzeichnet und validiert werden.

## Bedienung

- Einheitliche Schrittanzeige
- Zurück und Weiter
- Feldbezogene Validierung
- Kein Verlust eingegebener Daten beim Schrittwechsel
- Kein doppeltes Speichern
- Kompakte, inhaltsabhängige Darstellung
- Erreichbarer Footer

Bestehende Kunden werden über ein direktes Bearbeitungsformular geändert, ohne unnötigen Wizard.

# 14. ANGEBOTS- UND RECHNUNGSASSISTENTEN

Prüfe die bestehenden mehrstufigen Assistenten.

Behalte funktionierende Geschäftslogik bei.

Standardisiere:

- Schrittanzeige
- Schrittbezeichnungen
- Formularlayout
- Positionen
- Konditionen
- Begleittexte
- MWST
- Dokumentvorschau
- PDF-Erstellung
- Zurück-/Weiter-Navigation
- Validierung
- Speichern
- Fehlerbehandlung

Wenn ein Assistent aus einem Kundenkontext geöffnet wird, muss der Kunde vorausgewählt sein.

Prüfe den vollständigen Schweizer QR-Rechnungsprozess.

Keine doppelten Dokumente durch mehrfaches Absenden.

# 15. BOTTOM SHEETS UND OVERLAYS

Verwende eine zentrale BottomSheet-Implementierung.

Kurze Aktionsmenüs müssen inhaltsabhängig dimensioniert sein.

Lange Formulare dürfen mehr Bildschirmhöhe verwenden.

Verbindlich:

- Scrollbarer Inhaltsbereich
- Erreichbare Footer-Aktionen
- Einheitlicher Header
- Keine doppelten Titel
- Korrekte Fokussteuerung
- Keyboard-aware Verhalten
- Safe-Area-Unterstützung
- Keine unnötigen Leerflächen
- Keine unkontrollierten Höhen

## iPhone-Statusleiste

Bei geöffneten Bottom Sheets muss die Hintergrundabdunklung den oberen Bildschirmbereich einschliesslich der Statusleistenregion erfassen, soweit dies die jeweilige Browser- oder PWA-Umgebung technisch erlaubt.

Kein isolierter weisser Streifen am oberen Bildschirmrand.

Prüfe die Ursache zentral.

Keine lokalen Seiten-Patches.

Der bestehende Drag Handle darf erhalten bleiben.

# 16. VOLLSTÄNDIGES NAVIGATIONSAUDIT

Überprüfe sämtliche:

- Navigationspunkte
- Routen
- Unterseiten
- Tabs
- Zurück-Navigationen
- Profilmenüs
- Kontomenüs
- Einstellungsseiten
- Aktionsmenüs
- Schnellaktionsmenüs
- Berechtigungsabhängigen Ziele

Erstelle eine Navigationsmatrix mit:

- Einstiegspunkt
- Bezeichnung
- Zielroute
- Fachlicher Zuständigkeit
- Berechtigung
- Verwendeter Komponente
- Möglicher Doppelung

Prüfe auch versteckte oder nur über bestimmte Geschäftsprozesse erreichbare Seiten.

# 17. MENÜ «MEHR»

Die vorhandene einfache Liste bleibt erhalten.

Verbindlich:

- Keine neuen Gruppierungen
- Keine neuen Abschnittsüberschriften
- Keine grundlegende Neugestaltung
- Keine unnötige Umordnung
- Bestehende Icons möglichst erhalten
- Keine ersatzlose Entfernung von Funktionen

Prüfe sämtliche Einträge auf:

- Fachliche Zuordnung
- Doppelte Funktionen
- Unnötige Navigationswege
- Falsche Ziele
- Veraltete Seiten
- Berechtigungen

Fasse nur tatsächlich redundante Funktionen zusammen.

Mehrere sinnvolle Einstiegspunkte dürfen bestehen bleiben, sofern sie dieselbe zentrale Implementierung verwenden.


## Verbindliche Ergänzung ab Kapitel 18

BINSO ONE – V25: VERBINDLICHE VERVOLLSTÄNDIGUNG AB KAPITEL 18
Repository: oemercam/binso_admin_azure
Status: Anforderungen sammeln. Keine Implementierung vor der ausdrücklichen Freigabe „umsetzen“.
Geltung: Diese Ergänzung ersetzt den abgeschnittenen Rest ab Kapitel 18. Bei Widersprüchen haben die jüngsten ausdrücklich freigegebenen UX-Entscheidungen Vorrang.
18. Profil, Konto und Einstellungen – eindeutige Zuordnung
Prüfe alle Profil-, Konto- und Einstellungsseiten sowie sämtliche Einstiegspunkte und Unterseiten. Persönliche Identität, Profil, Sprache, Darstellung, Sicherheit, Passwort, aktive Sitzungen und persönliche Benachrichtigungen gehören zum Benutzerkontext. Firmendaten, Benutzer und Rollen, Abonnement, Rechnungs- und Dokumentvorgaben sowie Zeiterfassungsregeln gehören in den Unternehmenskontext und unterliegen den entsprechenden Rollenrechten. Datenschutz und Cookies sind nach tatsächlicher fachlicher Zuständigkeit zuzuordnen.

Erstelle eine Einstellungs-Matrix (Bezeichnung, Route, zuständige Komponente, Datenquelle, Speicherfunktion, Berechtigung, Duplikat, Soll-Zuordnung). Gleiche oder fachlich identische Einstellungen dürfen mehrere sinnvolle Einstiegspunkte haben, aber nur eine zentrale Implementierung und einen konsistenten Datenzustand. Keine parallelen Formulare, Speicherwege oder widersprüchlichen Werte. Änderungen müssen nach Navigation und Reload korrekt erhalten bleiben. Direkte URLs serverseitig absichern.
19. Menü „Mehr“ und gesamte Navigation
Prüfe Bottom-Navigation, „Mehr“, Konto, Profil, Einstellungen, Tabs, Unterseiten, Zurück-Navigation, Kontextmenüs, Floating-Plus-Menüs, Direktlinks und rollenabhängige Ziele. Bottom-Navigation unverändert lassen. Die bestehende einfache Liste in „Mehr“ ohne Gruppierungen oder Abschnittsüberschriften beibehalten. Nur nachgewiesene unnötige oder doppelte Einträge entfernen oder fachlich sinnvoll zusammenführen, ohne Funktionen zu verlieren oder deren Auffindbarkeit zu verschlechtern. Ähnliche Namen allein rechtfertigen keine Zusammenführung. Navigation muss für alle berechtigten Rollen funktionieren.
20. Kunden-360°-Ansicht
Die vorhandenen Kunden-Tabs und die freigegebene Designsprache erhalten. Kundenbezogene Kontakte, Angebote, Rechnungen, Zahlungen, Aufträge/Projekte, Aktivitäten, Geschäftsdokumente, Dateien und offene Forderungen sinnvoll und kompakt zusammenführen. Daten nach tatsächlicher Kunden-ID und Berechtigung filtern. Redundante Kontaktangaben und unnötige Akkordeons vermeiden. Objektaktionen über …, Erstellung über den bestehenden runden blauen Floating-Plus-Button. Keine zusätzlichen Abschnitts-Plus-Buttons.
21. Geschäftsprozess-End-to-End
Kunde → Angebot → Annahme → Auftrag/Projekt → Leistung und Zeiterfassung → Rechnung inklusive Schweizer QR-Rechnung/PDF → Zahlung/Teilzahlung → Mahnung/Abschluss. Datenübergaben, Zustandsübergänge, Berechtigungen, Berechnungen, Auditierbarkeit und Idempotenz überprüfen. Doppelte Projekte, Rechnungen oder Zahlungen durch wiederholte Aktionen verhindern. Nächste sinnvolle Aktionen im jeweiligen Kontext anbieten, ohne die freigegebene Aktionshierarchie zu verletzen. Bestehende Geschäftslogik nicht allein wegen UX-Vereinfachung ändern.
22. Dashboard, Finanzen und Auswertungen
Umsatz, Zahlungseingänge, Ausgaben, offene und überfällige Forderungen, Zahlungssaldo und Bankkontostand korrekt unterscheiden. Zeitraumwerte und Bestandswerte klar kennzeichnen. Fehlende Daten nicht als CHF 0.00 ausgeben, wenn dies sachlich falsch wäre. CHF-, Datums-, MWST-, Teilzahlungs- und Statusberechnungen prüfen. Vorhandene KPI-/Diagrammkomponenten zentral vereinheitlichen; klare Achsen, Zeiträume, auswählbare Datenpunkte und nachvollziehbare Detailwerte. Keine neue Designsprache und keine dekorativen Effekte.
23. Zeiterfassung
Auf Mobile: Titel/Tabs → Timerstatus und grosse Zeitanzeige → Start/Pause/Stop → Kunde/Projekt → heutige Einträge → manuelle Erfassung. Erforderliche Zuordnung vor Start sicherstellen beziehungsweise gültigen Default verwenden. Laufende Zeit darf bei Navigation, App-Wechsel, Reload oder Verbindungsunterbruch nicht verloren gehen. Laufende, abgeschlossene und heutige Gesamtzeit eindeutig unterscheiden. Freigaben und Bearbeitungsrechte prüfen.
24. Support, Tickets und Benachrichtigungen
Kurze lesbare Ticketnummern statt prominenter UUIDs; kompakte Titel und konsistente Status. Support-Chat: Header bleibt oben, Nachrichten scrollbar, Eingabe oberhalb der geöffneten iPhone-Tastatur. Browser und iOS-PWA testen. Anhänge und Dateivorschau über das zentrale Aktionssystem. Ticket erstellen, antworten, schliessen, wiederöffnen, interne Notizen und Benachrichtigungen rollen- und statusgerecht absichern. E-Mail-/Push-Einstellungen dürfen nur tatsächlich verfügbare Kanäle als aktiv darstellen.
25. Abonnement, Sicherheit und Datenschutz
Plan, Testphase, Demo-Modus, verbleibende Laufzeit, Zahlung und verfügbare Funktionen klar und widerspruchsfrei darstellen. Sicherheitsfunktionen wie 2FA, Passwortwechsel und Sitzungsverwaltung am tatsächlich implementierten Zustand ausrichten. Cookies und Einwilligungen nicht gleichzeitig mit widersprüchlichen Schaltflächen präsentieren. Serverseitige Autorisierung, Mandantentrennung und sensible Daten schützen.
26. Responsive, Safe Areas und Accessibility
Mobile-first für iPhone, iOS-PWA, Safari, Tablet und Desktop. Einheitliche Touch-Ziele, Kontraste, Fokus, Screenreader-Labels, Tastaturbedienung, Fehlermeldungen, Zoom und Reduced Motion. Bottom-Sheet-Overlay muss, soweit technisch möglich, den gesamten Hintergrund inklusive des Bereichs hinter der iPhone-Statusleiste abdunkeln; keinen weissen oberen Streifen. Keyboard-aware Sheets mit erreichbaren Footer-Aktionen. Der bestehende blaue Floating-Plus-Button und die Bottom-Navigation bleiben unverändert; darunterliegende Inhalte müssen dennoch erreichbar sein.
27. Globales Aktions- und Empty-State-Regelwerk absichern
PDF anzeigen/herunterladen, Anhänge hinzufügen, Bearbeiten, Duplizieren, Löschen usw. ausschliesslich über passende …-Menüs beziehungsweise das bestehende Floating-Plus-Schnellaktionsmenü, sofern es sich um Erstellung handelt. Keine zusätzlichen quadratischen Plus-Buttons neben Abschnittsüberschriften. Primäre Formularaktionen, Navigation, Suche/Filter und Timersteuerung bleiben direkt erreichbar. Leere Zustände maximal zwei Textzeilen, bevorzugt eine; keine grossen Karten, Illustrationen oder Zusatzbuttons. Zentrale Komponenten verwenden und Regressionstests ergänzen.
28. Formulare, Mustertexte und Kunden-Wizard
Alle geeigneten Eingabefelder erhalten sinnvolle, datentypgerechte Mustertexte oder Eingabehinweise; Labels bleiben sichtbar, Mustertexte werden niemals als echte Daten gespeichert. Schweizer Datums-, CHF-, Telefonnummern-, Adress- und IBAN-Formate berücksichtigen. Zentrale Validierung, Fokus-, Fehler- und Disabled-Zustände, mobile Tastaturen, Pflichtfelder, Doppelsubmit-Schutz und verständliche Fehlermeldungen.

Kunde erstellen in zwei Schritten: Grunddaten, dann ergänzende Details. Bei Firmenkunden bleiben Firmenname sowie Vorname und Nachname der primären Kontaktperson Pflicht. Der zweite Schritt darf nur fachlich optionale Angaben überspringen; Pflichtfelder müssen vor dem Speichern vollständig sein. Kundentypgerechte Felder. Bestehende Kunden direkt bearbeiten, ohne unnötigen Wizard. Andere Assistenten auf einheitliche Schritte und valide Datenübergaben prüfen.
29. CSS-, Komponenten- und Altlastenbereinigung
Vor jeder Änderung tatsächliche Root Cause im aktuellen Code ermitteln. CSS-Spezifität, doppelte Regeln, !important, feste Höhen, Overflow, Z-Index, veraltete Media Queries, parallele Komponenten/Hooks, doppelte Routen und Speicherwege prüfen. Bestehende zentrale UX-Foundation wiederverwenden und gezielt ergänzen; keine zweite Foundation, keine lokalen CSS-Workarounds. Ungenutzte Implementierungen nur nach Verwendungsprüfung entfernen. Keine Glass-, Blur- oder dekorativen Transparenzeffekte. Zuletzt freigegebene visuelle Referenzen sind verbindlich; ältere UX-Entwürfe nicht wieder einführen.
30. Teststrategie und Qualitätsnachweis
Bestehende Tests aktualisieren und gezielt ergänzen: Lint, Typecheck, Build, Unit-/Komponenten-Tests, Formularvalidierung, Rollen-/Mandantenrechte, Navigation, Aktionsmenüs, Empty States, Upload/PDF/QR-Rechnung, Rechnungs- und Zahlungslogik, Business-Flows, Accessibility, Safe Areas, Keyboard/iOS-PWA, Responsive und visuelle Regression. Während der Implementierung risikobasierte gezielte Tests; keine komplette Browser-Testsuite nach jeder Kleinigkeit. Vor Integration vollständige relevante Qualitätsprüfungen und repräsentative visuelle Abnahme. Fehlgeschlagene Tests ursächlich beheben; keine blinden Wiederholungen oder Umgehung von Gates.
31. GitHub, Dokumentation und Abnahme
Aktuellen Repository-Stand, offene PRs/Issues, GitHub Actions, Security-/Quality-Befunde und parallele Arbeiten berücksichtigen. Nach Freigabe nachvollziehbare Änderungen und PRs erstellen. Änderungsmatrix mit Ist-Zustand, Root Cause, Dateien, zentraler Korrektur, entfernten Altlasten, Tests und verbleibenden Risiken führen. Kein produktiver Deploy und keine risikoreichen produktiven Datenbank-/Infrastrukturänderungen ohne separate ausdrückliche Freigabe. Keine Secrets veröffentlichen. Keine Erfolgsmeldung allein aufgrund grüner Builds; tatsächliche UX-Abnahme erforderlich.
32. Abschlusskriterien und Freigabe
Abschluss erst nach nachgewiesener Prüfung aller Seiten, Unterseiten, Rollen, Navigationspunkte, Profileinstellungen, Formulare, Komponenten und relevanten Geschäftsprozesse. Keine unnötigen Doppelungen, keine verstreuten PDF-/Anhang-Plus-Aktionen, keine mehrzeiligen grossen Empty States, keine widersprüchlichen Finanzzustände, keine abgeschnittenen Inhalte. Bestehende Bottom-Navigation, runder blauer Plus-Button, einfache „Mehr“-Liste und aktuelle weiss-blaue Designsprache bleiben erhalten. Offene Punkte ehrlich dokumentieren.

STOPPREGEL: Bis zur ausdrücklichen Nachricht „umsetzen“ nur Anforderungen sammeln und prüfen; keinerlei Codeänderung, Commit, PR, Merge oder Deploy. Auch nach „umsetzen“ bleibt ein Produktivdeploy von einer separaten Freigabe abhängig.

ENDE DER SPEZIFIKATION – Kapitel 18 bis 32 vollständig.
## Umsetzungsfreigabe und Präzisierungen, 19.10.2026

Die Sammlung wurde ausdrücklich zur Implementierung freigegeben. Navigation und bestehender blauer Plus-Button bleiben im aktuellen Zustand unverändert; ihre Gestaltung und Position werden in V25 nicht verändert.

- Häufige notwendige Hauptaktionen und das direkte Öffnen von Dokumenten bleiben erreichbar. Sekundäre Objektaktionen gehören ins Kontextmenü.
- Kurze Empty-State-Texte, keine erzwungene Zeilenbegrenzung oder abgeschnittene Inhalte bei Zoom/grosser Systemschrift. Sicherheits- und Fehlermeldungen bleiben vollständig.
- Nur fachlich identische Logik zentralisieren. Geschäftsfehler von reinen Darstellungskorrekturen abgrenzen und stärker absichern.
- Eine definierte Browsermatrix und reale iPhone-/PWA-Abnahme ersetzen keine pauschale Garantie für alle Geräte.
- Kein Produktivdeployment ohne separate ausdrückliche Freigabe.
