# BINSO ONE – MASTER IMPLEMENTATION PHASE 1
## UX, Navigation, Identity, Security & Internationalisierung

**Projekt:** Binso One  
**Repository:** `oemercam/binso_admin_azure`  
**Grundlage:** Global UX Master V6 und alle danach freigegebenen UX-Entscheidungen  
**Arbeitsumgebung:** ChatGPT Work / Codex mit Live-Vorschau

---

## 1. Auftrag und Arbeitsweise

Prüfe den aktuellen Codebestand und implementiere die nachfolgenden Anforderungen als erste konsolidierte Phase.

Ziel ist eine moderne, einheitliche, sichere und vollständig mehrsprachige SaaS-Plattform für Schweizer Unternehmen.

Geltungsbereich:
- Öffentliche Landingpage.
- Registrierung und Anmeldung.
- Kunden-App.
- Admin-App.
- Desktop, Tablet, Mobile und PWA.
- Light Mode und Dark Mode.

Arbeite mit bestehenden Komponenten, Services, Datenmodellen und Berechtigungen.

**Keine zweite UX-Foundation und kein paralleles Authentifizierungssystem erstellen.**

Prüfe vor Änderungen, welche Funktionen bereits vollständig oder teilweise implementiert sind.

Erstelle eine kurze Ist-Soll-Matrix mit:
- Bereits vorhanden.
- Teilweise vorhanden.
- Fehlend.
- Technisch blockiert.

Danach implementiere die Anforderungen in logisch getrennten Arbeitspaketen.

Keine produktiven Datenänderungen, kein GitHub-Push und kein Azure-Deployment ohne Freigabe.

## 2. Globale UX-Standardisierung

Konsolidiere die vorhandenen Design-Tokens und Komponenten.

Verbindliche Typografie für Kunden-App und Admin-App:

| Element | Grösse | Gewicht |
|---|---:|---:|
| Seitentitel | 18 px | 600 |
| Abschnittstitel | 14 px | 600 |
| Standardtext | 14 px | 400 |
| Einstellungszeile | 14 px | 400–500 |
| Formularlabel | 13 px | 500 |
| Formularinhalt | 14 px | 400 |
| Sekundärtext | 12 px | 400 |
| KPI-Bezeichnung | 12 px | 400 |
| KPI-Wert | 20 px | 600 |
| Prozenttrend | 11 px | 500 |
| Detailbetrag | 24 px | 600 |
| Status-Badge | 11 px | 500 |
| Bottom-Sheet-Titel | 16 px | 600 |
| Navigation | 11 px | 500 |

Schriftfamilie: Inter.

Geometrie:
- Header: 56 px zuzüglich Safe Area.
- Header-Icons: 20 px.
- Normale Icons: 18 px.
- Navigations-Chevron: 16 px.
- Dropdown-Chevron: 14 px.
- Touchflächen: mindestens 44 × 44 px.
- Mobile Seitenränder: 16 px.
- Kartenradius: 16 px.
- Formularradius: 12 px.
- Formularfelder: ungefähr 48 px.
- Einheitliches 4-/8-px-Abstandssystem.

Gleichwertige Elemente müssen überall identisch aussehen.

Keine lokalen CSS-Sonderlösungen.

## 3. Header und Seitenbeschreibungen

Übersichts- und Listenseiten:
- Seitentitel links.
- Suche, Glocke und Avatar rechts.
- Keine drei Punkte im Header.

Detailseiten:
- Zurück-Pfeil links.
- Titel mittig.
- Drei-Punkte-Menü rechts, wenn mehrere Datensatzaktionen vorhanden sind.

Einzelne Bearbeitungsaktionen können als klar erkennbares Header-Icon erscheinen, sofern dies zentral geregelt ist.

Direkt unter dem Header eine kurze, fachlich passende Seitenbeschreibung auf Hauptseiten anzeigen.

Maximal eine Zeile bei normaler mobiler Breite, ansonsten höchstens zwei.

Keine doppelten Überschriften oder redundanten Beschreibungen.

## 4. Navigation V2

Neue Hauptnavigation:

**Übersicht · Kunden · Aufträge · Zeit · Mehr**

Icons:
- Übersicht: House.
- Kunden: Users.
- Aufträge: BriefcaseBusiness.
- Zeit: Clock3.
- Mehr: Ellipsis.

Die bestehende Bottom-Navigation technisch und visuell wiederverwenden.

Nur die fachliche Belegung und erforderliche aktive Navigation ändern.

Den bestehenden blauen Floating-Plus-Button in Grösse, Farbe, Position und Gestaltung unverändert lassen.

### Mehr – verbindliche Kategorien

**Geschäft**
- Angebote.
- Rechnungen.
- Finanzen.
- Spesen.

**Auswertung**
- Berichte.

**Verwaltung**
- Unternehmen.
- Mitarbeiter & Berechtigungen.
- Unternehmenseinstellungen.

**Hilfe**
- Support.
- Hilfe & Informationen.

Jede Kategorie erhält dieselbe Typografie, Zeilenhöhe, Icongrösse, Chevron-Ausrichtung und Trennlinien.

Keine doppelten Navigationsziele.

Bestehende Routen und Deep Links erhalten.

### Avatar

Ausschliesslich persönliche Einstellungen:
- Profil.
- Sicherheit.
- Benachrichtigungen.
- Darstellung.
- Sprache.
- Persönlicher Datenschutz.
- Sitzungen.
- Abmelden.

Unternehmensbezogene Einstellungen gehören zu Mehr.

## 5. Globales Aktionssystem

Plus:
- Neue Datensätze erstellen.
- Anhänge hinzufügen.
- Neue Positionen im jeweiligen Bearbeitungsablauf hinzufügen.

Drei Punkte:
- Bestehende Datensätze bearbeiten.
- Archivieren.
- PDF anzeigen und herunterladen.
- Versenden.
- Exportieren.
- Weitere vorhandene Datensatzaktionen.

Keine verstreuten Aktionsbuttons auf Detailseiten.

Keine Drei-Punkte-Menüs innerhalb gewöhnlicher Inhaltsabschnitte.

Für Positionslisten gilt die ausdrücklich freigegebene Ausnahme mit direkter Bearbeitung und kontextbezogenen Schnellaktionen.

Mobile Aktionsmenüs verwenden die zentrale Bottom-Sheet-Komponente.

Desktop verwendet kompakte Popovers.

## 6. Suche, Filter, Sortierung und Listenwerkzeuge

Suche:
- Genau ein X zum Löschen.
- Einheitliche Höhe und Rundung.
- Keine abgeschnittenen Suchbegriffe.
- Fokus nach Löschen erhalten.

Sortierung:
- Kompaktes Dropdown am Sortierzugang.
- Aktive Auswahl mit Häkchen.
- Einzeilige Optionen.
- Zurücksetzen als dezente Textaktion.

Filter:
- Einfache Filter als Dropdown.
- Komplexe Filter als Bottom Sheet.
- Aktive Filter eindeutig anzeigen.

Listenwerkzeuge:
- Immer rechts in der zentralen Steuerungszeile.
- Gleiche Position auf vergleichbaren Seiten.
- Keine unnötigen zusätzlichen Werkzeugbuttons.

Dropdowns dürfen nicht durch Elterncontainer oder Viewportgrenzen abgeschnitten werden.

## 7. Globale Listen und Detailseiten

Verwende zentrale Komponenten für:
- ListRow.
- NavigationRow.
- DetailRow.
- SectionHeader.
- SectionDivider.
- StatusBadge.
- Accordion.
- KPI-Card.

### Kundenliste

Ausschliesslich:
- Firmenname links.
- Status-Badge rechts auf derselben Zeile.
- Kontaktperson darunter.

Keine Beträge, Auftragszahlen oder sonstigen Kennzahlen.

### Angebote und Rechnungen

Zwei Zeilen:

Zeile 1:
- Dokumentnummer links.
- Status-Badge rechts.

Zeile 2:
- Firmenname und Datum links.
- Betrag rechts.

Keine zusätzliche Betragszeile.

