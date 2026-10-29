BINSO ONE – MASTER V8
Global Simple UX & Workflow – verbindlicher Work-Implementierungsprompt
Ziel: Sämtliche Module, Unterseiten, Formulare, Geschäftsabläufe und das Admin-Portal nach einem einzigen, einfachen und konsistenten UX- und Fachkonzept gestalten. V8 ergänzt V7.1; bei Widersprüchen gilt die jüngste ausdrückliche Nutzerentscheidung. Bestehende Geschäftslogik und Sicherheit erhalten.

1. Arbeitsauftrag
Prüfe den aktuellen Repository-Stand, AGENTS.md, Dokumentation, Routen, Komponenten, Datenmodelle, API-Verträge, Rollen, Tests und Deployment-Konfiguration. Erstelle zunächst eine vollständige Ist-Soll-Matrix je Modul, Seite, Feld, Aktion und Rolle: vorhanden / teilweise / fehlend / blockiert. Implementiere nachweisliche Lücken zentral, ohne parallele Komponenten, zweite Geschäftslogik oder lokale CSS-Patches. Keine produktiven Migrationen, Pushes, Merges oder Deployments ohne ausdrückliche Freigabe. Keine Platzhalter als fertig deklarieren.

2. Grundprinzip
Einfach erfassen → automatisch ergänzen → bei Bedarf erweitern → sicher abschliessen.

Standardformular: nur die jetzt wirklich notwendigen Angaben.
„Weitere Angaben“: optionale Felder, nur bei Bedarf sichtbar.
„Unternehmenseinstellungen“: dauerhafte Standardwerte, Freigaben, Steuer-/Dokumentregeln einmal zentral pflegen.
Pflichtangaben nach Phase unterscheiden: Entwurf, Aktivierung, Freigabe, Ausstellung, Buchung. Rechtliche Anforderungen nicht entfernen.
Bestehende Kunden-/Auftragsdaten übernehmen; Zuordnung vor verbindlichen Aktionen anzeigen.
Nach Erstellung Datensatzdetails öffnen; keine unnötigen Bestätigungen oder Zwischenseiten.
3. Navigation und Hierarchie
Hauptnavigation unverändert: Übersicht · Kunden · Aufträge · Zeit · Mehr. Bestehende Bottom-Navigation und der blaue Floating-Plus-Button bleiben in Design und Position erhalten. Globales Plus öffnet „Neu erstellen“ mit berechtigten Aktionen; Fachlisten-Plus bleibt kontextspezifisch.

Übersicht: Aufgaben, wenige relevante Kennzahlen, kompakter Einrichtungsstatus.
Kunden: Kundenliste → Kunde → Kunden-Zentrale mit kompakten Zeilen für Aufträge, Angebote, Rechnungen, Zahlungen, Kontakte, Dateien, Verlauf und Stammdaten. Jeder Bereich öffnet eine auf diesen Kunden gefilterte Fachliste. Keine separaten Datenkopien.
Aufträge: globale Liste → Auftrag → Planung, Mitarbeiter, Zeiterfassung, Kosten, Abrechnung, Dateien (nur soweit fachlich relevant).
Zeit: Timer, Einträge, rollenabhängige Freigaben.
Mehr / Geschäft: Angebote, Rechnungen, Zahlungen, Ausgaben/Spesen, Finanzübersicht.
Mehr / Auswertung: Berichte.
Mehr / Verwaltung: Unternehmen, Mitarbeiter/Berechtigungen, Unternehmenseinstellungen, Abonnement.
Mehr / Hilfe: Support, Hilfe/Informationen.
Avatar: ausschliesslich persönliche Daten, Sicherheit, Benachrichtigungen, Darstellung, Sprache, Datenschutz, Geräte/Sitzungen, Abmelden. Keine doppelten Firmen-Einstellungen.
Bei jedem Rückweg den tatsächlichen Aufrufer, Kunden-/Auftragsfilter, Tab und sinnvolle Scrollposition bewahren. X, Escape, Abbrechen und Speichern prüfen. Verwerfungswarnung nur bei tatsächlicher Änderung. Deep Links ohne Aufrufer erhalten sinnvollen Fallback.

