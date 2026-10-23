# BINSO ONE — Global UX Master Contract v1.0
23.10.2026 · **Zielentwurf zur Freigabe, keine Behauptung einer bereits umgesetzten UX**

## 1. Produkt und Geltung
Landingpage: eigenständige Marketingwebsite. Kunden-App und Admin-App: identische UX-Foundation (Typografie, Farben, Komponenten, Header, Sidebar, Dialoge, mobile Navigation), unterschiedliche fachliche Menüs, Rollen und Inhalte. Alle drei für Desktop, Tablet, Mobile-Browser; Kunden- und Admin-App zusätzlich vollwertig als installierbare PWA. Hell/Dunkel; DE/FR/IT/EN.

**Bereits verbindlich:** Originales Binso-Logo; Inter; Eingabefelder mit 12px Radius; rahmenloser Sprachwechsel `DE ˅`; vorhandene mobile Bottom-Navigation unverändert; vorhandener runder blauer Floating-Plus-Button unverändert; globales Plus öffnet „Neu erstellen“, Fachlisten-Plus bleibt kontextbezogen; PDF-/Datei-/Bearbeitungsaktionen über `…` oder vorhandenes Plus; Empty States maximal zwei Textzeilen; keine PWA-Update-Meldung.

**Status der folgenden Masse:** präzise Zielwerte, noch mit tatsächlichen zentralen CSS-Tokens und freigegebenen Screens abzugleichen. Codex darf daraus keine eigenen Produktentscheidungen ableiten.

## 2. Design-Tokens
| Element | Zielwert / Regel |
|---|---|
| UI-Schrift | Inter, system-ui Fallback |
| Body Desktop | 14px / 1.55 |
| Body Mobile | 15px / 1.5 |
| Metadaten | 12px / 1.45, nur sekundäre Informationen |
| Labels | 13px / 1.4, Medium |
| Seitentitel | Desktop 28px / 1.2; Mobile 23px / 1.25, Semibold |
| Bereichstitel | 19px / 1.3, Semibold |
| Kartentitel | 16px / 1.35, Semibold |
| Spacing | 4px Raster; bevorzugt 8/12/16/24/32px |
| Input/Select/Textarea | 12px Radius, gemeinsame Fokus-/Fehler-/Disabled-Styles |
| Karten | 14px Radius (Vorschlag), gleiche Innenabstände |
| Dialoge | 16px Radius (Vorschlag), konsistente Header/Footer |
| Controls | 42px Desktop; Touchziel mindestens 44px |
| Animation | 120–240ms, sanft, Reduced Motion beachten |
| Farben | Bestehende Binso-Tokens übernehmen; Blau für primäre Aktionen, Grün Erfolg, Rot Gefahr, Amber Warnung; nie nur Farbe zur Statusvermittlung |

Kein erfundenes Logo, keine neuen Blautöne, keine CSS-Magic-Numbers in Einzelseiten. Zahlen rechtsbündig/tabellarisch, Text linksbündig. WCAG-AA-Kontrast und sichtbarer Tastaturfokus.

## 3. Layout pro Gerät
| | Desktop >=1200px | Tablet 768–1199px | Mobile <768px |
|---|---|---|---|
| Seitenrand | 32px, Wide 40px | 24px | 16px |
| Content | max. 1440px zentriert | flexibel | einspaltig |
| Navigation | Sidebar 232px / eingeklappt 68px | Sidebar/Drawer adaptiv | bestehende Bottom-Navigation |
| Header | 64px, Suche, Mitteilungen, Avatar | kompakt | Mobile-Header |
| KPI | 4 Spalten, sonst 2 | 2 | 1–2 kompakte |
| Formulare | 2 Spalten wo sinnvoll | 1–2 | 1 |
| Listen | Datentabelle | reduzierte Tabelle | kompakte Datensätze |
| Dialoge | zentriert, inhaltsabhängig | begrenzte Breite | Bottom Sheet/Vollbild |

Auch 1920/2560/3840px und 200% Browserzoom: Content nicht unkontrolliert strecken, keine horizontale Seitenüberläufe. iOS-/Android-PWA: Safe Areas, Keyboard-Awareness, Scrollbarkeit, Eingabefeld oberhalb Tastatur, keine PWA-Update-Banner.

## 4. App-Shell für Kunden und Admin
**Sidebar:** Logo oben, fachlich gruppierte Navigation, Icons 18–20px, aktive Route mit sanfter Akzentfläche und Markierung, einklappbar mit Tooltips; Support/Einstellungen unten. Keine doppelte Start-Navigation.

