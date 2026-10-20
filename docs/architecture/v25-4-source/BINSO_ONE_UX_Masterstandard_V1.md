# BINSO ONE – UX-MASTERSTANDARD V1

**Schriftliches, plattformübergreifendes UX-Konzept für Kunden-App und One Admin**  
**Stand:** 20.10.2026  
**Repository:** `oemercam/binso_admin_azure`  
**Geprüfter Basisstand:** Main `d2825134deb33cac67a05c6e703b945ff28066e6`  
**Einordnung:** Fachlich-visueller UX-Vertrag zur Ergänzung von **V25.3 Business Process Master Implementation**. **Keine neue UX-Foundation und kein eigenmächtiger Code-/Merge-/Deploy-Auftrag.**

## 0. Verwendung und Rangfolge

Dieses Dokument legt schriftlich fest, **welche Informationen wo und wie gezeigt werden**, wie sich die Oberfläche in Desktop-Browser, Tablet-Browser, Mobile-Browser und installierten PWAs verhält und wie Personen Aktionen, Navigation, Fehler und Prozesszustände erleben. Es darf nicht durch lokale CSS-Regeln oder eine zweite UI-Bibliothek umgesetzt werden.

**Rangfolge:** (1) Sicherheit, Datenschutz, korrekte Geschäftsregeln; (2) zuletzt ausdrücklich bestätigte Binso-One-Entscheidungen; (3) `AGENTS.md` und `docs/architecture/ux-current-approval.md`; (4) `docs/architecture/reference-foundation.md` plus originales Microsoft-HTML-Referenzpaket unter `docs/audit/v24/reference/`; (5) derzeitige zentrale Tokens und Owner aus `app/design-system/manifest.json`; (6) neue, in diesem Dokument vorgeschlagene Regeln **nur nach gezielter Freigabe**, soweit sie nicht bereits vom Nutzer bestätigt wurden. V25.3 regelt Geschäftsprozesse und Rollen, dieses Dokument deren visuelle und interaktive Darstellung.

**Kennzeichnung der Aussagen:**
- **[FREIGEGEBEN]**: ausdrücklicher bestehender UX-/Produktentscheid; unverändert schützen.
- **[IST]**: am angegebenen Main-Commit aus Quellcode/Tokens abgeleitet; noch keine vollständige visuelle Geräteabnahme.
- **[ZIEL]**: empfohlene Präzisierung für einen künftigen, freizugebenden Implementierungsauftrag.
- **[OFFEN]**: Widerspruch oder produktrelevante Entscheidung, nicht stillschweigend ändern.

**Nicht-Ziele:** kein neues Design, keine neuen Farbsysteme, kein eigenmächtiger Wechsel der Navigationskomponente, keine Neunummerierung von Fachprozessen, keine erzwungene UI-Gleichheit zwischen Kunden-App und One Admin, keine Behauptung einer bestandenen mobilen Hardwareabnahme.

---

## 1. Die UX in einem Satz

**Binso One ist eine ruhige, sofort verständliche, mobile-fähige Schweizer Unternehmens-App:** Eine Person sieht nach der Anmeldung ihren **berechtigten Arbeitsbereich**, erkennt die **nächste Aufgabe**, erledigt sie mit wenigen eindeutigen Aktionen und erhält zuverlässig Rückmeldung darüber, was gespeichert, eingereicht, versandt oder gebucht wurde.

**Grundprinzipien [FREIGEGEBEN]:** Microsoft-inspirierte, flache, überwiegend weisse Flächen, dunkel lesbarer Text, blaue Akzente für primäre Aktionen und Fokus; keine Glassmorphism-, Blur-, neumodische Dock-/Capsule- oder zweite Foundation; Original-Binso-Assets; kompakte Elemente, klare Lesereihenfolge und ausreichend Luft. Dark Mode verwendet vorhandene abgeleitete Tokens und ist **nicht** als vollständig visuell originalfreigegebene Referenz auszugeben.

### 1.1 Was ein Benutzer auf jeder Seite versteht [ZIEL]
1. **Wo bin ich?** Aussagekräftiger Seiten-/Detailtitel; bei Details die Objektidentität (Kunde, Rechnungsnummer, Auftrag).
2. **Was gehört hierher?** Kurzer Zwecktext auf Hauptseiten, ohne doppelte Überschriften oder lange Erklärungen.
3. **Was ist der aktuelle Zustand?** Status, offene Aufgabe, berechnete Kennzahl oder ehrlicher Leer-/Lade-/Fehlerzustand.
4. **Was kann ich tun?** Eine kontextgerechte Erstellen-Aktion oder ein `…`-Aktionsmenü, nur mit zulässigen Befehlen.
5. **Was passiert danach?** Eindeutige Erfolgsmeldung/Fehler, nächste Aktion und nachvollziehbarer Rückweg.

### 1.2 Gegenstände der Darstellung [FREIGEGEBEN]
- Sichtbares Wort **«Auftrag»**, nicht gemischt «Projekt/Auftrag»; technische Routen/Daten wie `/projekte` und `projects` dürfen bestehen bleiben.
- Kunden-App und internes **One Admin** bleiben technisch und berechtigungsseitig getrennte Arbeitsbereiche.
- Startseite, Datenlisten, Details, Formulare, Support-Chat, Diagramme, Einstellungen und Fehlerzustände benutzen je den bereits vorhandenen gemeinsamen UI-Owner.
- Einfache vorhandene Liste unter **«Mehr»**, keine Kategorien- oder Gruppierungs-Neugestaltung.
- Keine grossen leeren Karten und Illustrationen für fehlende Daten; maximal zwei **inhaltliche** Textzeilen, wobei Schriftvergrösserung natürlich umbrechen darf.

---

## 2. Geräte- und Anzeigematrix

**Responsive Verhalten wird anhand tatsächlicher CSS-Breite und Eingabemethode bestimmt, nicht nach dem Gerätenamen.** Eine schmale iPad-Split-View darf die mobile Darstellung verwenden; ein breites Tablet kann die Desktop-Seitenleiste zeigen. Die Browser-Chrome- und PWA-Safe-Area unterscheiden sich.

| CSS-Viewport | Umgebung / typischer Fall | Shell und Navigation | Inhalt / Bedienung | Vertrag |
|---|---|---|---|---|
| 320–389 px | kleines Smartphone; Safari/Chrome/PWA | bestehender mobiler Header; feste Bottom-Navigation; Safe Areas | eine Spalte, Zeilen dürfen umbrechen, keine horizontale Seitenverschiebung, Sheet über voller Breite | [IST/FREIGEGEBEN] |
| 390–760 px | übliches Smartphone und schmale Tablet-Split-View | identischer mobiler Navigations-Owner, 52-px-Header-Token, 68-px-Navigation plus realer Safe Area | Listen als kompakte Zeilen, Filter in Sheet, Editieren als Bottom Sheet | [IST/FREIGEGEBEN] |
| 761–1100 px | Tablet hoch/quer oder schmales Desktopfenster | linke Seitenleiste (aktueller Token 190 px), Desktop-Header | verfügbare Breite nutzen, Spalten sinnvoll reduzieren, keine separate «Tablet-App» | [IST] |
| ab 1101 px | Notebook und Desktop | linke Seitenleiste (Basis 228 px), oberer Header, optional einklappbare Seitenleiste (68 px) | mehrspaltige Ansichten nach Inhalt, lokale Aktionsleiste, Datenraster | [IST] |
| grosse Monitore | breiter Desktop-Browser | gleiche Shell, kein gestrecktes XXL-Interface | zentraler Inhaltsbereich max. `--content-max: 1760px`; Diagramme lesbar, keine unnötigen Leerräume | [IST] |
| Standalone PWA | iOS-/Android-App-Fenster | **gleiche responsive Shell** wie bei gleicher CSS-Breite, zusätzliche System-/Safe-Area-Rücksicht | kein eigenständiges PWA-Design; Rückkehr, Tastatur, Offline, App-Wechsel und Deep Links gesondert sichern | [FREIGEGEBEN/ZIEL] |

