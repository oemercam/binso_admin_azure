# QA Report v1.3.0

## Automatisierte / statische Gates im Artefakt
- Release readiness script
- Permission self-check
- Production self-check
- Migration sequence / required files
- TypeScript/TSX syntax transpilation (ohne Projekt-Dependency-Auflösung)
- interne `@/` Importauflösung
- JavaScript/MJS Syntaxcheck

## Lokale Pflichtprüfung vor GitHub
Da das Artefakt-Laufzeitsystem keine Projekt-Dependencies aus der Registry installieren kann, ist der Windows-Lauf des Benutzers die definitive Prüfung:

```powershell
pnpm install
pnpm release:check
pnpm permissions:test
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Erst bei komplett grünem Lauf nach GitHub pushen.

## Manuelles UX-QA
Vor Pilotstart prüfen:
- Desktop 1366/1440/1920
- Laptop 1024–1280
- iPad/Tablet Portrait + Landscape
- iPhone Safari/PWA
- Android Chrome/PWA
- Samsung Internet
- Light/Dark/System
- Tastatur-Navigation / Fokus
- Dokumentvorschau / Print
- Support Diagnose/Screenshot/Anhang
- Anmeldung/MFA/Reset/Einladung

## Fachliche Abnahme
Finanz-, Lohn-, Steuer-, Bank- und rechtlich verbindliche Dokumentprozesse sind zusätzlich fachlich abzunehmen; technisches QA ersetzt keine fachliche oder juristische Validierung.
