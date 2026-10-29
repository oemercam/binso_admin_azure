# BINSO ONE V8 – GLOBAL SIMPLE UX & WORKFLOW
## Vollständiger Master-Implementierungsauftrag für ChatGPT Work / Codex

**Projekt:** Binso One  
**Geltungsbereich:** Gesamte Kunden-App, Admin-Portal, Registrierung, Onboarding, alle Module, Unterseiten, Formulare, Navigationen und Geschäftsprozesse.

**Ziel:** Binso One soll für kleine Schweizer Unternehmen sofort einfach bedienbar sein und gleichzeitig professionelle Funktionen für wachsende Unternehmen unterstützen.

Die bereits freigegebene UX- und Navigationsarchitektur V7.1 bleibt Grundlage. V8 ergänzt diese um die verbindliche Vereinfachung sämtlicher Geschäftsprozesse.

---

## 1. Grundauftrag

Analysiere das vollständige aktuelle Repository und optimiere alle Module nach folgendem Prinzip:

**Einfach starten → automatisch ergänzen → bei Bedarf erweitern.**

Prüfe und korrigiere:

- Zu viele Pflichtfelder.
- Unnötige Eingabeschritte.
- Wiederholte Abfragen derselben Informationen.
- Überladene Formulare.
- Unnötige Bottom Sheets.
- Verschachtelte Menüs und Tabs.
- Unklare Seitenhierarchien.
- Doppelte Funktionen.
- Widersprüchliche Einstellungen.
- Fehlende automatische Datenübernahme.
- Unverständliche Statusbezeichnungen.
- Unterschiedliche Listen- und Detaildarstellungen.
- Unnötige API-Anfragen und Ladezustände.
- Fehlerhafte Rücknavigation.
- Unvollständige Verknüpfungen zwischen Modulen.

Bewahre sämtliche bestehenden fachlichen Funktionen, Berechtigungen, Daten und Sicherheitsregeln.

**Keine parallelen Implementierungen und keine neue unabhängige Designbibliothek erstellen.**

## 2. Vor jeder Änderung: vollständige Bestandsaufnahme

Inventarisiere sämtliche vorhandenen:

- Module und Unterseiten.
- Routen und Navigationseinträge.
- Formulare und Formularfelder.
- Pflichtfelder und Validierungsregeln.
- Aktionen und Drei-Punkte-Menüs.
- Bottom Sheets, Dialoge und Dropdowns.
- Benutzerrollen und Berechtigungen.
- Datenbanktabellen und Relationen.
- API-Endpunkte und Integrationen.
- Übersetzungen und Benachrichtigungen.
- Design-Tokens, CSS-Regeln und Komponenten.
- Tests und Build-Konfigurationen.

Erstelle eine Ist-Soll-Matrix.

Kennzeichne jede Anforderung als:

`Vorhanden | Teilweise | Fehlend | Fehlerhaft | Blockiert`

Unterscheide nachweisbare Fehler von gewünschten Verbesserungen.

## 3. Globales Drei-Ebenen-Prinzip

### Ebene 1 – Standard

Nur die für die aktuelle Aufgabe notwendigen Felder anzeigen.

Bekannte Daten automatisch übernehmen.

Gültige Unternehmensstandards verwenden.

Keine zusätzlichen Einstellungen abfragen, wenn sie bereits zentral festgelegt sind.

### Ebene 2 – Weitere Angaben

Optionale und selten benötigte Funktionen über einen klaren Bereich „Weitere Angaben“ bereitstellen.

Nur relevante Felder für den jeweiligen Geschäftsfall anzeigen.

Keine mehrfach verschachtelten Akkordeons.

### Ebene 3 – Unternehmenseinstellungen

Dauerhafte Regeln zentral verwalten:

- MwSt.-Vorgaben.
- Zahlungsfristen.
- Nummernkreise.
- Dokumentvorlagen.
- Abrechnungsregeln.
- Stundensätze.
- Spesenrichtlinien.
- Freigaberegeln.
- Benachrichtigungen.
- Mitarbeiterrechte.

Diese Einstellungen nicht bei jeder Erfassung erneut abfragen.

## 4. Verbindliche Navigation

Hauptnavigation:

**Übersicht · Kunden · Aufträge · Zeit · Mehr**

Die bestehende Bottom-Navigation bleibt in Gestaltung und Position unverändert.

