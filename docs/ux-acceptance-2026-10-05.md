# Binso One – produktive UX-/UI-Abnahme, 5. Oktober 2026

## Testbasis und Grenzen

Geprüft wurde ausschliesslich die tatsächlich gerenderte Anwendung unter der bestehenden Azure-Produktivadresse. Ausgangsstand: `6981f7336d9f592c16ebc4a350ab444acd65e6a7`. Keine Domain-, DNS- oder Azure-Hostname-Änderungen.

Browser: Cloud Chrome, CSS-Viewport 1363 × 936 px. DOM, Accessibility-Struktur, Screenshots und UI-Interaktionen wurden ausgewertet. Der Browser stellt hier keine API zur Viewport-/Geräteemulation bereit. Browserzoom änderte den gemessenen Viewport nicht. Mobile, Tablet, Safari und installierte PWA wurden deshalb NICHT als gerendert geprüft oder bestanden markiert. Codeprüfung von Breakpoints/Safe Areas ersetzt keinen Gerätetest.

Die Demo wurde ohne Login gestartet. Ein synthetisches Testprodukt `UX Abnahme Testleistung 05.10.2026` (CHF 125.50) wurde in der isolierten Datenbank-Demo angelegt und nach der Speicherung in der Liste bestätigt. Der Timer wurde gestartet und gestoppt. Keine echten Zahlungen, kein produktiver Kundenaccount und keine Kundendaten wurden angelegt oder verändert.

## Zusammenhängend automatisch im Produktivbrowser geprüft

- Landingpage, Datenschutzauswahl „Nur notwendige“, FAQ öffnen und wechseln.
- Demo-Einstieg, Pflichtfeldfehler, Einrichtung mit synthetischem Namen/Firma, Dashboard.
- Dashboard: aktueller Monat Oktober; Auswahl September aktualisiert die Kennzahlen.
- Kunden: geladene Liste, Suche ohne Treffer, Zurücksetzen, Acme-Detail, Angebot aus Kundendetail öffnen.
- Angebote: Liste, Neuformular, Kundenauswahl, Positionseditor, Live-Vorschau und sichtbare Speicheraktionen.
- Rechnungen: Liste, Statusfilter „Offen“, Detail RE-2026-020, Vorschau, zweites Zahlungsblatt. Die geladene Vorschau kennzeichnet Demo-Rechnung und Beispiel-Zahlteil mit „Nicht bezahlen“.
- Zahlungen: Liste und Erfassungsformular mit der offenen Rechnung. Keine Zahlungsbuchung durchgeführt.
- Produkte: Liste, Formular, Testprodukt gespeichert und Persistenz in Liste bestätigt.
- Zeiterfassung: vorhandene Einträge, Timer starten und stoppen.
- Mitarbeiter, Spesen und Support: geladene Listen und Navigation.
- Benachrichtigungen: Headerdialog, Link zur vollständigen Seite und Ladezustand.
- Einstellungen, Sicherheit, Abonnement, Kontomenü, Logout bis zur Loginseite.
- Demo-Abonnement: Live-Zahlungen deaktiviert; Aboverwaltung deaktiviert; Demo ist erkennbar.
- Preise → Business/Jahr → Registrierung: CHF 690/Jahr wird übernommen; keine Kreditkarte nötig; Rechtslinks und Passwortanforderungen sichtbar.
- Registrierung abbrechen nach Firmenname-Eingabe: ursprünglicher Datenverlust ohne Bestätigung reproduziert.

Dies ist keine vollständige CRUD-, Berechtigungs-, Accessibility- oder Authentifizierungsabnahme. Eine sichtbare Liste bestätigt nicht alle Schreib-/Fehlerpfade eines Moduls.

## Fehlerregister

Prioritäten: P1 = blockiert einen Hauptablauf oder zeigt fachlich falsche Ergebnisse; P2 = erheblicher UX-/Darstellungsfehler; P3 = kleinere Unklarheit. „Korrigiert“ bezeichnet zunächst die Codeänderung; Produktiv-Retest und Deploy-Ergebnis werden separat dokumentiert.

