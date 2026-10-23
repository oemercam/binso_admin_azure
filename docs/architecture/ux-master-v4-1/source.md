# BINSO ONE – GLOBAL UX MASTER V4.1
## Konsolidierter Implementierungsauftrag – Einstellungen, Navigation, Finanzen, Berichte und Detailseiten

**Repository:** `oemercam/binso_admin_azure`  
**Arbeitsumgebung:** ChatGPT Work mit Live-Vorschau  
**Grundlage:** Global UX Master V4 und sämtliche freigegebenen UX-Verträge  
**Geltungsbereich:** Landingpage, Kunden-App und Admin-App

---

## 1. Verbindliches Ziel

Optimiere sämtliche betroffenen Seiten und Unterseiten anhand der bereits freigegebenen kompakten Binso-One-UX.

Keine eigenständige Neugestaltung.

Verwende den vorhandenen Projektcode und die bestehenden zentralen Komponenten.

Kunden-App und Admin-App müssen dieselbe UX-Foundation verwenden.

Die Landingpage behält ein eigenständiges Marketinglayout mit gemeinsamer Markenidentität.

Alle Änderungen müssen auf Desktop, Tablet, Mobile-Browser und PWA konsistent funktionieren.

Unterstützte Sprachen: DE, FR, IT, EN und TR.

## 2. Globale Darstellung

Verbindlich:

- Inter-Typografie.
- Einheitliche Schriftgrössen und Zeilenhöhen.
- Einheitliche Seitenränder und Inhaltsbreiten.
- Kompakte Karten mit dezenten Rahmen.
- Einheitliche Rundungen und Abstände.
- Keine unnötigen Leerflächen.
- Keine redundanten Seitenbeschreibungen.
- Keine doppelten Abschnittsüberschriften.
- Keine übergrossen Profilbilder.
- Keine unnötigen Status-Badges.
- Keine mehrzeiligen Erklärungen unter Kennzahlen.
- Keine verstreuten Aktionsbuttons.

Stammdaten und lange Werte werden linksbündig unter der jeweiligen Feldbezeichnung angezeigt.

Kurze Kennzahlen und Statuswerte dürfen links/rechts angeordnet werden.

Listeneinträge zeigen maximal zwei Textzeilen.

## 3. Header und Navigation

### Übersichts- und Listenseiten – Mobile/PWA

- Seitentitel links.
- Rechts Suche, Benachrichtigungen und Avatar.
- Kein Drei-Punkte-Menü.
- Keine vierte Header-Aktion.
- Keine doppelten Seitentitel.

### Detailseiten – Mobile/PWA

- Zurück-Pfeil links.
- Zentrierter Seitentitel.
- Ein Drei-Punkte-Menü rechts, sofern zulässige Datensatzaktionen vorhanden sind.
- Keine zusätzliche globale Suche, Glocke oder Avatar.

### Unveränderliche Bestandteile

Die bestehende Bottom-Navigation bleibt unverändert.

Der bestehende blaue Floating-Plus-Button bleibt in Gestaltung, Grösse und Position unverändert.

Keine neuen parallelen Navigationssysteme.

## 4. Globale Aktionen

**Plus (+):**
- Neue Datensätze erstellen.
- Neue Dateien und Anhänge hinzufügen.
- Neue Zeiteinträge und Spesen erfassen.
- Weitere tatsächlich vorhandene Erstellaktionen.

**Drei Punkte (…):**
- Bestehende Datensätze bearbeiten.
- PDF anzeigen oder herunterladen.
- Versenden, duplizieren, exportieren oder teilen.
- Archivieren, stornieren oder löschen, soweit zulässig.

**Direkte Prozessaktionen:**
- Timer Start/Pause/Stop.
- Speichern und Abbrechen.
- Bestätigen und Ablehnen.
- Suche, Filter und Sortierung.
- Navigation.

Keine Drei-Punkte-Menüs innerhalb von Cards, Listenzeilen oder Inhaltsbereichen.

Mobile Aktionsmenüs verwenden die bestehende zentrale BottomSheet-Komponente.

Desktop verwendet das entsprechende Popover.

## 5. Globale Werkzeugleiste

Listen- und Bereichswerkzeuge müssen auf allen Seiten an derselben Position stehen.