**Header:** keine redundante „Arbeitsbereich“-Zeile; globale Suche (`Ctrl/Cmd+K`), Benachrichtigungen, Avatar/Kontomenü. Einheitliche Popovers (Breite, Schatten, Ausrichtung, Fokus, Escape). Sprache rahmenlos `DE ˅`, im App-Kontokontext und wo sinnvoll dezent im Header.

**Mobile:** vorhandenes Bottom-Dock und Floating-Plus exakt erhalten. Admin verwendet dasselbe visuelle Navigationssystem mit eigenen Admin-Zielen; übrige Ziele unter „Mehr“. Bottom Sheets: einheitliche Header, scrollbarer Inhalt, Footer, Safe-Area und Tastaturverhalten.

**Seitenkopf:** ein eindeutiger Titel, maximal eine knappe Erklärung; Toolbar/Filter auf gemeinsamer Linie; Hauptinhalt startet bei allen Seiten am gleichen Raster. Keine doppelten Titel in Dialogen.

## 5. Komponentenregeln
- **Buttons:** gleiche Höhe und Baseline, pro Formular ein primärer Abschluss. Keine verstreuten Aktionsbuttons. Destruktive Aktion bestätigen.
- **Formulare:** zentrale FormField-Implementierung, Label oberhalb, konsistente Pflicht-/Fehler-/Hilfetexte, Dropdowns ohne Überlauf. Entwurf speicherbar, wenn fachlich zulässig; kritische Zustandsübergänge serverseitig prüfen.
- **Karten:** identische Innenabstände (Ziel 20–24px Desktop/16px Mobile), KPI-Zahlen auf gemeinsamer Baseline, erste Karten jeder Reihe gleiche Oberkante.
- **Tabellen:** gleiche Zeilenhöhen, Kopfzeilen, Spaltenlogik, Filter/Sortierung, Beträge rechts; Mobile kompakte Listen statt verkleinerter Desktop-Tabelle.
- **Dialoge:** gleiche Titelzeile, Close, Inhaltsabstand und Footer; Desktop zentriert, Mobile Bottom Sheet/Vollbild; keine doppelten Feldumrandungen.
- **`…`-Menü:** Bearbeiten, PDF, Datei, Export, Archivieren nach Kontext; gefährliche Aktionen zuletzt. Reine Navigation ist keine Aktionsfunktion.
- **Diagramme:** echte Kennzahlen mit Einheit, Zeitraum, Achse/Legende und Datenquelle; sinnvolle Ring-/Balken-/Liniencharts, keine dekorativen Nullgrafiken.
- **Empty States:** maximal zwei Zeilen, keine grosse leere Karte oder Illustration.
- **Zustände:** Loading, Empty, Error, Readonly, Disabled, Success, Offline, 403/404/500 konsistent und verständlich.

## 6. Landingpage und öffentliche Seiten
**Header:** Logo links; Produkt, Funktionen, Preise; rechts rahmenlos DE ˅, Anmelden, primärer Test-CTA (nur wenn tatsächlich verfügbar). Mobile kompaktes Menü. Kein App-Sidebar-Layout.

**Startseite Reihenfolge:** Hero (Nutzen, Untertitel, Haupt-CTA, echte Produktansicht) → überprüfbare Vorteile → Prozess Kunde/Angebot/Auftrag-Zeit/Rechnung/Zahlung → Module → Desktop/Mobile/PWA → Preise → FAQ → Abschluss-CTA → Footer.

**Seiten:** Start, Produkt, Funktionen und Detailseiten, Preise, FAQ, Kontakt, Login, Registrierung, Einladung, E-Mail-Bestätigung, Passwortreset, Impressum, Datenschutz/Cookies, AGB, DPA, Wartung/Offline/404/500.

**Preise:** Start/Business/Pro, gleiche Kartenoberkante, Preishöhe, CTA-Höhe und Trennlinien; Monat/Jahr-Umschalter, „2 Monate gratis“ nur wenn tatsächlicher Jahrespreis 10 Monatsraten beträgt; sichtbares „Beliebt“-Badge ohne Layoutverschiebung; subtile Kontur/Schatten/Hover. Nutzenpunkte auf grossen Screens als ordentliches Raster, nicht unruhig untereinander. Tarife, Limits, Add-ons und Texte müssen exakt zur tatsächlichen Freischaltung passen.

