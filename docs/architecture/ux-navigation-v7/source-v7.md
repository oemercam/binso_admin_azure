# BINSO ONE — UX & NAVIGATION MASTER V7

**Status:** verbindliche Soll-Spezifikation zur Implementierung und Abnahme, nicht Nachweis des aktuellen Codezustands.  
**Ziel:** Die im Chat freigegebene kompakte, interaktive Darstellung mit klaren Zeilen, feinen Trennlinien, linksbündigen Icons und rechtsbündigen Werten/Chevrons über die gesamte Kunden-App konsistent umsetzen.  
**Repository:** `oemercam/binso_admin_azure`.

## 1. Verbindliche Prinzipien

1. Eine Funktion hat einen eindeutigen fachlichen Hauptort; kontextuelle Links zeigen auf dieselben Datensätze.
2. Navigation: **Übersicht · Kunden · Aufträge · Zeit · Mehr**. Bestehende Bottom-Navigation in Design, Höhe und Position erhalten; nur freigegebene Belegung verwenden.
3. Bestehender runder blauer Floating-Plus-Button bleibt in Gestaltung und Position unverändert. Auf Übersicht öffnet er „Neu erstellen“, in Fachlisten kontextbezogen.
4. Übersichtliche Seiten: eine Hauptaufgabe, klar getrennte Bereiche, keine redundanten Kennzahlen, unnötigen Tabs oder Erklärtexte.
5. Keine neuen Parallelkomponenten oder lokalen CSS-Patches. Vorhandene zentrale Owner wiederverwenden beziehungsweise konsolidieren.
6. Alle Funktionen und Berechtigungen erhalten; keine erfundenen Status, Zahlungen, Versand- oder Lesebestätigungen.

## 2. Exakter visueller Vertrag für App-Oberflächen

| Element | Soll |
|---|---|
| Schrift | Inter, System-Fallback |
| App-Seitentitel | 18 px, Gewicht 600, Zeilenhöhe 24 px |
| Abschnittstitel | 14 px, Gewicht 600, Zeilenhöhe 20 px |
| Standard-/Zeilentext | 14 px, Gewicht 400–500, Zeilenhöhe 20 px |
| Sekundärtext | 12 px, Gewicht 400, Zeilenhöhe 16–18 px |
| Formularlabels | 13 px, Gewicht 500 |
| KPI-Wert | 20 px, Gewicht 600; hervorgehobener Detailbetrag 24 px |
| Statusbadge | 11 px, Gewicht 500, semantische Farbe |
| Mobile Input/Select/Textarea-Inhalt | mindestens 16 px gegen iOS-Fokuszoom; Desktop 14 px |
| App-Header | 56 px zzgl. Safe Area |
| Header-Icon / Zurück / Ellipsis | 20 px, einheitliche Strichstärke |
| Menü-Icon | 18 px; Navigations-Chevron 16 px; Dropdown-Chevron 14 px |
| Interaktive Zielfläche | mindestens 44 × 44 px |
| Mobile Seitenrand | 16 px |
| Kartenradius / Formularradius | 16 px / 12 px |
| Karten-Innenabstand | 12–16 px |
| Standard-Navigationszeile | mindestens 48 px, bei Zweizeilern inhaltsabhängig |
| Zeilen-Trennlinie | 1 px, dezente semantische Theme-Farbe, einheitlich am Inhaltsraster |
| Icon–Text-Abstand | 12 px |
| Abstände | zentrale 4/8/12/16/24/32-px-Skala; keine willkürlichen Werte |

**Trennlinienregel:** Zwischen benachbarten gleichartigen Zeilen genau **eine** Linie; keine Linie nach der letzten Zeile; keine doppelten Karten-/Zeilenrahmen. Gleicher Einzug innerhalb derselben Listenfamilie. Light/Dark über semantische Tokens. Keine optisch unmotivierten grossen Zwischenräume.