- Zeitraum, Suche oder Abschnittsauswahl links.
- Werkzeugzugang immer ganz rechts in derselben Steuerungszeile.
- Einheitliche Höhe, Abstände und Touchflächen.
- Keine Werkzeug-Icons unmittelbar neben dem Zeitraum, wenn rechts Platz vorhanden ist.
- Zahnrad ausschliesslich für echte Einstellungen.
- Schieberegler-Icon für allgemeine Listenwerkzeuge.
- Sortier-Icon für Sortierung.
- Filter-Icon für Filter.

Keine zusätzlichen Werkzeug-Icons im globalen Header.

Wenn keine Werkzeugaktionen existieren, keinen leeren Werkzeugbutton anzeigen.

## 6. Suche, Filter und Sortierung

### Suche

- Suchsymbol links.
- Genau ein X rechts bei vorhandenem Suchtext.
- Keine doppelten nativen Browser-X.
- Suche unmittelbar aktualisieren.
- Fokus nach Löschen erhalten.
- Keine doppelten Fokusrahmen.

### Sortierung

Einfache Sortierung öffnet ein kompaktes Dropdown direkt am Sortier-Icon.

Kein Bottom Sheet.

Dropdown:
- Ca. 230 px Breite.
- Einzeilige Optionen.
- Keine pillenförmigen Buttons.
- Keine Einzelrahmen pro Option.
- Mindestens 44 px Zeilenhöhe.
- Aktive Option mit blauem Häkchen rechts.
- Automatische Positionierung innerhalb des Viewports.
- Schliessen nach Auswahl, Escape oder Antippen ausserhalb.

### Filter

Einfache Filter als Dropdown.

Komplexe Filter als Bottom Sheet auf Mobile.

### Zurücksetzen

Bei aktiver, vom Standard abweichender Auswahl eine kompakte Statuszeile anzeigen.

Links beispielsweise:
«Sortierung: Name A–Z»

Rechts:
«Zurücksetzen»

Kein zusätzlicher grosser Button.

Zurücksetzen muss den fachlich richtigen Zustand wiederherstellen. Suche, Filter und Sortierung dürfen nicht unbeabsichtigt gemeinsam gelöscht werden.

## 7. Zeitraumfilter

Mobile/PWA:
- Kompakte Zeitraumzeile.
- Beispiel «Oktober 2026 ˅».
- Bottom Sheet für Schnellzeiträume und individuelle Datumsauswahl.

Desktop:
- Kompakte Segmentauswahl für 1, 3, 6 und 12 Monate.
- Kalender für individuelle Auswahl.

Keine doppelten Datumszeilen.

Zeitabhängige Kennzahlen und Diagramme verwenden denselben ausgewählten Zeitraum.

## 8. KPI-Karten und Trends

Alle geeigneten KPI-Karten:

- Kurze Bezeichnung oben links.
- Prozenttrend oben rechts.
- Grosser Wert darunter.
- CHF kompakt neben dem Betrag.
- Keine zusätzlichen Beschreibungszeilen.
- Einheitliche Kartenhöhe.
- Mobile zwei Spalten.
- Desktop vier Spalten bei ausreichender Breite.

Trend:
- Grün bei fachlich positiver Entwicklung.
- Rot bei fachlich negativer Entwicklung.
- Neutral bei nicht bewertbarer Entwicklung.
- Keine erfundenen Prozentwerte.
- Keine Prozentzahl bei fehlender Vergleichsbasis.

## 9. Finanzdiagramme

Semantische Farben:

- Einnahmen: Grün `#16A34A`.
- Ausgaben: Rot `#DC2626`.
- Neutrale Kennzahlen: Blau `#2563EB`.
- Fehlende Daten: Grau.

Kompakte Diagramme mit lesbaren Zeitachsen und verständlichen Tooltips.

Keine abgeschnittenen Monatsnamen.

Keine langen Erklärungen unter Diagrammen.

Keine künstlichen Daten.

Fakturierten Umsatz, Zahlungseingänge, Ausgaben und Zahlungssaldo fachlich unterscheiden.

## 10. Finanzübersicht und Finanzanalyse

Optimiere beide Seiten auf dieselbe zentrale KPI-, Chart- und Toolbar-Foundation.

Entferne:
- Redundante Seitenbeschreibungen.
- Doppelte Überschriften.
- Mehrzeilige KPI-Erklärungen.
- Unnötige Datumszeilen.
- Verstreute Werkzeug-Icons.
- Zusätzliche Aktionsbuttons.