**Footer/Cookies:** einheitlicher Footer mit Produkt, Kontakt, Rechtlichem, Firma und Sprache. Cookie-Banner mit gleichwertigen Optionen Ablehnen/Anpassen/Akzeptieren; optionale Kategorien als Toggle, notwendige erklärt und fixiert. Rechtstexte fachlich prüfen.

## 7. Kunden-App: Menü, Inhalte und Verantwortlichkeiten
Die folgenden Menügruppen sind Zielstruktur; existierende Routen und Rollen-Gates müssen vor Umsetzung zugeordnet werden. Ein Fachobjekt besitzt einen Owner; andere Seiten zeigen Verweise/Zusammenfassungen statt doppelter Bearbeitungslogik.

| Gruppe | Menü | Unterseiten / Inhalte | Primäre Aufgabe |
|---|---|---|---|
| Start | Übersicht | Aufgaben, KPI, Einrichtung, letzte Vorgänge | nächster Schritt / Neu erstellen |
| Verkauf | Kunden | Liste, Detail: Übersicht/Kontakte/Dokumente/Aktivitäten | Kunde erfassen |
| Verkauf | Angebote | Liste, Detail, Versionen, Antworten, Editor | Angebot erstellen |
| Verkauf | Rechnungen | Liste, Detail, Mahnung, PDF, Editor, Status | Rechnung erstellen |
| Verkauf | Produkte & Leistungen | Katalog, Preise, Steuerzuordnung | Leistung erfassen |
| Arbeit & Team | Aufträge/Projekte | Liste, Detail, Budget, Ressourcen, Zeiten, Rechnungen | Auftrag erstellen |
| Arbeit & Team | Zeiterfassung | Timer, manuell, Freigaben, Zeitrapporte | Zeit erfassen |
| Arbeit & Team | Mitarbeiter | Verzeichnis, Personalakte, Anstellung, Ferien, Absenzen | Mitarbeiter verwalten |
| Arbeit & Team | Lohn | Lohnmodelle, Lohnläufe, Abrechnungen | Lohnlauf vorbereiten |
| Partner | Lieferanten | Verzeichnis, Verträge, Fremdleistungen | Lieferant erfassen |
| Finanzen | Zahlungen | Eingänge, Zuordnungen, offene Beträge | Zahlung erfassen |
| Finanzen | Spesen | Foto/PDF, OCR, Einreichen, Freigabe, Erstattung | Spese erfassen |
| Finanzen | Eingangsrechnungen | Eingang, Abgleich, Freigabe, Zahlung | Rechnung erfassen |
| Finanzen | Finanzen | Umsatz, Forderungen, Kosten, Liquidität | Analysieren |
| Finanzen | Berichte | Finanz-, Zeit-, Spesen- und Personalberichte, PDF/CSV | Bericht erstellen |
| System | Support | Tickets, Details, Antworten, optional Chat | Ticket erstellen |
| System | Einstellungen | Profil, Sicherheit, Firma, Benutzer/Rollen, Abo, Dokumente, Sprache, Datenschutz | Konfigurieren |

**Fachregeln:** Ein Konto gehört zu einem Unternehmen. Navigation und API müssen denselben Rollen-/Abo-Vertrag erzwingen. Mitarbeiter sehen nur ihre eigenen Self-Service-Daten. Payroll-Produktivfreigabe nur nach validierten Schweizer Berechnungsregeln.

## 8. Admin-App: gleiche UX, andere Menüs
| Gruppe | Menü | Inhalt |
|---|---|---|
| Start | Plattformübersicht | echte KPIs, offene Aufgaben, Betriebslage |
| Mandanten | Unternehmen | Registrierung, Aktivierung, Einschränkung, Mandantenstatus |
| Mandanten | Abonnements | Pläne, Entitlements, Limits, Rechnungs-/Zahlungsaufsicht |
| Benutzer | Benutzer & Rollen | interne Benutzer, Berechtigungen, genehmigte Supportprozesse |
| Betrieb | Support | Tickets, Zuweisung, Antwort, Eskalation |
| Betrieb | Benachrichtigungen | Versandzustände, Alarme, Providerfälle |
| Governance | Sicherheit | Ereignisse, Sitzungen, Risiko-/Zugriffsübersicht |
| Governance | Audit | revisionsfähige Ereignisse, Filter, Export |
| System | Vorlagen & Konfiguration | Vorlagen, Feature Flags, Plattformsettings |
| System | Einstellungen | eigenes Profil, MFA, Sprache, Benachrichtigungen |

Admin erhält keinen pauschalen Einblick in alle Kundendaten. Mobile Admin-PWA ist vollwertig; sensible Aktionen benötigen geeignete Re-Authentifizierung und Audit. Dieselbe App-Shell wie die Kunden-App.