**Originale Breakpointquelle:** `@media (max-width:760px)` und `@media (min-width:761px)` in zentralen CSS-Ownern. 760/761 px sind **keine neuen Breakpoints**. Die Grenze und vorhandene Navigation dürfen nicht aus Bequemlichkeit umgestellt werden.

### 2.1 Desktop-Browser – sichtbare Reihenfolge [FREIGEGEBEN]
1. **Links:** bestehende, ein- und ausklappbare Seitenleiste; Bereiche und Rollenrechte bestimmen erreichbare Ziele.
2. **Oben:** kompakter, deckender Desktop-Header mit Arbeitsbereich/Orientierung, globaler Suche, Benachrichtigungen und Benutzerkonto; nicht zugleich Fachaktionen in den globalen Header stellen.
3. **Inhalt oben:** Titel, knappe Erklärung/Objektstatus, danach kontextgerechte lokale Suche, Filter, Sortierung und Erstellen-Aktion in gemeinsamer Command-Bar.
4. **Hauptinhalt:** Kennzahlen/Diagramme oder Datenliste/Detailabschnitte; keine zweite Toolbar und keine permanente Werkzeug-Seitenspalte.
5. **Unterseiten:** eindeutiger Rückweg plus Datenkontext, keine doppelte Titelzeile.
6. **Formulare:** zentrierter modaler FormSheet-Dialog; langer Inhalt in eigenem Scrollbereich, Aktionen unten erreichbar. Kein Desktop-Bottom-Sheet.

### 2.2 Tablet – Anpassung statt neue App [ZIEL]
- 761–1100 px: bestehende Sidebar und Desktop-Header, verfügbare Spaltenbreite dynamisch; schmale Kennzahlen/Tabellen dürfen umbrechen oder fachlich reduziert werden.
- Touch-Eingabe: mindestens 44 × 44 px Interaktionsfläche; Hover ist nur Zusatzfeedback, niemals einzige Erklärung oder Aktion.
- Hoch-/Querformat: Listen- und Detailkontext muss beim Wechsel erhalten bleiben, Popups und Dialoge neu positionieren.
- Split-View mit <=760 px: mobile Darstellung **durch bestehenden Breakpoint**.
- Physisches iPad Safari vs. installierte PWA gesondert prüfen; Tastatur und Fokus dürfen keine Aktionen verdecken.

### 2.3 Smartphone-Browser und Mobile-PWA [FREIGEGEBEN]
- **Oben:** deckender mobiler Header; auf der Übersicht Original-Binso-Icon + «One», auf Hauptseiten Bereichstitel, auf Unterseiten Zurück + Kontexttitel. Kein wiederholtes Logo auf jeder Seite.
- **Danach:** normaler schmaler Seitenabstand, gegebenenfalls kurzer Zwecktext; Tabs und Such-/Filterbereich unmittelbar beim Inhalt. Keine zusätzliche Leerfläche für bereits sichtbaren Header-Titel.
- **Mitte:** kompakte, gestapelte, gut lesbare Inhalts-/Zeilenstruktur ohne horizontalen Gesamtseiten-Scroll.
- **Unten:** bestehende beschriftete Bottom-Navigation mit deckendem Hintergrund über die ganze Breite und untere Safe Area, nicht ausblendend beim Scrollen. Ihre vorhandene Gestaltung, Position, Icons und Basisnavigation bleiben unverändert.
- **Erstellen:** bestehender runder blauer Plus-Button in seiner **bereits freigegebenen Gestaltung und Position**; beim Erfassen, in Dialogen, bei geöffneter OS-Tastatur und im Chat nach bestehendem Vertrag ausgeblendet. Er zeigt die jeweils erlaubten Erstellen-Aktionen; niemals durch eine neue Darstellung ersetzen.
- **Kontext:** Filter-, Aktions- und Formularflächen nutzen die gemeinsamen Sheet-Owner. Keine zweite Sheet-Höhenlogik auf einzelnen Seiten.
- **Schmale Geräte:** Status, Labels, Feldtexte und CHF-Beträge müssen ohne abgeschnittene Pflichtinformation umbrechen. Die Navigation darf nicht von Inhalt überdeckt werden; Inhalte und Footer müssen erreichbar bleiben.

### 2.4 Browser vs. installierte PWA [FREIGEGEBEN/ZIEL]
- Für gleiche CSS-Breite **gleiche Typografie, Farben, Daten, Icons und Aktionslogik**.
- Browser: native Adressleiste, Zurück/Vorwärts, Download und Share-Verhalten respektieren.
- Standalone PWA: `display-mode:standalone`, tatsächliche `safe-area-inset-*` und `visualViewport`/Tastatur berücksichtigen; UI darf nicht unter Statusleiste, Home-Indikator oder Tastatur verschwinden.
- Kunden-App und One Admin besitzen eigene Einstiegspunkte/Manifeste und unabhängige Sicherheitskontexte; beim Wechsel kein falscher Mandant/Account oder unzulässige Adminansicht.
- **[FREIGEGEBEN, VORRANG] Sichtbare PWA-Update-Meldung auf Web und Mobile vollständig unterlassen**, auch in Rechnungsassistenten. Keinen unerwarteten Seitenreload. Versions-/Asset-Prüfung kann unsichtbar im Hintergrund stattfinden und darf niemals einen Entwurf/Timer zerstören. Diese jüngere Entscheidung ersetzt ältere «Update anbieten»-Texte; `components/app-version-notice.tsx` ist damit ein **Ist/Soll-Konflikt**, kein freigegebenes Banner.
- Offline: wahrheitsgemäss darstellen, was lokal angezeigt werden kann; **keine gespeicherte oder zugestellte Mutation behaupten**, solange Serverbestätigung fehlt. Unbestätigte Aktionen als solche erkennbar halten. Keine alten Daten eines anderen Kontos nach Loginwechsel.

---

## 3. Verbindlicher Typografie-, Farb- und Abstandskatalog

Die folgenden Zahlen sind **am aktuellen zentralen `theme.css` dokumentierte Tokenwerte [IST]**. Sie sind nicht automatisch für jedes DOM-Element die berechnete Endgrösse; je nach Owner/Viewport kann ein Element andere, ebenfalls zentrale Tokens verwenden. **Keine neuen Seitentokens hartcodieren.** CSS-Computed-Style und Referenzscreenshots entscheiden bei Abweichungen.

