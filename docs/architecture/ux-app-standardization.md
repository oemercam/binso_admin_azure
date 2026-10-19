# App-Standardisierung – freigegebener Gesamtumfang, 19.10.2026

Diese Entscheidung ergänzt die unveränderten Microsoft-Referenzen vom 15.10.
und ersetzt nur ausdrücklich widersprechende historische Darstellungsverträge.
Neue Screens bleiben abgeleitet. Kein Produktivdeployment und keine produktive
Migration sind durch diesen Implementierungsauftrag freigegeben.

## Abnahmepakete

- [ ] Rollen plus explizite Mitarbeiter-/Kunden-/Auftragszuordnung: API, Server,
  Datenbank, Such-/Auswahllisten, Dateien und Rapporte; keine Rechte durch IDs.
- [ ] Eigene Zeiten/Spesen; separate Freigaberechte, keine Selbstfreigabe;
  nachvollziehbare Änderungen, Entzug, aktive Zeitmessungen und Bestandsdaten.
- [ ] Einzelzeit und Monatsrapport mit Gesamtstunden und unterschriebenem
  Nachweis; Einreichen/Prüfen, Sperren und Schutz vor doppelter Verrechnung.
- [ ] Benutzeroberfläche verwendet Auftrag statt Projekt; interne IDs bleiben.
- [ ] Gemeinsame Listentrennung, erkennbare Abschnittstitel, Status-Badges,
  kompakte Kontakte/Dokumente/Spesen und kontextbezogene Aktionsmenüs.
- [ ] Statusfilter im Filter-Sheet, keine Status-Tab-Leisten; aktive Filter
  entfernbar, fachliche Tabs bleiben; Auswahlfelder und Feldabstände gemeinsam.
- [ ] Mobiler blauer Plus-Button unten rechts oberhalb Navigation/Safe Area;
  Desktop beschriftet. Nicht während Erfassung, Dialog, Tastatur oder Chat.
- [ ] Erfassung: X und Abbrechen, kein zusätzlicher Header-Zurück-Pfeil;
  Nachfrage nur bei ungespeicherten Änderungen. X blau und gut bedienbar.
- [ ] Strasse/Hausnummer getrennt ohne geratenes Zerlegen bestehender Adressen;
  neue Kunden aktiv, Statusänderung später kontrolliert anbieten.
- [ ] Einstellungen: klare Texte, keine redundante mobile Bereichsnavigation,
  zentrale Feld-/Statusmuster und Wiederherstellung der Position beim Zurückgehen.
- [ ] Rechnung/Angebot: kurzer Header, vollständige kopierbare Referenz im Inhalt,
  Positionen/Status/Beträge zuerst, PDF separat, Stammdaten verknüpft statt doppelt.
  Dateianhang per beschriftetem zugänglichem Plus; Korrektur/Storno im Aktionsmenü.
- [ ] Übersicht rollenabhängig: eigene Arbeit, Handlungsbedarf, wenige echte
  Finanzkennzahlen; Rechnung/Zahlung/Ausgabe/Saldo nicht mit Kontostand verwechseln.
- [ ] Analyse: Zeitraum, exakt drei Kernwerte (Einnahmen, Ausgaben, Zahlungssaldo),
  ein Diagramm, Forderungen/Drilldown bei Bedarf; CashOverview behält vier Kennzahlen.
- [ ] Timer: digitale Zeit, grüner ruhiger Ring aktiv, Amber pausiert, Blau Start;
  kein vorgetäuschter Fortschritt; Reduced Motion, Pause/Beenden eindeutig.
- [ ] Wiederöffnungs-Hinweis für tatsächlich laufenden Timer, keine automatische
  Unterbrechung oder Mutation, Schutz von Entwürfen und fremden Dialogen.
- [ ] Chat: Header Support exakt zentriert, kein unnötiges Aktionsmenü, keine
  untere Navigation; einzeiliger Composer mit begrenztem Wachstum, kein iOS-Zoom.
- [ ] Ruhiger iPhone/PWA-Start, konsistente Icon-Geometrie, keine doppelten
  Startanimationen; Navigation ohne falsche Leerzustände, sichere Datenaktualität.