## 9. Onboarding, Identity und Rollen
**Firma:** Landingpage → Tarif → Vorname/Nachname/E-Mail/Anmeldung → Bestätigung → Firma → erforderliche Einrichtung → Dashboard. Daten persistieren über Reload/erneuten Login. Dashboard zeigt fehlende Pflicht- und optionale Angaben. Rechnungsentwurf trotz fehlender Bankdaten möglich; Ausstellen serverseitig blockieren und direkt zum fehlenden Feld führen.

**Mitarbeiter:** Berechtigter Firmenverantwortlicher lädt ein → zeitlich begrenzter Einmal-Link → Annahme/Identitätsbestätigung → Profil → rollenabhängige Startseite. Abgelaufener Link: klare Erklärung und erneute Einladung durch Berechtigte. Keine stillen Rollenwechsel.

**Login:** Einheitliche Auth-Maske für Kunde/Admin mit klarem Kontext, Passwort/Passkey/MFA je real implementiertem Provider, Passwortreset, Logout und Sitzungsverwaltung. Keine erfundene Push-MFA-Funktion.

## 10. Durchgängige Geschäftsprozesse
- Kunde → Angebot → Auftrag → Zeit → genehmigte verrechenbare Positionen → Rechnung → Zahlung. Kein doppeltes Erfassen, explizite Übernahme, Idempotenz.
- Mitarbeiter → Anstellung → Ferien/Absenzen → Zeit → Freigabe → Payroll-Vorbereitung. Gehälter nicht in normalen Projektansichten offenlegen.
- Lieferant → Vertrag → Fremdleistung → Eingangsrechnung → Abgleich → Freigabe → Zahlung. Solo-Owner kann bei passender Firmenregel selbst freigeben; Vier-Augen-Freigabe konfigurierbar, ungeklärte Abweichungen blockieren.
- Spesen: Foto/PDF → OCR-Vorschlag → Prüfung → Einreichung → Genehmigung → Erstattung → Bericht. Keine ungeprüfte automatische OCR-Übernahme.
- Support: Ticket ohne automatische Live-Chat-Eröffnung; Ticketnachrichten und optionaler Chat getrennt.
- PDF: sichtbare A4-Seitenkontur auf hellem/dunklem Hintergrund; Mobile Wischen/Zoom; Schweizer QR-Zahlteil auf separater letzter A4-Seite.

## 11. Screen-Spezifikation je Route
Für **jede** Route/Unterseite und jeden wesentlichen Zustand wird eine Zeile in einer Screen-Matrix verlangt:
`screen_id | surface | route | menu | purpose | headline | primary_action | secondary_actions | data_owner | permissions | plan | desktop_layout | tablet_layout | mobile_layout | pwa_constraints | loading | empty | error | dialogs | i18n_keys | reference_id | approval_status`.

Keine generischen Aussagen wie „modern gestalten“. Vor Implementierung muss ein freigegebener Referenz-Screen mit realem Browsercode und echten zentralen Komponenten existieren. Designentscheidungen ohne Freigabe werden als offene Fragen geführt.

## 12. Visueller Soll-Ist-Nachweis
- Gleiche Browserengine, Viewport, Device Scale, Fonts, Sprache, Datenfixture und Hell-/Dunkelmodus für Referenz und Produkt.
- Pflichtgrössen: 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440; zusätzlich 3840px Wide, Browserzoom und echte PWA-Geräte separat.
- Screenshotvergleich mit dokumentierten Toleranzen für Antialiasing, **keine** pauschale Pixelgenauigkeitsbehauptung. Raster, Card-Baselines, CTA-Positionen, Schriftgrössen, Komponentenstates und Interaktionen explizit prüfen.
- Jedes Abweichungsticket nennt Route, Gerät, Soll-Referenz, Ist-Screenshot, CSS-/Komponentenursache, Korrektur und Nachtest.

## 13. Freigabe- und Umsetzungsregel für Codex
1. Bestehende Codebasis, zentrale Tokens und freigegebene Referenzen lesen.
2. Nur den freigegebenen Screen-/Komponentenvertrag implementieren; keine selbst erfundenen Menüs, UX-Varianten oder Geschäftsregeln.
3. Gemeinsame Komponenten zentral anpassen; keine parallele Kunden-/Admin-Foundation.
4. Bestehende Bottom-Navigation und Floating-Plus-Button nicht verändern.
5. Gezielte Funktionstests während Entwicklung; kritische Finanz-/Rollen-/Migrationsprüfungen sofort; gebündelte CI und vollständige Final QA vor Produktivfreigabe.
6. Abnahme getrennt nach implementiert, funktional geprüft, visuell geprüft, fachlich freigegeben und produktiv freigegeben.
7. Fehlende Referenzen/Entscheidungen als Blocker melden statt eigenständig erfinden.

