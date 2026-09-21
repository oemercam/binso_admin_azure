# Binso Admin v10 – E2E Audited Demo

Dieser Stand behebt die systemischen Quick-Create-/Deep-Link-Probleme und enthält einen statischen End-to-End-Audit sowie einen manuellen Smoke-Testplan.

Vor Merge/Deployment:

```bash
npm run audit:e2e
npm run typecheck
npm run build
```

Im GitHub/Azure-Setup reicht der bestehende `package-lock.json` des Repositories. Diese Distribution ersetzt ihn absichtlich nicht.

Siehe:
- `E2E_AUDIT.md`
- `TEST_PLAN.md`
- `ARCHITECTURE.md`
- `FEATURE_MAP.md`

Wichtig: Datenpersistenz, PDF-Dateiuploads, echter Microsoft-Graph-Versand, automatische Jobs, revisionssicheres Audit-Log und Push-Zustellung sind noch Produktionsintegrationen und nicht als fertig zu betrachten.