- [ ] Filter-Scrim einschliesslich Header/Safe Area; keine weisse Restfläche.
- [ ] Gezielte lokale Regressionen; vollständige GitHub Quality/CodeQL und
  Browserabnahme vor deploybarem Ergebnis. Keine Gates abschwächen.

Die physische iPhone-/PWA-Abnahme ist getrennt von emulierter Browserabnahme
auszuweisen. Datenbankmigrationen werden ausschliesslich lokal/isoliert geprüft.

## Rollen und kontrollierte Einführung

- Inhaber und Administratoren verbinden einen aktiven Mitarbeiter ausdrücklich
  mit einem aktiven Benutzerzugang und geben Kunden beziehungsweise Aufträge
  mit Gültigkeitszeitraum frei. Keine Zuordnung aufgrund ähnlicher E-Mail-Adressen.
- Neue Aufträge werden durch Inhaber/Administratoren angelegt; neue Kunden
  zusätzlich durch Finanzen. Auftragsleitung bearbeitet die bereits freigegebenen
  Bereiche. UI, POST-Endpunkte und Datenbank halten diese Erstellgrenze ein.
- Mitarbeitende erfassen eigene Zeiten und Spesen. Auftragsleitung sieht und
  prüft nur zugeordnete Bereiche. Inhaber/Admin prüfen andere Mitarbeitende;
  eigene Einreichungen können auch durch diese Rollen nicht selbst geprüft werden.
- Monatsrapporte benötigen immer einen hochgeladenen, zugänglichen Nachweis und
  eine unabhängige Freigabe. Die bestehende Organisationsregel für automatische
  Einzelzeitfreigaben bleibt erhalten und ist keine behauptete Personenprüfung.
- Migration 0055 erfindet keine Bestandszuordnungen. Vor der Freigabe für
  Mitarbeitende müssen Verantwortliche die Benutzerbindung und Zuordnungen
  kontrollieren. Alte Einträge werden nicht gelöscht oder automatisch neu verteilt.
- Ein Rechteentzug blockiert neue Erfassungen, Einreichungen und Nachweis-Uploads.
  Eine bereits laufende Messung kann weiterhin pausiert werden; Abschluss oder
  Fortsetzung benötigt wieder eine gültige Zuordnung. Gespeicherte eigene
  Historie bleibt lesbar. Keine automatische Umbuchung oder Verwerfung.
- Die Freigabe einer produktiven Migration oder eines Deployments gehört nicht
  zu diesem Auftrag. Erst isolierte Datenbanktests, CI und ein geprüfter Rollout
  mit den tatsächlichen Zuordnungen; keine Umgehung fehlender Voraussetzungen.

## Vorhandene gezielte Nachweise

- `scripts/workforce-regression-test.mjs`: echte eingeschränkte PostgreSQL-Rolle,
  Mandanten-/Direkt-ID-Grenzen, Dateien, Rechteentzug, Monatsüberlappung,
  unabhängige Prüfung und unveränderliche Historie.
- `scripts/migration-test.mjs`: alle Migrationen und bestehende Geschäftsprozesse,
  einschliesslich tatsächlichem Monatsrapport-Upload, Scannerstatus, Rückweisung,
  Korrektur und erneuter Einreichung; ausschliesslich synthetische Daten.
- `scripts/navigation-return-test.mjs`: gemeinsamer Hook für Header- und
  Browser-Zurück, getrennte Rückkehrpositionen und Vorwärtsnavigation.
- `scripts/task-controls-render-test.mjs`: gezielte echte Control-Geometrie in
  Light/Dark; ersetzt keine Routenmatrix oder physische iPhone-Abnahme.
- Bestehende Quality-, CodeQL-, Browser-, Auth-, Dokument- und Finanzprüfungen
  bleiben verpflichtend. Die Checkboxen werden erst nach überprüfter Abnahme
  abgeschlossen, nicht durch die Erzeugung statischer Inventare.

## Folgekorrektur nach Release #287