| ID | Seite | Bildschirmgrösse | Problem | Gewünschtes Verhalten | Priorität | Korrektur / Restpunkt |
| --- | --- | --- | --- | --- | --- | --- |
| UX-01 | Landingpage | 1363 × 936 | 180 × 326 px Bild auf ca. 611 px Breite vergrössert; stark unscharf und zugeschnitten | Scharfer echter Screenshot mit korrektem Seitenverhältnis | P2 | Aktueller Screenshot aus produktiver Demo, ohne erfundene Geräteansicht; natürliche Bildhöhe |
| UX-02 | Landingpage FAQ | 1363 × 936 | Zwei Antworten gleichzeitig offen | Nur die zuletzt geöffnete Antwort offen halten | P2 | Gemeinsamer Accordion-Controller; funktioniert auch ohne Unterstützung von `details.name` |
| UX-03 | Demo → Kunden | 1363 × 936 | SPA-Navigation führt trotz Demo-Sitzung zur Loginseite; vollständige Navigation funktioniert | Demo bleibt ohne Login durchgehend bedienbar | P1 | Sitzungswechsel verwirft anonym vorab geladene Routendaten durch Dokumentnavigation; ebenso Login, Bestätigung und Logout |
| UX-04 | Demo-Einstieg | 1363 × 936 | Zwei Schritte und Pflichtangaben vor dem Ausprobieren | Sofortiger Einstieg; Personalisierung optional | P2 | Direktstart mit synthetischen Vorgaben; Personalisierung optional |
| UX-05 | Angebot/Rechnung erstellen | 1363 × 936 | Speicheraktion nur in unsichtbarer Mobile-Leiste; kein sichtbarer Desktop-Abschluss | Erstellen/Speichern in Desktop-Kopfzeile | P1 | Primäre Kopfaktion, deaktiviert während Speichern/Laden |
| UX-06 | Dokument-Positionseditor | 1363 × 936 | Mobile-Zusammenfassung wird zusätzlich zu Inlinefeldern gerendert; Felder verschoben/abgeschnitten | Desktop-Tabellenfelder sauber ausrichten; Mobile-Summary nur mobile | P1 | Desktop-Grundregeln und passende Spaltenbreiten ergänzt |
| UX-07 | Rechnungen / Offen | 1363 × 936 | Unbezahlte gesendete Rechnung RE-2026-020 verschwindet im Filter „Offen“ | Gesendete, teilweise bezahlte und überfällige Rechnungen im offenen Bestand | P1 | Explizite Statusgruppen, Teilzahlungsstatus übersetzt |
| UX-08 | Hauptlisten | 1363 × 936 | Während Requests erscheint „Keine Treffer“/0 Einträge; API-Fehler können wie leere Daten aussehen | Lade-, Fehler- und echte Leerzustände unterscheiden | P2 | Kunden/Produkte/Mitarbeiter/Spesen/Zahlungen/Angebote/Rechnungen erhalten Requeststatus; kompakte Leerzeile |
| UX-09 | Dokument erstellen | 1363 × 936 | Während Kundenladung erscheint „Zuerst einen Kunden erfassen“, obwohl Kunden vorhanden sind | Kundendaten laden, dann erst Leerzustand oder Fehler anzeigen | P2 | Kundenlade-/Fehlerstatus und deaktivierte Speicheraktion |
| UX-10 | Dashboard / Letzte | 1363 × 936 | Alte Rechnungen/Zahlungen von 2025 erscheinen trotz Daten aus Oktober 2026 als letzte Einträge | Nach Beleg-/Zahlungsdatum absteigend und deterministisch sortieren | P2 | API-Sortierung nach issue_date bzw. paid_on; erlaubte SQL-Sortierspalten ausdrücklich begrenzt |
| UX-11 | Registrierung | 1363 × 936 | Abbrechen verwirft eingetragenen Firmennamen ohne Bestätigung | Bei vorhandenen Eingaben Abbruch bestätigen | P2 | Bestehenden Bestätigungsdialog eingebunden |
| UX-12 | Demo / Sicherheit | 1363 × 936 | Authenticator als verpflichtend und Produktfunktionen als gesperrt beschrieben, obwohl Demo ohne Login läuft | Demo-spezifischer Hinweis; echte MFA-Regeln bleiben bestehen | P2 | Demo ausdrücklich vom produktiven MFA-Hinweis unterschieden |
| UX-13 | Landingpage Footer | 1363 × 936 | „Sicherheit“-Link und fehlender Copyright-Link/Socials entsprechen nicht den bekannten Gestaltungswünschen | Footer final mit gültigen Profil-URLs und Copyright-Link abstimmen | P3 | Sicherheit entfernt, Copyright verlinkt, gültiges LinkedIn-Profil ergänzt; Instagram/XING benötigen bestätigte Profil-URLs |
| UX-14 | Supportliste | 1363 × 936 | Vollständige technische UUID als Ticketnummer vor dem Betreff | Lesbare Fallnummer statt UUID | P2 | Vorhandene case_number verwenden; ohne Nummer Betreff anzeigen, UUID nur als Routing-ID |
| UX-15 | Demo / Einstellungen Abonnement | 1363 × 936 | „noch 1 Tage“, Testphasenstatus in Demo | Korrekte Einzahl und eindeutiger Demo-Status | P3 | Einzahl korrigiert, Demo-spezifischer Hinweis |