| Element | Token / gegenwärtiger Ausgangswert | Benutzung |
|---|---|---|
| Schriftfamilie | `--font-sans: Inter, system-ui, sans-serif` | App-weit; keine zusätzlichen Webfonts ohne Prüfung |
| Desktop-Seitentitel | `--workspace-title-size: 27px` (`--type-desktop-heading: 27px`) | eine klare H1, nicht je Bereich neu definieren |
| Mobile Haupttitel | `--type-mobile-heading: 25px` | Platz und Umbruch beachten |
| Mobile Detailtitel | `--type-mobile-detail: 23px` | tatsächliche Verwendung am jeweiligen Header messen |
| Abschnittstitel | `--section-title-font: 18px`; `--type-section: 18px` | gleiche Hierarchie in allen Modulen |
| Untertitel | `--type-subtitle: 20px`; `--type-subheading: 16px` | nur wo erforderlich; keine doppelten Beschreibungen |
| Fliesstext | `--type-body: 14px`; `--body-font-size: 14px` | lesbar, mit Zeilenumbruch; auf Touch/Textzoom testen |
| grössere Fliesstexte | `--type-body-large: 15px` | nur zentral vorgegebene Kontexte |
| Label und Schaltflächen | `--type-label: 13px`, `--type-control: 14px` | sichtbare Feldlabels und Aktionsbeschriftungen |
| Metadaten/Hinweise | `--type-metadata: 12px` | nie einzige lesbare Darstellung kritischer Angaben |
| Desktop-Eingabetext | `--control-font: 13px` | zugänglich, kein harter Wert pro Formular |
| Mobile-Eingabetext | `--control-font-mobile: 16px` | verhindert iOS-Fokus-Zoom; mobile Layoutprüfung |
| Kennzahlen | `--workspace-value-size: 25px` | gleicher KPI-Owner und Zuordnung |
| grosse Zeitanzeige | `--timer-value-size: 44px` | Timerwert, nicht freie Zahlenskalen pro Seite |
| Primäraktion | `--app-action-accent: #2566bd` | Buttons, Auswahl/Fokus; bestehende Farbtokens nutzen |
| Light Hintergrund | `--app-canvas: #fff` | keine grossflächige graue Neugestaltung |
| Light Haupttext | `--workspace-ink: #202b3b` | aktiver App-Kontext; Kontrast messen |
| Light Zweittext | `--workspace-muted: #647080` | ergänzende Angaben |
| Trennlinien | `--workspace-line: #edf1f6` | sparsam, nur nötige Abgrenzungen |
| Light Auswahlfläche | `--app-accent-soft: #edf4ff` | aktive/markierte Zustände |
| Basisradius Control | `--app-control-radius: 7px`, mobil `8px` | systemweiter Owner, keine abweichenden lokalen Rahmen |
| Mobiler Sheetradius | `--radius-sheet: 18px` | nur oben, Standard-Sheet |
| Touch-Ziel | `--touch: 44px` | min. 44 × 44 px auf Touch |
| Desktop-Button | `--button-height: 42px` | Pointer-coarse überschreibt auf Touchmass |
| Desktop-Feld | `--control-h: 40px` | auf Touch mind. 44 px |
| Mobile-Feld | `--control-h-mobile: 44px` | Eingaben/Selects |
| Normaler Formularabstand | `--field-group-gap: 14px` | FormGroup/Owner; keine doppelte Einzelkomponenten-Margin |
| Label/Feld-Abstand | `--field-label-gap: 6px` | überall gleich |
| Desktop-Inhaltsseitenrand | `--workspace-page-inset: 26px` und `--page-x` | tatsächlichen berechneten Wert prüfen |
| Mobiler Seitenrand | `--mobile-page-x: clamp(16px,4.55vw,20px)` | Safe Areas übersteuern bei Bedarf |
| mobile Abschnittsabstände | `--mobile-section-gap: 18px` | gleichbleibende vertikale Rhythmik |
| Desktop Seitenbereich | `--content-max: 1760px` | auf grossen Displays zentriert |
| Desktop Sidebar | `--sidebar-w: 228px` Basis, `190px` bei 761–1100 px; eingeklappt `68px` | keine neue Sidebarvarianten |
| Mobile Header/Navigation | `--mobile-header-h: 52px`; `--mobile-nav-h: 68px` plus `--safe-bottom` | bestehende Geometrie schützen |
| Übergänge | `--motion-fast: 140ms`, `--motion-base: 220ms` | direktes Feedback; Reduced Motion → 0 ms |

**Dark Mode [IST/ABNAHME OFFEN]:** gleiche Hierarchie/Komponenten, bestehende `html[data-theme=dark]`-Tokens (`--app-canvas:#000`, `--app-action-accent:#48a7ff` usw.). Kein eigenmächtiges Wechseln auf fremde Dunkelthemen; Dark-Screens ohne Originalreferenz als abgeleitet kennzeichnen.

**Verbindliche Messregel [ZIEL]:** CSS-Tokens zentral, `getComputedStyle` an Referenz-Viewports, WCAG-konformer Kontrast, Lesbarkeit bei 200% Zoom und 320 px; kein Abschneiden von Zahlen, wichtigen Labels oder Sicherheitsfehlern. Statisch im Vertrag genannte Werte dürfen den wirksamen CSS-Bindings nicht widersprechen.

---

## 4. Icon- und Aktionskonzept

**[FREIGEGEBEN]** Original-Binso-Logo/-Icon, vorhandene Lucide-Icons aus dem Produkt; keine zusätzlichen Icon-Fonts, kein zweites Asset-System. **Gleiche Funktion = gleiches Icon und gleiche Position** über Seiten hinweg.

| Funktion | Konvention | Text/Accessibility |
|---|---|---|
| Start / Übersicht | vorhandenes Haus-/Start-Icon | «Start» / «Übersicht» |
| Kunde | vorhandenes Personen-Icon | «Kunden» |
| Auftrag | bestehendes Auftrags-Icon | sichtbares Wort «Auftrag» |
| Zeiterfassung | Uhr/Timer | «Zeiterfassung», Primärsteuerung Start/Pause/Stop direkt |
| Angebote/Rechnungen | vorhandene Dokument-Icons | keine identischen, unbeschrifteten Aktionen für unterschiedliche Zwecke |
| Finanzen | bestehendes Finanz-Icon | nur berechtigtes Ziel; keine Sackgasse «Kein Zugriff» |
| Suche / Filter | Suche / Filter | Tastaturkürzel nur als Zusatz, nie als Voraussetzung |
| Mehr/Objektaktionen | `…` | zugänglicher Name «Weitere Aktionen» mit Objektbezug |
| Erstellung | bestehender runder blauer Plus-Button | voller zugänglicher Name «Neu erstellen» / Fachaktion |
| Zurück | bestehendes Pfeil-zurück-Icon | «Zurück» und sinnvoller Rückkontext |
| Schliessen | X im Overlay | «Schliessen», unsaved-Guard bei Bedarf |
| Erfolg / Warnung / Fehler | gemeinsame Status-Icons/Farben + Text | nie Farbe oder Icon allein zur Unterscheidung |
| PDF / Datei | Kontextaktion im Menü | «PDF anzeigen», «PDF herunterladen», «Datei hinzufügen» |