Die gemeinsame Quelle bleibt ux-current-approval.md. Aktueller Arbeitsbranch:
ux/task-focused-consistency. Kein Merge, Deployment oder produktive Migration.

| Ansichten | Gemeinsamer Aufbau und konkret korrigierte Ursache | Nachweis |
| --- | --- | --- |
| Alle internen Seiten/Zurück | Kein sichtbarer Ladebalken; 30s frische und bis 5min zurückkehrende In-Memory-Snapshots nur bei identischer Sitzung/Revision; alte Werte werden im Hintergrund aktualisiert | task-focused-ux-test; loading-browser-test in CI |
| Hauptheader | Kein doppelter Header-Timer und keine vergrösserte Timer-Headerzeile; vorhandener Wiederöffnungs-Hinweis bleibt | Header-Adversaries; responsive CI |
| Listen/Übersicht | Name/Betrag oben, Metadaten und rechter Status darunter; ohne Betrag zentrierter rechter Status; kein Badge in Fälligkeitstext | echte Zeilengeometrie 320/390/1024 Light/Dark |
| Details/Kundendossier/Tabs | Gleichrangige Abschnittstypografie; Nummer neben Feldbezeichnung; Dokumente mit Suche/Filter/einer kontextgebundenen Erstellung | Control-Renderer; Kunden-Browserfälle in CI |
| Erfassen/Bearbeiten/Einstellungen | Derselbe modale Sheet-Owner, lange Aufgaben erweitert; Footer aus Scrollinhalt getrennt; hinterliegende Oberfläche inert, verschachtelt gezählt | workspace/modal, Dirty-/Replay-/Berechtigungstests; CI-Formularfälle |
| Auswahl/Filter | Sichtbarer Button und App-Listbox; nativer Wert nur für Formularsemantik, kein iOS-Picker als Trigger | echte Auswahl, Keyboard, Disabled, verschachtelte Sperren |
| Rechnung/Angebot/Vorschau | Betrag/Status zuerst, Positionen und Fälligkeit, explizite PDF-Vorschau; Zusatzhistorie auf Bedarf; keine zweite Aktionsspalte | echte PDF/QR- und operative Darstellungsregressionen |
| Produkte/Leistungen | Keine doppelte Weitere-Aktionen-Sektion; Bearbeiten im Sheet; Produktwerte in neuer Dokumentposition vorbelegen; neuer Datensatz aktiv | Formular-/Replay-Tests; CI |
| Vorgaben | Vorhandene Firmen-MwSt./Zahlungsfrist/Texte und Kundenfrist verwenden; gemeinsame Steuersatzliste; keine Bestands-Snapshots überschreiben | positive/negative Defaults; tatsächliche isolierte Repository-/PDF-Tests |
| Finanzen/Analyse | Drei Analyse-Kernwerte, separater Zeitverlauf; echter reconciliierter Rechnungsbestand als Ring mit Drilldown, kein Kontostand behauptet | tatsächliche PostgreSQL-Zahlungs-/Gutschrift-/Zeitzonen-/Chart-Tests |
| Chat/PWA | Ein Composer, reduzierte Eingabehilfen; Tastatur-Viewport ohne zusätzliche Safe-Area-Lücke; keine Navigation im Chat | Composer-Renderer und CI; physisches iPhone bleibt separat |
| Auth/öffentliche Seiten/Operator | Vorhandene eigene Muster und Rollen erhalten; gemeinsame Auswahl und Dialogregeln greifen; keine neue Foundation | vorhandene vollständige Quality-/Security-/Browser-Gates |

Die generierte page-matrix.json ordnet weiterhin sämtliche 76 Seiten und zwölf
Operatorvarianten zu; eingebettete Tabs, Sheets und Vorschauen gehören zu ihren
Seiten-Ownern. Ein statischer Eintrag ist keine visuelle Abnahme. Unbekannt bleiben
physische iPhone-/PWA-Systemleisten und die tatsächliche Produktionslatenz nach
diesem noch nicht veröffentlichten Paket. Kein Versprechen verzögerungsfreier
Netzantworten; Rechte, Session-Zäune, Fehler und notwendige Validierung bleiben.