| UX-16 | Kundenportal / Erstellen, Suche, Konto; Admin / Konto | 1363 × 936 | Dialog am Bildschirmboden mit mobilem Ziehgriff (Erstellen: y=433,6 bis 936 px) | Desktop: zentrierter Dialog ohne Ziehgriff; mobile Darstellung eigenständig | P2 | Gemeinsame Desktop-Dialogregeln ab 761 px; Tastaturfokus, Escape und Fokusrückgabe für Shell-/Admin-Kontodialog |
| UX-17 | Admin-Navigation | 1363 × 936 | Feste Ticketzahl 12 trotz nur vier Demo-Tickets; aktive Seite kaum unterscheidbar | Keine erfundene Kennzahl, klarer aktiver Navigationspunkt | P2 | Feste Zahl entfernt; aria-current und sichtbare Hervorhebung |
| UX-18 | Admin / Dashboard und Detailkopf | 1363 × 936 / Codeprüfung | Demo nicht sichtbar gekennzeichnet; Kundendetailkopf fest Acme AG, Ticketkopf zeigt Routing-ID | Demo sichtbar, neutraler Detailkopf bis echte Daten vorliegen | P2 | Demo-Badge, Kundendetails/Ticketdetails statt falschem Namen/UUID |
| UX-19 | Admin-Tabellen und Konversationen | 1363 × 936 | Tabellen-/Beschreibungstext überwiegend 10–11 px; feste Spalten können lange Inhalte verdrängen | Gut lesbare Desktoptexte und begrenzte flexible Spalten | P2 | Zeilen 13 px, Unterzeilen 12 px, minmax-Spalten, Umbruch, Toolbar-Wrapping |
| UX-20 | Kundenportal / Header | 1363 × 936 / Codeprüfung | Laufender Timer nur im mobilen Header sichtbar | Desktop: Status und direkter Zugang zur Zeiterfassung | P2 | Kompakter Timer-Link im Desktop-Header |

Zusätzliche Codehärtung: Kein automatischer Wechsel von fehlgeschlagener produktiver Anmeldung zu Demo; Login-Rücksprung akzeptiert keine protokollrelativen externen URLs.

## Muss manuell auf echtem Gerät bestätigt werden

- iPhone 17 Pro Max: Safari und vom Home-Bildschirm gestartete PWA, Hoch-/Querformat, Hell/Dunkel.
- Safe Areas/Notch/Home-Indikator, Scroll-Header, Bottom-Pill, Hamburger/X und vollständige Overlay-Abdeckung.
- Tastatur: E-Mail/Passwort/OTP, Zahlen/Mengen/Preis/Datum, Fokus, Safari-Autozoom, Scrollen zu verdeckten Feldern.
- Tablet: Hoch-/Querformat und Übergänge bei 767/768 sowie weiteren definierten Breakpoints.
- Touchziele, horizontale Overflows, lange Firmen-/Personennamen, Positionseditor, Tabellen/Detailseiten.
- VoiceOver, Fokusreihenfolge und Fokusbegrenzung in Dialogen, Escape/Zurück, Kontrastmessung in allen Themen.
- PWA-Installation, Offlinezustand, Service-Worker-Update und Wiederanmeldung.

## Noch erforderlicher echter Kundenweg

Registrierung mit kontrollierter empfangsfähiger Testmailbox, ausdrückliche Annahme der Bedingungen, E-Mail-Zustellung/Bestätigung, erneuter Codeversand, Login, E-Mail-MFA, Authenticator-Einrichtung/Bestätigung, Recovery Codes, echte Konto-/Tenanttrennung und Logout/Login. Keine Passwörter oder Einmalcodes im Chat mitteilen. Eine echte Registrierung mit Vertragsannahme und neue Authenticator-Zugangsdaten werden vom Kontoinhaber über den sicheren Browserablauf abgeschlossen.

## Technische Validierung

Alle zehn angeforderten pnpm-Befehle werden auf dem finalen Änderungsstand ausgeführt. Lokale Ergebnisprotokolle und GitHub Quality/Deploy müssen separat erfolgreich sein. Ein grüner Build ersetzt keine vollständige UX-Abnahme. Ein erfolgreicher Deploy allein bestätigt weder echte E-Mail-Zustellung noch Safari/PWA-Verhalten.

## Erweiterte Desktop-Abnahme für Kunden- und Adminportal

Desktop wird als Arbeitsoberfläche mit persistenter Navigation, direkter Suche, sichtbaren Hauptaktionen und Inline-Positionseditor geprüft. Mobile Navigation und Bottom Sheets werden nicht als verpflichtendes Desktop-Bedienmuster übernommen. Admin-Demo ist eine tatsächlich produktiv gerenderte, isolierte Beispielansicht; sie bestätigt nicht die Daten und Berechtigungen einer echten Microsoft-Operator-Sitzung. Admin-Demo-Einstieg wechselt nach Sitzungsanlage vollständig zur Anwendung und verändert keine Kunden-Demo-Markierung im Local Storage.