## 14. Noch explizit freizugebende Details
Exakte Original-Logo-Assets und Farben aus aktuellem Code; endgültige Typografie-/Spacing-Tokens; Sidebarbreiten und Responsive-Breakpoints; tatsächlicher Navigationsbaum je Abo/Rolle; Preistabelle/Add-ons; visuelle Referenzansichten für jede Seitenfamilie; exakte rechtliche Texte; Payroll-Parameter und Provider. **Dieses Dokument ist ein vollständiger globaler Rahmen, aber noch keine fertige 1:1-Screenbibliothek aller tatsächlichen Routen.** Diese wird nach dem aktuellen Codeinventar ergänzt und visuell freigegeben.

---
# REVISION V3 — VERBINDLICHE ERGÄNZUNGEN UND VORRANGREGELN
**Datum: 23.10.2026.** Bei Widerspruch mit V1 gelten die nachstehenden später freigegebenen Regeln. Der tatsächliche Code ist vor Änderungen zu inventarisieren; die Spezifikation beschreibt Soll, nicht automatisch Ist.

## 15. Keine verstreuten Aktionsbuttons — global
Auf **allen** Seiten und Unterseiten der Kunden- und Admin-App (Desktop, Tablet, Mobile-Browser, PWA) keine separaten Inhalts-Aktionsbuttons für Datei hinzufügen, PDF öffnen/herunterladen, Export, Teilen, Monatsrapport, manuelle Zeit, Bearbeiten, Löschen oder Neu erstellen. Funktionen nicht löschen, sondern zentral erreichbar machen.

**Blaues bestehendes Floating-Plus (+)** bedeutet neue Datensätze oder Inhalte hinzufügen. Auf der Übersicht öffnet es „Neu erstellen“ mit berechtigten Schnellaktionen; in Fachlisten bevorzugt die kontextspezifische Neuanlage. **Design und Position des bestehenden Plus bleiben unverändert.**

**Ein einziges Drei-Punkte-Menü (…) im Seiten-/Detailheader** bedeutet bestehende Objekte bearbeiten, verwalten, senden, exportieren, PDF anzeigen, archivieren oder stornieren. Keine Drei-Punkte-Menüs in Cards, Listenzeilen oder Untersektionen. Datensatz in Liste antippen → Detailseite → dort Header-Menü. Zielobjekt eindeutig; status-, rollen- und aboabhängig. Mobile/PWA: Bottom Sheet; Desktop: Popover. Kein künstliches Menü bei fehlenden Aktionen.

Ausnahmen: Timer Start/Pause/Stop, Speichern/Abbrechen im Formular, Anmelden, Bestätigen/Ablehnen im Prozess, Suche/Filter/Sortierung, Navigation/Tabs, notwendige Einwilligung. Keine parallele Aktionsbibliothek.

### 15.1 Kunden-App-Aktionsmatrix (Soll, Existenz prüfen)
| Seite | Plus (+) | Header (…) |
|---|---|---|
| Übersicht | Kunde, Angebot, Rechnung, Auftrag, Zeit, Spese via Schnellmenü | Bestehende Dashboard-Verwaltung |
| Kundenliste | Kunde | Import/Export falls vorhanden |
| Kundendetail | Kontakt, Auftrag, Datei/Dokument | Bearbeiten, Archivieren |
| Angebote | Angebot | Listenexport falls vorhanden |
| Angebotsdetail | Neue Version nur falls zulässig | PDF, Senden, Duplizieren, Verlauf |
| Rechnungen | Rechnung | Listenexport |
| Rechnungsdetail | Kein erzwungenes Plus | PDF, Senden, Duplizieren, Stornieren/Korrektur nach Status |
| Zahlungen | Zahlung | Export, Abgleich |
| Produkte | Produkt | Import, Export |
| Aufträge | Auftrag | Verwaltungsaktionen |
| Auftragsdetail | Zeit/Leistung | Bearbeiten, Abschliessen, Archivieren |
| Zeiterfassung | Manuelle Zeit | Monatsrapport, Export, Teilen |
| Zeiteintrag | — | Bearbeiten, Löschen wenn zulässig |
| Spesen | Spese, Beleg fotografieren/importieren | Export |
| Spesendetail | Beleg | Bearbeiten, Einreichen, Zurückziehen |
| Mitarbeiter | Mitarbeiter | Export, Einladungen |
| Mitarbeiterdetail | Dokument | Bearbeiten, Deaktivieren, Vertrag |
| Finanzen | — | Bericht exportieren |
| Berichte | — | Export, Teilen |
| Support | Neues Ticket **ohne erzwungenen Chat** | Listenaktionen |
| Ticketdetail | Anhang | Schliessen, Wiedereröffnen |
| Einstellungen | — | Nur echte Seitenaktionen |
| V26-Fachmodule | Fachlich zulässige Neuanlage | Vorhandene berechtigte Verwaltung |