**Interaktionssemantik:** `chevron-right` = Navigation; `chevron-down/up` = Auf-/Zuklappen; `plus` = Hinzufügen; `ellipsis` = kontextbezogene Datensatzaktionen. Reine Kennzahlen erhalten keinen Chevron. Die gesamte navigierbare Zeile ist anklickbar, nicht nur das Icon.

## 3. Einheitliche Komponenten

Inventarisiere bestehende Implementierungen und konsolidiere sie in einer Foundation für `AppHeader`, `PageDescription`, `SectionHeader`, `NavigationRow`, `DataListRow`, `DetailRow`, `SectionDivider`, `StatusBadge`, `MetricCard`, `EmptyState`, `Accordion`, `SearchField`, `Filter/SortPopover`, `ActionMenu`, `BottomSheet`, `FormField` und `StickyActionFooter`. Namen sind konzeptionell: bestehende äquivalente Komponenten bevorzugen. Für identische Elemente keine seitenbezogenen Sondergrössen.

**Referenzmuster NavigationRow:** ein Icon links (18 px), Text links (14 px), optional Anzahl/Status rechts (14 px), Chevron ganz rechts (16 px); einheitliche Baselines, 48 px Mindesthöhe, 12 px Icon-Text-Abstand, 1-px-Trenner. Zahlen und Pfeile stehen auf jeder Zeile in denselben Spalten. Die interaktive Chat-Referenz ist das Sollbild; für pixelnahe Umsetzung reale Browser-Screenshots derselben Ansicht und Viewportbreite vergleichen.

## 4. Vollständige Informationsarchitektur

### Hauptnavigation

- **Übersicht:** persönliche Aufgaben, relevante KPI, kompakte Einrichtungshinweise, zuletzt bearbeitete Vorgänge. Keine vollständigen Fachlisten.
- **Kunden:** Firmenliste → Kunde → **Kunden-Zentrale** → kundenbezogene Fachliste → Datensatzdetail.
- **Aufträge:** unternehmensweite Auftragsliste → Auftrag → zugeordnete Zeiten, Dokumente, Kunde.
- **Zeit:** Timer, Einträge, berechtigte Freigabe-/Rapportprozesse.
- **Mehr:** kategorisierte unternehmensweite Fachmodule und Unternehmensverwaltung.

### Mehr — Kategorien und Reihenfolge

**Geschäft:** Angebote · Rechnungen · Zahlungen · Ausgaben & Spesen · Finanzübersicht.  
**Auswertung:** Berichte.  
**Verwaltung:** Unternehmen · Mitarbeiter & Berechtigungen · Unternehmenseinstellungen · Abonnement (als eigenständiger Punkt nur, wenn die vorhandene Struktur es erfordert; keine doppelte Seite).  
**Hilfe:** Support · Hilfe & Informationen.

Alle Einträge als einzeilige `NavigationRow` mit Icon, Titel, Chevron und **einheitlichen Trennlinien**. Kategorien mit 14-px-Semibold-Überschrift und einheitlichem Abschnittsabstand. Berechtigungsabhängige Sichtbarkeit. Keine redundanten Beschreibungen unter jedem Eintrag.

### Avatar — ausschliesslich persönlich

Persönliche Daten · Sicherheit & Anmeldung · Benachrichtigungen · Darstellung · Sprache · Datenschutz & Cookies · Geräte & Sitzungen · Abmelden. Unternehmensweite Konfiguration gehört ausschliesslich unter Mehr. Die Sprachwahl erscheint im persönlichen Konto genau einmal: `DE ˅`, `FR ˅`, `IT ˅`, `EN ˅`, `TR ˅`, Dropdown vollständig sichtbar. Landingpage hat ihren eigenen einmaligen Sprachwähler im Header.

## 5. Kunden-Zentrale — zentrale Referenzseite