Bei schmalen Bildschirmen vollständigen Betrag erhalten und Firmennamen kontrolliert kürzen.

### Kundendetails

Drei Tabs:
- Übersicht.
- Dokumente.
- Verlauf.

Übersicht:
- Hauptkontakt.
- Relevante Stammdaten.
- Aktive Aufträge.
- Offene Rechnungen.

Dokumente:
- Angebote.
- Rechnungen.
- Zusätzliche Dateien.

Verlauf:
- Chronologische Geschäftsereignisse.

Kundenentwicklung aus der Kundendetailseite entfernen, ohne zugrunde liegende Daten zu löschen.

## 8. Angebote, Rechnungen und Positionslisten

Verwende die freigegebene kompakte Positionsliste – Variante 1.

Jede Position:
- Verschiebegriff links.
- Positionsnummer und Bezeichnung.
- Menge × Einzelpreis als zweite Zeile.
- Gesamtbetrag rechts.
- Chevron zur Bearbeitung.

Interaktionen:
- Antippen öffnet Position bearbeiten.
- Drag & Drop ändert Reihenfolge.
- Wischen bietet Duplizieren und Löschen, mit zugänglicher Alternative im Bearbeitungsformular.
- Positionsnummern nach Verschieben aktualisieren.
- Neue Position über den vorgesehenen Erstellungszugang.

Keine Drei-Punkte-Menüs pro Position.

Keine verschachtelten Bottom Sheets.

Umfangreiche Dokumentbearbeitung als eigene Bearbeitungsansicht.

Berechnungen, Steuern, Versionierung und unveränderliche ausgestellte Dokumente erhalten.

## 9. Formular- und Bottom-Sheet-Standard

Alle Formulare verwenden dieselbe zentrale Foundation.

Bottom Sheets:
- Kompakter Header.
- Scrollbarer Inhalt.
- Keyboard-aware Footer.
- Korrekte iOS-Safe-Area.
- Keine doppelten Scrollbereiche.
- Keine verschachtelten Sheets für umfangreiche Bearbeitung.

Formulare:
- Einheitliche Feldhöhen.
- Einheitliche Rundungen.
- Einheitliche Labels.
- Einheitliche Validierung.
- Korrekte Datumsausrichtung.
- Keine verstreuten Aktionsbuttons.

### Dirty-State

Ohne tatsächliche Änderung:
- Sofort schliessen.
- Keine Verwerfungsfrage.

Mit ungespeicherten Änderungen:
- «Änderungen verwerfen?»
- «Weiter bearbeiten»
- «Verwerfen»

Nach erfolgreichem Speichern keine Verwerfungsfrage.

Ausgangsroute, Tab, Filter und Scrollposition erhalten.

## 10. Finanzen und Berichte

Vier kompakte KPI-Karten.

Prozenttrends nur aus tatsächlichen Vergleichsdaten.

Einnahmen grün, Ausgaben rot.

Finanzentwicklung:
- Horizontale Vergleichsbalken.
- Keine grossen Diagramme.
- Saldo kompakt darunter.
- Keine bedeutungslosen Balken bei fehlenden Daten.

Forderungen und Angebote als kompakte Accordions.

Berichte thematisch gruppieren.

Keine langen Erklärungen oder grossen Leerzustände.

Abschnittstitel, Trennlinien und Navigationszeilen überall einheitlich.

## 11. Zeiterfassung

Timer:
- Starten blau.
- Fortsetzen blau.
- Pause neutral.
- Stoppen rot.
- Gleiche Buttonhöhe und Rundung.

Laufende Zeit darf nicht verloren gehen.

Zeiteinträge:
- Eindeutige Status-Badges.
- Keine missverständlichen Bezeichnungen wie «Zur Prüfung», wenn nur ein Status gemeint ist.
- Klare Unterscheidung zwischen Erfasst, Eingereicht, Freigegeben und Zurückgewiesen.

Mehrfachauswahl:
- Berechtigte Zeiteinträge auswählen.
- Gemeinsam zur Prüfung einreichen.
- Berechtigte Prüfer können mehrere Einträge freigeben.
- Keine unzulässigen Statusübergänge.
- Auditierung der Freigaben.