Finanzanalyse:
- Einnahmen.
- Ausgaben.
- Zahlungssaldo.
- Prozenttrends.
- Kompaktes Zeitreihendiagramm.
- Zentrale Zeitraumsteuerung.

Bestehende Finanzberechnungen unverändert erhalten.

Zahlungssaldo darf nicht als Bankkontostand bezeichnet werden.

## 11. Berichte

Ersetze die aktuelle lange, unstrukturierte Berichtsseite durch klar gruppierte Auswertungen.

Vorhandene Bereiche logisch strukturieren:

- Unternehmensbestand.
- Kundenentwicklung.
- Finanzen.
- Arbeitszeit.
- Aufträge.
- Angebote und Rechnungen.
- Spesen.
- Mitarbeiter.

Kompakte Tabs oder Abschnitte verwenden, abhängig vom tatsächlichen Umfang.

Bestandskennzahlen und Zeitraumkennzahlen fachlich unterscheiden.

Einheitliche KPI-Karten.

Keine langen Beschreibungen.

Keine Drei-Punkte-Menüs innerhalb von Berichtskarten.

Export und Download über den zentralen Berichts-/Werkzeugzugang.

Keine neuen Berichte erfinden.

## 12. Persönliches Konto und Profil

Persönliche Daten ausschliesslich über den Avatar erreichbar machen.

Profil:
- Kompakter Avatar.
- Name und Rolle.
- Keine doppelte E-Mail-Anzeige.
- Keine redundante Seitenbeschreibung.
- Alle Stammdaten linksbündig.
- Feldbezeichnung oberhalb des Wertes.
- Lange E-Mail-Adressen und Anschriften korrekt umbrechen.
- Fehlende Werte als «Nicht hinterlegt».
- Bearbeiten über die vorhandene Detailheader-Aktion.

Keine zusätzlichen Bearbeiten-Buttons innerhalb der Seite.

## 13. Trennung Avatar und Mehr

**Avatar = persönliche Einstellungen.**

Dazu gehören:
- Persönliche Daten.
- Profilbild.
- Passwort.
- MFA und Passkeys.
- Aktive Sitzungen.
- Persönliche Benachrichtigungen.
- Darstellung.
- Sprache.
- Persönliche Datenschutzeinwilligungen.
- Abmelden.

**Mehr = Unternehmen und Verwaltung.**

Dazu gehören:
- Firmendaten.
- Mitarbeiter und Unternehmensrollen.
- Abonnement.
- Bankverbindungen.
- Rechnungs- und Angebotsvorgaben.
- Dokumentvorlagen.
- Unternehmensdatenschutz.
- Weitere Fachmodule und Support.

Admin-App:
- Persönliche Administratoreinstellungen über Avatar.
- Plattformverwaltung über die bestehende Adminnavigation.

Keine doppelten Einstellungsmenüs.

Jede Einstellungsroute besitzt genau einen primären Navigationsort.

Bestehende gültige Deep-Links erhalten.

## 14. Globale Einstellungsdarstellung

Alle Einstellungen verwenden vier zentrale Bedienmuster:

1. Toggle für echte Ein/Aus-Einstellungen.
2. Navigationszeile mit Chevron für Unterseiten.
3. Kompaktes Dropdown für einfache Wertauswahl.
4. Geführter Ablauf für sicherheitskritische Änderungen.

Keine verstreuten Buttons wie:
- Passkey hinzufügen.
- Erneut versuchen.
- Datei hinzufügen.
- Bearbeiten.
- Exportieren.

Stattdessen vorhandene Funktionen in passende Navigations- oder Aktionsabläufe integrieren.

Keine doppelten Abschnittsüberschriften.

Keine langen technischen Fehlermeldungen.

Keine unnötigen Leerflächen.

## 15. Sicherheitseinstellungen

Standardisiere:

- Passwort ändern.
- Zwei-Faktor-Authentifizierung.
- Passkeys.
- Verpflichtenden E-Mail-Anmeldeschutz.
- Aktive Sitzungen.
- Geräteverwaltung.

Passwort ändern:
- Navigationszeile mit Chevron.
- Eigenes Formular.

