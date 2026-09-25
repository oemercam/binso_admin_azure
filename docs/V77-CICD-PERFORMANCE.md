# V77 – CI/CD Performance und Deployment-Optimierung

## Ziel

V77 reduziert die Durchlaufzeit der GitHub-Actions-Pipeline, ohne Sicherheits-, Qualitäts-, Datenbank- oder Deployment-Kontrollen zu entfernen. Die Optimierung konzentriert sich auf Parallelisierung, Cache-Nutzung, kleinere Installationen im Produktions-Migrationsjob und messbare Build-/Deploy-Zeiten.

## Änderungen

### Parallele Hauptjobs

Die bisher serielle Kette `Build -> Critical E2E` wurde aufgelöst. Folgende Jobs laufen nun unabhängig und parallel:

- Isolated PostgreSQL migrations and RLS
- Quality and regression checks
- Build and package
- Critical E2E

Der Produktions-Migrationsjob wartet weiterhin auf alle vier erfolgreichen Ergebnisse. Dadurch bleibt die Freigabekette vollständig erhalten.

### Getrennter Quality-Job

Typecheck, Lint, Produktchecks und Regressionstests wurden vom Packaging getrennt. Der Next.js Build kann dadurch gleichzeitig mit diesen Prüfungen laufen. Der Production-Build führt weiterhin seine eigene Next.js/TypeScript-Prüfung aus.

### Next.js Build Cache

`.next/cache` wird über `actions/cache` zwischen CI-Läufen wiederverwendet. Der Schlüssel berücksichtigt Node 24, Lockfile und relevante Quellpfade. Bei Quelländerungen kann ein kompatibler Cache aus demselben Lockfile wiederverwendet werden.

### Playwright Cache

Chromium-Binaries werden zwischen E2E-Läufen gecacht. Die Systemabhängigkeiten werden weiterhin explizit installiert, damit der Test reproduzierbar bleibt.

### Produktions-Migration

Der Produktions-Migrationsjob installiert nur Production Dependencies (`pnpm install --frozen-lockfile --prod`). Die Migration bleibt unverändert über `pnpm db:migrate` und die vorhandenen Datenbank-Secrets abgesichert.

### CI- und Deployment-Messwerte

GitHub Step Summaries zeigen neu unter anderem:

- Dependency-Installationszeit
- Typecheck-/Lint-/Produktcheck-/Regression-Zeit
- Next.js Build-Zeit
- Standalone-Materialisierung
- ZIP-Erstellungszeit
- Standalone- und ZIP-Grösse
- Smoke-Test-Zeit
- Playwright-Setup und E2E-Zeit
- Produktions-Migrationszeit
- Azure Staging Deployment
- Staging Smoke
- Slot Swap
- Production Healthcheck

Damit können zukünftige Verschlechterungen direkt pro Run erkannt werden.

### Concurrency

Normale Push-/PR-CI-Läufe dürfen ältere CI-Läufe derselben Ref abbrechen. Manuelle Production-Deployments bleiben davon ausgenommen und werden nicht automatisch abgebrochen.

## Unveränderte Sicherheits- und Qualitätskontrollen

V77 entfernt keine der bestehenden Kontrollen. Insbesondere bleiben erhalten:

- PostgreSQL Migration Repeatability und RLS-Test
- Typecheck
- ESLint
- Security- und Secret-Hygiene-Checks
- Architektur- und Produktchecks
- Multi-Tenant-/Auth-/Billing-/Go-Live-Prüfungen
- Behavioral Regression Tests
- Critical E2E
- isolierter Standalone Smoke-Test
- immutable Deployment ZIP
- Deployment auf Staging Slot
- Staging Smoke-Test
- Slot Swap
- Production Healthcheck
- automatischer Reverse-Swap bei fehlgeschlagenem Production Healthcheck

## Erwarteter Effekt

Der grösste Zeitgewinn entsteht durch die Parallelisierung von Build, Quality, PostgreSQL und E2E. Zusätzlich reduzieren warme Next.js- und Playwright-Caches Wiederholungsarbeit. Die tatsächliche Verbesserung wird nicht geschätzt, sondern über die neuen GitHub Step Summaries gemessen.

## Schneller manueller Production-Deploy

Der manuelle Production-Workflow baut und testet denselben Commit nicht mehr ein zweites Mal. Stattdessen sucht er fail-closed nach einem **erfolgreichen Push-CI-Run für exakt denselben Commit-SHA**. Nur dessen unveränderliches Deployment-Artefakt darf verwendet werden.

Beim Push auf `main` werden zusammen mit `binso-one.zip` eine SHA-256-Prüfsumme und `artifact-metadata.json` gespeichert. Der manuelle Deploy:

1. findet einen erfolgreichen Push-Run für exakt `$GITHUB_SHA`,
2. lädt dessen Artefakt herunter,
3. prüft Commit-SHA und SHA-256,
4. führt erst danach die Produktionsmigration und den Azure-Deploymentpfad aus.

Existiert kein erfolgreicher Push-CI-Run für denselben Commit oder ist das Artefakt nicht mehr verfügbar, bricht der Production-Deploy ab. Dadurch wird keine Qualitätskontrolle übersprungen; die bereits erfolgreich ausgeführten Kontrollen werden lediglich nicht redundant wiederholt.
