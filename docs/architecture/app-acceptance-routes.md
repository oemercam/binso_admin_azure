# App-Abnahme: Routen und eingebettete Ansichten

Codebasis: `c7c95585aafd380db2c70d8a7c27fbd93bdde914` (20.10.2026).
Prüfbedingungen, Rollen, Nachweise und Blockaden: [gemeinsames Protokoll](app-acceptance.md).
Quelle der Zuordnung: bestehendes [UX-Inventar](ux-inventory.json). Kein zweites Quellinventar.
Alle Seitenstatus bleiben OFFEN: diese Tabelle ist eine vollständige Prüfliste, keine behauptete Sichtabnahme.

## Profile

- APP: G01–G04, N01–N02, A01, R01–R02, P01–P04, M01–M02; alle anwendbaren Zustände.
- LIST: APP + L01. DETAIL: APP + D01 sowie eingebettete Tabs/Dateien/Aktionen.
- FORM: APP + F01–F03. CHAT: APP + C01 und Dateiaktionen.
- SETTINGS: APP + passende F01–F03; persönlicher und organisatorischer Scope separat.
- KPI: APP + K01–K02, Listen-/Filterdrilldown L01.
- ADMIN: APP + L01/D01/F01–F03/K01–K02/C01 jeweils für tatsächliche Unteransichten; Entra statt Tenant-Login.
- AUTH: G01–G04, N01, F01–F03, A01, R02, P01–P02, M01–M02; Authprozess ohne Freigabe von echten Nachrichten.
- REDIRECT: Ziel/Session/History N01/R02 und P01/P04, danach Zielprofil vollständig.
- PUBLIC: G01–G04/N01/M01, zustandsabhängig R02/P01–P04; Rechtsinhalte erhalten.
- DEMO: passendes APP/LIST/KPI-Profil mit klar synthetischen Daten; kein Nachweis realer Auth/API-Rechte.
- K-ROLLEN/A-ROLLEN: alle im Hauptprotokoll genannten Tenant-/Operatorrollen inklusive Negativfällen. Routen-Leserecht ersetzt kein Schreibrecht.

## Vorhandene Seitenrouten (76)