**[FREIGEGEBEN]** Erstellen über das vorhandene zentrale Erstellen-Aktionssystem; vorhandene Objektaktionen (PDF, Anhang, Duplizieren, Editieren, Stornieren, Export) gehören in kontextspezifische `…`-Menüs. **Ausnahmen:** direkte Form-Submit-Aktionen, Timersteuerung, reine Navigation/Links, Filter, Suche, wichtige Sicherheitsaktionen. Keine separaten Fachbereichs-Plusbuttons oder zusätzliche «Anhang +»-Aktionen. Aktionen nach Berechtigung, tatsächlichem Status und Mandant einschränken; API erzwingt dasselbe.

---

## 5. Seitenmuster und feste Informationshierarchie

| Muster | Desktop/Tablet | Smartphone/PWA | Gemeinsamer Owner |
|---|---|---|---|
| Landingpage | Produktnutzen → Funktionen → Abläufe → Preise → FAQ/Kontakt → Anmeldung/Registrierung | dieselben Inhalte einspaltig, gut erreichbare CTA, keine Desktop-Menü-Kopie | Marketing-/Auth-Foundation |
| Login/Registrierung/MFA | klarer Formularfokus, wenige Felder, Hilfe/Reset sichtbar | Systemtastatur, Passwortmanager, Fokus, sichere Rückwege | AuthWorkspace |
| Rollenübersicht | nächste Aufgaben und wenige erlaubte KPIs; keine leeren Fremdmodule | task-first, kompakte Abschnitte; keine falschen Kennzahlen | DashboardPage/AppShell |
| Fachliste | Titel → lokaler Such-/Filter-/Sortierblock → Listen-/Tabelleninhalt → Pagination | Titel → Filter-Sheet → kompakte RecordRows, gleiche Ergebnismenge | RecordsControls/RecordsView |
| Detailansicht | Kontext-/Objekttitel → Status → wesentliche Informationen → Tabs → Aktionen | Zurück im Header, kurze Detailmetadaten, Tabs, Kontextmenü | DetailHeading/DetailTabs |
| Erfassen/Bearbeiten | zentrierter FormSheet-Dialog, ggf. Wizard | Bottom Sheet, Keyboard-aware, Footer erreichbar | FormSheet/FormWizard |
| Einstellungen | persönliche/organisatorische Ziele aus einem Katalog; Rollen beachten | bestehende flache «Mehr»- und Einstellungen-Navigation, kompakte Rows | SettingsNavigation |
| Rechnungen/PDF | echte Vorschau, Seitennavigation im Viewer, Ausdruck/Download im Menü | PDF-Seitenviewer mit erreichbarer Seitenwahl und Aktionen im Menü | Documents/PdfPageViewer |
| Zeiterfassung | Status/Zeit → Steuerung → Kontext → Einträge/Manuell | **Timer und grosse Zeit vor Kunde/Auftrag-Auswahl**, unterhalb heutige Einträge und manuelle Erfassung | TimePage |
| Support-Ticket/Chat | fester Kontext, scrollbar Nachrichten, Composer am Ende | Header oben, Nachrichten scrollbar, Composer über Tastatur; kein zweiter App-Footer | MessageBubble/Chat-Viewport |
| One Admin | gleiche Design-Tokens, eigene Rollen-/Fachbereiche, auditierbare Aktionen | begrenzte Operator-Shell und eigene Navigation; kein Kundendaten-Bypass | OperatorPage |
| Offline/Read-only/No Access | freundlicher, wahrheitsgemässer Status mit erlaubtem nächsten Schritt | gleiche Semantik, kurze Meldung, sichtbarer Retry | LoadingState/ErrorState/EmptyState |

**Wiederverwendbarkeit:** Diese Muster gelten für sämtliche 76 vorhandenen App-Routen und 13 Operatorvarianten, **soweit der Seitentyp anwendbar ist**. Die nicht original abgebildeten Ansichten sind von den gemeinsamen Ownern abzuleiten und vor visueller Abnahme explizit zu kennzeichnen.

### 5.1 Dashboard je Rolle [ZIEL, deckungsgleich mit V25.3]
- **Inhaber:** Überblick, ausstehende Freigaben, Kunden/Aufträge, offene Forderungen und berechtigte Finanzen.
- **Finanzen:** Rechnungen, Zahlungen, Fälligkeiten, Mahnvorschläge; keine automatisch freigegebenen Mitarbeiterzeiten.
- **Auftragsleitung:** zugewiesene Aufträge, eingesetzte Mitarbeiter, Freigaben, eigene Arbeit; keine Lohn-/Vollbuchhaltung.
- **HR:** Mitarbeiter, Abwesenheiten und berechtigte Personalaufgaben; kein leerer Finanzplatzhalter.
- **Mitarbeiter «nur Zeiterfassung»:** nur Zeit-/Einreichungs-/Freigabestatus und persönliche Einstellungen; Kunden/Aufträge nur als berechtigte Zuordnungsauswahl ohne komplette Kundendossiers.
- **Lesen:** nur freigegebene Leseinformationen ohne Geschäfts-Mutation.
- **One Admin:** rollenabhängige Support-/Billing-/Audit-/Governance-Daten; keine pauschale Einsicht in Unternehmensdetails.

**[OFFEN – UX-01]** Die feste bestehende fünfteilige mobile Bottom-Navigation und die Zielanforderung «nur erlaubte Funktionen sichtbar» erzeugen für extrem eingeschränkte Rollen einen Produktentscheid. **Nicht** heimlich Icons/Positionen/Anzahl verändern oder unzulässige Finanzziele auf «Kein Zugriff» führen; role-aware Zielerreichbarkeit muss mit einem separat freigegebenen Nachweis zur bestehenden Geometrie gelöst werden.

---

## 6. Navigation, Seitenwechsel, Zurück und Rückkehrzustände

### 6.1 Interner Seitenwechsel [FREIGEGEBEN]
- Shell, Navigation und Header bleiben montiert; kein Weissblitz, kein neues Startlogo und kein dekorativer Ladebalken pro Wechsel.
- Aufruf durch Sidebar/Bottom-Nav, ListRow, Tabs und Objektlink behält die angemessene Scrollposition: neuer Hauptbereich von oben, **Rückkehr zur Liste** erhält Suchtext/Filter/Sortierung/Seite/Scroll dort, wo der Kontext dies verlangt.
- Detailseite bekommt korrekten Kunden-/Auftrags-/Rechnungsbezug und führt zurück zur richtigen Ursprungsliste bzw. zum Dossier; keine künstlichen Browser-History-Schleifen.
- Browser-Zurück, iOS-Swipe-Back und Android-Hardware-Zurück respektieren offene Sheets und unsaved-Guards.
- Kein `window.location.reload()` für gewöhnliche Appnavigation, keine doppelten Datenabfragen wegen unabhängiger Header-Ereignisse.