MFA:
- Toggle mit sicherem Einrichtungs-/Deaktivierungsprozess.
- Zustand erst nach erfolgreicher Bestätigung übernehmen.
- Keine blinde Aktivierung.

Passkeys:
- Eigene kompakte Verwaltungsansicht.
- Registrierte Passkeys anzeigen.
- Hinzufügen über eine navigierbare Aktion.
- Kein einfacher Ein/Aus-Toggle.

Verpflichtender E-Mail-Anmeldeschutz:
- Kompakter Status.
- Kein abschaltbarer Toggle.

Aktive Sitzungen:
- Kompakte Geräteliste.
- Aktuelle Sitzung markieren.
- Andere Sitzungen nur nach vorhandenen Sicherheitsregeln beenden.

Keine Sicherheitsregeln abschwächen.

## 16. Datenschutz und Cookies

Ersetze die aktuelle lange Seite durch drei kompakte Bereiche:

**Notwendig**
- Anmeldung & Sicherheit.
- Rechts «Immer aktiv».
- Kein Toggle.

**Optional**
- Performance-Messung.
- Toggle rechts in derselben Zeile.
- Tatsächlichen Consent sicher speichern.
- Widerruf muss wirksam sein.
- Keine optionale Messung ohne gültige Zustimmung.

**Rechtliches**
- Datenschutzerklärung als Navigationszeile.
- Unterauftragsbearbeiter als Navigationszeile.
- Chevron rechts.
- Keine grossen Linkbuttons.

Bestehende rechtliche Inhalte unverändert erhalten.

## 17. Firmenprofil

Kompakter Profilkopf mit kleinem Firmenlogo.

Keine doppelte Firmenbezeichnung.

Keine redundante Beschreibung.

Stammdaten linksbündig mit Bezeichnung oberhalb des Wertes.

Betroffene Felder:
- Firmenname.
- UID.
- Adresse.
- E-Mail.
- Telefon.
- Weitere vorhandene Stammdaten.

Bearbeiten über das Detailheader-Menü.

Firmenlogo im vorhandenen Bearbeitungsprozess verwalten.

Keine zusätzlichen Upload- oder Bearbeiten-Buttons auf der Detailseite.

## 18. Abonnement

Ersetze die lange technische Darstellung durch:

**Kompakte Abonnementkarte**
- Paketname.
- Tatsächlicher Status.
- Tatsächlich gültige Preis- und Abrechnungsinformationen.
- Paketdetails bei Bedarf aufklappbar.

**Abrechnung**
- Zahlungsmethode als Navigationszeile.
- SaaS-Rechnungen als Navigationszeile.
- Kompakter Verfügbarkeitsstatus.

**Nutzung**
- Benutzer.
- Speicher.
- Weitere tatsächlich vorhandene Limits.

Keine technischen Providerfehler prominent anzeigen.

Tarifpreis, tatsächliche Abrechnung, Testphase und Zahlungsstatus fachlich trennen.

Keine Preise, Limits oder Verlängerungsdaten erfinden.

## 19. Rechnungs- und Angebotseinstellungen

Ersetze das überlange Bottom Sheet durch eine kompakte Einstellungsübersicht mit getrennten Unterseiten.

**Rechnungsvorgaben**
- Standard-MwSt.
- Zahlungsfrist.
- Weitere vorhandene Standardwerte.

**Bankverbindung**
- IBAN.
- QR-IBAN.
- Kontoinhaber, soweit vorhanden.

**Dokumenttexte**
- Rechnungseinleitung.
- Rechnungsschlusstext.
- Angebotseinleitung.
- Angebotsschlusstext.

**Nummerierung**
- Vorhandene Nummerierungsregeln.
- Toggle für echte Ein/Aus-Funktionen.
- Bestehende Präfixe und Nummernkreise.

Dokumentdesign nur ergänzen, wenn tatsächlich vorhanden.

Keine umfangreichen Formulare in einem einzigen Bottom Sheet.

Speichern als reguläre Formularabschlussaktion.

Bestehende Schweizer QR-Rechnungsregeln erhalten.

Ausgestellte Dokumente und archivierte Angebotsversionen unverändert lassen.

## 20. Angebote und Rechnungen

Listen:
- Maximal zwei Textzeilen.
- Kunde, Betrag, Datum und Status.
- Keine unnötigen technischen IDs.

