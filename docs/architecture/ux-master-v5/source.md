# BINSO ONE – GLOBAL UX MASTER V5

**Verbindlicher UX-, Navigations-, Interaktions- und Implementierungsvertrag**  
Repository: `oemercam/binso_admin_azure`  
Arbeitsmodus: Work-Live-Vorschau; kein Push, Merge oder Deployment ohne Freigabe.

## 1. Produkt und Grundsätze

Bestehende Binso-One-UX beibehalten und gezielt optimieren. Keine selbst erfundenen Designs oder parallelen UI-Bibliotheken. Drei Oberflächen: öffentliche Landingpage, Kunden-App, Admin-App. Kunden- und Admin-App verwenden dieselbe UX-Foundation mit unterschiedlichen Funktionen und Rechten. Alle Oberflächen: Desktop, Tablet, Mobile-Browser und PWA; Hell/Dunkel; DE, FR, IT, EN und TR. Offene Entscheidungen dokumentieren, nicht erfinden.

## 2. Branding und Design-Tokens

Originales Binso-Logo, Inter, zentrale Farben, Typografie, Radien, Abstände, Rahmen, Fokuszustände, Icons und responsive Regeln. Mobile Zielwerte: Header 56 px; Seitenrand 16–20 px; Titel 18–20 px semibold; Fliesstext 14 px; Sekundärtext 12–13 px; Kartenradius 12–16 px; Inputradius 12 px; Kartenabstand 8–12 px; Touchflächen mindestens 44 × 44 px. Vorhandene freigegebene Tokens haben Vorrang. Keine unnötigen Schatten, grossen Leerflächen oder Dekorationen.

## 3. Header-Vertrag

**Mobile Übersicht/Liste:** Titel links; rechts Suche, Glocke und Avatar. Keine drei Punkte, keine vierte Aktion, keine doppelten Seitentitel.

**Mobile Detail:** Zurück links, Titel optisch zentriert, rechts maximal ein Drei-Punkte-Menü für zulässige Aktionen des geöffneten Objekts. Keine Suche/Glocke/Avatar in derselben Zeile, keine weiteren Drei-Punkte-Menüs in Inhaltsbereichen. Sichere Rücknavigation. Desktop/Tablet nutzen dieselbe fachliche Logik in der vorhandenen responsiven Shell.

## 4. Navigation und Aktionen

Bestehende mobile Bottom-Navigation sowie Gestaltung und Position des blauen Floating-Plus-Buttons **unverändert lassen**. Navigation wechselt Bereiche. Plus (+) erstellt neue Objekte oder fügt Inhalte hinzu. Drei Punkte (…) verwalten bestehende Objekte. Bottom Sheet ist die mobile Darstellung eines Menüs/Formulars, Popover die kompakte Desktop-Darstellung – keine getrennte Geschäftslogik.

**Plus:** neue Kunden, Kontakte, Angebote, Rechnungen, Aufträge, Zeiten, Spesen, Belege, Mitarbeiter, Tickets und andere tatsächlich vorhandene Erstellaktionen. Auf Dashboard bestehendes Schnellaktionsmenü.

**Drei Punkte:** bearbeiten, PDF anzeigen/herunterladen, versenden, duplizieren, exportieren/teilen, archivieren, stornieren/löschen – nur nach Status und Berechtigung.

**Direkt sichtbar bleiben:** Timer Start/Pause/Stop, Speichern/Abbrechen, Genehmigen/Ablehnen im Prozess, Anmelden, Suche, Filter, Sortierung, Tabs und Navigation. Keine verstreuten Aktionsbuttons in Karten, Listen oder Empty States.

## 5. Listenwerkzeuge und Aktionsinventur

Auf Übersichts-/Listenseiten keine drei Punkte im globalen Mobile-Header. Kompakter Werkzeugzugang bei Suche/Filter für vorhandene Sortier-, Filter-, Import- und Exportfunktionen. Einfache Werkzeuge direkt am jeweiligen Icon, keine zusätzlichen Buttons pro Datensatz. Vor Änderung für **jede tatsächliche Route** erfassen: Seitentyp, Entität, bestehende Aktionen/Handler, Plus, Detailmenü, direkte Prozessaktionen, Listenwerkzeuge, Rolle, Mandant, Abo, Status, Ziel, responsive Darstellung und Tests. Geplante V26-Funktionen getrennt kennzeichnen. Keine verlorenen oder erfundenen Aktionen.