### 6.2 Zurück-Vertrag [ZIEL]
| Situation | Erwartete Aktion |
|---|---|
| Liste → Detail → Zurück | ursprüngliche Liste mit Suche/Filter/Position erhalten |
| Kundendossier → zugehörige Rechnung → Zurück | exakt dieses Kundendossier/zugehörigen Tab erreichen |
| Formular ohne Änderungen → Schliessen/X/Escape | Formular schliessen ohne weitere Nachfrage |
| Formular mit ungespeicherten Änderungen → Zurück/X/Browser-Back | **ein** Dialog «Änderungen verwerfen?» mit «Weiter bearbeiten» / «Änderungen verwerfen» |
| Speichern läuft → Zurück/Schliessen | keine Datenverlustrisiken; Aktion blockieren oder sicheren Abschluss abwarten |
| Filter-Sheet → Anwenden | Filter übernehmen, Sheet schliessen, Liste aktualisieren, Fokus sinnvoll zurück |
| Filter-Sheet → Abbrechen | vorherige Filter unverändert |
| Support-Chat → Zurück | zurück zur Ticketliste; keine verlorene Nachricht und kein verdeckter Composer |
| PWA Deep Link bei abgelaufener Session | anmelden → zurück zum zulässigen Ziel; unberechtigte Ziele abweisen |
| Widerrufene Berechtigung während Sitzung | Daten/Navigation invalidieren und in sicheren Bereich führen; keine alten Mandantendaten zeigen |

**Technischer Owner:** bestehender `useBrowserBackGuard`, FormSheet, `safeAppPath`, `useNavigationScroll`, Session-/Revisionsgrenzen. Ein neuer Back-Handler pro Fachseite ist verboten.

---

## 7. Laden, Seitenübergänge, Speichern und Rückmeldungen

### 7.1 Ladezustände [FREIGEGEBEN]
| Auslöser | Sichtbares Verhalten | Screenreader / Technik |
|---|---|---|
| allererster Bootstrap/Sessioncheck | ausschliesslich vorhandenes originales Binso-App-Icon über `AppStart`, nicht bei jedem Routewechsel | `role=status`, sprechende Meldung |
| interner Seitenwechsel | bestehende Shell bleibt stehen; **kein** sichtbarer Fortschrittsbalken, Spinner, lauter «Daten werden geladen»-Fliesstext oder Splash | `LoadingState` meldet «Daten werden geladen» diskret für Hilfsmittel |
| Daten laden innerhalb der aktuellen Seite | Kontext bleibt stabil; keine fingierten Zahlen/alten Fremddaten, kein springender Header | lokale Lade-/Retry-Semantik, Status ansagen |
| Suche, Filter oder Pagination | Liste zeigt konsistent Ergebnis-/Lade-/Leer-/Fehlerzustand; Suchbegriff bleibt erhalten | Fokus bleibt bedienbar, nicht dauernd neu setzen |
| Dokument/PDF oder Dateianhang | eindeutiger Zustand «wird geladen» im tatsächlichen Dateikontext, ohne doppelte globale Anzeige | Abbruch/Fehler ggf. erneuter Versuch |
| sehr langsame API/Netzfehler | nachweisbar nicht fertig statt leere/0-Werte zu behaupten; lokaler Fehler mit Wiederholen | `ErrorState`/`role=alert` |

**[OFFEN – UX-02]** Ein zusätzlicher sichtbarer «Loading-Icon»-Stil für interne Navigation wäre eine **Änderung** der freigegebenen Quiet-Loading-Regel. Deshalb kein neuer Spinner definieren. Falls später gewünscht, separat freigeben und gegen Originalreferenzen prüfen.

### 7.2 Speichern – exakt definierter Zustandsautomat [ZIEL/FREIGEGEBEN]
1. **Bereit:** primäre Aktion z. B. «Speichern», «Zur Freigabe einreichen», «Rechnung ausstellen». Noch nichts passiert.
2. **Validierung:** Pflichtfelder, Schweizer Formate, Rechte und Status prüfen; Fehler direkt am relevanten Feld und Fokus zum ersten ungültigen Feld.
3. **In Bearbeitung:** Aktion genau einmal abschicken; Button deaktiviert/zeigt **«Wird gespeichert …»** oder fachlich «Wird versendet …»; Gegenaktion darf keine Doppelbuchung verursachen.
4. **Erfolg nur nach Backendbestätigung:** kurze Toast-/Statusmeldung **«Gespeichert»**, «Zur Freigabe eingereicht», «Rechnung ausgestellt», «Zahlung erfasst»; tatsächlichen neuen Status und nächsten Schritt zeigen. Kein „versendet“, wenn lediglich Outbox/Queue existiert.
5. **Eindeutiger Fehler:** Eingaben/Entwurf bleiben erhalten; präzise hilfreiche Meldung und Retry ohne Doppelanlage.
6. **Unklarer Request-Ausgang (Timeout/Netzabbruch):** **kein** «Erfolg» oder blindes Neusenden; Status nach Request-ID/Idempotency prüfen. Nutzer sieht «Speicherung konnte nicht bestätigt werden. Bitte Stand prüfen.»
7. **Abbruch:** Bei Änderungen einmalige Verwerfungsrückfrage; schliessen ohne Änderungen sofort.

**Meldungs-Timing [ZIEL]:** kurze bestätigende Hinweise verschwinden nach angemessener Zeit und sind für Screenreader ansagbar; Fehler und geschäftlich nötige Status bleiben im richtigen Bereich sichtbar, bis sie verstanden/behandelt sind. Keine starren 2-Sekunden-Timeouts für wichtige Fehler. Keine konzeptweit erfundene fixe Toast-Dauer: bestehende Ownerzeiten erst messen, dann gegebenenfalls zentral vereinheitlichen.

### 7.3 Systemmeldungen und Farblogik [FREIGEGEBEN/ZIEL]
| Typ | Beispiel | Ort und Verhalten |
|---|---|---|
| Erfolg | «Kunde gespeichert.» | Toast/Status nahe Nutzerkontext; nur nach verifizierter Speicherung |
| Information | «Die Freigabe steht noch aus.» | Kurzer Hinweis im Detail/Dashboard |
| Warnung | «Zahlungsfrist überschritten.» | Rechnung/Finanzen mit nächsten zulässigen Aktionen |
| Fehler | «Die Rechnung konnte nicht versendet werden.» | direkt im betroffenen Kontext, sichtbar mit Retry/Begründung |
| Validierungsfehler | «Bitte gültige E-Mail-Adresse eingeben.» | beim Eingabefeld, `aria-invalid`, Fokusführung |
| Konflikt | «Dieser Eintrag wurde inzwischen geändert.» | sichere Refresh-/Vergleichsmöglichkeit, Entwurf nicht still überschreiben |
| Sicherheit | «Deine Sitzung ist abgelaufen.» | sichere Anmeldung, kein Anzeigen geschützter Daten |
| irreversible Aktion | «Rechnung wirklich stornieren?» | bestätigender Dialog mit Folgen, Audit und klarer Abbruchaktion |

**Keine negativen Beträge allein durch rote Farbe kennzeichnen, keine Info als Erfolg darstellen.** Fehlende Statistikwerte bleiben **unbekannt**, nicht künstlich CHF 0.00.

