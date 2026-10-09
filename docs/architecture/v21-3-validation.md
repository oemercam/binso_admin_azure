# V21.3 Validierung

2026-10-09. Ausschliesslich lokale/synthetische Testdaten, keine produktiven Datenbankoperationen.

| Prüfung | Ergebnis | Umfang / Grenze |
|---|---|---|
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
| PWA Browser | bestanden | Chromium, ServiceWorker, Offlinefallback, Manifeste, Neustart Theme; keine privaten API-/Dashboardantworten im SW-Cache; keine physische Installation und kein Timer-Neustartnachweis |
| Navigationvertrag | bestanden | Kunden- und Operator-Bottom-Navigation gegen main-Basis unverändert inklusive transitiver Tokens |
| Einladung | bestanden | echte API/Service gegen isolierte DB: Membership/Token/Outbox atomar, Replay, Versandfehler/-unklarheit und finaler DB-Rollback; keine externen Mails |
| File-Prozess | bestanden | tatsächliche Upload/List/Downloadhandler an isolierter DB; Byteprüfung, Relation, Rollen-/Tenantablehnung |
| Azure-Smoke | offen | Kein Deployment ausgeführt, keine Live-Schreibtests |
| Reales PostgreSQL Parallelitätsgate | offen | PGlite ist keine unabhängige Mehrverbindungsinstanz |
| GitHub Required Quality | noch nicht bestanden | Erstlauf: checks/build inkl. Runtime- und Artefakt-Smoke grün; Chromium scheiterte an kurzzeitig ausgeblendeten Listen bei Hintergrundrevalidierung. Hook korrigiert, expliziter pending-read Browsertest ergänzt; aktualisierter Lauf erforderlich. |

Reproduktion: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run release:check`, `npm run css:check`, `pnpm audit --prod --audit-level high`, `node scripts/full-security-audit.mjs`. Das neue Browserinteraktionspaket `data` ist im QA-Plan für payments und umfassende Läufe enthalten. `BINSO_UX_INTERACTIONS=data` führt den sieben-Tab-Test separat aus. Für lokale Browser ist `BINSO_PLAYWRIGHT_MODULE` zu setzen; Chromium kann über `BINSO_CHROMIUM_EXECUTABLE` gewählt werden.

Die 25 verbindlichen Fälle und ihre verbleibenden Grenzen stehen in [v21-3-data-foundation.md](v21-3-data-foundation.md). Diese Tabelle bestätigt einzelne Prüfungen, keine vollständige fachliche Abnahme des Gesamtauftrags.