Detailseiten:
- Einheitlicher Detailheader.
- Dokumentnummer und Status.
- Kunde.
- Gesamtbetrag.
- Relevante Daten.
- Positionen.
- Zwischentotal, Steuer und Total.
- Dateien kompakt.

Keine Drei-Punkte-Menüs innerhalb des Dateienbereichs.

PDF, Versand, Bearbeiten und weitere Verwaltungsaktionen über das Detailheader-Menü.

Dateien hinzufügen über den vorgesehenen Plus-Ablauf.

## 21. Zeiterfassung und Spesen

Zeiterfassung:
- Kompakter Timer.
- Grosse Zeitanzeige.
- Start/Pause/Stop.
- Danach Kunde und Auftrag.
- Heutige Einträge.
- Keine separaten Buttons für manuelle Erfassung oder Monatsrapport.

Spesen:
- Foto, Datei/PDF oder manuelle Erfassung.
- Bestehende Belegerkennung verwenden, soweit implementiert.
- Unsichere erkannte Werte kennzeichnen.
- Benutzer muss Daten vor Übernahme prüfen.
- Bestehende Freigabeprozesse erhalten.

## 22. Landingpage und Sprache

Landingpage:
- Einheitlicher Header.
- Professioneller Hero.
- Tatsächliche Produktvorschau.
- Funktionen.
- Preise.
- FAQ.
- Kontakt.
- Registrierung und Anmeldung.
- Rechtliche Unterseiten.
- Minimalistischer Footer.

Sprachauswahl nur einmal pro Oberfläche.

Landingpage: ausschliesslich im Header.

Kompakte rahmenlose Darstellung wie «DE ˅».

Fünf Sprachen:
DE, FR, IT, EN, TR.

Footer nur mit:
- Impressum.
- Datenschutz.
- AGB.
- Cookie-Einstellungen.
- Kontakt.

Copyright:
© 2026 Binso GmbH

Zusätzlicher Link:
binso.ch ↗

Ziel: https://binso.ch

Keine Adresse oder Handelsregisternummer im Footer.

## 23. Technische Zentralisierung

Prüfe sämtliche tatsächlich vorhandenen Seiten und Unterseiten.

Erstelle eine vollständige Seiten- und Aktionsmatrix.

Verwende zentrale Owner für:
- Header.
- Navigation.
- Floating-Plus.
- Bottom Sheets.
- Popovers.
- Suchfelder.
- Filter.
- Sortierung.
- Zeitraumfilter.
- KPI-Karten.
- Diagramme.
- Listen.
- Stammdaten.
- Einstellungen.
- Toggles.
- Formulare.
- Statusanzeigen.

Keine zweite UX-Foundation.

Keine lokalen CSS-Sonderlösungen.

## 24. Legacy Cleanup

Identifiziere:
- Veraltete CSS-Regeln.
- Doppelte Selektoren.
- Widersprüchliche Media Queries.
- Alte Header.
- Doppelte Aktionssysteme.
- Verstreute Buttons.
- Veraltete Komponenten.
- Überholte UX-Testannahmen.

Migriere zuerst alle vorhandenen Funktionen auf die zentrale Foundation.

Entferne alte Implementierungen erst nach nachgewiesener Funktionsgleichheit.

Keine Sicherheits-, Finanz-, Rollen- oder Datenintegritätstests entfernen oder abschwächen.

## 25. Regressionstests und GitHub-CI-Kompatibilität

Ergänze beziehungsweise aktualisiere gezielte Tests für:

- Header A und B.
- Plus-/Drei-Punkte-Aktionen.
- Listenwerkzeuge.
- Sortier-Dropdown.
- Filter und Zurücksetzen.
- Suche ohne doppeltes X.
- Einheitliche Toolbar-Position.
- KPI-Karten und Prozenttrends.
- Finanzdiagrammfarben.
- Zeitraumfilter.
- Kompakte Listen.
- Stammdaten.
- Toggles und Persistenz.
- Sicherheitseinstellungen.
- Consent.
- Abonnementdarstellung.
- Dokumenteinstellungen.
- Navigation Avatar/Mehr.
- Responsive Verhalten.
- DE, FR, IT, EN und TR.
- PWA-Safe-Areas und Keyboard-Verhalten.

Vorhandene UX-Tests auf den neuen Vertrag migrieren.

Keine Tests deaktivieren, um CI künstlich grün zu bekommen.

Bestehende Git