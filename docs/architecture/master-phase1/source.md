# BINSO ONE – MASTER IMPLEMENTATION PHASE 1
## UX · Navigation V2 · Identity & Security · Benachrichtigungen · Internationalisierung

**Projekt:** Binso One  
**Repository:** `oemercam/binso_admin_azure`  
**Arbeitsmodus:** ChatGPT Work / Codex mit Live-Vorschau  
**Grundlage:** Global UX Master V6 und die danach ausdrücklich freigegebenen Entscheidungen  
**Status:** Implementierungsauftrag, kein Nachweis bereits umgesetzter Funktionen

## 1. Ziel und Arbeitsregeln

Prüfe den aktuellen Codebestand und implementiere die folgenden Anforderungen in logisch abgegrenzten Arbeitspaketen. Beginne mit einer Ist-Soll-Matrix je Funktion: **vorhanden / teilweise vorhanden / fehlend / blockiert**. Nutze bestehende Komponenten, APIs, Berechtigungen und Datenmodelle; erzeuge keine zweite UX-, Authentifizierungs- oder Übersetzungsarchitektur. Erhalte sämtliche fachlichen Berechnungen, Mandantengrenzen, Versionsstände und bestehenden Daten. Keine produktiven Datenänderungen, GitHub-Pushes oder Azure-Deployments ohne Freigabe. Zeige anschliessend die echte Live-Vorschau.

**Konfliktregel:** Die zuletzt ausdrücklich bestätigten Entscheidungen haben Vorrang vor älteren Vorschlägen. Insbesondere gelten die Typografiewerte aus UX Master V6 (18 px Seitentitel, 14 px Abschnittstitel und Standardtext), keine Drei-Punkte-Menüs in gewöhnlichen Inhaltsabschnitten, und die kompakte Positionsliste Variante 1. Bestehende Bottom-Navigation optisch beibehalten, jedoch gemäss Navigation V2 fachlich neu belegen. Das bestehende blaue Floating-Plus in Gestaltung, Grösse und Position nicht verändern.

## 2. Zentrales Designsystem

- Schriftfamilie Inter mit System-Fallbacks.
- Seitentitel 18 px / 600; Abschnittstitel 14 px / 600; Standardtext 14 px / 400; Einstellungszeile 14 px / 400–500.
- Formularlabel 13 px / 500; Formularinhalt 14 px / 400; Sekundärtext 12 px / 400.
- KPI-Bezeichnung 12 px / 400; KPI-Wert 20 px / 600; Prozenttrend 11 px / 500; Detailbetrag 24 px / 600; Badge 11 px / 500; Bottom-Sheet-Titel 16 px / 600; Navigation 11 px / 500.
- Header 56 px plus Safe Area; Header-Icons und Zurück-Pfeil 20 px; Menü-Icons 18 px; Navigations-Chevrons 16 px; Dropdown-Chevrons 14 px; Avatar 34 px; Touchflächen mindestens 44 × 44 px.
- Mobile Seitenränder 16 px; einheitliches 4-/8-px-Abstandssystem; Kartenradius 16 px; Formularradius 12 px; Eingabefeldhöhe ca. 48 px.
- Einheitliche Komponenten für `SectionHeader`, `SectionDivider`, `ListRow`, `NavigationRow`, `DetailRow`, `StatusBadge`, `Accordion`, `KpiCard`, `FormField`, `Popover` und `BottomSheet` (bestehende Namen/Owner bevorzugen).
- Trennlinien: 1 px, dezente Theme-Farbe, identische Ausrichtung im Inhaltsraster. Gleiche Zeilentypen auf allen Seiten mit gleichen Abständen und Schriftgrössen. Keine lokalen CSS-Patches.
- Hauptseiten erhalten direkt unter dem Header eine kurze, einheitliche, funktionsbezogene Beschreibung; bei Unterseiten nur wenn sie einen tatsächlichen Informationsnutzen bietet. Keine doppelten Titel.
- Chevron rechts = Navigation, Chevron unten = Aufklappen, Plus = Erstellen. Keine mehrdeutigen Icons.