### 15.2 Admin-App-Aktionsmatrix
| Seite | Plus (+) | Header (…) |
|---|---|---|
| Dashboard | Nur echte administrative Neuanlagen | Dashboard-Verwaltung |
| Tickets | Internes Ticket nur falls vorhanden | Export/Verwaltung |
| Unternehmen | Anlegen nur falls vorgesehen | Export/Verwaltung |
| Unternehmensdetail | — | Einschränken, Reaktivieren, Abo verwalten |
| Zahlungen/Finanzen | — | Export/Abgleich/Bericht |
| Abonnemente | Tarif/Regel nur falls unterstützt | Bearbeiten, Deaktivieren |
| Sperrungen | — | Prüfen, Aufheben |
| Monitoring | — | Diagnose/Export |
| Ankündigungen | Ankündigung | Bearbeiten, Veröffentlichen, Zurückziehen |
| Zugriff & Rollen | Internen Benutzer einladen | Zugriffe/Rollen verwalten |
| Audit | — | Berechtigter Export |
| Einstellungen | — | Nur vorhandene Aktionen |

## 16. Einstellungen: Toggle-Standard
Jede **binäre** Einstellung als zentralen Switch: Label links, Toggle rechts, kompakte einzeilige Zeile, gleiche Höhe/Ausrichtung, Blau = an, Grau = aus, klarer Disabled-/Fokuszustand, Touchziel mindestens 44×44 px. Beispiele: Push-/E-Mail-Benachrichtigungen, Erinnerungen, automatische Nummerierung, optionale Features. Keine Ein/Aus-Buttonpaare, keine Checkbox als Ersatz für gewöhnliche Switches, kein einzelner Speichern-Button je Toggle. Sofort persistieren **nur** bei vorhandener sicherer API; bei Fehler Zustand zurücksetzen und verständliche Meldung. Sicherheitskritische Änderungen mit Reauth/Bestätigung; Consent niemals automatisch aktivieren. Mehrwertige Optionen (Sprache, Tarif, Theme mit Auto) bleiben Select/Segmented-Control, keine Toggles.

## 17. Suchfelder: genau ein X
Zentrale Search-Komponente auf allen Kunden-/Adminseiten. Links Lupe, Mitte Suchtext, rechts **maximal ein X**, nur bei nichtleerem Wert. Browser-natives `type=search`-Clear und eigenes Clear niemals gleichzeitig; gegebenenfalls natives `::-webkit-search-cancel-button` gezielt unterdrücken. Ein Klick löscht vollständig, Fokus bleibt, Ergebnis aktualisiert. Kein Layoutsprung, kein doppelter Fokusrahmen, kein überlappendes Icon. Edge/Chrome/Safari und PWA prüfen.

## 18. KPI-Karten und Prozenttrends
KPI-Karte: **oben links kurze Bezeichnung, oben rechts kleiner Trendpfeil und Prozent**, darunter grosser Wert mit kompakter Währung direkt daneben. **Keine mehrzeiligen Erklärungen, keine zusätzliche CHF-Zeile**. Mobile zwei Spalten, Desktop vier wenn sinnvoll. Alle Karten gleiche Höhe, Padding, Baselines. Bei langen Beträgen responsiv ohne Overflow.

Trends aus echten Daten mit explizitem Zeitraum und gleich langem Vorzeitraum. Prozentänderung `(aktuell - vorher) / abs(vorher) * 100` nur bei sinnvoller nichtnull Vergleichsbasis. Fehlende Vergleichsdaten ≠ 0; dann neutral „–“ oder kein Trend. Grün/Rot nach **fachlicher Bedeutung**, nicht bloss Pfeilrichtung: Umsatz/Zahlungseingänge steigen meist positiv, Ausgaben/Überfälliges steigen negativ, sinkendes Überfälliges positiv. Bestandszahlen ohne sinnvolle Vergleichsbasis ohne Prozent. Farbe immer zusätzlich mit Pfeil/Text zugänglich.

