# Binso Admin V20

Zentralisierte Next.js-Anwendung für die interne Administration von Binso GmbH.

## Stack

- Next.js 16
- React 19
- TypeScript
- Node.js Runtime
- Microsoft Azure App Service
- PWA / Mobile Browser / Desktop

## Repository-Struktur

- `app/` – App Router, Seiten, API-Routen und globale Styles
- `components/` – zentrale UI-, Navigation-, Provider- und Overlay-Komponenten
- `lib/` – Auth, HTTP, Konfiguration, Daten- und Browser-Helfer
- `modules/` – fachliche Domänenmodelle und Regeln
- `types/` – gemeinsame Domain-Typen
- `database/` – Datenbankschema
- `public/` – PWA- und Brand-Assets
- `.github/workflows/` – Azure Deployment

## Entwicklung

```bash
npm install
npm run dev
```

## Prüfungen

```bash
npm run typecheck
npm run build
```

## Deployment

Die Anwendung wird über den GitHub-Actions-Workflow unter `.github/workflows/` nach Azure App Service deployt.

Falls im bestehenden GitHub-Repository bereits eine gültige `package-lock.json` vorhanden ist, diese beibehalten. Das aktuelle Source-Bundle enthält keinen neu erzeugten Lockfile-Stand.

## Nicht ins Repository einchecken

`node_modules`, `.next`, Build-Artefakte, Logs, lokale `.env`-Dateien und `*.tsbuildinfo` sind über `.gitignore` ausgeschlossen.