### 7.4 Bewegung und Feedback [FREIGEGEBEN]
- Tap-/Klickfeedback direkt (zentraler Fast-Token 140 ms), sanfte Modal-/Kontextübergänge (220 ms Basis), keine Animation als einzige Statusinformation.
- Kein unnötiger Seitenwechsel-Loading-Effekt. Bei `prefers-reduced-motion` Animationen/Übergänge deaktivieren und Fokus sichtbar erhalten.

---

## 8. Formulare, Bottom Sheets, Auswahl und Tastatur

- **Field/Input/Select/Textarea** mit einer einheitlichen Border-/Fokus-/Disabled-/Fehlerlogik; keine doppelt wirkenden Umrandungen, kein lokaler CSS-Patch.
- Sichtbares Label bleibt vorhanden, Placeholder ist nur *Beispiel*, niemals tatsächlicher Standardwert. Formatbeispiele: CHF 1’250.00, PLZ 9050, +41 …, IBAN CH… (korrekte Validierung separat).
- **Pflichtfelder** vor dem Weiterschalten prüfen; Wizard zeigt Schritt x von n, verhindert ungültiges Weiter, setzt Fokus sinnvoll. Keine wiederholte Doppelbearbeitung identischer Daten in mehreren Schritten.
- **Mobile**: Inhaltsspezifisches FormSheet von unten, nicht bei jeder Aktion Vollbild; bei langer Erfassung Scrollbereich und am unteren Rand erreichbare Aktionen; Footer oberhalb der nativen Tastatur; `visualViewport` und Safe Areas testen.
- **Desktop**: zentrierter Modaldialog, keine mobilen Bottom-Sheets; langer Inhalt scrollbar, Save/Cancel unten sichtbar.
- **Dialog-Grundregel**: Hintergrund wirklich gesperrt, modaler Fokus im Dialog, Escape/X korrekt, nach Schliessen Fokus zurück zum Auslöser, verschachtelte Dialoge ohne Fokusverluste.
- **Auswahl- und Datumsfelder**: bestehender App-Select-Popup-Owner, Tastatur/Screenreader, echte Auswahlvalidierung; nie verdeckt über Tastatur/Footer/Screenkante.
- **Filter-Sheet**: kompaktes inhaltsabhängiges Mass; Suche/Filter/Sortierung im gemeinsamen Owner; kein doppelter Titel oder verdeckte Bedienelemente.
- **Upload**: eine konsistente Dateiaktion im bestehenden Besitzer, ausgewählte Datei und Scannerstatus anzeigen; Zugriff und Dateiformat prüfen; Vorschau/Download nicht als verstreute Zusatzbuttons.
- **Dokumentassistent**: Kunde/Datum → Positionen → Bedingungen → lesbare Zusammenfassung; PDF getrennte Vorschau, vor Versand/Bezahlung ehrliche Status.
- **Support-Chat iOS**: Systemtastatur darf Composer nicht verdecken; Header bleibt oben, Nachrichten bleiben scrollbar, ein begrenzt wachsender Eingabebereich; echte iOS Safari/PWA-Abnahme obligatorisch.

### 8.1 Einheitliche leere, read-only und gesperrte Zustände
- Leer: bevorzugt eine Kurzzeile, bei Bedarf zweite hilfreiche Zeile (z. B. «Noch keine Einträge vorhanden.»). Keine Riesenkarte, dekorative Illustration, eigene Erstellen-Schaltfläche. Text darf bei 200% Zoom umbrechen und wird **nicht abgeschnitten**.
- Keine Berechtigung: keine verbotenen Buttons/Links als Lockmittel; direkte URL/API bleibt geschützt. Bei rechtmässiger Anzeige eines «Kein Zugriff»-Zustands kurze Erklärung.
- Read-only wegen Abo: bestehende Daten sicher lesbar, soweit vertraglich erlaubt; Buttons deaktiviert/entfernt, Status und Handlungsweg verständlich.
- Kein Treffer nach Filter: «Keine passenden Ergebnisse.» statt «Es gibt noch keine Daten.»; Filterzustand bleibt änderbar.

---

## 9. Finanz-, Zeit- und Statusdarstellung

**[FREIGEGEBEN]** Jede Darstellung trennt Umsatz/Fakturierung, Zahlungseingänge, Ausgaben, offenen Forderungsbestand und Saldo. Donut nur für echte Teile *desselben* Totals. Bestandswert vs. Zeitraumwert sichtbar unterscheiden. Währungen nicht künstlich zusammenrechnen. CHF/QR-Rechnung und MWST aus korrekten Geschäftsdaten; keine Fantasiewerte in Live-Ansichten.

| Objekt | Primäre sichtbare Information | Sekundäre Information / Aktion |
|---|---|---|
| Auftrag | Nummer/Name, Kunde, Status, verantwortliche Person | Budget, Termine, zugewiesene Zeiten, zugehörige Rechnungen nach Recht |
| Zeiteintrag | Datum, Kunde/Auftrag, Dauer, Status | eigene Korrektur, Einreichen, Freigabeverlauf; keine fremden Stundensätze |
| Rechnung | Nummer, Kunde, Betrag/Währung, Fälligkeit, Status | offener Restbetrag, PDF, Zahlungen, Mahnhistorie nach Recht |
| Angebot | Nummer, Kunde, Betrag, Gültigkeit, Entscheidstatus | Version, Nachweis der Annahme, daraus entstandener Auftrag |
| Spese | Person, Betrag, Kategorie, Einreich-/Freigabestatus | Erstattung getrennt von Kundenverrechnung |
| Supportticket | kurze lesbare Ticketnummer, knapper Titel, Status | Chat, interne Notiz ausschliesslich in One Admin |

**Rollenabhängig [ZIEL]:** Der Mitarbeiter sieht freigegeben/eingereicht/zurückgewiesen und die eigene Zeit, nicht Zahlungsstatus oder Unternehmensfinanzen. Finanzen sieht freigegebene abrechenbare Leistungen, nicht automatisch vertrauliche Personaldaten. One Admin sieht nur Plattformdaten seiner Rolle.

---

## 10. Accessibility, Lokalisierung, Performance und Browserdetails

- **Tastatur:** sinnvoller Tab-Reihenfolge, sichtbarer Fokus, Enter/Space/Escape, kein Keyboard-Trap ausser absichtlich modalem Dialog, Rückfokus.
- **Screenreader:** dynamische Titel und Zustände, Felder mit echten Labels und Fehlerverknüpfung, Buttons mit klaren Namen, Statusnachrichten über `role=status`/`role=alert`; bei langen Tabellen erkennbare Header.
- **Touch/Zoom:** mind. 44px Touch, iOS-Input 16px, 320px Breite, 200% Textzoom, Landscape, dynamische Browserleisten, Safe Areas; keine kritische Aktion verdeckt.
- **Sprache/Region:** Schweiz, `de-CH` als dokumentierter Standard; aktiv verfügbare Sprachen und Übersetzungsfallbacks ehrlich; `Europe/Zurich` für Tagesgruppen und Geschäftsdatumsgrenzen, keine UTC-«Heute»-Fehler.
- **Zahlen:** CHF-Beträge, Daten, Zeitdauer, MWST und Prozent fachgerecht formatieren; barrierefreie negative Beträge; Dokument- und Datenbankwerte nicht durch gerundete UI-Werte verändern.
- **Performance [ZIEL]:** keine neuen doppelten API-Abfragen; nachgewiesene Cache-/Sessiongrenzen erhalten; langsame Verbindungen und hohe Listenbestände testen; p95-Ziele erst nach realer Messung als verbindlichen SLO festlegen.
- **Fehlerfälle:** Offline, auslaufende Session, Passwort-/MFA-Fehler, fehlendes Abo, bereits bearbeitete Datensätze, parallele Änderungen, Uploadvirus-Scan, unbestätigter E-Mail-Versand, Zahlungs-Kollision.
- **Schweizer PWA/Browser:** iPhone Safari + installierte iOS-PWA; Android Chrome + installierte PWA; iPad Safari inkl. Split View; Desktop Chrome/Edge/Firefox sowie macOS Safari für relevante Vertragszustände. Simulator-/WebKit-Erfolg ist **kein** realer iPhone-Nachweis.