## 6. Suche

Eine zentrale Suchkomponente: Lupe links, Text mittig, genau **ein X** rechts nur bei Inhalt. Kein zusätzliches natives Browser-X. Löschen erhält Fokus und aktualisiert Ergebnisse. Keine doppelten Fokusrahmen, überlappenden Icons oder Suchbuttons.

## 7. Sortier-Dropdown

Einfache Sortierung öffnet auf Desktop, Tablet, Mobile und PWA ein **Dropdown direkt am Sortier-Icon**, kein Bottom Sheet. Breite ungefähr 230 px, maximal verfügbare Viewportbreite. Titel „Sortieren nach“; darunter ungerahmte, einzeilige Optionen, mindestens 44 px hoch, aktiver Wert mit kleinem blauem Häkchen rechts. **Keine pillenförmigen Einzelbuttons.** Auswahl sofort anwenden und schliessen. Escape/Aussenklick/Fokus/Tastatur/Screenreader und Positionierung ohne Abschneiden unterstützen.

Bei abweichender Sortierung unter Suche eine einzeilige Anzeige links „Sortierung: Name A–Z“, rechts dezenter Textlink „Zurücksetzen“ ohne Buttonrahmen. Zurücksetzen stellt nur die fachbereichsspezifische Standardsortierung wieder her; Suche und Filter bleiben erhalten. Ohne Abweichung Zeile ausblenden.

## 8. Filter

Einfacher Status-/Einzelfilter als Dropdown, komplexer Mehrfeldfilter auf Mobile als Bottom Sheet. Aktive Filter in einer kompakten Zeile links, „Zurücksetzen“ rechts. Keine übergrossen Filterkarten. Bei gemeinsamer Anzeige von Suche, Filter und Sortierung muss klar sein, welche Auswahl zurückgesetzt wird.

## 9. Zeitraumfilter

Mobile: „Oktober 2026 ˅“ als kompakte Zeile, Bottom Sheet für aktuellen Monat, letzte 3/6/12 Monate, individuellen Zeitraum. Desktop/breite Tablets: `1 M | 3 M | 6 M | 12 M | Kalender` als kompakte Segmentauswahl. Keine redundante Datumszeile. Rollierende und Kalenderzeiträume eindeutig definieren; Kennzahlen, Charts und Vergleichsperioden konsistent steuern.

## 10. Listen und Informationszeilen

**Maximal zwei sichtbare Textzeilen pro Listeneintrag:** Zeile 1 Name links/Hauptwert rechts, Zeile 2 Datum/Metadaten links/Status rechts. Ganze Zeile antippbar, keine technischen UUIDs, keine Aktionsbuttons oder Drei-Punkte-Menüs in Zeilen. Namen bei Bedarf kürzen, Beträge vollständig anzeigen. Informationsgruppen grundsätzlich einzeilig mit Wert rechts, ohne Zusatzbeschreibungen. Empty States maximal zwei Zeilen. Die Zwei-Zeilen-Regel gilt nicht für fachlich notwendige Formulare oder Dokumentpositionen.

## 11. KPI-Karten und Finanzdiagramme

KPI: kurzer Titel oben links, kleiner Trendpfeil mit Prozent oben rechts, grosser Wert und kompakte Währung darunter. Keine mehrzeiligen Erklärungen; gleiche Kartenhöhen; Mobile zwei, Desktop bei Platz vier Spalten. Trends nur aus echten vergleichbaren Perioden; bei fehlender Basis keine Prozentwerte. Grün für fachlich positiv, Rot für negativ, neutral bei unklarer Bewertung.

Diagramme: Einnahmen/Zahlungseingänge grün `#16A34A`, Ausgaben/Geldabflüsse rot `#DC2626`, neutrale Daten blau `#2563EB`, fehlende Daten grau. Hell/Dunkel-Tokens; kurze vollständige Achsenlabels, Tooltips, keine langen Erklärungen oder grossen leeren Charts. Fakturierten Umsatz, tatsächliche Eingänge, Ausgaben und Saldo nicht vermischen.

## 12. Dashboard und Einrichtung