**Ablauf:** Übersicht → Kunden → Kunde auswählen → Kunden-Zentrale → Aufträge/Angebote/Rechnungen/Zahlungen/Kontakte/Dateien → Liste gefiltert auf Kunden → Datensatzdetail → Zurück exakt zur gefilterten Liste/Kunden-Zentrale.

**Kopf:** Detailheader mit Zurück links, Kundenname mittig, Ellipsis rechts (bei mehreren zulässigen Aktionen); kompakte Status-/Kontextzeile. Danach **keine Tabs und keine langen Inhaltsblöcke** in der Zentrale.

**Menüzeilen, Reihenfolge:**

1. Aufträge — Anzahl, Chevron
2. Angebote — Anzahl, Chevron
3. Rechnungen — Anzahl, Chevron
4. Zahlungen — Anzahl, Chevron
5. Kontakte — Anzahl, Chevron
6. Dateien — Anzahl, Chevron
7. Verlauf — Chevron
8. Stammdaten — Chevron

Verwende die freigegebene Chat-Darstellung: eine klar begrenzte Fläche, 48-px-Zeilen, feine Trennlinien, Icons links, Text links, Anzahl rechts, Chevron ganz rechts. Keine sechs grossen KPI-Kacheln, keine doppelten Tabs, keine komplette Rechnungs-/Auftragsliste in der Zentrale. Fehlende Zählwerte nicht erfinden; Lade-/Fehlerzustand korrekt behandeln.

**Fachlisten:** dieselben Daten wie die unternehmensweiten Listen, aber mit festem, sichtbarem und bei Bedarf gezielt lösbarem Kundenfilter. Von `Mehr → Rechnungen` erscheinen dagegen alle berechtigten Kunden. Keine duplizierten Datensätze oder getrennte Datenmodelle.

## 6. Globale Listenverträge

- **Kunden:** Zeile 1 Firmenname links + Statusbadge rechts; Zeile 2 Kontaktperson links. Keine Beträge, Auftragszahlen oder Branche.
- **Angebote:** Zeile 1 Dokumentnummer links + Statusbadge rechts; Zeile 2 Firma und Datum links + vollständiger CHF-Betrag rechts.
- **Rechnungen:** identisch zum Angebot; keine dritte Betragszeile.
- **Aufträge:** Bezeichnung und Status klar getrennt; Kunde als zweite Zeile, vorhandene fachlich sinnvolle Kurzangaben nur bei Bedarf.
- **Support:** kurzer Ticket-Titel, lesbare Ticketnummer, Status; Tippen öffnet **Ticketdetail**, nicht direkt Chat.
- **Zeiteinträge:** Tätigkeit, Dauer, Datum und eindeutiges Statusbadge; „Wartet auf Prüfung“ als Status, „Zur Prüfung einreichen“ nur als Aktion.

Alle Listen verwenden gleiche Abstände, Linien und Textgrössen. Lange Namen können gekürzt/umgebrochen werden, Beträge und Badges dürfen nicht abgeschnitten werden. Maximal zwei Zeilen für Empty States.

## 7. Fachabläufe und Detailseiten

**Support:** Ticketliste → Ticketdetail (Titel, Nummer, Status, Beschreibung, Anhänge, Verlauf) → Unterhaltung; Chat keyboard-aware, Composer sichtbar oberhalb der iOS-Tastatur.

**Aufträge:** Auftragsliste → Detail mit Kunde, Status, Leistungen, Zeiten, zugehörigen Dokumenten; kein unstrukturierter Datenblock. Kontextlinks behalten Rückweg.

**Angebote/Rechnungen:** Detail mit Nummer und Version getrennt, Status, Betrag, Datum, Positionen, Summe, Versionen/Versand, Dateien. Dokumentversionen und Versandereignisse getrennt. Versandstatus: gelb versendet ohne Zustellbestätigung, grün nur nachgewiesen zugestellt/angesehen, rot nachgewiesen fehlgeschlagen, neutral unbekannt. Keine Providertexte im normalen UI.