---

## 11. Spezielle plattformübergreifende Flows als UX-Vertrag

### UX-F01 Login / Rollenwechsel
1. Anmeldung/MFA → authentifizierter Unternehmenskontext → rollenrelevante Übersicht.
2. Personen mit nur Zeiterfassung sehen ausschliesslich ihren erlaubten Arbeitsbereich und persönliche Einstellungen; Auftrags-/Kundenauswahl als begrenztes Hilfsfeld, nicht als Vollzugriff.
3. Sitzung/Unternehmen/Rolle geändert → Berechtigungen und Daten invalidieren, keine alte Navigation/alte Datensätze durch Cache oder Browserhistory.
4. Nur echte Nutzer-/Mandantendaten, keine Platzhalter aus Preview ins Produkt.

### UX-F02 Kunde → Angebot → Auftrag → Rechnung
1. Kundenliste → Kunde erstellen (Firma + primärer Kontakt mit Vor- und Nachname) → Kundendossier.
2. Angebot erstellen und speichern → PDF-Vorschau → kontrollierter Versand → tatsächlich nachgewiesene Annahme.
3. Auftrag übernehmen, kein doppelter Auftrag bei wiederholter Aktion.
4. Erfasste/freigegebene verrechenbare Zeiten/Spesen in Abrechnungsstapel → Rechnungsvorschlag → Review → ausstellen → QR/PDF → Versand.
5. Detailstatus, Kundenkontext und Rücknavigation bleiben entlang aller Schritte erhalten; jede Aktion folgt V25.3-Rechten.

### UX-F03 Zeit-only Mitarbeiter
1. Login → «Meine Arbeitszeit» als berechtigter Einstieg.
2. Grosse Zeitanzeige, Start/Pause/Stop **vor** Zuordnungsfeldern; gültiger Default oder Pflichtauswahl vor Start, ohne Datenverlust.
3. Nach Speichern eigene Einträge sehen; Einreichen, Statuswechsel, begründete Zurückweisung und Korrektur klar verständlich.
4. Keine Finanz-, Mitarbeiter- oder Kundenverwaltungsfunktion; keine fremden Einträge; API negative Fälle ebenfalls prüfen.

### UX-F04 Zahlungen und Mahnen
1. Rechnung ausgestellt, Fälligkeit sichtbar; Zahlungen nur bestätigt erfassen.
2. Teilzahlung → neuer Restbetrag, kein falscher «Bezahlt»-Status; Überzahlung/unsichere Zuordnung sicher behandeln.
3. Überfällig → manuelle Mahnprüfung bzw. bei späterer Freigabe geplante Vorschläge; kein automatischer Versand ohne bestätigte Entscheidung und verfügbare Infrastruktur.
4. Fehlerhafter Versand → «nicht bestätigt», Nachprüfung statt blindem Retry; Empfänger und Status unverfälscht.

### UX-F05 Support über Kunden-App und One Admin
1. Kunde erstellt Ticket, erhält lesbare Ticketnummer.
2. Intern antwortet autorisierte Supportrolle; **interne Notizen niemals in Kundensicht**.
3. Mobile Chat-Sicht mit offener Tastatur ist nutzbar; Antwort-/Senden-Feedback ist korrekt; Reopen/Close nachvollziehbar.

---

## 12. Abnahme ohne 76 × alle Geräte manuell zu testen

**Zwei Ebenen verpflichtend:**
1. **Automatisierte Routen-/Status-/Rollenmatrix** über alle 76 App-Routen und die 13 Operatorvarianten: autorisiert/abgewiesen, Render/Overflow, Formlabels, Empty/Error/Loading, Navigation, wichtige CRUD- und API-Tests, Screenshots aus denselben Datenzuständen.
2. **Repräsentative reale Gerätetests** für die schwierigen Muster: Login/MFA, Dashboard, Liste/Filter, Kunde-Wizard, Dokument-Editor/PDF, Timer/Offline, Chat-Tastatur, FormSheet/Select, Upload/Scan, Einstellungen, PWA-Resume und Operatorzugriff. Alle nicht abgedeckten Sondermuster risikobasiert ergänzen.

**Testprofile:** 320, 360, 390, 430, 760, 761, 768, 820, 1024, 1100, 1101, 1280, 1440 und 1920 CSS-px (zielgerichtet statt immer alle Kombinationen), Light/Dark, Browser/PWA, Portrait/Landscape, Touch/Pointer, systemische Schriftvergrösserung, Offline/Slow, Owner/Finance/HR/Project Manager/Member/Reader sowie getrennte Operatorrollen.

**Abnahme-Regeln [FREIGEGEBEN]:** Es gibt keine automatische Zustimmung durch erfolgreiche Builds. Originales Microsoft-Referenzpaket wird bei gleichen Inhaltsbreiten mit der echten Implementierung verglichen. Fehlende Screens/Operator/Dark abgeleitet markieren. Verbindliche Bildbaselines nur nach ausdrücklicher Freigabe übernehmen. Pro Fall `Route, Rolle, Viewport, Engine, Theme, Gerät, Zustand, Erwartung, Ist-Ergebnis, Commit, Screenshot/Trace, Freigeber, Datum` dokumentieren. **Realgeräte-, Screenreader- und PWA-Nachweise dürfen nicht aus Emulation abgeleitet werden.**

### 12.1 Verbindliche Komponenten-/Statusprüfung
- [ ] AppStart erscheint nur beim Session-Start, nicht bei internem Zurück.
- [ ] Kein sichtbarer Ladebalken/Spinner bei normaler interner Navigation; Screenreader erfährt den Status.
- [ ] Start/Detail/Listentitel und klare Breadcrumb-/Back-Bezüge je Gerät.
- [ ] Mobile Bottom-Navigation unverändert in Aussehen/Position, lesbar, Safe Area korrekt; keine unberechtigten Sackgassen.
- [ ] Desktop Sidebar und obere Suche/Bell/Konto; Actions in Command-Bar.
- [ ] Typografie/Abstände matchen zentrale Tokens und freigegebene Referenz.
- [ ] FormSheet: Tastatur, Safe Area, Scroll, Footer und Rückfokus funktionieren.
- [ ] Entwurf: X/Abbrechen/Browser-Back führen zu derselben Datenverlustentscheidung.
- [ ] Save-Buttons signalisieren Running/Success/Failure wahrheitsgemäss.
- [ ] Keine fremden Daten, keine Rechteausweitung durch PWA/Deep Link/Search.
- [ ] Keine sichtbare PWA-Update-Meldung auf Web/Mobile, kein Überraschungsreload.
- [ ] Empty States kompakt (max. zwei inhaltliche Zeilen), textzoomfest.
- [ ] Finanzwerte, Rechnungsstatus und PDF/QR korrekt und berechtigungsabhängig.
- [ ] Supportchat funktioniert auf echtem iPhone mit geöffneter Tastatur.
- [ ] Jede visuelle Abweichung wird zentral am zuständigen Owner behoben, nicht im Routen-CSS.