Tageszeitabhängig mit tatsächlichem Vornamen: 05:00–10:59 „Guten Morgen“, 11:00–17:59 „Guten Tag“, 18:00–04:59 „Guten Abend“. Benutzerzeitzone; ohne Vornamen nur Begrüssung. Untertitel höchstens eine Zeile. Reihenfolge: Begrüssung, erforderliche Einrichtung, Zeitraum/KPIs, Aufgaben, Entwicklung, letzte Aktivitäten.

Einrichtung als **eine kompakte antippbare Karte**: „Einrichtung abschliessen“, echter Fortschritt „2 von 3“, schmale Leiste, nächste fehlende Pflichtangabe, „Fortsetzen ›“. Keine weiteren Buttons/Plus-Symbole. Nach vollständigen Pflichtangaben ausblenden. Rechnungsentwürfe ohne Bankdaten möglich, Ausstellung weiter geprüft.

## 13. Formulare, Konto und Einstellungen

Nur notwendige Felder zuerst, weitere Angaben aufklappbar. Einheitliche Inputs (12 px Radius), Labels, feldnahe Validierung, erstes Fehlerfeld fokussieren, mobile Tastatur und keyboard-aware Sheets. Entwurfssicherung nur wo fachlich zulässig; kein automatischer Versand oder Ausstellung.

Binäre Einstellungen als **Toggles**: Label links, Switch rechts, aktiv Binso-Blau, inaktiv neutral, zugängliche Fokus-/Disabled-Zustände. Änderungen nur bei sicher unterstützter API unmittelbar persistieren; bei Fehler Zustand korrigieren. Sicherheitskritisches bestätigen. Sprache, Tarife und Mehrfachauswahl als Select, nicht Toggle. Konto/Profil mit kompaktem Avatar, Name, E-Mail, kurzen Gruppen und nur einer Sprachwahl.

## 14. Rechnungen und Angebote

Listen zweizeilig mit Kunde, Betrag, Datum und Status. Details: Zurück/Titel/…, Nummer und Status, Kunde, Gesamtbetrag, relevante Daten, Positionen, Zwischentotal, MwSt. und Total. Dateien kompakt ohne zusätzliches Drei-Punkte-Menü. Aktionen nach Dokumentstatus, Rolle und Abo. Keine unzulässige Änderung historischer ausgestellter Dokumente.

## 15. PDF und E-Mail

PDF-Vorschau als kompakter Lesemodus mit Seitenwechsel, Zoom und unterstützten mobilen Gesten; Herunterladen/Teilen im passenden Detailmenü. E-Mail-Versand mit Empfänger, Betreff, Nachricht, Anhang und **expliziter Versandbestätigung**, kein Sofortversand beim Öffnen. Bestehende Mail-Outbox, Idempotenz, Audit und Berechtigungen erhalten.

## 16. Zeiterfassung, Spesen und Benachrichtigungen

Zeiterfassung: grosse kompakte Zeit, klare Start/Pause/Stop-Steuerung, danach Kunde/Auftrag, heutige Einträge. Plus für manuelle Zeit; vorhandene Rapport-/Exportaktionen über den fachlich freigegebenen Aktionszugang, ohne separate Seitenbuttons. Zeitmessung darf nicht verloren gehen.

Spesen: Foto, Datei/PDF oder manuell; erkannte Felder nur bei vorhandener Erkennung vorausfüllen, Unsicherheit kennzeichnen und Prüfung verlangen. Genehmigungen rollen-/statusabhängig. Benachrichtigungen öffnen den richtigen Datensatz und bewahren beim Zurückgehen Listenfilter und Position.

## 17. Admin-App

Vollwertige Mobile-App/PWA, keine abgespeckte Version. Gleiche UX-Foundation wie Kunden-App, aber eigene Menüs/Rechte für Unternehmen, Abos, Benutzer, Rollen, Support, Monitoring, Sicherheit und Audit. Kritische Aktionen mit serverseitiger Berechtigung, Audit und gegebenenfalls Bestätigung/erneuter Authentifizierung.

## 18. Landingpage

Eigenständiges Marketinglayout mit Binso-Branding: Header, Hero, echte Produktvorschau, Funktionen, Prozesse, Preise, FAQ, Kontakt, Registrierung, Login, Rechtliches, Consent, Footer. Keine erfundenen Leistungen/Preise/Referenzen. Tarifkarten gleich hoch, Preis/CTA/Trennlinien ausgerichtet, Monats-/Jahreswahl klar; „2 Monate gratis“ nur wenn rechnerisch korrekt. Sanfte Hoveranimationen, Reduced Motion.