Der bestehende blaue Floating-Plus-Button bleibt ebenfalls unverändert.

### Kunden-Zentrale

Ablauf:

`Kunden → Kunde auswählen → Fachbereich → Datensatz auswählen → Details`

Bereiche:

1. Aufträge
2. Angebote
3. Rechnungen
4. Zahlungen
5. Kontakte
6. Dateien
7. Verlauf
8. Stammdaten

Alle Fachbereiche verwenden denselben Kundenkontext.

### Mehr

**Geschäft**
- Angebote
- Rechnungen
- Zahlungen
- Spesen
- Ausgaben
- Finanzen

**Auswertung**
- Berichte

**Verwaltung**
- Unternehmen
- Mitarbeiter
- Berechtigungen
- Unternehmenseinstellungen
- Abonnement

**Hilfe**
- Support
- Hilfe und Informationen

Vorhandene Funktionen und Berechtigungen berücksichtigen. Keine doppelten Navigationsziele.

### Avatar

Ausschliesslich persönliche Einstellungen:

- Profil
- Sicherheit
- MFA und Passkeys
- Geräte und Sitzungen
- Benachrichtigungen
- Darstellung
- Sprache
- Datenschutz
- Abmelden

## 5. Einheitlicher Geschäftsprozess

Der Standardablauf lautet:

`Kunde → Angebot → Auftrag → Leistung/Zeit → Rechnung → Zahlung`

Nicht jeder Schritt ist zwingend.

Erlaubte Alternativen:

- Kunde → Rechnung → Zahlung.
- Kunde → Auftrag → Zeit → Rechnung.
- Kunde → Angebot → Rechnung.
- Interner Auftrag → Zeiterfassung.
- Pauschalauftrag ohne abrechenbare Arbeitsstunden.

Ein Datensatz besitzt eine führende Datenquelle.

Verknüpfte Module zeigen dieselben Daten, keine Kopien.

## 6. Kunden und Kontakte

### Kunde erstellen

Standardfelder:

- Firmenname.
- Kontaktperson, soweit vorhanden beziehungsweise erforderlich.

Weitere Angaben:

- Adresse.
- E-Mail.
- Telefon.
- UID.
- Weitere Kontaktpersonen.
- Rechnungsadresse.

Kundendaten können ergänzt werden, bevor eine Rechnung ausgestellt wird.

### Kundenliste

Zeile 1: Firmenname links, Status rechts.

Zeile 2: Kontaktperson.

Keine Finanzzahlen in der Kundenliste.

### Kundendetails

Kunden-Zentrale mit kompakten Navigationszeilen, Icons, Werten, Chevrons und feinen Trennlinien.

### Kontakte

Kompakte Kontaktliste.

Antippen öffnet Kontaktdetails.

Bearbeiten und Kommunikationsaktionen über das kontextspezifische Aktionsmenü.

## 7. Angebote

Einfacher Standardablauf:

1. Kunde auswählen.
2. Abrechnungsart auswählen.
3. Positionen erfassen.
4. Entwurf speichern.
5. Angebot prüfen und versenden.

Verbindliche Abrechnungsarten:

- Pauschal / Fixpreis.
- Nach Aufwand.
- Nach Menge.
- Gemischt.
- Wiederkehrend.
- Nach Meilensteinen.

Nur modellabhängige Felder anzeigen.

Positionen verwenden die freigegebene kompakte Variante 1:

- Drag-Handle.
- Positionsnummer.
- Bezeichnung.
- Menge × Preis.
- Betrag rechts.
- Antippen zum Bearbeiten.

Duplizieren und Löschen konsistent anbieten.

Versionen unveränderlich erhalten.

Versandstatus korrekt zwischen versendet, zugestellt, angesehen und fehlgeschlagen unterscheiden.

Ein angenommenes Angebot kann ohne doppelte Dateneingabe in einen Auftrag übernommen werden.

## 8. Aufträge

### Einfach erstellen

Pflicht für einen Entwurf:

- Kunde oder Intern.
- Auftragsbezeichnung.
- Abrechnungsmodell.

Weitere Angaben:

- Verantwortlicher.
- Mitarbeiter.
- Beginn und Ende.
- Aufgaben.
- Meilensteine.
- Stundenbudget.
- Kostenbudget.
- Beschreibung.
- Dateien.

Auftragsnummer und Initialstatus automatisch erzeugen.

