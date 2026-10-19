> Stand 19.10.2026: V25.1-Anforderungssammlung mit den besprochenen Präzisierungen. Die Codeimplementierung ist durch die anschliessende ausdrückliche Anweisung «dan mach das» freigegeben. Bestehende V25-Fachanforderungen und Sicherheitskontrollen bleiben erhalten; V25.1 ersetzt nur ausdrücklich widersprechende UX-Vorgaben. Die jüngste Freigabe für Navigation und Plus-Button bleibt verbindlich. Historische Merge-/Deployment-Freigaben gelten nicht für dieses neue Paket.

# BINSO ONE – V25.1 GLOBAL UX CORRECTION & STANDARDIZATION

**Repository:** `oemercam/binso_admin_azure`

**Auftrag:** Vollständige UX-Nachbesserung, Root-Cause-Analyse, zentrale Komponentenstandardisierung und technische Qualitätssicherung.

**Grundlage:** Aktueller Repository-Stand, zuletzt freigegebener Binso-One-UX-Standard, V25-Anforderungssammlung und aktuelle iPhone-Screenshots.

## 1. Verbindliche Designvorgaben

Die bestehende, zuletzt freigegebene UX-Foundation ist die einzige gültige Designgrundlage.

Unverändert erhalten bleiben:

- Bestehende Bottom-Navigation.
- Bestehender runder blauer Floating-Plus-Button, einschliesslich Gestaltung, Position und Funktion.
- Bestehendes weiss-blaues Design und dessen Design-Tokens.
- Einfache Liste im Menü «Mehr», ohne zusätzliche Gruppierungen.
- Vorhandene, funktionierende Geschäftsprozesse und Berechtigungen.

Ausdrücklich verboten:

- Glassmorphism, Blur- oder dekorative Transparenzeffekte.
- Neue Designsysteme oder parallele UX-Foundations.
- Eigenmächtige Redesigns.
- Lokale CSS-Workarounds zur Überdeckung zentraler Fehler.
- Unnötige Schatten, Animationen und zusätzliche Aktionsbuttons.

Ältere widersprüchliche UX-Entwürfe sind ungültig. Weiterhin gültige fachliche Anforderungen bleiben erhalten.

## 2. Vollständige Root-Cause-Analyse

Prüfe alle Seiten, Unterseiten und Komponenten des aktuellen Repositories.

Untersuche insbesondere:

- Doppelte oder widersprüchliche CSS-Regeln.
- Unterschiedliche Abstands- und Grössendefinitionen.
- Lokale Komponentenvarianten.
- Veraltete Styles und Layouts.
- Unnötige feste Höhen und Mindesthöhen.
- Overflow-, Scroll- und Z-Index-Probleme.
- Uneinheitliche Formularfelder.
- Doppelte Aktionsmöglichkeiten.
- Unterschiedliche KPI- und Diagrammkomponenten.
- Inkonsistente Bottom Sheets und Dialoge.
- Fehlerhafte Safe-Area-Behandlung.

Dokumentiere für jede relevante Abweichung die tatsächliche Ursache und die betroffenen Dateien.

Verwende bestehende zentrale Komponenten. Ergänze diese nur, wenn erforderlich.

## 3. Formulare und Eingabefelder

Standardisiere sämtliche Formulare und Assistenten.

Verbindliche Anforderungen:

- Einheitliche Feldhöhen, Labels, Abstände und Rahmen.
- Einheitliche Fokus-, Fehler- und Disabled-Zustände.
- Sinnvolle Mustertexte für alle geeigneten Eingabefelder.
- Schweizer Datums-, Telefon-, Adress- und Zahlenformate.
- Korrekte mobile Tastatur je Eingabetyp.
- Keine doppelten Feldumrandungen.
- Keine überlappenden Labels.
- Keine unnötigen Trennlinien.
- Verständliche Validierung direkt am Feld.
- Keine Speicherung von Mustertexten als echte Werte.

Prüfe insbesondere Kunden, Firmenprofil, persönliche Daten, Angebote, Rechnungen, Zeiterfassung, Support und Einstellungen.

