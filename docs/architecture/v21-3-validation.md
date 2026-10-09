# V21.3 Validierung

2026-10-09. Ausschliesslich lokale/synthetische Testdaten, keine produktiven Datenbankoperationen.

| Prüfung | Ergebnis | Umfang / Grenze |
|---|---|---|
| Aktuelles Schema | bestanden | alle Migrationen tatsächlich angewendet; 95 Tabellen, 1222 Spalten, 514 Constraints, 69 Policies, 335 Indizes inventarisiert; keine produktive Datenbank gelesen |
| package test | bestanden | Architektur, Rollen, Session, alle 46 Migrationen in PGlite, 50 RLS-Testmandanten, Finanz-/Prozess-/PDF-/PWA-Verträge und neue Datenfundamenttests |
| lint | bestanden | Vollständiges ESLint, keine Warnungen; zentrale UI-Regeln erhalten |
| typecheck | bestanden | TypeScript noEmit; zusätzlich Build-Typecheck |
| build | bestanden | Next 16 Webpack Produktionsbuild; keine produktive DB erforderlich |
| release:check | bestanden | Vorhandene Release-, Dokumentations- und Repository-Verträge |
| css:check | bestanden | Bestehende CSS-Architektur |
| Produktions-Dependencyaudit | bestanden | pnpm audit --prod --audit-level high: keine bekannten Schwachstellen |
| Vollständiger Dependencyaudit | bestanden nach bestehender Policy | Ausschliesslich bereits dokumentierte temporäre Dev-Tool-Ausnahme GHSA-VFJ7-8CJW-P6XM; keine neue Ausnahme |
| WebKit gezielt | bestanden | 8 Seiten × 1440/375 px, light; finance/documents/time Interaktionen; synthetische APIs |
| Chromium gezielt | bestanden | dieselben 16 Kombinationen; synthetische APIs |
| Zusätzlicher Chromium-Abschlusslauf | bestanden | 24 Kombinationen: 6 Seiten × 320/375/768/1440 px; Einstellungen/Einladungsretry, sieben Payment-Tabs und angehaltener Hintergrundread ohne verschwundene Rechnung |
| Zahlung über sieben Tabs | bestanden | echtes PaymentForm, Fehler503 ohne Saldoänderung, danach 1000 Teilzahlung auf2561.97; Detail/Liste/Kundenfinanzen/Zahlungen/Finanzen/Dashboard/Aktivität ohne Reload; synthetisches Ledger |
| PWA Browser | bestanden | Chromium, ServiceWorker, Offlinefallback, Manifeste, Neustart Theme; keine privaten API-/Dashboardantworten im SW-Cache; tatsächliche TimePage mit Navigation, laufendem/pausiertem Neustart, Tab-Pause/Stop und Sessionablauf; keine physische Installation |
| Navigationvertrag | bestanden | Kunden- und Operator-Bottom-Navigation gegen main-Basis unverändert inklusive transitiver Tokens |
| Einladung | bestanden | echte API/Service gegen isolierte DB: Membership/Token/Outbox atomar, Replay, Versandfehler/-unklarheit und finaler DB-Rollback; keine externen Mails |
| File-Prozess | bestanden | tatsächliche Upload/List/Downloadhandler an isolierter DB; Byteprüfung, Relation, Rollen-/Tenantablehnung |
| Kundenworkspace | bestanden | tatsächlicher Repository-Aufruf, gleiche Summary, owner/member Rechte, fremde ID; Kundenänderung mit gleichen Namen/Umbenennung in Chromium und WebKit |
| Zusätzlicher Abschlusslauf | bestanden | Chromium10 Route/Viewport-Kombinationen plus data/settings/header/chat/employees/documents; WebKit2 Kombinationen plus data/settings/header |
| Verlorene Zahlungsantwort | bestanden | actual PaymentForm, synthetischer Commit mit anschliessendem Netzwerkabbruch; Fehler ohne Erfolgsanzeige, gleicher Replay-Key, exakt eine Zahlung und sieben aktuelle Tabs |
| Anonyme API-Grenzen | bestanden | echte HTTP-Requests gegen eigenen lokalen Server ohne DATABASE_URL: 110 private Methoden abgelehnt; zwei ausdrücklich unsupported405 Methoden; öffentliche/token/webhook Endpunkte separat ausgenommen |
| Authentifizierter HTTP-/PostgreSQL-Gate | ergänzt, CI-Ergebnis offen | zwei synthetische Mandanten, echte Cookies/Sessions, positive und fremde IDs, alle acht Zahlungsrollen, Operatortrennung und echte Sessionexpiry; eigene leere Testdatenbank im build-Job |
| Canonical Fremd-IDs | bestanden | alle zehn tatsächlichen Repository-Datenquellen mit positiven eigenen Fixtures und fremder direkter ID |
| Validierungsfehler | bestanden | tatsächliche asObject/string/email/enum Helpers ->400; Response401/403/404/409/429/503 unterscheiden sich; UTF-8-Bytegrenze |
| Azure-Smoke | offen | Kein Deployment ausgeführt, keine Live-Schreibtests |
| Reales PostgreSQL Parallelitätsgate | Nummern/Payment bestanden; Timer-Erweiterung noch offen | Isolierter postgres:16-Service; leere lokale Testdatenbank mit explizitem Namen/Benutzer; Quality-Lauf1156: zehn gleichzeitige Nummern, sechs Dokument-/Payment-Replays und konkurrierende Vollzahlungen bestanden. Zusätzliche Parallel-Timerstarts/-stops im nächsten Lauf. Keine DATABASE_URL-Fallbacks oder Schemaresets. |
| GitHub Required Quality | noch nicht bestanden | Lauf1156: checks einschliesslich echter PostgreSQL-Paralleltests und build/Runtime-/Artefakt-Smoke grün. Beide Browser scheiterten am Teamfixture, das nach bestätigter Rollenänderung weiterhin member lieferte; Fixture korrigiert, gezielte Chromium/WebKit-Läufe grün. Finaler Commit muss das vollständige Gate erneut bestehen. |

Reproduktion: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run release:check`, `npm run css:check`, `pnpm audit --prod --audit-level high`, `node scripts/full-security-audit.mjs`. Das neue Browserinteraktionspaket `data` ist im QA-Plan für payments und umfassende Läufe enthalten. `BINSO_UX_INTERACTIONS=data` führt den sieben-Tab-Test separat aus. Für lokale Browser ist `BINSO_PLAYWRIGHT_MODULE` zu setzen; Chromium kann über `BINSO_CHROMIUM_EXECUTABLE` gewählt werden.

Die 25 verbindlichen Fälle und ihre verbleibenden Grenzen stehen in [v21-3-data-foundation.md](v21-3-data-foundation.md). Diese Tabelle bestätigt einzelne Prüfungen, keine vollständige fachliche Abnahme des Gesamtauftrags.