## 12. Dokumentversionen und Versandverlauf

Versionen:
- Versionsnummer.
- Datum.
- Status.
- Tatsächlich vorhandenes PDF.

Versandverlauf:
- Kompakte chronologische Ereignisse.
- Status-Icon und kurzer Text.
- Empfänger und Datum.

Farben:
- Grün: technisch bestätigt zugestellt oder nachweislich angesehen.
- Gelb: versendet, Zustellung noch nicht bestätigt.
- Rot: nachweislich fehlgeschlagen.
- Grau: ausstehend.

Keine langen technischen Providertexte im normalen UI.

Keine Zustellung oder Lesebestätigung erfinden.

## 13. Registrierung und Konten

Firmenregistrierung:
- Firmenname.
- E-Mail.
- Passwort.
- E-Mail-Verifikation.
- Onboarding.

Ein Benutzerkonto gehört im Startmodell zu genau einem Unternehmen.

Weitere Mitarbeiter werden eingeladen.

Prüfe:
- Einladungen.
- Einladungsablauf.
- Einladung widerrufen.
- Mitarbeiter deaktivieren.
- E-Mail-Adresse ändern.
- Passwort vergessen.
- Passwort zurücksetzen.
- Passwort anzeigen.
- Registrierung fortsetzen.
- Konto- und Datenlöschung nach vorhandenen Aufbewahrungsregeln.

Keine parallelen Registrierungsprozesse entwickeln.

## 14. Identity & Security

Implementiere beziehungsweise vervollständige anhand der vorhandenen Architektur:

- E-Mail/Passwort.
- E-Mail-Verifikation.
- Passwortmanager-Unterstützung.
- Sicheres Angemeldetbleiben.
- Passkeys via WebAuthn.
- Face ID/Touch ID über Passkeys.
- Windows Hello.
- Authenticator-App mit TOTP.
- Sichere Recovery-Codes.
- Geräte- und Sitzungsverwaltung.
- Einzelne Sitzung beenden.
- Alle Sitzungen beenden.
- Erneute Authentifizierung bei kritischen Änderungen.
- Schutz gegen automatisierte Anmeldeversuche.
- Sichere Passwort- und E-Mail-Änderungen.
- Sicherheitsereignisse auditieren.

### MFA

**Admin-Portal: MFA zwingend.**

- Keine Abschaltung.
- Backendseitige Durchsetzung.
- Kein Admin-Zugriff vor abgeschlossener MFA.
- Direkte API-Zugriffe ebenfalls geschützt.

**Kundenportal:**
- MFA optional.
- Unternehmen kann MFA für Mitarbeiter verpflichtend machen.
- Bei verpflichtender MFA keine individuelle Abschaltung.

TOTP:
- Einrichtungsschlüssel sicher erzeugen.
- QR-Code für Authenticator-App.
- Manuelle Eingabe als Alternative.
- Aktivierung erst nach erfolgreicher Codeprüfung.
- Recovery-Codes sicher verwalten.

Keine MFA-Umgehung durch Recovery oder alternative Loginpfade.

Vor der Implementierung den vorhandenen Identity-Provider prüfen und technische Einschränkungen dokumentieren.

## 15. Benachrichtigungen

Prüfe und vervollständige:

- In-App-Benachrichtigungen.
- Push für Browser/PWA.
- E-Mail-Benachrichtigungen.
- Persönliche Benachrichtigungseinstellungen.
- Gelesen/ungelesen.
- Direkte Navigation zum betreffenden Vorgang.
- Sicherheitswarnungen.
- Supportantworten.
- Angebotsentscheidungen.
- Rechnungsereignisse.
- Zeit- und Spesenfreigaben.

Push nur nach gültiger Berechtigung.

Keine sensiblen Informationen unnötig auf Sperrbildschirmen anzeigen.

Benachrichtigungen müssen idempotent und mandantensicher verarbeitet werden.

## 16. Vollständige Mehrsprachigkeit