**Sprachauswahl einmal pro Oberfläche**, auf Landingpage ausschliesslich im Header als dezentes `DE ˅`; DE/FR/IT/EN/TR. Footer nur Impressum, Datenschutz, AGB, Cookie-Einstellungen, Kontakt. DPA/Unterauftragsbearbeiter über Rechtsseiten erreichbar. `© 2026 Binso GmbH` und Link `binso.ch ↗` auf `https://binso.ch`; keine Adresse/Handelsregisternummer oder zweite Sprachauswahl im Footer.

## 19. Legacy-Cleanup

Alte CSS-Selektoren, Media Queries, Tokens, Header, Aktionskomponenten und UX-Tests inventarisieren. Widersprüche zentral migrieren und nur nach Abhängigkeits-/Funktionsnachweis entfernen. Keine zweite UX-Foundation, keine blinden Löschungen. Sicherheits-, Rollen-, RLS-, Finanz-, QR-Rechnungs-, Datenintegritäts-, Audit- und Mail-Outbox-Tests erhalten.

## 20. Tests und GitHub-CI

Vor Änderungen vorhandene Tests lesen. Veraltete UX-Assertions durch gleichwertige oder strengere Verträge ersetzen, niemals Tests nur für grüne CI deaktivieren. Gezielte Regressionen für Header A/B, Plus/…, Listenwerkzeuge, Sortierung/Reset, Filter, ein Such-X, zweizeilige Listen, KPIs, Toggles, Zeitraumfilter, Responsive, DE/FR/IT/EN/TR, Rollen/Mandanten/Abos, PWA-Safe-Areas, Tastatur und Fokus. Vollständige Pflicht-CI erst beim freigegebenen Integrationscommit, nicht nach jeder kleinen CSS-Korrektur.

## 21. Umsetzung in Work

Zuerst tatsächliche Routen, Komponenten, Aktionshandler und bestehende Tests inventarisieren. Dann zentrale Komponenten in kleinen Paketen umsetzen und Seiten migrieren. Keine eigenständige Neugestaltung, keine neuen Fachfunktionen. Echte Live-Vorschau auf Mobile/Desktop zeigen, Freigabe abwarten. Kein Push, Merge, Deployment oder produktive Datenänderung.

## 22. Vollständige Seiten- und Aktionsmatrix

Für jede vorhandene Route dokumentieren: Oberfläche, Seitentyp, Entität, Header, Navigation, Plus, Drei Punkte, Listenwerkzeuge, direkte Prozessaktionen, Bottom Sheet/Popover, Handler/Ziel, Rolle/Mandant/Abo/Status, responsive Darstellung, Sprache, Ist/Soll, Tests, offene Abweichungen. Nicht vorhandene V26-Funktionen und unzugängliche Ansichten separat ausweisen.

## 23. Visueller Soll-Ist-Vergleich

Freigegebene Referenzen mit tatsächlicher Browseransicht bei identischen Viewports, Schrift, Daten, Theme, Sprache und Zustand vergleichen. Landingpage, Kunden-App, Admin-App auf Desktop, Tablet, Mobile und PWA prüfen. Keine erfundenen Mockups als Implementierungsnachweis.

## 24. Funktionale Abnahme

Navigation, Rückweg mit Filter-/Scrollkontext, Erstellen/Bearbeiten, Validierung, Datei/PDF, E-Mail ohne echten Versand, Timer, Statusregeln, Rollen und Abos müssen weiterhin funktionieren. UI-Ausblendung ersetzt keine serverseitige Berechtigungsprüfung. Keine verlorenen Aktionen.

## 25. Responsive und Barrierefreiheit

Mindestens 320, 360, 390, 430, 768, 1024, 1440 und 1920 px repräsentativ prüfen, Hell/Dunkel und fünf Sprachen. Keine Überläufe oder verdeckten Aktionen; sichtbarer Fokus, Labels, Touchflächen, Screenreader-/Tastaturbedienung und Reduced Motion.

## 26. Nachweise

Liefern: vollständige Seiten-/Aktionsmatrix, geänderte zentrale Komponenten, migrierte Seiten, bereinigte CSS-/Legacy-Regeln, ersetzte UX-Tests, bestandene gezielte Tests, offene Blocker und echte Browser-Screenshots. Keine pauschale Freigabe bei offenen Anforderungen.