4. Exakter visueller Referenzstandard
Die freigegebenen interaktiven Chat-Ansichten sind die Referenz: kompakte, klar getrennte Zeilen mit feinen Trennlinien, links Icon/Titel, rechts Wert/Status/Chevron. Zentrale Komponenten für PageHeader, PageDescription, SectionHeader, NavigationRow, ListRow, DetailRow, Divider, StatusBadge, Search, Filter, BottomSheet, FormField, ActionFooter und DocumentPositionRow wiederverwenden.

Element	Referenz
Schrift	Inter
Seitentitel	18 px, 600
Abschnittstitel	14 px, 600
Zeilentext	14 px, 400–500
Sekundärtext	12 px
Zeilenhöhe	mindestens 48 px, zweizeilig nach Inhalt
Zeilenpadding	8 px vertikal
Icon / Chevron	18 / 16 px
Icon-Text-Abstand	12 px
Mobile Seitenrand	16 px
Kartenradius / Formfeldradius	16 / 12 px
Eingabeschrift Mobile	mindestens 16 px (iOS-Fokuszoom)
Trennlinien	1 px, dezente Theme-Farbe, identische Ausrichtung
Touchflächen	mindestens 44 × 44 px
Leere Zustände	maximal zwei kurze Zeilen
Bestehende zentrale Tokens prüfen statt blind überschreiben. Keine übergrossen Einzelkarten oder doppelte Rahmen. Chevron rechts = Navigation, unten = Aufklappen, Plus = Erstellen. Ganze Seiten für längere Erfassungen/Details; Bottom Sheets für kurze Auswahl/Filter/Aktionen, keyboard- und Safe-Area-kompatibel. Keine verschachtelten Sheets. Mobile/Tablet/Desktop und Light/Dark einheitlich.

5. Vereinfachung sämtlicher Module
Modul	Einfacher Standardablauf	Erweiterungen / Prüfungen
Registrierung	Firma, E-Mail, Passwort → Mail bestätigen	Mitarbeiter über Einladung, sichere Wiederherstellung
Firmeneinrichtung	Eine ganze Seite: Firma, Adresse, Zahlungskonto → abschliessen	Bestehende Daten übernehmen; QR-IBAN, MwSt.-Defaults, Zahlungsfristen und Dokumenttexte in Einstellungen
Kunden	Firmenname, Kontaktperson → speichern	Adresse, UID, weitere Kontakte; Kundenliste: Firmenname links, Status rechts, Kontaktperson darunter; keine Zahlen
Kontakte	Name und nötige Kontaktangabe → speichern	Funktion, Hauptkontakt, weitere Kanäle; Zeile führt zu Kontaktdetails
Angebote	Kunde → Abrechnungsart → Positionen → Entwurf	Gültigkeit, Rabatte, Versionen, Versand; kompakte Positionsliste mit Drag-Handle, Tippen zum Bearbeiten, Duplizieren/Löschen
Aufträge	Kunde/Intern → Bezeichnung → Abrechnungsmodell → Entwurf	Team, Planung, Stunden-/Kostenbudget, Meilensteine, Verantwortliche
Zeit	Kunde/Intern + Auftrag vor Timerstart → Start/Stop oder manuell	Einheitlicher durchsuchbarer Picker für Kunde und Auftrag; Sammel-Einreichung/-Freigabe
Rechnungen	Kunde → Leistungen übernehmen → prüfen → Entwurf/ausstellen	Direktrechnung ohne Auftrag, QR-Rechnung, Teil-/Akonto-/Schlussrechnung, Gutschrift
Zahlungen	Ausgestellte Rechnung → Betrag/Datum → verbuchen	Teilzahlung, Differenzen, Rückerstattung, Überzahlungsschutz
Spesen	Beleg fotografieren/hochladen oder manuell → Betrag/Datum/Kategorie prüfen → speichern	OCR nur bei echter Integration; unsichere Erkennung bestätigen; Erstattung, MwSt., Kunde/Auftrag, Weiterverrechnung
Ausgaben	Betrag, Datum, Kategorie → speichern	Lieferant, Beleg, Steuer, Zuordnung
Support	Betreff + Beschreibung → Ticket → Ticketdetails → Chat	Anhänge, Status/Priorität, keyboard-aware Chat
Mitarbeiter	E-Mail + Rolle → Einladung	Teams, Rechte, Widerruf/Deaktivierung
Berichte	Bericht wählen → Zeitraum → Ergebnis	Filter, Export; keine lange Mischung aller Berichte
Finanzen	Umsatz, Zahlungseingänge, Ausgaben, Forderungen	Direkte Links zu Fachlisten, keine vermischte Auftragsverwaltung
Einstellungen	Persönlich via Avatar, Firma via Mehr	Toggles für binäre Einstellungen, keine technischen Backendtexte
Admin-Portal	Aufgabenorientierte Governance	MFA zwingend, Audit, sichere Overrides, Rollen-/Mandantenkontrolle
6. Einheitliche Abrechnungsmodelle
Angebote, Aufträge und Rechnungen nutzen dieselben Regeln:

Pauschal/Fixpreis: vereinbarter Betrag; intern erfasste Stunden nicht automatisch zusätzlich fakturieren.
Nach Aufwand: freigegebene, noch nicht abgerechnete Zeiten/Leistungen.
Nach Menge: Stück, Tage, Meter und andere Einheiten.
Gemischt: Pauschale, Zusatzaufwand und Mengen getrennt, keine Doppelabrechnung.
Wiederkehrend: vereinbarte Periode und Leistung, keine unkontrollierte automatische Ausstellung.
Nach Meilensteinen: definierte Etappen und Teilbeträge.
Akonto, Teilrechnung, Schlussrechnung und Gutschrift sind Rechnungs-/Korrekturverfahren, keine zusätzlichen Preislogiken. Angebot und Auftrag dürfen für einfache Direktrechnungen optional sein. Finale Dokument-/Preis-/Steuersnapshots erhalten.

7. Durchgängige Prozesse und Datenhoheit
Kunde führt Stammdaten/Kontakte; Angebot Konditionen/Versionen; Auftrag Leistung/Team/Planung/Budget; Zeit Erfassung/Freigabe; Rechnung Forderung/Positionen; Zahlung Buchung; Spesen/Ausgaben Kosten/Erstattung.
Kunden- und Auftragsansichten zeigen gefilterte Sichten derselben führenden Datensätze.
Freigabe- und Abrechnungsstatus von Zeiten getrennt halten. Berechtigte Mehrfach-Einreichung/-Freigabe, firmenweite Freigaberegeln, serverseitige Übergänge.
Doppelte Zeitabrechnung transaktional verhindern; Reservierungen bei verworfenen Entwürfen sicher lösen. Storno/Gutschrift historisch nachvollziehbar.
Timer anhand persistierter Zeitpunkte/Pausen; kein Verlust bei Navigation, Reload, PWA-Neustart, Netzunterbruch. Konkurrierende Starts/Stops absichern.
Auftrag direkt oder aus angenommenem Angebot erstellen; Rechnung kann mehrere Leistungen/Zeiten, Auftrag mehrere Rechnungen und Rechnung mehrere Zahlungen haben.
Budget nicht gesetzt ist nicht 0; Kosten, Umsatz und Marge korrekt, Personalkosten rollenbasiert schützen.
8. Sicherheit, Anmeldung, Benachrichtigungen
E-Mail/Passwort mit Verifikation, Passwortmanager/Autofill, sichere Sitzungen, Abmelden, Passwort-Reset, Passkeys via WebAuthn für Face ID/Touch ID/Windows Hello, TOTP-Authenticator mit QR-Code und Recovery-Codes soweit sicher mit bestehender Identity-Architektur integrierbar. TOTP nicht mit Push-Number-Matching verwechseln. Kunden-MFA optional bzw. durch Firmenadministrator verpflichtend; Admin-Portal-MFA immer serverseitig zwingend. In-App-, E-Mail- und erlaubte Web-Push-Benachrichtigungen mit Präferenzen und Deep Links. Keine unbewiesenen Zustell-/Lesebestätigungen. Mandantentrennung/RLS, Rollenprüfung, Audit, CSRF-/Rate-Limit-Schutz und sichere PWA-Caches.

9. Fünf Sprachen
Sämtliche neuen und geänderten UI-Texte, Status, Validierungen und unterstützten Vorlagen in de-CH, fr-CH, it-CH, en, tr. Marktübliche Fachbegriffe, keine sichtbaren Translation Keys, keine hartcodierten UI-Texte. Locale-gerechte Zahlen, Zeiten, Daten, Währungen und Prozente; lange Texte und türkische Sonderzeichen. Sprachwahl rahmenlos mit Sprachcode und korrekt positioniertem Chevron; Dropdown nicht abschneiden. Rechtliche Übersetzungen nur nach fachlicher Freigabe verbindlich veröffentlichen.

