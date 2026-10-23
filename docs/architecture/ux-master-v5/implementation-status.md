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