Unterstützte Sprachen:

- Deutsch: `de-CH`
- Französisch: `fr-CH`
- Italienisch: `it-CH`
- Englisch: `en`
- Türkisch: `tr`

### Zentrale Regeln

Verwende das vorhandene Internationalisierungssystem.

Keine zweite Übersetzungsarchitektur entwickeln.

Alle UI-Texte müssen über zentrale Übersetzungsschlüssel verfügbar sein.

Keine neuen hartcodierten UI-Texte.

Prüfe vollständig:

- Landingpage.
- Registrierung.
- Anmeldung.
- Passwort-Reset.
- E-Mail-Verifikation.
- Onboarding.
- Kunden-App.
- Admin-App.
- Navigation.
- Header.
- Menüs.
- Bottom Sheets.
- Formulare.
- Validierungen.
- Statusanzeigen.
- Finanzkennzahlen.
- Angebote.
- Rechnungen.
- Zeiterfassung.
- Spesen.
- Support.
- Sicherheit.
- MFA.
- Passkeys.
- Benachrichtigungen.
- E-Mail-Vorlagen.
- Vorhandene Dokumentvorlagen.

### Übersetzungsqualität

Übersetze fachlich korrekt und natürlich, nicht mechanisch Wort für Wort.

Verwende in allen fünf Sprachen konsistente Fachbegriffe.

Besonders prüfen:
- Angebot.
- Rechnung.
- Auftrag.
- Projekt.
- Zeiteintrag.
- Spese.
- Forderung.
- Zahlung.
- Freigabe.
- Einreichen.
- Entwurf.
- Versendet.
- Zugestellt.
- Angesehen.
- Überfällig.
- Abgelehnt.

Gleiche fachliche Zustände müssen überall dieselbe Übersetzung verwenden.

Keine Vermischung verschiedener Sprachen innerhalb einer Ansicht.

Keine fehlenden Übersetzungsschlüssel.

Keine sichtbaren technischen Schlüssel.

Keine unnötigen englischen Fallbacks in französischen, italienischen oder türkischen Ansichten.

### Lokalisierung

Verwende die korrekten Locale-Regeln für:

- Datum.
- Uhrzeit.
- Zahlen.
- Dezimaltrennzeichen.
- Tausendertrennzeichen.
- Währung.
- Prozentwerte.
- Relative Zeitangaben.

Schweizer Geschäftsdaten und QR-Rechnungsregeln bleiben fachlich korrekt.

Türkische Sonderzeichen und Gross-/Kleinschreibung müssen funktionieren.

### Layout

Prüfe längere Übersetzungen auf:

- Abgeschnittene Buttons.
- Überlaufende Tabs.
- Zu schmale Dropdowns.
- Mehrzeilige Navigationslabels.
- Abgeschnittene Status-Badges.
- Überlaufende Tabellen.
- Zu schmale Bottom Sheets.
- Überlappende Icons.

Keine Schrift künstlich verkleinern, nur damit ein Text passt.

Responsive Layouts müssen sich an die tatsächliche Textlänge anpassen.

### Sprachwahl

Eine zentrale rahmenlose Sprachauswahl:

`DE ˅`, `FR ˅`, `IT ˅`, `EN ˅`, `TR ˅`

Chevron unmittelbar neben dem Sprachcode.

Dropdownbreite ungefähr 180–200 px.

Alle fünf Sprachen vollständig sichtbar.

Keine abgeschnittenen Optionen.

Spracheinstellung sicher speichern und wiederherstellen.

### Rechtliche Dokumente

Rechtliche Seiten innerhalb der App anzeigen.

Öffentliche Rechtsseiten bleiben ohne Anmeldung erreichbar.

Freigegebene rechtliche Dokumentversionen zentral verwalten.

Keine ungeprüften rechtlichen Übersetzungen als verbindlich veröffentlichen.

## 17. Mobile, Tablet, Desktop und PWA

Prüfe repräsentative Viewports:

320, 360, 390, 430, 768, 1024 und 1440 px.

Zusätzlich:
- iPhone Safari.
- Installierte