10. Vollständiger technischer Qualitätsaudit
Prüfe gesamte Ablage und Codebasis: Ordner, Dateien, Imports, Duplikate, Assets/Bilder/Logos/Icons, CSS-Kaskade, Design-Tokens, Hardcodierungen (Farben, Texte, Rollen, Status, Routen, Preise, Fristen, URLs), Frontend/Backend, TypeScript, API-Verträge, Validierungen, Fehlerbehandlung, Performance, Caching, Race Conditions, N+1, Accessibility, Logging, alle Datenbanktabellen und Felder, Relationen, Indizes, Constraints, Migrationen, RLS-Policies, Tenant-Sicherheit, externe Schnittstellen, E-Mail, PDF/QR, Zahlungen, Storage, Webhooks, Secret-Handling, Node/pnpm/Lockfile, Build, Tests, Abhängigkeiten, GitHub Actions, Azure und Dokumentation. Begründete Konstanten nicht blind entfernen. Sichere, belegte Fehler zentral korrigieren; riskante oder destruktive Schema-/Auth-/Billing-Änderungen gesondert freigeben lassen.

11. Abnahme und End-to-End-Tests
Prüfe 320/375/390/430 px Mobile, 768/820 px Tablet, 1024/1440 px Desktop; Light/Dark, Tastatur, Safe Areas, Tastaturbedienung, lange Übersetzungen, 200%-Zoom. Echte installierte iOS-PWA-Tests nur als durchgeführt melden, wenn tatsächlich erfolgt.

Pflichtpfade:

Registrierung → E-Mail-Bestätigung → Firmeneinrichtung auf einer Seite → Übersicht.
Kunde → Kunden-Zentrale → Angebot → Auftrag → Zeit → Freigabe → Rechnung → Teil-/Vollzahlung.
Kunde → Direktrechnung ohne Angebot/Auftrag → Zahlung.
Interner Auftrag → nicht verrechenbare Zeit → Bericht.
Angenommenes Angebot → Auftrag ohne doppelte Datenübernahme.
Auftrag → Team/Planung/Budget → Zeiten/Kosten → Teilrechnung.
Spesenbeleg → Foto/Upload oder manuell → Freigabe/Erstattung/Weiterverrechnung.
Supportliste → Ticketdetails → Chat → zurück zum Ticket.
Mitarbeiter einladen → Rechte prüfen → Zugriff entziehen.
Sicherheit/Passkey/MFA/Sitzungen → Abmelden → kein Zugriff auf private Daten.
Kundenfilter/Tab/Scrollposition und Deep-Link-Rückweg.
Negative Fälle: fremder Mandant, falsche Rolle, doppelte Abrechnung, konkurrierende Aktionen, Netzfehler, Sessionablauf.
12. Umsetzungspakete und Übergabe
A – Inventur: vollständige Routen-/Feld-/Datenquellen-/Rollenmatrix und Risiken.

B – Foundation: Navigation, Rückweg, gemeinsame Listen/Trennlinien, Formulare, Picker, Bottom Sheets, Aktionen.

C – Kernprozesse: Firmeneinrichtung, Kunden, Angebote, Aufträge, Zeit, Rechnungen, Zahlungen.

D – Weitere Module: Spesen, Ausgaben, Support, Mitarbeiter, Berichte, Finanzen, Einstellungen, Admin.

E – Technik und Übersetzungen: belegte Architektur-/Code-/DB-/API-/Buildabweichungen sicher korrigieren; fünf Sprachen.

F – QA: gezielte Tests während Umsetzung, vollständige Pflichtprüfungen auf finalem SHA (pnpm lint, pnpm typecheck, pnpm build sowie vorhandene Sicherheits-/DB-/Browser-Gates). Keine Tests deaktivieren, keine endlosen unveränderten Wiederholungsläufe.

Abschlussbericht mit Ist-Soll-Status je Modul, geänderten Dateien, Datenbank-/API-Auswirkungen, Testnachweisen, echten Browser-Screenshots, bekannten Einschränkungen, offenen Risiken und finalem Git-Status/Commit-SHA. Keine produktive Migration, kein Push, Merge oder Azure-Deployment ohne ausdrückliche Freigabe.

⋮⋮⋮⋮⋮⋮⋮⋮
