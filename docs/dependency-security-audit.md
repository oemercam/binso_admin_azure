# Binso One – Dependency Security Audit Policy

Stand: 5. Oktober 2026

## Blocking production gate

Der verpflichtende CI-Sicherheitsgate lautet:

```bash
pnpm security:scan
```

und prüft ausschliesslich ausgelieferte Produktionsabhängigkeiten mit:

```bash
pnpm audit --prod --audit-level high
```

High- oder Critical-Findings in produktiven Runtime-Abhängigkeiten blockieren den Release.

## Full audit

Für die komplette Dependency-Struktur inklusive Development-/Build-Tools:

```bash
pnpm security:scan:all
```

Development-Findings werden nicht still ignoriert. Sie werden geprüft, dokumentiert und nach Verfügbarkeit eines Upstream-Fixes aktualisiert.

## Temporär akzeptiertes Development-Tool-Finding

Am 5. Oktober 2026 meldet der vollständige Audit:

- Advisory: GHSA-vfj7-8cjw-p6xm / CVE-2026-93687
- Package: `braces`
- Version: `3.0.3`
- Severity: High
- Pfad: `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`
- Verwendung: ESLint-/Build-Tooling, nicht Bestandteil des produktiven App-Service-Runtime-Bundles
- Upstream-Status am 5. Oktober 2026: keine gepatchte `braces`-Version veröffentlicht

Risikobehandlung:
- nicht als Runtime-Abhängigkeit ausliefern,
- keine benutzerkontrollierten Glob-Patterns an diese Lint-Toolchain übergeben,
- Production-Audit bleibt blockierend,
- Full-Audit bei Dependency-/Next.js-Updates erneut ausführen,
- Ausnahme entfernen, sobald Upstream einen Fix bzw. eine Toolchain ohne betroffene Version bereitstellt.

Diese Ausnahme gilt ausschliesslich für dieses konkrete Development-Tool-Finding. Neue High-/Critical-Findings werden dadurch nicht automatisch akzeptiert.
