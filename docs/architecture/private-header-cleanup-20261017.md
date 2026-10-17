# Redundante private Header-Zuordnung

Basis: Main nach PR #269 (`87c99b04`). Unabhängig vom CSS-Paket #270.

In `next.config.ts` war `/angebote/:path*` zweimal mit exakt denselben
`noStoreHeaders` registriert. Ausschliesslich den zweiten Eintrag entfernt.
Keine Route, Headerdefinition, CSP, sonstige Security-Einstellung oder
fachliche Konfiguration geändert.

Nachweis: Vorher-/Nachher-Konfiguration über den bestehenden TypeScript-
Testloader tatsächlich importiert und `headers()` ausgeführt. Die geordneten
effektiven Source-/Header-Zuordnungen sind gleich; alle übrigen exportierten
Next-Konfigurationsfelder ebenfalls. Für Angebote bleibt genau ein Eintrag mit
unverändertem `private, no-store` und `X-Robots-Tag` erhalten. Der vorhandene
Runtime-Integritätstest bestätigt weiterhin die geschützten Routen und seine
Negativfälle für Body-Limits, Origins, Logs und Service-Worker-Caches.

Runtime-Regression, vollständiges Lint, Typecheck und Produktionsbuild
bestanden. Bestehende GitHub-Quality-/CodeQL-
Gates bleiben erforderlich. Kein Deployment, keine Infrastrukturänderung.
