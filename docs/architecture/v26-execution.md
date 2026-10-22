# V26 — lokale Umsetzung

Beginn22.10.2026, Basis `a64582c7` einschliesslich lokalem V25-IBAN-Fix `00bfe5ce`. Branch `feat/v26-modular-revision3`; V25-Branch bleibt auf seinem gesicherten Stand. Nutzer hat die paketweise Umsetzung ohne erneute Einzelfreigaben und ohne fortlaufende Push-/Testschleifen beauftragt. Keine Pushes in diesem Arbeitsblock; kein Merge/Deployment/produktive Migration.

| Paket | Status | Ergebnis / gezielte Prüfung |
| --- | --- | --- |
| P01 | Lokal abgeschlossen | [Owner-, API-/Ereignis- und erste Seitenverträge](v26-module-contracts.md); vorhandene Register statt paralleler Registry. Relative Links/Quellpfade und Diff kontrolliert; reine Dokumentation, keine App-Tests nötig. |
| P02 | Implementiert, Blockprüfung folgt | POST/PATCH lehnen nicht erlaubte Felder ausdrücklich ab statt sensible/Identity-Zusatzfelder still zu ignorieren. Bestehende Rechte und explizite Leseprojektion erhalten; keine unbestätigten Fachgrants vergeben. Die umfassende neue HR-/Payroll-Matrix F02 bleibt für spätere sensible APIs offen; diese Scheibe ist kein Abschluss aller Feld-/Self-Service-Rechte. |
| P03–P51 | Offen | [Paketplan](v26-gap-and-packages.md); genaue Ergebnis-/Commit-/Prüfzuordnung fortlaufend ergänzen. |

Prüfstrategie: gezielte risikogerechte Regressionen am Ende eines zusammenhängenden Blocks, Typecheck bei TS-Verträgen; keine Vollsuite/Build-/Browsermatrix nach einzelnen Änderungen. P0-Rechte-/RLS-/Finanz-/Scan-Grenzen werden nicht aufgeschoben oder abgeschwächt. Externe Payroll-/Produkt-/Provider-/Gerätefreigaben sind keine bestandenen Tests. GitHub-CI bleibt bis ausdrücklich genehmigtem gebündeltem Push auf dem V25-Head.