## 19. Informationszeilen und Empty States
Entscheidungen, Unternehmen, Meine Arbeit, Einstellungen, Projekte, Spesen und ähnliche Bereiche: **eine kompakte Zeile** mit Label links und Wert rechts; optional Chevron bei Navigation. Keine zweite oder dritte Beschreibung unter „Offene Forderungen“, „Zeiten zur Freigabe“, „Kunden“, „Mitarbeiter“ etc. Einheitliche Höhe etwa 44–48px. Fachliche Details in Detailansicht. Empty States maximal zwei kurze Textzeilen, keine Illustrationen oder grosse leere Karten.

## 20. Finanzdiagramme und Farben
**Einnahmen und tatsächliche Zahlungseingänge grün `#16A34A`, Ausgaben und Geldabflüsse rot `#DC2626`, neutrale Daten bestehendes Binso-Blau (Richtwert `#2563EB`), fehlende Daten grau.** Zentrale semantische Tokens, Hell-/Dunkelkontrast prüfen. Rot bei Ausgaben bezeichnet Geldflusskategorie, nicht zwingend einen Fehler. Trendrot dagegen negative Entwicklung.

Umsatz/fakturiertes Volumen, tatsächliche Zahlungseingänge, Ausgaben und Zahlungssaldo **nicht vermischen**. Diagramme kompakt mit kurzer Legende, verständlichen Tooltips, sauber lesbaren Monaten/Wochen (nicht `Mai...`), keine langen Erklärungen darunter. Bei fehlenden Daten kompakter Empty State statt grossem Null-Chart. Ring-, Balken- oder Liniendiagramme nur bei nützlicher Aussage und belegbarer Datenquelle; keine dekorativen Statistiken.

## 21. Startseite: persönliche Begrüssung und kompakte Hierarchie
Ersetze „Dein Überblick.“ durch lokale tageszeitabhängige Begrüssung mit **gespeichertem Vornamen**: 05:00–10:59 „Guten Morgen, [Vorname]“; 11:00–17:59 „Guten Tag, [Vorname]“; 18:00–04:59 „Guten Abend, [Vorname]“. Bei fehlendem Vornamen ohne Name; DE/FR/IT/EN korrekt übersetzen; bestehende Nutzerzeitzone/Locale; bei Tageszeitwechsel ohne Neuanmeldung aktualisieren, ohne dauernde Last. Untertitel höchstens **eine Zeile**: „Dein Unternehmen auf einen Blick“.

Kunden-Dashboard: Begrüssung → Zeitraum → vier kompakte KPIs → offene Aufgaben → Entwicklung bei echten Daten → höchstens drei letzte Aktivitäten. **Einrichtungshilfe** nur solange Pflichtangaben fehlen: kompakte Fortschrittskarte mit Anzahl, schmalem Balken, kurzer Aktion zur passenden Einstellung; keine lange Pflichtangabenliste auf der Startseite. Dashboard rollenspezifisch; Admin-Dashboard gleiche Komponenten/Raster, aber Plattformkennzahlen, Support/Governance-Aufgaben.

## 22. Konkrete mobile Seitenfamilien
- **Kunden:** keine lange Seitenbeschreibung; kompakte Suche + Filter; ganze Zeile antippbar; Kundenname und knappe Meta, Status rechts. Keine Inline-Buttons oder Zeilen-`…`.
- **Finanzen:** kompakter Zeitraumfilter, vier gleich hohe KPI-Karten (Umsatz, Offen, Ausgaben, Überfällig) mit sinnvollen Trends, nützliche Charts, offene Vorgänge. Keine langen Erläuterungen und redundante Tabs.
- **Zeiterfassung:** Timerstatus, grosse Zeit und direkte Start/Pause/Stop **vor** Kunde-/Auftragsauswahl. Kein überdimensionierter Timerkreis. Danach Zuordnung, heutige Einträge. Manuelle Zeit über bestehendes Plus, Monatsrapport/Export/Teilen über Header-`…`; keine separaten Buttons. Laufende Zeit darf nicht verloren gehen; fachlich notwendige Zuordnung vor Start prüfen.
- **Kundendetail/Angebote/Rechnungen/Spesen/Support/Mitarbeiter:** gleiche Header-, Card-, Listen-, Dialog- und Aktionsregeln; historische Dokumente und serverseitige Fachregeln nicht verändern. Support-Ticket muss ohne sofortigen Chat erstellt werden können; Chat erst als gesonderter Ticketprozess.
- **Einstellungen:** binäre Switches, sonst passende Controls, einheitliche Abstände, kein doppelt wirkender Rahmen; Login, Passwortreset, MFA, Passkeys und aktive Sitzungen als klare sichere Abläufe.