**Fachliche Pflichtfelder bleiben erhalten.** Bei Firmenkunden sind Firmenname sowie Vor- und Nachname der Kontaktperson Pflicht.

## 4. Firmenprofil und Datei-Upload

Korrigiere die uneinheitliche Dateiauswahl im Formular «Firmendaten bearbeiten».

Ersetze die sichtbar native Dateiauswahl durch die bestehende beziehungsweise zentral ergänzte Upload-Komponente im freigegebenen Design.

Die Komponente soll unterstützen:

- Aktuelles Firmenlogo anzeigen.
- Neue Datei auswählen.
- Datei ersetzen oder entfernen, sofern berechtigt.
- Dateityp und Dateigrösse validieren.
- Upload-Fortschritt und Fehler anzeigen.
- Korrekte Darstellung auf Mobile und Desktop.

Die Dateiauswahl innerhalb eines Bearbeitungsformulars bleibt ein Formularelement. Keine zusätzliche globale Aktionsfläche erstellen.

## 5. Bottom Sheets, Dialoge und Assistenten

Prüfe die gemeinsame Bottom-Sheet-Architektur.

Kurze Aktionsmenüs sollen sich inhaltsabhängig dimensionieren.

Lange Formulare dürfen den verfügbaren Bildschirm sinnvoll nutzen, müssen aber einen korrekt scrollbaren Inhaltsbereich besitzen.

Verbindlich:

- Einheitlicher Header und Schliessmechanismus.
- Korrekte Safe Areas.
- Keine doppelten Titel.
- Keine unnötigen Leerflächen.
- Formular-Footer bleibt erreichbar.
- Keine abgeschnittenen Felder.
- Keine unkontrollierten verschachtelten Scrollbereiche.
- Korrektes Verhalten bei geöffneter Tastatur.
- Korrekte Darstellung in iPhone Safari und iOS-PWA.

Prüfe auch die Abdunklung des Hintergrunds einschliesslich des technisch kontrollierbaren oberen Bildschirmbereichs.

Verändere keine nativen Browser-Bedienelemente ausserhalb der Anwendung.

## 6. Dropdowns und DatePicker

Überprüfe sämtliche Select-, Combobox- und Datumsfelder.

Die bisherigen Screenshots zeigen uneinheitliche Dropdown-Darstellungen und sehr grosse Auswahlmenüs.

Korrigiere zentral:

- Breite und Positionierung.
- Abstände und Schriftgrössen.
- Fokusrahmen.
- Auswahlmarkierungen.
- Maximale Höhe.
- Scrollverhalten.
- Keyboard-Bedienung.
- Touch-Bedienung.
- Z-Index.
- Verhalten innerhalb von Bottom Sheets.

Für DatePicker gilt:

- Einheitliche Darstellung im freigegebenen Design, soweit technisch kontrollierbar.
- Schweizer Datumsformat.
- Verständliche Monats- und Jahresnavigation.
- Korrekte Auswahl und Bestätigung.
- Keine Überlagerung anderer Formularelemente.
- Kein Datenverlust beim Schliessen.

Bestehende native Eingabemechanismen dürfen verwendet werden, wenn sie funktional zuverlässiger sind und den UX-Anforderungen entsprechen.

## 7. Globale Aktionen

Prüfe sämtliche Seiten auf zusätzliche oder verstreute Aktionsbuttons.

Funktionen an bestehenden Objekten gehören in das kontextspezifische Drei-Punkte-Menü.

Dazu gehören insbesondere:

- PDF anzeigen und herunterladen.
- Exportieren, beispielsweise CSV.
- Bearbeiten und Duplizieren.
- Anhänge hinzufügen und verwalten.
- Löschen und Stornieren.
- Weitere objektbezogene Aktionen.

Erstellungsfunktionen werden über das bestehende zentrale beziehungsweise kontextspezifische Schnellaktionsmenü bereitgestellt.

Primäre Formularaktionen (Speichern und Bestätigen), notwendige Wiederholungsaktionen nach Fehlern, Timersteuerungen, Navigation, Suche und Filter bleiben direkt bedienbar. Die Logo-Dateiauswahl bleibt im Bearbeitungsformular. Kontextmenüs dürfen notwendige Hauptaktionen nicht unnötig verstecken.

