# V5 – Ergebnis des 15-Minuten-Blocks

## Umgesetzt

- SelectControl/LocaleSwitcher: rahmenloser Sprachkürzel-Trigger, vollständige native Namen im rechts verankerten 190-px-Portal; 44-px-Optionen, Häkchen, bestehende Tastatur-/Escape-/Fokus-/Persistenzlogik. Sprache aus dem Settings-Katalog entfernt; Deep-Link-Seite erhalten.
- MarketingHeader/Footer: genau eine Sprachwahl im Header auch auf Mobile; Footer nur Impressum, Datenschutz, AGB, Cookie-Einstellungen, Kontakt, Copyright und binso.ch. Rechtsseiten behalten DPA und Unterauftragsbearbeiter als Querverweise.
- Zentrale Typografie in theme/layout/analytics/primitives: 18-px-Titeltokens, 14-px-Abschnittstitel, 20-px-KPI-Wert, 12-px-KPI-Label, 11-px-Trend, 56-px-Mobile-Header, 20-px-Headericons. Keine Änderung der Bottom-Navigation oder des FAB. Nicht jede historische lokale Typografie ist damit global migriert.
- Neue Kunden-App-Rechtsrouten: /einstellungen/rechtliches und /einstellungen/rechtliches/[document]. requireSession, bekannte Dokument-Whitelist, gemeinsame LegalPage ohne Marketing-Chrome, unveränderte Texte/Versionen/Anker, interne Querverweise, normale App-Shell. Navigation über Unternehmenseinstellungen und persönliche Datenschutzansicht. Nichtdeutsche Rechtsübersetzungen erhalten einen fehlenden-Freigabenachweis-Hinweis.

## Inventar

86 tatsächliche Routen und 6368 statische Aktionsvorkommen in inventory/routes.json und actions.csv. Handler, Ziele, Owner/Zeile und Codebedingungen erfasst. Das ist keine vollständige semantische Rollen-/Abo-/Statusabnahme; entsprechende Felder bleiben ausdrücklich offen. Neue Rechtsrouten im Architekturregister mit Status Offen aufgenommen; alte Evidenz nicht als neue Abnahme umgeschrieben.

## Geprüft

Gezieltes ESLint und TypeScript. V5-Regression prüft eine Sprachwahl bei offenem/geschlossenem Marketingmenü, exakte Footer-Ziele, Authentifizierungsgrenze/ungültige Rechtsdokumente und Dropdown-Geometrie in acht Breiten. Bestehende Lokalisierungsregression vergleicht jetzt öffentliche und interne Rechtsartikel auf identische Inhalte, Versionsdaten und Abschnittsanker; Sprachtrigger-Assertion gezielt auf V5 umgestellt. Bestehende UX-/Finance-Final-/Navigations-/CSS-/Sprachabdeckungsregressionen bestanden. Keine Finanz-, Rollen-, Auth-, RLS-, Consent- oder Mail-Prüfung deaktiviert.

Browser: echte lokale Kunden-App-Rechtsseite auf 390 px, Finanzanalyse auf 320/390/768/1440 px, Sprachdropdown 190 px mit fünf 44-px-Optionen und DE-Trigger; Marketing auf 390 px genau eine Sprachwahl, korrekter Footer und kein horizontaler Seitenüberlauf. Mobile/desktop-Screenshots liegen im Workspace als v5-finance-*.png, v5-language-mobile.png, v5-legal-mobile.png und v5-marketing-mobile.png.

## Offen

Admin-interne Rechtsseiten und Admin-Rollenabnahme; komplette Migration sämtlicher Rechtslinks/Typografie/Stammdaten-/Abo-/Dokument-Unterseiten; genehmigte Rechtsübersetzungs- und Dokumentfreigabematrix; komplette funktionale Seiten-/Aktionsabnahme, alle repräsentativen Sprach-/Theme-/Geräte-/PWA-Varianten. Kapitel 32 ist nicht vollständig umgesetzt. Keine komplette globale V5-Abnahme, keine vollständige CI oder Browsermatrix. Die neuen Rechtsseiten brauchen ihre gezielte Browser-Rollenabnahme.

Die öffentliche Rechtsquelle und bisherige Zustimmungs-/Consent-Versionen wurden nicht geändert. Nur lokale Vorschau; kein Push, Merge, Deployment und keine produktiven Datenänderungen.