## 23. Landingpage und Abos
Eigenständiges responsives Marketinglayout, gleiches Original-Branding, Inter und Akzentfarben; klare Headernavigation, Produkt, Funktionen, Preise, FAQ, CTA, Footer und rechtliche Seiten. Preis-Cards gleiche Oberkanten, Button-Baselines, Trennlinien und Höhen; sanfte Hoverbewegung, dezente Schatten/Umrandung; „Beliebt“-Badge sichtbar und nicht überladen. Monatlich/jährlich als verständliche Auswahl; **jährlich zwei Monate gratis nur, wenn tatsächliche Preis-/Billing-Regeln dies belegen**. Auf grossen Displays Benefits nebeneinander, nicht unnötig untereinander. Landingpage-Versprechen, Pläne Start/Business/Pro, Add-ons, Limits und tatsächliche App-Freischaltungen müssen übereinstimmen. Keine unbestätigten Produkt-/Preisbehauptungen.

Registrierung, E-Mail-Bestätigung, Login, Passwortreset, Einladung, Onboarding, Fehlerseiten, Wartung, Offline, Cookies/Consent und rechtliche Seiten in gleicher Markenidentität. Sprachwahl als kleiner rahmenloser `DE ˅`-Selector, kein Sprach-Button; alle vier Sprachen, keine Mischtexte. Cookie-Kategorien als verständliche Toggles, notwendige Cookies nicht abschaltbar, Einwilligungen nicht vorausgewählt; Footer an allen vorgesehenen öffentlichen Seiten konsistent.

## 24. Responsive, Dialoge und PWA
Desktop: kompakter nutzbarer Header mit Suche/Benachrichtigung/Avatar, einklappbare Sidebar mit Icons, kein redundantes „Arbeitsbereich“-Breadcrumb; breite Bildschirme mit sinnvollem Content-Maximum. Tablet: adaptive Spalten und Touchziele. Mobile/PWA: vorhandene Bottom-Navigation und blauer FAB **unverändert**, Safe-Area, virtuelle Tastatur, Bottom Sheets, Scrollverhalten; keine PWA-Update-Meldung. Kunden- und Admin-App gleicher Shell-Standard und beide vollwertig mobil/PWA. Einheitliche Dialog-Header, Inhaltsränder, Footer-Aktionen, Fokus und Keyboard-Awareness. Keine doppelten Seitentitel im Sheet.

## 25. Durchführung in ChatGPT Work
1. Aktuellen Code und echte Live-Vorschau als **Ist** aufnehmen; keine erfundenen Mockups oder Demo-Daten als Produktionsstand deklarieren.
2. Zentrale Tokens, App-Shell, Search, KPI, Informationszeilen, Toggle, ActionSheet und Dialoge identifizieren; Wiederverwendung vor Änderung.
3. **Zuerst** Dashboard, Kunden, Finanzen, Zeiterfassung, Einstellungen in der Work-Live-Vorschau umsetzen und **zur visuellen Freigabe zeigen**. Danach weitere Kunden- und Admin-Seiten familienweise, Landingpage separat. Nicht alles ungeprüft gleichzeitig umbauen.
4. Für jede Seite: Soll/Ist-Screenshot bei identischem Viewport, Schrift und Zustand; prüfen: Header, Raster, Abstände, Typografie, Icons, Karten, Aktionen, Funktionen, Rollen. Keine gestalterische Interpretation ohne Freigabe.
5. Keine Änderungen an Finanzberechnungen, produktiven Daten, DB-Schema, Berechtigungsregeln oder historischem PDF-Verhalten für reine UX-Arbeiten. Gezielte Tests für geänderte Interaktionen/Persistenz. Keine vollständige Browsermatrix während iterativer Vorschau.
6. Kein GitHub-Push, Merge, Azure-Deployment oder produktive Migration. Nach Vorschau und kurzem Bericht auf Freigabe warten.

**Abschlussbericht:** tatsächlich geänderte zentrale Komponenten, angepasste Routen, Aktionszuordnung, funktionierende Toggles, echte Trenddaten, Screenshots Desktop/Mobile, noch offene Abweichungen. **Nicht implementierte oder nicht nachgewiesene Funktionen nicht als fertig melden.**