**Positionsliste:** freigegebene **Variante 1**: Drag-Handle links, zweistellige Nummer + Titel, Menge × Einzelpreis zweite Zeile, Betrag rechts, Chevron zur Bearbeitung. Zeile tippen = bearbeiten; Griff ziehen = sortieren; Duplizieren/Löschen über zugängliche Kontextaktion (Touch-Wischgeste nur mit Alternative). Nummerierung, Summen, PDF-Reihenfolge und historische Dokumentversionen korrekt halten.

**Zeit:** Start/Fortsetzen blau, Pause neutral, Stoppen rot; Timerverlust verhindern. Erfasste Einträge in Mehrfachauswahl zur Prüfung einreichen; Prüfer können nur berechtigte Einträge gesammelt freigeben. Statusübergänge serverseitig prüfen.

**Finanzen:** echte Finanzkennzahlen und Zahlungsbezüge; keine Vermischung mit Arbeitszeit oder Angebotslisten als vermeintliche Finanz-KPI. Berichte separat. Bei fehlenden Daten kompakte Leerzustände.

**Einrichtung:** drei kurze Schritte Unternehmen → Adresse → Zahlungskonto; nur notwendige Angaben, ein Fortschrittsindikator; optionale Dokumenttexte/MwSt.-Defaults in Einstellungen. Vorhandene fachliche QR-/IBAN-Regeln erhalten.

## 8. Header, Aktionen, Suche und Formulare

- Übersichts-/Listenseiten: Titel links; Suche, Glocke, Avatar rechts; **keine drei Punkte im Header**.
- Detailseiten: Zurück links, Titel optisch zentriert, Ellipsis rechts für mehrere Aktionen; keine zusätzlichen vier Header-Icons.
- Globales Plus auf Übersicht öffnet `Neu erstellen` mit berechtigten Kunde, Auftrag, Angebot, Rechnung, Zeiteintrag, Spese. Fachlisten-Plus kontextspezifisch. Plus-Design und Position unverändert.
- Filter und Sortierung als kleine verankerte Dropdowns; komplizierte Filter als Bottom Sheet. Aktive Sortierung/Filter sichtbar und getrennt rücksetzbar. Keine unnötige Paginierung in leeren Auswahlen.
- Formulare mit zentralen Inputs, 12-px-Radius, einheitlichen Feldabständen; umfangreiche Bearbeitung als eigene Ansicht, nicht verschachtelte Sheets. Footer kompakt und keyboard-aware.
- Dirty-State nur bei tatsächlicher Abweichung von geladenen Ausgangswerten. X/Abbrechen/Escape ohne Änderungen sofort schliessen; bei echten Änderungen bestätigen. Aufrufroute, Kundenfilter, Tab, Sortierung, Scrollposition erhalten.
- Auf Hauptseiten kurze, einheitliche Seitenbeschreibung unter dem Header; Detailseiten nur bei echtem Mehrwert, keine doppelte Erklärung.

## 9. Sprachen, Sicherheit und Datenschutz

Fünf Sprachen: `de-CH`, `fr-CH`, `it-CH`, `en`, `tr`. Zentraler Übersetzungskatalog, keine sichtbaren Schlüssel, keine Mischsprachen; türkische Zeichen, lange Texte, Zahlen-/Datumsformate und responsive Umbrüche testen. Rechtliche Texte nur als freigegebene Fassungen; öffentliche Rechtsseiten weiterhin ohne Anmeldung, intern in App-UX.

Admin-Portal: **MFA verpflichtend und serverseitig durchgesetzt**. Kunden-MFA optional beziehungsweise durch Unternehmensrichtlinie verpflichtend. Vorhandene Auth-/Passkey-/TOTP-/Sitzungsarchitektur prüfen, nicht ungefragt neu schreiben. RLS, Mandantentrennung, Zahlungslogik, QR-Rechnung, Timer und Auditprotokolle unverändert schützen.