## 3. Header und Navigation V2

**Mobile Hauptnavigation:** `Übersicht · Kunden · Aufträge · Zeit · Mehr` mit Icons House, Users, BriefcaseBusiness, Clock3, Ellipsis. Optische Eigenschaften, Position und Safe-Area-Verhalten der bestehenden Bottom-Navigation erhalten. Aktive Hauptbereiche auch auf Unterseiten korrekt markieren. Bestehende Routen und Deep Links weiterführen.

**Haupt-/Listenseite:** Titel links, rechts Suche, Glocke und Avatar; keine drei Punkte im Header. **Detailseite:** Zurück links, Titel mittig, kontextbezogenes Drei-Punkte-Menü rechts bei mehreren zulässigen Aktionen. Bei einer einzigen Aktion eine konsistente, klar erkennbare Header-Aktion prüfen. Keine vierte globale Header-Aktion.

**Mehr – feste Kategorien und Reihenfolge:**

| Kategorie | Menüpunkte |
|---|---|
| Geschäft | Angebote, Rechnungen, Finanzen, Spesen |
| Auswertung | Berichte |
| Verwaltung | Unternehmen, Mitarbeiter & Berechtigungen, Unternehmenseinstellungen |
| Hilfe | Support, Hilfe & Informationen |

**Avatar – nur persönlich:** Profil, Sicherheit, Benachrichtigungen, Darstellung, Sprache, persönlicher Datenschutz, Sitzungen, Abmelden. Unternehmensbezogene Einstellungen ausschliesslich unter Mehr/Verwaltung. Jede Einstellungsseite hat einen primären Ort; andere Kontexte dürfen dorthin verlinken, nicht duplizieren.

**Übersicht:** Begrüssung, relevante KPI, offene Aufgaben, Einrichtung und letzte Vorgänge kompakt; keine unnötigen Nullwertbereiche. **Kunden:** vollständige CRM-Funktionen. **Aufträge:** vorhandene Auftrags-/Projektlogik und Details. **Zeit:** Timer, Einträge und Berichte. **Mehr:** vorhandene Fachmodule wie oben, ohne Funktionseinbussen.

## 4. Aktionssystem, Suche, Filter, Sortierung

- Globales blaues Plus unverändert. Auf Übersicht `Neu erstellen` mit berechtigten Aktionen Kunde, Auftrag/Projekt, Angebot, Rechnung, Zeiteintrag, Spese; auf Fachlisten kontextspezifisch.
- Drei Punkte für bestehende Datensatzaktionen: Bearbeiten, PDF ansehen/herunterladen, Versenden, Duplizieren, Archivieren, Exportieren, Löschen, soweit berechtigt. Auf Mobile zentrales Bottom Sheet, auf Desktop kompaktes Popover. Keine verstreuten Aktionsbuttons und keine Drei-Punkte-Menüs mitten in Cards oder Abschnitten.
- Suche mit Icon links und **genau einem** Lösch-X rechts; keine doppelte native Clear-Schaltfläche. Fokus nach Löschen behalten; kein Textüberlauf.
- Einfache Sortierung als kompaktes, verankertes Dropdown mit einzeiligen Optionen und aktivem Häkchen. Einfache Filter ebenfalls Dropdown; komplexe Filter Bottom Sheet. Statuszeile bei aktiver Abweichung mit `Zurücksetzen` rechts, ohne fremde Filter unbeabsichtigt zu löschen.
- Werkzeugzugang auf allen vergleichbaren Seiten **rechts in derselben Steuerungszeile**; Zeitraum/Suche links. Zahnrad nur für Einstellungen, Schieberegler für Werkzeuge. Keine abgeschnittenen Overlays.
- Bei langen Such- und Auswahlmenüs durchsuchbare Auswahl ohne unnötige Zurück-/Weiter-Schaltflächen.

## 5. Einheitliche Listen und Detailseiten