Modellabhängige Pflichtangaben erst vor Aktivierung verlangen.

### Auftrags-Zentrale

- Planung.
- Mitarbeiter.
- Zeiterfassung.
- Kosten.
- Abrechnung.
- Dateien.

Jeder Bereich öffnet eine klare Unterseite.

### Kosten und Planung

Unterstütze geplante und tatsächliche Stunden, Kosten, Umsätze und Margen.

Vertrauliche Personalkosten nur berechtigten Rollen anzeigen.

Nicht vorhandene Budgets dürfen nicht als Nullbudget interpretiert werden.

## 9. Zeiterfassung

### Timer

Vor Start:

1. Kunde oder Intern auswählen.
2. Auftrag auswählen.
3. Timer starten.

Kunde und Auftrag verwenden dieselbe zentrale durchsuchbare Auswahlkomponente.

Mobile: Bottom Sheet.

Desktop: Dropdown beziehungsweise Popover.

Keine unterschiedlichen Auswahlmethoden innerhalb derselben Funktion.

Timer:

- Starten: Blau.
- Pause: Neutral.
- Fortsetzen: Blau.
- Stoppen: Rot.

Zeitmessung bei Navigation, App-Neustart und Verbindungsunterbruch zuverlässig erhalten.

### Einträge

Kompakte Listen mit eindeutigen Statusanzeigen.

Einzel- und Mehrfachauswahl.

Mehrere Zeiten gemeinsam zur Prüfung einreichen.

Berechtigte Prüfer können mehrere Einträge freigeben.

### Abrechnung

Freigegebene, verrechenbare und noch nicht abgerechnete Zeiten übernehmen.

Doppelte Verrechnung serverseitig verhindern.

Freigabestatus und Abrechnungsstatus getrennt halten.

## 10. Rechnungen

Einfacher Ablauf:

1. Kunde auswählen.
2. Leistungen übernehmen oder Positionen erfassen.
3. Rechnung prüfen.
4. Entwurf speichern oder Rechnung ausstellen.
5. Versenden.

Unterstütze:

- Direktrechnungen.
- Rechnungen aus Angeboten.
- Rechnungen aus Aufträgen.
- Stundenabrechnung.
- Pauschalabrechnung.
- Mengenabrechnung.
- Gemischte Abrechnung.
- Meilensteinabrechnung.
- Wiederkehrende Abrechnung.
- Akonto.
- Teilrechnung.
- Schlussrechnung.
- Gutschrift.

Rechtsgültige Rechnungsdaten und Schweizer QR-Rechnungsregeln vor Ausstellung prüfen.

Bereits finalisierte Dokumente nicht rückwirkend verändern.

## 11. Zahlungen

Standard:

1. Rechnung auswählen.
2. Betrag prüfen.
3. Zahlungsdatum festlegen.
4. Zahlung erfassen.

Offenen Betrag automatisch aktualisieren.

Teilzahlungen, Überzahlungen, Rückerstattungen und Korrekturen fachlich korrekt behandeln.

Zahlungen gehören zur Rechnung.

Aufträge und Kunden zeigen die zugehörigen Zahlungen nur als verknüpfte Ansicht.

## 12. Spesen und Ausgaben

### Spesen

Standardablauf:

1. Beleg fotografieren oder hochladen.
2. Angaben erkennen, sofern die vorhandene technische Integration dies unterstützt.
3. Betrag, Datum und Kategorie kontrollieren.
4. Speichern.

Manuelle Erfassung ohne Foto ermöglichen, sofern die Firmenrichtlinie dies zulässt.

Weitere Angaben nur bei Bedarf:

- Händler.
- Mitarbeiter.
- Kunde.
- Auftrag.
- MwSt.
- Zahlungsart.
- Kostenstelle.
- Weiterverrechnung.
- Beschreibung.

Unterscheide privat bezahlte Spesen, firmenseitig bezahlte Ausgaben und weiterverrechenbare Ausgaben.

Keine doppelte Buchung oder Erstattung.

### Belegerkennung

Vorhandene OCR-/KI-Funktionen prüfen.

Fehlende Funktionen nicht als implementiert deklarieren.

Automatisch erkannte Werte müssen korrigierbar sein.

Unsichere Erkennung darf nicht automatisch verbindliche Buchungen erzeugen.

### Freigabe

Einzel- und Sammelfreigabe gemäss Berechtigung.