## 10. Work-/Codex-Arbeitsauftrag

1. **Inventur:** alle tatsächlichen Routen, Rollen, Navigationen, Menüs, Aktionen und Komponenten; Ist-Soll-Matrix je Seite mit `Erfüllt / Teilweise / Fehlt / Blockiert` und Codebeleg.
2. **Foundation:** vorhandene Tokens und Komponenten zentral konsolidieren. Vorhandene gute UI nicht neu gestalten; Legacy-Overrides erst nach nachgewiesener Ersetzung entfernen.
3. **Referenzseiten zuerst:** Kunden-Zentrale, Mehr, Avatar, Kunden-/Angebots-/Rechnungslisten; diese gegen das oben definierte Chat-Referenzmuster im echten Browser vergleichen.
4. **Flächendeckend migrieren:** Aufträge, Zeit, Finanzen, Berichte, Support, Einstellungen, Dokumentdetails und Formulare nach denselben Komponenten; kein isolierter CSS-Patch je Seite.
5. **Navigation und Kontext:** Kunden- und unternehmensweite Wege, Deep Links, Zurück, X, Escape, Dirty-State, Filter/Scrollkontext testen.
6. **Gezielte Tests:** Unit/Komponenten, Routen, Rollen, Regressionen, responsive Screenshots (320, 390, 430, 768, 1024, 1440 px), Light/Dark, fünf Sprachen; iOS-PWA-Gerätetests nur als bestanden melden, wenn wirklich ausgeführt.
7. **Abnahme:** Matrix je Route und Screenshots der echten Implementierung, verbleibende Abweichungen explizit nennen. Keine Tests abschalten, keine unbelegten 100%-Behauptungen.

**Performance:** gezielte Prüfungen nach Änderung, nicht nach jeder CSS-Zeile vollständige Testmatrix; abschliessend alle vorgeschriebenen CI-Gates auf finalem SHA.

**Freigabegrenze:** keine produktiven Datenänderungen, Migrationen, GitHub-Pushes, Merges oder Azure-Deployments ohne ausdrückliche Freigabe. Erst tatsächliche Vorschau und Abnahmebericht zeigen.

## 11. Konkrete Akzeptanzkriterien

- Die Kunden-Zentrale entspricht der Chat-Referenz hinsichtlich Zeilen, 1-px-Trennern, Icons, Abständen, Zählwerten und Chevrons.
- `Kunden → Muster AG → Rechnungen → Rechnung → Zurück` landet bei den Rechnungen von Muster AG; erneutes Zurück bei der Kunden-Zentrale.
- `Mehr → Rechnungen` zeigt die unternehmensweite, berechtigungsgeprüfte Liste ohne erzwungenen Kundenfilter.
- Avatar enthält nur persönliche Einstellungen; Mehr nur fachliche/unternehmensweite Funktionen; keine doppelten Einstellungen.
- Kunden-, Angebots- und Rechnungszeilen folgen exakt den vereinbarten zwei Informationszeilen.
- Alle Navigationslisten haben einheitliche Trennlinien und Chevron-/Werte-Ausrichtung; keine grossen leeren Karten.
- Ticketliste öffnet Ticketdetail vor Chat; Dokument- und Timerfunktionen bleiben erhalten.
- Die neue Navigation und der vorhandene Floating-Plus-Button funktionieren ohne Sprünge und ohne Änderung des freigegebenen Erscheinungsbilds.
- Kein visuelles „bestanden“ ohne echte Browseransicht; kein funktionales „bestanden“ ohne geeigneten Test.

**V7 hat Vorrang vor widersprechenden älteren UX-Vorschlägen; sicherheits- und fachrechtliche Anforderungen behalten Vorrang vor rein visuellen Vereinfachungen.**