**Kundenliste – exakt zwei Zeilen:** erste Zeile Firmenname links und Status-Badge rechts; zweite Zeile Kontaktperson. Keine Finanzzahlen, Auftragsanzahlen, Branchen oder Umsatzwerte.

**Angebote und Rechnungen – exakt zwei Zeilen:** erste Zeile Dokumentnummer links, Status rechts; zweite Zeile Firmenname und Datum links, vollständiger CHF-Betrag rechts. Keine dritte Betragszeile. Lange Firmennamen kontrolliert kürzen, niemals Beträge abschneiden.

**Kundendetail – drei Tabs:**
- **Übersicht:** Hauptkontakt, relevante Stammdaten, aktive Aufträge, offene Rechnungen; keine Kundenentwicklung.
- **Dokumente:** Angebote, Rechnungen, zusätzliche Dateien/Anhänge ohne Duplikate; Suche und passende Filter.
- **Verlauf:** chronologische fachliche Ereignisse mit korrektem Status und Datum, ohne technische Protokollflut.

Einheitliche Abschnitte und dezente Trennlinien, keine übergrossen Leerzustände (maximal zwei kurze Zeilen). Navigation zur vorherigen Ansicht muss aktiven Tab, Suche, Filter, Sortierung und Scrollposition möglichst erhalten.

## 6. Angebote, Rechnungen, Positionen und Dokumente

**Freigegebene Positionsliste: Variante 1, kompakt.** Links Verschiebegriff; daneben zweistellige Positionsnummer und Bezeichnung; darunter Menge × Einzelpreis; Gesamtbetrag rechts, Chevron zur Bearbeitung. Bei schmalen Displays darf der Betrag in eine eigene Zeile wandern. Antippen öffnet Position bearbeiten. Griff halten und per Drag & Drop verschieben; Tastaturalternative bereitstellen. Wischen für Duplizieren/Löschen mit zugänglicher Alternative im Bearbeitungsformular. Keine Drei-Punkte-Menüs je Position. Positionsnummern nach Verschieben neu berechnen; Reihenfolge im Dokument und PDF konsistent speichern. Alte versendete Versionen unveränderlich lassen.

Umfangreiche Angebots- und Rechnungsbearbeitung als eigene Ansicht, keine gestapelten Bottom Sheets. Einheitliche Felder für Menge, Einheit, Preis, Rabatt, MwSt., Steuerbefreiung; Berechnungen und Schweizer QR-Rechnungsregeln bewahren.

Dokumentnummer und Version sichtbar trennen. `Versionen und Verlauf` als kompaktes Accordion mit Dokumentversionen und Versandverlauf. Zusätzliche Dateien als eigener Abschnitt. PDF auf Mobile an Breite anpassen und Zoom erlauben. Versandstatus kurz mit Icon: grau ausstehend, gelb versendet/Zustellung nicht bestätigt, grün nachweislich zugestellt oder angesehen, rot nachweislich fehlgeschlagen. **Nie** `zugestellt` oder `gelesen` behaupten, wenn nur Providerannahme vorliegt.

## 7. Formulare, Bottom Sheets und Dirty State

- Kleine Auswahlen/Aktionen als Bottom Sheet oder Popover; umfangreiche Bearbeitungen als eigene Seite.
- Ein zentraler Sheet-Aufbau mit Header, scrollbarem Inhalt, optionalem fixiertem Footer; inhaltsabhängige Höhe, kein doppeltes Scrollen, iOS-PWA-/Keyboard-/Safe-Area-Unterstützung.
- Einheitliche Eingabefelder, Selects, Textareas und Datumsfelder mit 12-px-Radius, korrekter Textzentrierung, Fokus-/Fehler-/Disabled-Zuständen.
- **Dirty-State** erst nach vollständigem Laden und Normalisieren der Ausgangswerte setzen. Öffnen, Fokus, Scrollen, vorbefüllte Werte oder Änderung mit anschliessender Rücksetzung dürfen keine Verwerfungsfrage auslösen.
- Ohne echte Änderung X/Abbrechen sofort schliessen. Mit ungespeicherten Änderungen `Änderungen verwerfen?` mit `Weiter bearbeiten` und `Verwerfen`. Nach erfolgreichem Speichern keine Nachfrage; nach Fehler Eingaben erhalten.
- X schliesst die aktuelle Ebene und führt zum Aufrufer zurück, nicht pauschal zur Übersicht. Browser-Zurück, Escape und Overlay-Schliessen beachten denselben Datenverlustschutz.