Klare Statusanzeigen.

## 13. Support

Ablauf:

`Support → Ticketliste → Ticketdetails → Unterhaltung`

Nicht direkt aus der Ticketliste in den Chat springen.

Ticket erstellen mit:

- Betreff.
- Beschreibung.
- Optionalem Anhang.

Ticketdetails:

- Ticketnummer.
- Titel.
- Status.
- Beschreibung.
- Anhänge.
- Verlauf.
- Zugang zur Unterhaltung.

Der Chat muss auf iPhone, iOS-PWA und Desktop korrekt mit der Tastatur funktionieren.

## 14. Mitarbeiter und Berechtigungen

Einladung mit:

- E-Mail.
- Rolle.

Weitere Berechtigungen bei Bedarf.

Vorhandenes Rollenmodell weiterverwenden.

Keine parallele Rollenverwaltung.

Sämtliche Berechtigungen serverseitig prüfen.

Mandantentrennung konsequent erzwingen.

## 15. Registrierung, Profil und Sicherheit

- E-Mail-Registrierung.
- E-Mail-Verifikation.
- Passwort.
- Passwort-Reset.
- Sichere Sitzungsverwaltung.
- Angemeldet bleiben.
- Passwortmanager-Unterstützung.
- Passkeys.
- Face ID / Touch ID über Passkeys.
- Authenticator-App.
- Wiederherstellungscodes.
- Geräteverwaltung.
- Abmelden und alle Sitzungen beenden.

**Admin-Portal: MFA verpflichtend und nicht deaktivierbar.**

Kundenportal: MFA optional, durch Unternehmensrichtlinie verpflichtend schaltbar.

Vorhandenen Identity-Provider und technische Einschränkungen prüfen.

Keine zweite unabhängige Authentifizierung aufbauen.

## 16. Firmeneinrichtung

Die bisherige mehrseitige Firmenvervollständigung durch eine einzige übersichtliche Seite ersetzen.

Abschnitte:

- Unternehmen.
- Geschäftsadresse.
- Zahlungskonto.

Eine kompakte Fortschrittsanzeige.

Einmalige Aktion „Einrichtung abschliessen“.

Optionale Dokument-, Steuer- und Zahlungseinstellungen auslagern.

Bereits vorhandene Angaben übernehmen.

Keine Datenverluste bei Unterbrechungen.

## 17. Finanzen und Berichte

### Finanzen

Nur zentrale Finanzinformationen:

- Umsatz.
- Zahlungseingänge.
- Ausgaben.
- Offene Forderungen.
- Überfällige Beträge.

Klare Fachnavigation.

Keine Vermischung mit unnötigen Zeit- oder Angebotsdetails.

### Berichte

Ablauf:

1. Bericht auswählen.
2. Zeitraum festlegen.
3. Ergebnis anzeigen.

Erweiterte Filter und Exporte bei Bedarf.

## 18. Einstellungen

Persönliche und unternehmensbezogene Einstellungen strikt trennen.

Toggles für echte Ein-/Aus-Einstellungen.

Navigationszeilen für Unterseiten.

Dropdowns für Auswahlen.

Keine verstreuten Buttons, wenn eine standardisierte Zeile besser geeignet ist.

Alle Einstellungen fachlich eindeutig benennen.

## 19. Globale UX-Foundation

Die interaktiven Binso-One-Darstellungen aus dem freigegebenen V7-Konzept sind die verbindliche visuelle Referenz.

Verwende:

- Inter.
- Einheitliche Schriftgrössen.
- Einheitliche Icons.
- Einheitliche Zeilenhöhen.
- Einheitliche Seitenränder.
- Feine 1-px-Trennlinien.
- Einheitliche Status-Badges.
- Einheitliche Chevron-Positionen.
- Einheitliche Formularfelder.
- Einheitliche Bottom Sheets.
- Einheitliche Footer-Aktionen.
- Kompakte Leerzustände.

Keine individuellen CSS-Sonderlösungen pro Seite.

### Richtwerte

| Element | Standard |
|---|---|
| Seitentitel | 18 px / Semibold |
| Abschnittstitel | 14 px / Semibold |
| Listenzeile | 14 px |
| Sekundärtext | 12 px |
| Mobile Eingabeschrift | Mindestens 16 px |
| Mobile Seitenrand | 16 px |
| Navigationszeile | Mindestens 48 px |
| Touchfläche | Mindestens 44 × 44 px |
| Icon | 18 px |
| Chevron | 16 px |
| Formularradius | 12 px |
| Kartenradius | 16 px |
| Trennlinie | 1 px, dezente Theme-Farbe |