## 27. Verbindliche Abschluss- und Freigabekriterien

Eine UX-Seite gilt erst als abgenommen, wenn Soll-Ist-Vergleich, Aktionszuordnung, responsive Darstellung, Lokalisierung und relevante Regressionen nachgewiesen sind. Veraltete CSS- und Testregeln nur kontrolliert entfernen, Sicherheits- und Finanzverträge nicht abschwächen. Abschlussbericht mit überprüften/nicht überprüften Seiten, implementierten Funktionen, offenen Abweichungen und Testresultaten. **Kein GitHub-Push, Merge, produktive Migration oder Azure-Deployment ohne separate ausdrückliche Freigabe.** Nach Live-Vorschau auf visuelle Freigabe warten.

---
# V5 – Verbindliche Ergänzungen (haben Vorrang bei UX-Widersprüchen)

## 28. Globale Typografie

Inter als zentrale Schrift. App-Seitentitel 18 px/600/24 px; Abschnittstitel 14 px/600/20 px; Normaltext und Einstellungswerte 14 px/400/20 px; Einstellungslabels 14 px/400–500; Formularlabels 13 px/500; Eingaben 14 px/400; Listen-Haupttext 14 px/500, zweite Zeile 12 px/400; KPI-Label 12 px/400, KPI-Wert 20 px/600, KPI-Trend 11 px/500; Detailbetrag 24 px/600; Statusbadge 11 px/500; Tabs 13 px/500; Bottom-Navigation 11 px/400–500; Dropdowns 14 px/400; Dialogtitel 16 px/600; Hilfs-/Fehlertexte 12 px/400. Abschnittstitel sind gleich gross wie Einstellungszeilen, aber semibold. Zentrale semantische Tokens statt lokaler Overrides. Lesbarkeit bei Browserzoom und vergrösserter Schrift erhalten. Landingpage hat eine eigene grössere Marketing-Typografieskala.

## 29. Icons, Header und Geometrie

App-Header mobile 56 px, Titel 18 px/600. Suche, Glocke, Zurück-Pfeil und Ellipsis jeweils 20 px; Avatar 34 px; normale Menüicons 18 px; Navigationschevron 16 px; Dropdownchevron 14 px; Statusicons 14 px. Eine Iconfamilie mit konsistenter Strichstärke ca. 1.75–2 px. Touchflächen mindestens 44 × 44 px; Einstellungszeilen mindestens 48 px; Dropdownoptionen mindestens 44 px; Inputs 44–48 px mit 12 px Radius, sofern Textskalierung dies zulässt. Gleichartige Elemente haben gleiche Position, Grösse, Abstand und Gewichtung. Listenheader: Titel links, maximal Suche/Glocke/Avatar rechts, keine Ellipsis. Detailheader: Zurück links, optisch zentrierter Titel, maximal eine Ellipsis rechts für berechtigte Aktionen. Bestehende Bottom-Navigation und blauer Floating-Plus bleiben unverändert.

## 30. Sprache und Dropdown

Fünf Sprachen DE, FR, IT, EN, TR. Sprachauswahl einmalig: Landingpage nur Header; Kunden-/Admin-App nur im persönlichen Avatar-Kontobereich, nie zusätzlich unter «Mehr» oder im Footer. Geschlossener Trigger rahmenlos `DE ˅` (analog andere Sprachen), Chevron direkt 4–6 px neben Kürzel. Dropdown 180–200 px breit unabhängig vom schmalen Trigger, rechts am Trigger ausgerichtet, bei Platzmangel umpositionieren; Portal/Overlay gegen Abschneiden. Jede Sprache (Deutsch, Français, Italiano, English, Türkçe) in genau einer Zeile, 44 px Optionshöhe, aktiver Eintrag mit Häkchen, keine Pill-Buttons. Escape/Aussenklick/Fokus/Tastatur/Screenreader korrekt. Persistenz und Übersetzungsabdeckung prüfen. Fehlende rechtlich freigegebene Übersetzungen transparent kennzeichnen, keine rechtsverbindlichen Übersetzungen erfinden.

## 31. Avatar versus «Mehr» und Settings

