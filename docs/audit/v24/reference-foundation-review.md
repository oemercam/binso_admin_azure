# Original-ZIP als gemeinsame UI-Foundation

Stand: 16.10.2026. Entwurf; keine Produktionsfreigabe und kein Deployment.

Die ursprüngliche Sechs-Dateien-Vorgabe wurde entfernt. `app/styles/` ist durch
benannte Komponenten-Owner in `app/design-system/` ersetzt. Das Manifest besitzt
eine feste Importreihenfolge, aber keine feste Dateianzahl. Farben, Schriftrollen,
Radien und globale Layouttokens gehören zentral zum Theme; die unveränderten
geerbten Navigationswerte haben einen ausdrücklich geschützten Owner.

Gemeinsame Shell-Slots, RecordsControls/RecordsView, DetailSections, ContextActions,
FormSheet, ActionSheet und native Controls vereinheitlichen die bestehenden Seiten.
Desktop-Kontextaktionen stehen in der Commandbar; Mobile verwendet das gemeinsame
Sheet. Der Mobile-Fallback erhält bisherige Detailaktionen. Kompakte Zeilen zeigen
ihren Status als Metadatum, statt ihn auszublenden. Admin verwendet dieselben
Schrift- und Layoutrollen. Bottom-Navigation, Destinationen, Rechte und Icons
entsprechen weiterhin dem ursprünglichen unabhängigen Vertrag.

Die Landingpage folgt dem Originalaufbau und verwendet aktuelle echte
Produktaufnahmen. Upload-Auswahl und gemeinsame Ringausrichtung sind zentral.
Kunden-Finanzspalten und Offen-Filter verwenden eine optionale, rollen- und
mandantengeprüfte SQL-Projektion. Sie berücksichtigt Währungen, Gutschriften,
Rückerstattungen und Datumsgrenzen; ohne Rechnungsleserecht werden diese Controls
nicht angeboten. Es werden keine Referenzzahlen in Produktdaten übernommen.

## Prüffähiger Vergleich

- [Original und Produkt nebeneinander sowie abgeleitete Ansichten/Zustände](review.html)
- [Unverändertes Originalpaket](original-reference.zip)
- [Original-Dateihashes](reference-source.json)
- [Bild-, Browser- und Quellen-Nachweise](ux-vergleich/nachweise.json)
- [Verbindliche Architektur und neue Seitenmuster](../../architecture/reference-foundation.md)

Zehn Originaldateien wurden bytegenau gegen das ZIP geprüft. Login, Kundenliste
und Kundendetail wurden bei 1440/390 CSS-Pixeln mit derselben lokalen
Edge/Chromium-Schriftumgebung verglichen. Originaldateien bleiben unverändert;
die Aufnahme blendet nur äussere Vorschauumrahmung/Umschalter aus. Gleiche Namen
und Kontakte dienen als isolierte Vergleichsdaten. Reale Produktlogik bestimmt
Zahlen, Sortierung, Währungen und vorhandene Zusatzfunktionen.

Der breite Lauf prüfte 170 Routen-/Breitenfälle. Nach den letzten zentralen
Korrekturen folgten 48 gezielte Light/Dark-Fälle und 22 API-basierte Adminfälle.
Alle Bediengruppen bestanden: Kunden, Dokumente, Produkte, Mitarbeiter, Finanzen,
Zeit, Spesen, Chat, Abrechnung, Header, Admin, Einstellungen, Datenaktualisierung
und Navigation. API-Fixtures sind synthetisch, alle unbedienten Requests scheitern;
die Operatoraufnahmen belegen kein reales Entra-SSO.

Produktionsbuild, TypeScript, ESLint, CSS-Architektur, Navigationsverträge,
Quellen-/Routeninventar, Lokalisierungsabdeckung und der finanzielle
Projektionstest bestanden. Gesamte Skriptsuite: 39/43 bestanden.

## Offene Prüfungen

- `readiness-integrity-test.mjs`: Bash monitoring probe returned null status instead of 0 on Windows.
- `file-scan-test.mjs`: Windows rejected the Unix-socket protocol peer with EACCES.
- `file-rescan-test.mjs`: POSIX process.getuid is unavailable on Windows.
- `auth-integrity-test.mjs`: Development file-access exception expected HTTP 200 but received 423; unresolved. No security gate disabled.

Diese vier Fehler wurden nicht deaktiviert oder als Erfolg umgedeutet. Die
Skriptsuite ist insgesamt nicht grün. WebKit, physische Geräte und die endgültige
visuelle Abnahme bleiben offen. Automatische Darstellungstests und ein grüner
Build sind kein Nachweis einer pixelgenauen 1:1-Freigabe. Fehlende Adminvorlagen,
Dark Mode und zusätzliche Zustände sind im Review ausdrücklich abgeleitet.

Es bestehen sichtbare fachliche Unterschiede zum statischen Original: echte
Markenassets, geschützte Navigation, verfügbare Zusatzfunktionen/Detailtabs,
dynamische Finanzwerte und tatsächliche Kontakt-/Dokumentdaten. Diese werden
nicht durch fiktive Produktdaten kaschiert.

Build-ID: `_NI6mwk3J6cU8kJYblGLi`. Laufzeitquellen inklusive CSS:
`48ec3944d5f591c42dc2047a53ee91b64482d53412aef5f39214fcf4a883deb3`. Einzeldateihashes stehen im Nachweis.