| ID | Route | Oberfläche | Profil | Rollen | Eingebettete Prüfumfänge | Seitenabnahme |
| --- | --- | --- | --- | --- | --- | --- |
| R001 | `/agb` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R002 | `/angebote/[id]` | Kunden-App | DETAIL | K-ROLLEN | Positionen/Status, PDF, Revision, Annahme/Ablehnung/Ablauf, Auftrag/Rechnungsübernahme | OFFEN |
| R003 | `/angebote/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R004 | `/angebote` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R005 | `/auftragsbearbeitung` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R006 | `/belege` | Kunden-App | KPI | K-ROLLEN | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R007 | `/benachrichtigungen` | Kunden-App | APP | K-ROLLEN | Liste/Detailziel, gelesen/alle gelesen, kein fremder Tenant, richtiger Rückweg | OFFEN |
| R008 | `/berichte` | Kunden-App | KPI | K-ROLLEN | Zeitraum, Rollenmaskierung, KPIs, CSV/Fehler/Download | OFFEN |
| R009 | `/dashboard` | Kunden-App | KPI | K-ROLLEN | Monat, Handlungsbedarf, Bestand/eigene Arbeit je Rolle; keine Bank-/Gewinnbehauptung | OFFEN |
| R010 | `/datenschutz` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R011 | `/demo` | Prüf-/Demoansicht | DEMO | Synthetische Daten | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R012 | `/dev/ux-lab` | Prüf-/Demoansicht | DEMO | Synthetische Daten | Isolierter Komponentenprüfstand, kein Ersatz für reale Appzustände oder Produktionsroute | OFFEN |
| R013 | `/einladung` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R014 | `/einstellungen/abonnement` | Kunden-App | SETTINGS | K-ROLLEN | Plan/Vertrag, Preise, Rechte, Provider-/Fehlerzustände; keine echte Zahlung ohne Testfreigabe | OFFEN |
| R015 | `/einstellungen/benachrichtigungen` | Kunden-App | SETTINGS | K-ROLLEN | Vorhandene E-Mail-Präferenz; nicht implementierter Pushkanal wird nicht als aktivierbar bestätigt | OFFEN |
| R016 | `/einstellungen/darstellung` | Kunden-App | SETTINGS | K-ROLLEN | Light/Dark/System, Systemwechsel, Start/Rückkehr und Persistenz | OFFEN |
| R017 | `/einstellungen/datenschutz` | Kunden-App | SETTINGS | K-ROLLEN | Anzeigen, zulässiges Bearbeiten, Abbruch/Fehler und Rücknavigation | OFFEN |
| R018 | `/einstellungen/dokumente` | Kunden-App | SETTINGS | K-ROLLEN | Zentrale Defaults, Vorschau; keine rückwirkende Änderung ausgestellter Dokumente | OFFEN |
| R019 | `/einstellungen/firma` | Kunden-App | SETTINGS | K-ROLLEN | Anzeigen, zulässiges Bearbeiten, Abbruch/Fehler und Rücknavigation | OFFEN |
| R020 | `/einstellungen/konto` | Kunden-App | SETTINGS | K-ROLLEN | Anzeigen, zulässiges Bearbeiten, Abbruch/Fehler und Rücknavigation | OFFEN |
| R021 | `/einstellungen` | Kunden-App | SETTINGS | K-ROLLEN | Persönlich/Firma; jedes berechtigte Ziel; Rückkehr auf ursprüngliche Listenposition | OFFEN |
| R022 | `/einstellungen/sicherheit` | Kunden-App | SETTINGS | K-ROLLEN | MFA/Recovery, Sitzungen, Fehler, Validierung und notwendige Sicherheitsinformationen | OFFEN |
| R023 | `/einstellungen/sprache` | Kunden-App | SETTINGS | K-ROLLEN | Anzeigen, zulässiges Bearbeiten, Abbruch/Fehler und Rücknavigation | OFFEN |
| R024 | `/einstellungen/team` | Kunden-App | SETTINGS | K-ROLLEN | Mitglieder, Einladungen/Status, rollenabhängige Aktionen, Replay und Ablauf | OFFEN |
| R025 | `/einstellungen/zeiterfassung` | Kunden-App | SETTINGS | K-ROLLEN | Anzeigen, zulässiges Bearbeiten, Abbruch/Fehler und Rücknavigation | OFFEN |
| R026 | `/email-bestaetigen` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R027 | `/finanzen/analyse` | Kunden-App | KPI | K-ROLLEN | Zeitraum, Währung, Cash-/Volumen-Abgrenzung, Linien/Ringe/Legenden/Drilldown | OFFEN |
| R028 | `/finanzen` | Kunden-App | KPI | K-ROLLEN | Rollen-Teilansichten, Forderungen, Angebote, Abrechenbarkeit, Kennzahlen/Drilldown | OFFEN |
| R029 | `/impressum` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R030 | `/kunden/[id]/bearbeiten` | Kunden-App | FORM | K-ROLLEN | Unveränderte Altbestände, Validierung, Dirty-Abbruch, Dossier-Rückziel | OFFEN |
| R031 | `/kunden/[id]` | Kunden-App | DETAIL | K-ROLLEN | Überblick, Stammdaten, Kundenentwicklung, Kontakte/Aktionen, Dokumente/Dateien, Aktivitäten, Aufträge/Zahlungen; Kontext zurück | OFFEN |
| R032 | `/kunden/neu` | Kunden-App | FORM | K-ROLLEN | Firma/Privat, Pflichtkontakt, Duplikate, weitere Daten, Speichern → erfasstes Dossier | OFFEN |
| R033 | `/kunden` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R034 | `/login` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R035 | `/mitarbeiter/[id]` | Kunden-App | DETAIL | K-ROLLEN | Überblick, berechtigte Zeit/Spesen-Tabs, Dokumente, Zuordnungen, Bearbeiten; Einzelscope und Rückziel | OFFEN |
| R036 | `/mitarbeiter/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R037 | `/mitarbeiter` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R038 | `/offline` | Öffentlich | PUBLIC | Anonym + Rückkehr | Offlinezustand/Retry; keine falsche Zusage von offline verfügbaren privaten Daten | OFFEN |
| R039 | `/operator/[...section]` | Admin | ADMIN | A-ROLLEN | Alle konkreten Varianten in separater Tabelle; unbekannter Abschnitt und fremde ID negativ | OFFEN |
| R040 | `/operator/login` | Admin | ADMIN | A-ROLLEN | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R041 | `/operator` | Admin | ADMIN | A-ROLLEN | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R042 | `/operator/wallboard` | Admin | ADMIN | A-ROLLEN | Weiterleitung und sicherer Zielkontext; kein eigenständiger Vollbildnachweis | OFFEN |
| R043 | `/` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R044 | `/passwort-vergessen` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R045 | `/passwort-zuruecksetzen` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R046 | `/portal/login` | Kunden-Einstieg | REDIRECT | AUTH | Weiterleitung nach /login mit korrekter sicherer Rückkehr | OFFEN |
| R047 | `/portal` | Kunden-Einstieg | REDIRECT | AUTH | Weiterleitung nach /login; altes Portal-Manifest und Scope-Wechsel separat P01/P04 | OFFEN |
| R048 | `/portal/registrieren` | Kunden-Einstieg | REDIRECT | AUTH | Weiterleitung nach /registrieren; lokalisierter Auth-/App-Kontext | OFFEN |
| R049 | `/preise` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R050 | `/preview/dashboard` | Prüf-/Demoansicht | DEMO | Synthetische Daten | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R051 | `/preview/rechnungen` | Prüf-/Demoansicht | DEMO | Synthetische Daten | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R052 | `/preview/zeit` | Prüf-/Demoansicht | DEMO | Synthetische Daten | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R053 | `/produkt` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R054 | `/produkte/[id]` | Kunden-App | DETAIL | K-ROLLEN | Leistung/Produkt, Einheit/Preis/Steuer, Bearbeiten, Dokumentübernahme | OFFEN |
| R055 | `/produkte/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R056 | `/produkte` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R057 | `/projekte/[id]` | Kunden-App | DETAIL | K-ROLLEN | Auftrag/Status, zugewiesene Mitarbeiter, Zeiten, Abrechnung/Dateien und Rückweg | OFFEN |
| R058 | `/projekte/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R059 | `/projekte` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R060 | `/rechnungen/[id]` | Kunden-App | DETAIL | K-ROLLEN | Operative Übersicht, Positionen/Status, PDF, Korrektur/Storno/Gutschrift/Rückerstattung und Zahlungen | OFFEN |
| R061 | `/rechnungen/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R062 | `/rechnungen` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R063 | `/registrieren` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R064 | `/spesen/[id]` | Kunden-App | DETAIL | K-ROLLEN | Beleg/Vorschau, Bearbeiten, Einreichen, unabhängig genehmigen/zurückweisen, Erstattung/Abrechnung | OFFEN |
| R065 | `/spesen/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R066 | `/spesen` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R067 | `/support/[id]` | Kunden-App | CHAT | K-ROLLEN | Thread, Composer/Keyboard, Dateien, interne Notizen nicht sichtbar, geschlossen/wieder öffnen, Reply-Replay | OFFEN |
| R068 | `/support/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R069 | `/support` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R070 | `/unterauftragsbearbeiter` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R071 | `/wartung` | Öffentlich | PUBLIC | Anonym + Rückkehr | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R072 | `/willkommen` | Authentifizierung | AUTH | Anonym/Session/MFA | Vollständige Zustände und tatsächliche Benutzeraktionen nach Hauptprotokoll | OFFEN |
| R073 | `/zahlungen/[id]` | Kunden-App | DETAIL | K-ROLLEN | Überblick, eingebettete Bearbeitung, Status, Dateien/Aktionen und Rücknavigation | OFFEN |
| R074 | `/zahlungen/neu` | Kunden-App | FORM | K-ROLLEN | Erfassungs-/Abbruch-/Fehler-/Speicherziel; Pflichtfelder und Defaults | OFFEN |
| R075 | `/zahlungen` | Kunden-App | LIST | K-ROLLEN | Suche, Filter, Sortieren, Pagination, Details und erlaubte Erstellungsaktion | OFFEN |
| R076 | `/zeit` | Kunden-App | APP | K-ROLLEN | Timer/Einträge, Freigabewarteschlange, manuell/Monatsrapport, Auftragssuche; eigene Tagesarbeit | OFFEN |

## Konkrete Operator-Varianten (13)

Zwölf Varianten stammen aus dem bestehenden Inventar; `/operator/monitoring` ist zusätzlich direkt in `components/operator.tsx` nachgewiesen. Es wird nicht ausgelassen, nur weil der statische Generator den Fragment-Zweig nicht als Variante erfasst.
Dashboard und Detailrouten wiederholen die obige Rahmenroute absichtlich als eigenständige Zustandsfälle.

| ID | Route | Teilansichten / Aktionen | Profil | Status |
| --- | --- | --- | --- | --- |
| O01 | `/operator/tickets` | Liste/Filter/Status/Priorität, Navigation zum Fall | ADMIN | OFFEN |
| O02 | `/operator/kunden` | Tenant-Liste/Filter und Dossierziel; keine fremden Daten | ADMIN | OFFEN |
| O03 | `/operator/zahlungen` | Währung/Datum/Status, Filter und Kennzahlbezug; Kunden-/Periodenscope | ADMIN | OFFEN |
| O04 | `/operator/finanzen` | Vertragswert/Zahlungen klar abgrenzen, Zeitraum und Diagramme | ADMIN | OFFEN |
| O05 | `/operator/abonnemente` | Plan/Vertrag/Status und zulässige Aktionen; Testprovider statt produktiver Abrechnung | ADMIN | OFFEN |
| O06 | `/operator/sperrungen` | Liste, Erfassung, Dauer/Grund, Aufheben/Audit; nur isolierter Testtenant | ADMIN | OFFEN |
| O07 | `/operator/ankuendigungen` | Liste, Erstellen/Bearbeiten/Status; keine echte Rundnachricht | ADMIN | OFFEN |
| O08 | `/operator/sicherheit` | Operatoren/Rollen/Leserechte; keine produktive Entra- oder Rollenänderung | ADMIN | OFFEN |
| O09 | `/operator/audit` | Filter/Chronologie/Details, readonly und Datenschutz | ADMIN | OFFEN |
| O10 | `/operator` | Support-/Abrechnungsfokus je Rolle, reale Kennzahlen, Zustände und Drilldowns | ADMIN | OFFEN |
| O11 | `/operator/tickets/[id]` | Thread, Antwort/interne Notiz, Dateien, Status/Priorität, Replay/Fehler, Kundensicht | ADMIN | OFFEN |
| O12 | `/operator/kunden/[id]` | Account/Vertrag, Abonnement, Zahlungen, Tickets, Einschränkungen/Audit; jede vorhandene Tab-/Menüaktion | ADMIN | OFFEN |
| O13 | `/operator/monitoring` | Status/Fehler, Maintenance-Control-Rechte und Lesbarkeit; keinerlei reale Wartungs-/Infrastrukturaktion | ADMIN | OFFEN |

## Gemeinsame eingebettete Komponenten

| ID | Owner / Ansicht | Pflichtfälle | Status |
| --- | --- | --- | --- |
| U01 | AppShell / OperatorShell, Header und Navigation | G02/G04/N01/N02/M01; beide Owner separat, nicht vom Kundenheader auf Admin schliessen | OFFEN |
| U02 | RecordsView/ListRow/DocumentList/Status | L01/D01/G02/G03; Tabellen und mobile Zeilen, rechts ausgerichtete Werte, lange Nummern | OFFEN |
| U03 | FormSheet/FilterSheet/ActionsMenu/FormActions | F01–F03/A01/M01; Fokus/Scrollsperre/Dirty-Guard/Keyboard, verschachtelte Popups | TEILNACHWEIS aus Komponentenregression; Einbettung OFFEN |
| U04 | SelectControl/DirectorySelect/Date-/CurrencyInput | F03/L01/G04; 1101 Datensätze, ausgewählte ID ausserhalb Seite, Datums-/Betragseingabe | TEILNACHWEIS; Gerätepicking OFFEN |
| U05 | KPI/Statistics/RingChart/Trend | K01/K02/G04; unterschiedliche Berechtigungen, Währungen, Null/negativ/grosse Beträge | TEILNACHWEIS; beide Portale visuell OFFEN |
| U06 | FileUpload/EntityFiles/PDF-Viewer | D01/P04/A01/R01; Scan/Quarantäne/Fehler/Retry, Download und Rückkehr | TEILNACHWEIS aus API-/PDF-Prüfung; Geräte OFFEN |
| U07 | Chat-Thread/Composer/Workspace-Viewport | C01/M01/P02; Kunden- und Operatorthread, interne Notizen, Keyboard/Rotation | API-TEILNACHWEIS; echte Tastatur OFFEN |
| U08 | AppStart/LoadingState/ThemeRuntime/PwaRegister | G03/P01–P03/M02; ursprüngliches BINSO-Icon, Scope/Update/Offline/Session | Lifecycle-TEILNACHWEIS; echte Installation OFFEN |
| U09 | Toast/ErrorState/EmptyState/PermissionResult | G03/G04; zugängliche Meldungen, Fokus, Retry, kein Abschneiden oder falscher Erfolg | OFFEN je Einbettung |

## Ausführungsblatt pro Fall

| Fall/Route/Tab/Aktion | SHA / Build / Umgebung | Rolle / Testtenant | Gerät / OS / Browser / Viewport / Theme | Schritte und Soll | Ist / Status | Nachweis / Fehler / Datum / Prüfer |
| --- | --- | --- | --- | --- | --- | --- |
| Noch nicht ausgeführt | — | — | — | Gemäss zugeordnetem Profil und E01–E10 | OFFEN | — |

Erst einen eigenen ausgefüllten Datensatz anlegen, wenn der Fall tatsächlich ausgeführt wurde. Keine fiktiven Screenshots, Gerätetests oder Testergebnisse. Rechte- und Modalvarianten sind nicht mit einem einzigen Screenshot einer leeren Liste abgedeckt.
