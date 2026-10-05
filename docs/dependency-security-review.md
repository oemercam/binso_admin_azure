# Binso One – Dependency Security Review

Stand: 5. Oktober 2026

## Blocking production gate

Der Quality-Workflow führt aus:

```bash
pnpm audit --prod --audit-level high
```

High- und Critical-Advisories in **Produktionsabhängigkeiten** blockieren den Release.

## Bekannter Dev-Tooling-Befund

Der vollständige Audit (`pnpm security:scan:all`) meldet derzeit:

- Advisory: `GHSA-vfj7-8cjw-p6xm`
- Paket: `braces@3.0.3`
- Pfad: `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`
- Schweregrad: High
- Verwendung: ausschliesslich Entwicklungs-/Lint-Toolchain
- Produktionsbundle: nicht enthalten
- von pnpm gemeldete gepatchte Version: keine

Dieser Befund wird deshalb nicht durch einen erzwungenen Package-Override umgangen. Ein Override auf eine inkompatible oder nicht existierende Version würde die Toolchain destabilisieren, ohne das Produktionsrisiko zu reduzieren.

## Behandlung

- Produktionsabhängigkeiten bleiben ein hartes Release-Gate.
- Der vollständige Dev-Dependency-Audit wird bei Dependency-/Next-/ESLint-Upgrades erneut geprüft.
- Sobald eine upstream-kompatible Behebung verfügbar ist, werden Lockfile und Toolchain aktualisiert.
- Neue High-/Critical-Advisories in Produktionsabhängigkeiten dürfen nicht als Ausnahme aufgenommen werden.

## Review

Spätestens bei jedem Upgrade von Next.js, `eslint-config-next`, ESLint oder pnpm sowie vor dem kommerziellen Go-live nochmals ausführen:

```bash
pnpm security:scan
pnpm security:scan:all
```