Verhindere doppelte Aktionen mit unterschiedlichen Implementierungen.

## 8. Empty States

Verwende eine zentrale Empty-State-Komponente.

Verbindlich:

- Bevorzugt maximal zwei Textzeilen als Gestaltungsziel, keine harte Zeilenbegrenzung. Bei Zoom, grosser Systemschrift und Übersetzungen vollständig umbrechen; nichts abschneiden. Sicherheits-, Fehler- und Berechtigungshinweise bleiben vollständig.
- Bevorzugt eine kompakte Zeile.
- Keine grossen leeren Karten.
- Keine Illustrationen.
- Keine überflüssigen Erklärungen.
- Keine zusätzlichen Aktionsbuttons.

Prüfe sämtliche Listen, Dateien, Kontakte, Anhänge, Suchergebnisse und andere leere Zustände.

## 9. Finanzanalyse und Diagramme

Die aktuellen Screenshots zeigen weiterhin Abweichungen bei Diagrammen, Kennzahlen und Beschriftungen.

Prüfe und korrigiere:

### Linien- und Balkendiagramme

- Einheitliche Diagrammabstände.
- Verständliche Achsen.
- Korrekte Währungsdarstellung.
- Lesbare Monatsbezeichnungen.
- Responsives Verhalten.
- Korrekte Darstellung aller Datenpunkte.
- Auswahl von Datenpunkten für Detailinformationen.
- Kein Abschneiden durch Navigation oder Container.

### Donut-Diagramm

Die Beschriftung und der Betrag im Zentrum des Forderungsdiagramms sind sichtbar überlagert beziehungsweise abgeschnitten.

Korrigiere die Ursache zentral.

Beträge, Legenden und Prozentwerte müssen bei allen unterstützten Bildschirmgrössen lesbar sein.

Falls der Gesamtbetrag nicht zuverlässig in den Ring passt, zeige ihn ausserhalb des Diagramms in einer kompakten, eindeutig zugeordneten Kennzahl.

### Kennzahlen

Verwende die bestehende UX-Foundation für einheitliche KPI-Darstellungen.

Unterscheide fachlich:

- Zeitraumwerte.
- Aktuelle Bestandswerte.
- Einnahmen.
- Ausgaben.
- Forderungen.
- Zahlungssaldo.
- Tatsächlichen Bankkontostand.

Fehlende oder unvollständige Daten dürfen nicht als vollständige Nullwerte erscheinen.

Prüfe die Berechnungen anhand der tatsächlichen Datenquellen. Dokumentiere je Kennzahl Datenquelle, Zeitraum beziehungsweise Stichtag, Berechnungsregel und Verhalten bei fehlenden Daten. Erfasste Zahlungen allein belegen keinen Bankkontostand. Nachgewiesene fachliche Berechnungsabweichungen zuerst als gesonderten Befund mit Auswirkungen und Regressionserfordernissen dokumentieren; nicht beiläufig als Darstellungskorrektur ändern.

## 10. Berichte

Standardisiere die Berichtsansichten.

Korrigiere:

- Uneinheitliche KPI-Anordnung.
- Übermässige vertikale Abstände.
- Unterschiedliche Typografie für gleichwertige Kennzahlen.
- Vermischung von Bestands- und Zeitraumwerten.
- Unklare Beschriftungen.
- Redundante Erklärtexte.
- Separate Export-Aktionsbuttons.

«CSV exportieren» gehört in das zuständige Aktionsmenü.

Die Exportfunktion muss vollständig erhalten bleiben.

Prüfe, ob Berichtskennzahlen fachlich korrekt berechnet werden und dieselben zentralen Definitionen verwenden wie Dashboard und Finanzanalyse.

## 11. Benachrichtigungen und Einstellungen

Prüfe sämtliche Einstellungsseiten auf konsistente Darstellung.

Insbesondere:

- Benachrichtigungen.
- Sicherheit.
- Persönliche Daten.
- Firma.
- Benutzer und Rollen.
- Abonnement.
- Rechnungen und Dokumente.
- Zeiterfassung.
- Datenschutz.

Verwende zentrale Komponenten für Einstellungszeilen und Schalter.

Reduziere unnötige vertikale Abstände, ohne die Bedienbarkeit einzuschränken.

E-Mail- und Push-Einstellungen bleiben unabhängig konfigurierbar.

Entferne doppelte Überschriften und unnötig wiederholte Erklärungstexte.

Prüfe, ob Einstellungen zwischen Konto, Profil und Unternehmensverwaltung doppelt implementiert sind.

Mehrere sinnvolle Navigationswege dürfen bestehen bleiben, müssen aber auf dieselbe Funktion zugreifen.

Das Menü «Mehr» bleibt eine einfache Liste ohne neue Gruppierungen.

## 12. Dashboard und Kundenansichten

Prüfe die Startseite und Kunden-360°-Ansichten.

Ziele:

- Kompakte, klar beschriftete Kennzahlen.
- Eindeutig identifizierbare Geschäftsvorgänge.
- Korrekte Beträge und Statusanzeigen.
- Verständliche Fälligkeitsinformationen.
- Keine doppelten Erstellungsaktionen.
- Einheitliche Listenzeilen.
- Konsistente Detailnavigation.
- Keine unnötigen Akkordeons.
- Keine mehrfach dargestellten Informationen.

Die bestehenden Navigations- und Aktionskonzepte bleiben verbindlich.

## 13. Zeiterfassung

Prüfe Timer, manuelle Zeiterfassung und Zeiteintragslisten.

Verbindlich:

- Timerstatus und grosse Zeitanzeige vor den Zuordnungsfeldern.
- Start/Pause/Stop direkt erreichbar.
- Danach Kunde, Auftrag beziehungsweise Projekt.
- Heute-Einträge und manuelle Erfassung darunter.
- Laufende Zeit darf nicht verloren gehen.
- Fachliche Pflichtzuordnungen müssen validiert werden.
- Datum und Dauer müssen zuverlässig erfasst werden.
- Einheitliche Select- und Formular-Komponenten.

Prüfe die Speicherung und Wiederherstellung laufender Timer.

## 14. Support und Chat

Prüfe Supportlisten, Tickets und Chat.

Insbesondere:

- Kompakte Ticketnummern.
- Verständliche Titel und Status.
- Einheitliche Aktionsmenüs.
- Keyboard-aware Chat-Eingabe.
- Nachrichtenbereich scrollbar.
- Eingabe oberhalb der Tastatur.
- Korrektes Verhalten auf iPhone Safari und iOS-PWA.
- Keine abgeschnittenen Nachrichten.
- Einheitliche Datei- und Anhangsverwaltung.

## 15. Globale UX-Regressionen verhindern

Ergänze gezielte automatisierte Prüfungen für die zentralen UX-Regeln.

Prüfe unter anderem:

- Keine unzulässigen zusätzlichen Aktionsbuttons.
- Keine doppelten FormField-Rahmen.
- Einheitliche Empty States.
- Keine veralteten Komponentenvarianten.
- Keine unerlaubten CSS-Overrides.
- Keine parallelen UX-Foundations.
- Korrekte Formularvalidierung.
- Berechtigungsabhängige Aktionen.
- Responsive Diagramme.
- Funktionierende Navigation.
- Korrekte Bottom-Sheet-Zustände.

Prüfe die tatsächliche Renderdarstellung zusätzlich durch repräsentative Browser- und Mobile-Tests. Ordne jeden gemeldeten Screenshot einer Seite, einem Zustand und einer Bildschirmgrösse zu; kennzeichne unbekannte Angaben und fehlende Screenshots als offene Evidenz. Führe Vorher-/Nachher-Nachweise unter denselben Bedingungen. Echte Safari-/iOS-PWA-Tastatur-, Safe-Area- und Startup-Nachweise auf physischen Geräten bleiben eine gesonderte Abnahme; Emulation ersetzt diese nicht.

Ein erfolgreicher Build allein gilt nicht als UX-Abnahme.