Avatar = persönliche Daten, Sicherheit (Passwort/MFA/Passkeys/Sitzungen), persönliche Benachrichtigungen, Theme, Sprache, persönliche Datenschutzeinwilligungen, Abmelden. «Mehr» = Firmendaten, Mitarbeiter/Rollen, Abonnement, Bank, Dokumentvorgaben, Unternehmens-Compliance, Module und Support; Admin-Plattformverwaltung in bestehender Adminnavigation. Jede Einstellungsroute genau einem primären Menüort zuweisen, Deep-Links erhalten. Binär = Toggle rechts, Unterseite = antippbare Zeile mit Chevron, Wertwahl = kompaktes Dropdown, kritische Änderung = geführter Ablauf. MFA-Toggle erst nach bestätigter Einrichtung/Deaktivierung; Passkeys sind eine Verwaltungsseite, kein Toggle. Keine verstreuten Buttons, keine doppelten Überschriften.

## 32. Stammdaten, Abo und Dokumenteinstellungen

Persönliche, Firmen-, Kunden-, Mitarbeiter- und Lieferantendaten: Feldlabel oben, Wert darunter, alles linksbündig; lange E-Mails/Adressen umbrechen. Kompakter Avatar/Logo 52–64 px; keine doppelten Namen/E-Mails. Bearbeiten im Detailheader, Logo im Bearbeitungsprozess. Abonnement: kompakte Plan-/Statuskarte, echte Preise und Abrechnungsdaten getrennt von Marketingpreis, Nutzungszeilen und Zahlungs-/SaaS-Rechnungsnavigation. Keine erfundenen Limits oder technischen Providerfehler im Kundentext. Rechnung/Angebot: separate Unterseiten für Vorgaben, Bankverbindung, Dokumenttexte und Nummerierung statt überlangem Bottom Sheet; Speichern als Formularabschluss. Schweizer MwSt.-, IBAN-/QR-IBAN-, QR-Rechnungs- und Dokumentversionsregeln erhalten.

## 33. Toolbar, Suche, Filter, Sortierung

Listenwerkzeug stets ganz rechts in der Steuerungszeile; Zeitraum/Suche links. Zahnrad nur für Einstellungen, Schieberegler für allgemeine Werkzeuge. Suche: genau ein X, keine nativen doppelten Browser-Clear-Icons. Einfache Sortierung als ca. 230 px breites, nicht abgeschnittenes Dropdown direkt am Icon, 44 px hohe einzeilige Menüoptionen ohne Pills; aktive Option mit Häkchen. Einfache Filter als Dropdown, komplexe Filter auf Mobile als Bottom Sheet. Bei aktiver Abweichung kompakte Statuszeile mit Auswahl links und «Zurücksetzen» als Text rechts; Reset nur für die bezeichnete Dimension. Keine funktionslosen Werkzeuge und keine verlorenen Import-/Exportaktionen.

## 34. Finanzanalyse und Berichte – freigegebene Variante 3

Vier kompakte KPI-Karten: Einnahmen, Ausgaben, Saldo, Offen; Label oben links, prozentualer fachlich bewerteter Trend oben rechts nur bei gültiger Vergleichsbasis, Betrag darunter. Mobile 2 Spalten, Desktop bei Platz 4. Einnahmen grün `#16A34A`, Ausgaben rot `#DC2626`, neutral blau `#2563EB`. Grosses Liniendiagramm ersetzen durch kompakte **horizontale Vergleichsbalken**: Einnahmen grün, Ausgaben rot, jeweilige Beträge rechts, Saldo darunter; Balkenhöhe ca. 8 px, proportional zum grösseren Betrag, Null-/Negativfälle korrekt. Keine künstlichen Daten. Zahlungssaldo ist kein Bankkontostand. «Forderungen» und «Angebote» standardmässig eingeklappte Accordions; geöffnet Forderungen mit ca. 90-px-Ring und überschneidungsfreien Statusgruppen bezahlt/offen/überfällig; Statusnavigation erhält Filter, Zeitraum und Scrollposition. Bestands- und Zeitraumwerte in Berichten nicht vermischen.

## 35. Rechtliches – innerhalb der Anwendung anzeigen