## 8. Finanzen, Berichte und Zeiterfassung

Finanz-KPI kompakt, echte Vergleichstrends nur bei vorhandener Vergleichsbasis. Einnahmen grün, Ausgaben rot. **Finanzentwicklung Variante 3:** horizontale Vergleichsbalken statt grossem Diagramm, Saldo darunter; bei Nullwerten keine bedeutungslosen Balken. Forderungen und Angebote als kompakte Accordions, korrekte disjunkte Statusgruppen. Berichte nach Themen gruppieren, keine langen Erklärungen oder leeren Grosskarten.

Timer: grosse Zeitanzeige, Start/Fortsetzen blau, Pause neutral, Stoppen rot; bestehende Steuerungslogik und Zeitpersistenz schützen. Kunde und Auftrag unter den Timeraktionen. Suche/Listenwerkzeuge nur im passenden Kontext. Zeiteinträge mit eindeutigen Status-Badges (`Erfasst`, `Eingereicht`, `Freigegeben`, `Zurückgewiesen`) und klarer Trennung von Status und Aktion. Mehrfachauswahl für zulässige Einträge und Sammelaktion `Zur Prüfung einreichen`; getrennte berechtigte Sammelfreigabe, mit serverseitigen Berechtigungen und Audit. Monatsrapport mit eindeutigen Ausgabeoptionen.

Spesen: kompakter Upload, Kamera/Datei, verständliche Erkennungsfehler, manuelle Korrektur, korrekte Pflichtfeldprüfung und Statusübergänge.

## 9. Registrierung, Identity & Security

Firmenregistrierung mit geschäftlicher E-Mail, Passwort, E-Mail-Bestätigung und Onboarding; ein Unternehmen pro Konto im Startmodell. Mitarbeiter über Einladungen. Registrierung fortsetzen, Verifikation erneut senden, Passwort vergessen/zurücksetzen, E-Mail-Änderung sicher bestätigen, Mitarbeiter deaktivieren und Sitzungen widerrufen.

**Anmeldung:** E-Mail/Passwort; sichere Unterstützung von Passwortmanagern (`autocomplete`), Passwort anzeigen; `Angemeldet bleiben` mit widerrufbaren, sicher geschützten Sessions, niemals Klartextpasswörter speichern. Passkeys via WebAuthn mit Face ID, Touch ID und Windows Hello, soweit Plattform/Browser unterstützt. Mehrere Passkeys verwalten und sicher entfernen.

**Authenticator (TOTP):** QR-Code plus manueller Einrichtungsschlüssel, Bestätigung durch gültigen zeitbasierten Code, sichere Recovery-Codes, geschützte Deaktivierung und Wiederherstellung. Authenticator-App erzeugt Codes auf dem Smartphone; nicht als Push-Freigabe darstellen.

**MFA-Regeln:** Admin-Portal **immer verpflichtend**, nicht abschaltbar; serverseitig auch für APIs durchsetzen. Kundenportal optional, jedoch durch Unternehmensadministrator für Mitarbeiter verpflichtend schaltbar. Keine Umgehung über alternative Login- oder Recovery-Pfade. Bei kritischen Änderungen erneute Authentifizierung. Vor Implementierung bestehenden Identity-Provider auf unterstützte Methoden prüfen; keine unsichere Eigenimplementierung kryptografischer Protokolle.

