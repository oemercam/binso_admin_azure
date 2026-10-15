# QA – Baseline cb1e5574

| Prüfung | Ergebnis | Evidenz / Grenze |
| --- | --- | --- |
| corepack pnpm install --frozen-lockfile | bestanden | pnpm 10.17.1; 386 Pakete, keine Lockfile-Änderung |
| repository:clean | bestanden | qa/clean.txt |
| docs:check | bestanden | qa/docs.txt |
| release:check | bestanden | qa/release.txt; statisches Gate ist keine Freigabe |
| lint | bestanden | qa/lint.txt |
| css:check | bestanden | qa/css.txt |
| typecheck | bestanden | qa/typecheck.txt |
| build | bestanden | qa/build.txt; keine live validierten Secrets vorausgesetzt |
| security:scan | bestanden | qa/security.txt; keine bekannten produktiven Advisories in dieser Abfrage; keine manuelle Security-Abnahme |
| pnpm test | blockiert / fehlgeschlagen | qa/baseline-test.txt; Scanner: listen EPERM |
| Alle 32 Test-Einträge separat diagnostisch | 31 bestanden, 1 fehlgeschlagen | independent-test-results.json; ersetzt nicht pnpm test |
| PostgreSQL unter echter Runtime-Rolle | nicht ausgeführt | DATABASE_URL fehlt; PGlite-/Quelltests ersetzen diese Prüfung nicht |
| Browser / Screenshots / Accessibility | nicht ausgeführt | Lokale Server-Listener blockiert; vorhandene alte Screenshots nicht als V24-Evidenz übernommen |
| Physische iOS-/Android-PWA | nicht ausgeführt | Gerätetest offen |
| Produktions-Health | HTTP-Erfolg | release 03929b8; kein Nachweis von /api/health/ready, DB, Mail oder Billing |

Keine Pflichtprüfung deaktiviert oder in eine scheinbar erfolgreiche Abnahme umgedeutet. Keine vollständige QA-/Release-Freigabe.