Nachprüfung: Integrationsarchitektur in der isolierten Quellkopie mit beiden neuen Rechtsrouten bestanden (Importzyklen, Barrel-Schutz, vollständige Routenmatrix). Öffentliche Datenschutzseite zusätzlich ohne Sitzung per HTTP mit Status 200, öffentlicher Shell und unveränderter Version 2026-10-05.2 geprüft.

## Release-Vorbereitung nach ausdrücklichem Deployment-Auftrag

Der nachfolgende Nutzerauftrag hebt den lokalen GitHub-/Deployment-Stopp für die Release-Vorbereitung auf. PR #312 bündelt die bisherigen Änderungen; die Ergebnisse des ursprünglichen 15-Minuten-Blocks oben bleiben historische Einzelbefunde.

Die Release-Nachprüfung korrigiert die Profilidentität auf den in V5 vorgegebenen Bereich (60 px), verwendet 44 px für zentrale App-Eingaben und bewahrt den letzten verbundenen Seiten-Trigger beim Wechsel vom Werkzeugmenü in ein Sheet. Die tatsächliche lokale Zeitansicht bestätigt Escape und Fokusrückkehr zu Listenwerkzeuge ohne Änderung der gespeicherten Testzeit.

Routenregister und Komponentenabhängigkeiten sind aktualisiert. Die beiden neuen Rechtsrouten bleiben `nicht geprüft` beziehungsweise `nicht_abgenommen`; alle fünf Artikel und die Übersicht sind zusätzlich im vollständigen Chromium-/WebKit-Plan enthalten. Der Sprach-Deep-Link bleibt erreichbar, während sein doppelter Katalogeintrag gemäss V5 entfällt. Der eingefrorene Navigationsvergleich bleibt unverändert; die CI erhält die dafür notwendige historische Git-Quelle.

Der vollständige Linux-Lauf für 8ff6eddf bestätigt Release-Verträge, gesamte pnpm-Testkette, Compliance-Gegenprüfungen, isolierte PostgreSQL-Nebenläufigkeit, Lint, CSS, Typprüfung und Abhängigkeitsprüfungen. Build, echte Scanner-Qualifizierung, Rechnungsausstellung und Rabatte sind ebenfalls bestätigt. Browsermatrix und eine gezielte Desktop-Selektorkorrektur befinden sich noch in Qualifizierung; dies ist noch keine Release- oder vollständige V5-Abnahme. Keine fachliche, Rollen-, Mandanten-, Mail-, Finanz- oder Sicherheitsprüfung wurde abgeschaltet.

Weitere Release-Nachprüfung: Der tatsächliche Mobile-zu-Desktop-Wechsel eines offenen Zeitraumdialogs erzeugte eine leere Auswahl. Die zentrale Komponente schliesst jetzt beim Wechsel über 1024 px, ohne den angewendeten Zeitraum oder Kennzahlen zu ändern; lokal im Browser bestätigt und als echter Finanz-Browserfall ergänzt. Eingabetypografie der abgeleiteten R7-Loginreferenz verwendet ausschliesslich für Inputs den ausdrücklich freigegebenen V5-Wert 14 px; historische Referenzbytes bleiben unverändert.

Browserabläufe folgen den bestehenden V4/V4.1-Einstiegen: Kundenimport und Dubletten über Listenwerkzeuge, persönliche Sicherheit über den Dashboard-Kontomenü-Einstieg, Dokumenteinstellungen über ihre bestehende direkte Bearbeitung. Wiederhergestellte HTML-details werden anhand des vorhandenen open-Attributs geprüft und nicht versehentlich zugeklappt. Der vollständige funktionale Chromium-Lauf für 0bd89f26 bestand; die noch ausstehenden bzw. nachfolgenden Browser-/Commit-Nachweise bleiben ausdrücklich offen.

Die wiederholten CI-Installationsverzögerungen wurden im Live-Protokoll auf azure.archive.ubuntu.com bei Schrift-/Medienpaketen zurückgeführt. Alle fünf Browserworkflows verwenden denselben vorbereitenden Helper mit dem offiziellen HTTPS-Ubuntu-Hauptarchiv und begrenzten APT-Netzwerkwartezeiten. Vollständige Playwright-Systemabhängigkeiten, Paket-/TLS-Verifizierung, Browserpins und sämtliche Prüfungen bleiben erhalten. Der Workflow-Sicherheitsvertrag prüft die Einbindung und unveränderten Freigabegrenzen.