Aktive Geräte/Sitzungen, einzelnes und globales Abmelden, Inaktivitätsregeln, sichere Session-Wiederherstellung, Kontoschutz gegen automatisierte Versuche, Audit relevanter Sicherheitsereignisse. Keine sensiblen Daten nach Logout via Browser-Zurück zugänglich.

## 10. Benachrichtigungen

In-App-Glocke mit gelesen/ungelesen und direktem Link zum Vorgang; Push für unterstützte Browser/PWA nach ausdrücklicher Berechtigung; E-Mail-Benachrichtigungen und persönliche Toggles. Relevante Ereignisse: Supportantworten, Angebotsentscheidungen, Rechnungen, Zeit-/Spesenfreigaben, Einladungen und Sicherheitswarnungen. Keine sensiblen Inhalte unnötig auf Sperrbildschirmen; mandantensichere, idempotente Zustellung. Tatsächliche Versandfähigkeit und Zustellzustände nicht vortäuschen.

## 11. Internationalisierung – alle fünf Sprachen vollständig

**Sprachen:** Deutsch `de-CH`, Französisch `fr-CH`, Italienisch `it-CH`, Englisch `en`, Türkisch `tr`.

- Bestehendes i18n-System zentral verwenden. Alle sichtbaren UI-Texte, Validierungen, Fehlermeldungen, Status, Menüs, Formulare, Auth-/MFA-/Passkey-Abläufe, Landingpage, Kunden-App, Admin-App, Benachrichtigungen und vorhandene E-Mail-/Dokumentvorlagen inventarisieren.
- Keine neuen hartcodierten UI-Texte, fehlenden Keys oder gemischten Sprachen. Fachlich korrekte, konsistente Übersetzungen; besondere Prüfung türkischer Sonderzeichen und Gross-/Kleinschreibung.
- Datum, Uhrzeit, Zahlen, Prozentwerte und CHF locale-gerecht formatieren; Schweizer Geschäftsvorschriften nicht durch UI-Sprache verändern.
- Sprachwahl **einmal je Oberfläche**: Landingpage im Header; App über Avatar. Rahmenlos `DE ˅` usw.; Chevron direkt daneben; Dropdown ca. 180–200 px, alle fünf Namen einzeilig, korrektes Overlay, keine Abschneidung, Tastatur- und Screenreader-Unterstützung.
- Lange Übersetzungen auf 320–1440 px prüfen, ohne die Schrift künstlich zu verkleinern. Rechtliche Übersetzungen nur als verbindlich ausgeben, wenn freigegeben; öffentlich erforderliche Rechtsseiten bleiben ohne Anmeldung erreichbar, in der App werden dieselben freigegebenen Inhalte intern angezeigt.

## 12. Prüfung, Qualität und Abschluss

Prüfe repräsentative Ansichten in Light/Dark und bei 320, 360, 390, 430, 768, 1024 und 1440 px; iPhone Safari und iOS-PWA soweit testbar. Schwerpunkt: Header, Navigation, Such-X, Dropdown-Overlay, Filter/Sortierung, Zeilentrennung, Beträge, Status, Drag & Drop, Dirty-State, Keyboard, PDF, Auth/MFA, Passkeys, Sprachumschaltung, Mandantentrennung.

Erhalte bestehende Finanz-, Sicherheits-, Rollen- und Datenintegritätstests. Aktualisiere nur nachweislich überholte UX-Assertions; keine Tests deaktivieren. Führe zunächst gezielte Tests und einen abschliessenden zusammenhängenden QA-Lauf durch, nicht bei jeder Kleinänderung die gesamte Browsermatrix.

**Abschlussbericht:** Ist-Soll-Matrix mit Umsetzungsstatus, geänderte zentrale Komponenten, migrierte Seiten, entfernte Legacy-Regeln, relevante Testergebnisse, nachweisbare Live-Vorschau und offene Blocker. Nicht implementierte oder nur teilweise implementierte Anforderungen ausdrücklich nennen. **Kein GitHub-Push, kein Azure-Deployment, keine produktiven Datenänderungen. Auf visuelle Freigabe warten.**