**Verbindliche neue Entscheidung:** Angemeldete Kunden- und Adminbenutzer sollen bei Impressum, Datenschutz, AGB, Unterauftragsbearbeitern und vorhandener DPA nicht auf die öffentliche Landingpage weitergeleitet werden. Stattdessen **app-interne Rechtsseiten** mit normaler App-Shell, passendem Detailheader, kompakter «Rechtliches»-Navigation aus einzeiligen antippbaren Zeilen und Chevron sowie lesbarem, vollständig scrollbarem Dokumenttext. Keine verstreuten Linkbuttons. Rechtstexte sind von der Zwei-Zeilen-Regel für Listen ausgenommen. Persönliche Consent-Einstellungen bleiben unter Avatar, Unternehmens-Compliance unter «Mehr»/Adminnavigation. Keine doppelten primären Einstellungsmenüs.

**Öffentlicher Zugang bleibt zwingend:** Landingpage, Login, Registrierung, E-Mail-Links und nicht angemeldete Besucher müssen öffentlich erforderliche Rechtstexte weiterhin ohne Login erreichen. App-intern sind die Links interne Routen, kein externer Seitenwechsel. Öffentlicher Footer nur Impressum, Datenschutz, AGB, Cookie-Einstellungen, Kontakt; `© 2026 Binso GmbH` und Link `binso.ch ↗` auf `https://binso.ch`, keine Sprachwahl oder Firmenadresse im Footer.

**Eine zentrale, versionierte Inhaltsquelle:** App und Landingpage zeigen dieselbe freigegebene Dokumentversion mit Dokumenttyp, Version, Gültigkeitsdatum, Sprache und Freigabestatus. Keine doppelt gepflegten Texte, keine erfundenen oder automatisch umgeschriebenen Rechtsklauseln. Vorhandene Zustimmungsversionen, Consent-Nachweise, Widerruf, AGB-Akzeptanz und Historie unverändert erhalten. Fehlende freigegebene TR-/andere Rechtsübersetzung transparent kennzeichnen, nicht als autorisierte Fassung ausgeben. Bei fehlender zentraler Rechtsquelle erst Inventar und Migrationsplan, keine eigenmächtige Änderung rechtsverbindlicher Inhalte.

**Prüfungen:** App-internes Öffnen ohne Landingpage-Redirect, öffentliche Erreichbarkeit ohne Sitzung, identische freigegebene Version, gültige Deep-Links, Browser-Zurück, Scrollen, Tastatur/Screenreader, Consent-Verhalten, Berechtigungen und keine Cross-Tenant-Datenexposition.

## 36. Technische Umsetzung, Legacy und CI

Zuerst **alle tatsächlichen Routen, Aktionen, Komponenten, CSS-Owner, Testannahmen und rechtlichen Inhaltsquellen inventarisieren**. Für jede Route Seitentyp, Header, Plus, Ellipsis, Toolbar, direkte Prozessaktion, Bottom Sheet/Popover, Handler, Rolle/Mandant/Abo/Status, i18n und Soll-Ist dokumentieren. Bestehende zentrale Komponenten verwenden, keine zweite Foundation. Alte CSS-Regeln und Tests nur nach Abhängigkeitsprüfung und gleichwertigem Ersatz entfernen. Finanz-, Auth-, RLS-, Rollen-, Audit-, QR-Rechnungs-, Mail- und Consent-Tests erhalten. Gezielte Regressionstests für Header/Icons/Typografie/Sprachdropdown/Settings/Finanzbalken/Accordions/Rechtsrouten sowie Viewports 320, 360, 390, 430, 768, 1024, 1440 px und Hell/Dunkel. Reale Work-Live-Vorschau, keine Mockup-Abnahme. Keine GitHub-Pushes, keine Deployments, keine produktiven Migrationen ohne separate Freigabe. Abschlussbericht mit abgedeckten/nicht abgedeckten Routen, Tests und offenen Abweichungen.

## 37. Vorrang und Abnahme

Bei Widerspruch zwischen V4-Basiskapiteln und den V5-Kapiteln 28–36 gelten **V5-Kapitel 28–36 für UX**. Sicherheit, Recht, Datenintegrität und tatsächlich gültige Geschäftsregeln dürfen durch visuelle Vereinfachung nicht geschwächt werden. Eine Seite gilt nur als fertig, wenn ihre Funktionen erreichbar sind, ihre UX der freigegebenen Referenz entspricht und die gezielten Verträge bestanden sind. **Nach Live-Vorschau auf visuelle Freigabe warten.**