---

## 13. Kodierungs-/Implementierungsvorgaben – späterer Codex-Auftrag

**Kein neuer UI-Unterbau:** `app/design-system/manifest.json` bleibt die einzige CSS-Owner-Matrix. Komponentenowner u. a. `components/app-shell.tsx`, `components/app-chrome.tsx`, `components/binso-ux.tsx`, `components/records.tsx`, `components/ui.tsx`, `components/settings-navigation.tsx`, `components/pages/time.tsx`, `components/documents.tsx`, `components/pdf-preview.tsx`, `components/operator.tsx`. Nur eine berechtigte, dokumentierte neue Komponente, wenn ein bestehender Owner nicht fachlich passend ist.

1. Bestehende Main-/PR-Arbeit ermitteln, vor allem **PR #297** zur Foundation-Compliance: nicht doppelt implementieren. Alte historische UX-Berichte nicht zu aktiven Regeln machen.
2. Dieses Dokument als UX-Vertragsquelle in der Dokumentenhierarchie verlinken, **ohne** `AGENTS.md`, aktuelle Approval- oder das CSS-Manifest zu ersetzen.
3. Abweichungen zwischen [IST] und [FREIGEGEBEN] als konkrete Findings behandeln; [ZIEL] nur nach Freigabe umsetzen; [OFFEN] nicht vom Agenten entscheiden lassen.
4. Zentrale Token-/Component-/Businesslogik ändern statt lokale CSS-Fixes. Vorher-/Nachher-Computed-Styles in Light/Dark und bei Grenzbreiten verifizieren.
5. Während Entwicklung nur betroffene Tests; vor Integrationsfreigabe vollständige relevante CI-/Security-/Browser-Gates am aktuellen SHA. Kein stilles Akzeptieren neuer Baselines oder Falsch-Grün im Compliance-Aggregator.
6. Keine produktiven Migrationen, Merges, Deployments oder Live-Datenveränderungen ohne separate Freigabe. Kein Ersatz für echten Gerätetest.

---

## 14. Zielkonflikte und Produktentscheidungsregister

| ID | Sachverhalt | Empfehlung | Status |
|---|---|---|---|
| UX-01 | Fünf feste mobile Navigationspositionen vs. Mitarbeiter mit nur einem Geschäftsmodul | Bestandslayout nicht verändern; rollenabhängige Erreichbarkeit ohne Sackgassen separat visuell freigeben | **OFFEN** |
| UX-02 | Wunsch nach sichtbarem Lade-Icon vs. freigegebenem quiet LoadingState | Keinen neuen Spinner; Bootstrap-Binso-Icon behalten; bei späterem Änderungswunsch neue visuelle Freigabe | **Bestehende Regel hat Vorrang** |
| UX-03 | Ältere Dokumente fordern sichtbares Update-Angebot, jüngste Nutzerfreigabe verbietet es | sichtbares Banner auf Web/PWA vollständig unterlassen; unsichtbares Update-Management ohne Reload/Risiko | **FREIGEGEBEN, Codeabweichung** |
| UX-04 | Dark-/Operator- und nicht vorhandene Originalscreen-Referenzen | aus Foundation ableiten, in Review kennzeichnen, nicht als «original genehmigt» melden | **ABNAHME OFFEN** |
| UX-05 | «Max. zwei Zeilen» Empty State vs. Textzoom/Accessibility | max. zwei inhaltliche Textabsätze; notwendiger Umbruch zulässig, kein Abschneiden | **FREIGEGEBEN** |
| UX-06 | Tablet-Portrait und schmale Split-View | CSS-Breakpoint 760/761 bestimmen lassen, Touch-/Focusregeln ergänzen, kein neuer Tablet-Breakpoint | **ZIEL** |
| UX-07 | Feedback nach asynchronem Versand/Upload | nur nach bestätigtem Ergebnis «gesendet», bei unklarer Rückmeldung Statusprüfung/Retry | **FREIGEGEBENE Sicherheitslogik / ZIEL-UX** |
| UX-08 | Rollenbezogene «Nur Zeiterfassung»-Startansicht | V25.3-Rechte zuerst implementieren, Dashboard und erlaubte Navigation daraus ableiten | **FACHLICH FREIGEGEBEN, UMSETZUNG OFFEN** |
| UX-09 | Ob einzelne Fehlermeldungen verschwinden dürfen | wichtige Fehler erhalten, rein positive Toasts zeitlich begrenzen; zentrale Ownerzeit nach Messung bestimmen | **ZIEL** |
| UX-10 | Popup/Sheet-Verhalten bei echtem iOS-PWA und OS-Tastatur | echte Hardware-Evidenz erforderlich; keine Emulation als Erfolg deklarieren | **ABNAHME OFFEN** |

---

## 15. Quellenverweise (geprüfter Main-Stand)

- `AGENTS.md`
- `docs/architecture/ux-current-approval.md`
- `docs/architecture/reference-foundation.md`
- `docs/audit/v24/reference/IMPLEMENTIERUNG.md` – zuletzt freigegebene Aussagen haben Vorrang vor historischen Zeilen (z. B. ursprünglicher schwarzer Plus-Kreis).
- `docs/assets/20261018/stable-navigation-reference.json`
- `app/design-system/manifest.json`, `theme.css`, `foundation.css`, `layout.css`, `navigation.css`, `primitives.css`, `overlays.css`
- `components/app-shell.tsx`, `components/app-start.tsx`, `components/ui.tsx`, `components/binso-ux.tsx`, `components/app-chrome.tsx`, `components/use-browser-back-guard.ts`, `components/app-version-notice.tsx`
- `components/customer-app-layout.tsx`, `app/operator/layout.tsx`, `public/manifest-app.webmanifest`
- `docs/architecture/app-acceptance.md`, `docs/architecture/app-acceptance-routes.md`
- Vorhandenes V25.3 Masterkonzept im Nutzer-Artefakt `BINSO_ONE_V25_3_Business_Process_Master_Implementation.md`.

**Arbeitsstatus:** Spezifikation verfasst, Ist-Tokens und technische Owner per Repository-Leserechten abgeglichen; keine umfassenden Browser-/Geräteprüfungen, keine Codeänderungen, keine Baseline-Freigabe, kein Merge/Deployment. Im Zweifel immer die aktuellere schriftlich ausdrücklich freigegebene Produktentscheidung einholen.