Vorhandene zentrale Tokens bevorzugen und widersprüchliche Werte konsolidieren.

### Ganze Seiten und Bottom Sheets

Ganze Seiten für umfangreiche Prozesse.

Bottom Sheets für kurze Eingaben, Filter und Aktionen.

Keine verschachtelten Bottom Sheets.

Keine unnötigen Vollbilddialoge.

Keine verdeckten Footer-Aktionen.

### Dirty State

Ohne tatsächliche Änderung sofort schliessen.

Nur bei echten ungespeicherten Änderungen nach Verwerfen fragen.

Nach X, Abbrechen oder Speichern zum korrekten Ausgangspunkt zurückkehren.

## 20. Mehrsprachigkeit

Vollständige Unterstützung:

- Deutsch (de-CH).
- Französisch (fr-CH).
- Italienisch (it-CH).
- Englisch (en).
- Türkisch (tr).

Prüfe sämtliche:

- Navigationen.
- Formulare.
- Status.
- Validierungen.
- Fehlermeldungen.
- E-Mails.
- Benachrichtigungen.
- Dokumenttexte.
- Einstellungen.
- Admin-Ansichten.

Keine hardcodierten sichtbaren UI-Texte.

Marktübliche Fachbegriffe verwenden.

Keine abgeschnittenen Übersetzungen.

Schweizer Zahlen-, Datums-, Währungs- und Rechnungsregeln korrekt behandeln.

## 21. Vollständige technische Qualitätsprüfung

Prüfe das gesamte Repository auf:

- Codequalität und Architektur.
- Ungenutzte Dateien.
- Doppelte Komponenten.
- Veraltete CSS-Regeln.
- Hardcodierte Farben, Abstände und Geschäftsregeln.
- Bilder, Logos und Assets.
- Ordner- und Dateistruktur.
- TypeScript-Typisierung.
- API-Verträge.
- Datenbanktabellen und Felder.
- Beziehungen und Constraints.
- Indizes.
- Row-Level Security.
- Mandantentrennung.
- Authentifizierung und Autorisierung.
- Transaktionen.
- Race Conditions.
- Idempotenz.
- Cache-Invalidierung.
- Performance.
- Abhängigkeiten.
- Sicherheitslücken.
- Build-Konfiguration.
- GitHub Actions.
- Azure-Konfiguration.
- Dokumentation.

**Keine unkontrollierten Refactorings oder Datenbankmigrationen.**

Kritische Änderungen zuerst dokumentieren und zur Freigabe vorlegen.

## 22. Performance

Prüfe:

- App-Kaltstart.
- Dashboard-Ladezeit.
- Seitenwechsel.
- Datenabfragen.
- Unnötige React-Renderings.
- N+1-Datenbankabfragen.
- API-Wartezeiten.
- Lazy Loading.
- Caching.
- PWA-Neustart.
- Offline- und Fehlerzustände.
- Stabile Inhaltsgeometrie.

Keine sichtbaren Layoutsprünge.

Den bestehenden Floating-Plus-Button nicht verändern.

Messwerte vor und nach Änderungen unter vergleichbaren Bedingungen dokumentieren.

## 23. End-to-End-Prozessprüfung

Teste mindestens:

1. Registrierung → E-Mail bestätigen → Firma einrichten.
2. Kunde erstellen → Angebot erstellen → Auftrag übernehmen.
3. Auftrag erstellen → Mitarbeiter zuordnen → Zeit erfassen.
4. Zeit einreichen → freigeben → Rechnung erstellen.
5. Pauschalauftrag → Rechnung → Zahlung.
6. Direktrechnung ohne Auftrag.
7. Gemischte Abrechnung.
8. Teilrechnung und Schlussrechnung.
9. Spese mit Beleg → Freigabe → Erstattung.
10. Support-Anfrage → Ticketdetails → Unterhaltung.
11. Mitarbeiter einladen → anmelden → Berechtigungen prüfen.
12. Admin-Anmeldung mit verpflichtender MFA.
13. Abmelden → erneute Anmeldung.
14. Kunden-Zentrale → Fach