## 16. Test- und Arbeitsstrategie

Arbeite effizient und vermeide unnötig wiederholte vollständige Browsertests.

Vorgehen:

1. Aktuellen Repository-Stand und Änderungen seit V25 prüfen; vorhandenes V25-Inventar und Abnahmematrix weiterführen. Keine erneute Vollanalyse bereits belegter unveränderter Bereiche. Alle Seiten bleiben im Umfang; zentrale Fehler über konkrete betroffene Ansichten verfolgen.
2. Betroffene Komponenten und Ursachen identifizieren.
3. Korrekturen fachlich zusammenfassen.
4. Zentrale Implementierung korrigieren.
5. Gezielte Komponenten- und Funktionstests durchführen.
6. Nach Abschluss der Änderungen vollständige relevante QA ausführen.
7. Repräsentative visuelle Browserprüfungen durchführen.
8. Regressionen beheben.
9. Ergebnisse dokumentieren.

Verwende vorhandene Tests und ergänze fehlende Prüfungen gezielt.

Führe keine doppelten Testläufe ohne technischen Grund aus.

## 17. Dokumentation und Abnahme

Erstelle eine nachvollziehbare Abnahmematrix mit:

- UX-Anforderung.
- Betroffener Seite beziehungsweise Komponente.
- Festgestellter Root Cause.
- Technischer Korrektur.
- Betroffenen Dateien.
- Testergebnis.
- Visuellem Ergebnis.
- Verbleibenden Einschränkungen.

Dokumentiere nicht umgesetzte Punkte ausdrücklich. Ein Punkt gilt nur mit technischem und gegebenenfalls visuellem Nachweis als erledigt. Begründet offene Punkte bleiben offen und gelten nicht als erfolgreiche Umsetzung; ein dokumentierter Restpunkt ist keine vollständige Abnahme.

Kennzeichne Einschränkungen durch native Browserfunktionen oder fehlende Testumgebungen.

Behaupte keine erfolgreiche Prüfung ohne tatsächlichen Nachweis.

## 18. GitHub und Deployment

Arbeite auf einem geeigneten Branch des aktuellen Repositories.

Berücksichtige offene Pull Requests und bereits integrierte Änderungen.

Führe die vorhandenen relevanten Prüfungen aus, insbesondere:

- Lint.
- Typecheck.
- Build.
- Unit-Tests.
- Integrationstests.
- Geschäftsprozessprüfungen.
- Gezielte UI-Regressionstests.
- Relevante Sicherheitsprüfungen.

Erstelle einen nachvollziehbaren Pull Request mit Testergebnissen und Abnahmematrix.

Korrigiere auftragsbezogene Fehler anhand der tatsächlichen Logs.

Keine blinden Workflow-Wiederholungen.

Keine risikoreichen Datenbank- oder Infrastrukturänderungen.

**Kein Merge und kein produktiver Deploy ohne ausdrückliche Freigabe.**

## 19. Verbindliche Erfolgskriterien

Der Auftrag ist erst abgeschlossen, wenn:

1. Alle betroffenen zentralen Komponenten überprüft wurden.
2. Die dokumentierten UX-Abweichungen korrigiert oder begründet als offen ausgewiesen sind.
3. Die freigegebene Designsprache erhalten geblieben ist.
4. Keine neue parallele UX-Foundation entstanden ist.
5. Keine funktionierenden Geschäftsprozesse beschädigt wurden.
6. Die relevanten automatisierten Tests erfolgreich sind.
7. Repräsentative Mobile- und Desktop-Ansichten visuell geprüft wurden.
8. Die Änderungen im Pull Request nachvollziehbar dokumentiert sind.

## 20. Freigabe

Dieser Auftrag ergänzt die bestehende V25-Master-Spezifikation und ersetzt widersprüchliche ältere UX-Anweisungen.

Er ist keine Freigabe für ein Redesign.

Er ist keine Freigabe für produktive Datenbankänderungen.

Er ist keine Freigabe für einen produktiven Deploy.

**Implementierung ausdrücklich freigegeben. Kein Merge und kein Deployment aus dieser Freigabe.**