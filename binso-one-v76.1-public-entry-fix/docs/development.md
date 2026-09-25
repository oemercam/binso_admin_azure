# Entwicklung

## Ziel
Binso One bleibt pragmatisch: Kernprozesse in Sekunden, Sicherheits- und Qualitätskontrollen automatisch. Keine unnötige Enterprise-Komplexität.

## Lokaler Start
1. Node.js 24 verwenden (`.nvmrc`, `package.json#engines`).
2. `pnpm install --frozen-lockfile`
3. `.env.example` nach `.env.local` kopieren und nur lokale Werte setzen.
4. `pnpm dev`

## Vor einem Push
`pnpm lint`
`pnpm typecheck`
`pnpm test`
`pnpm build`

Bei kritischen Geschäfts-, Auth- oder Navigationsänderungen zusätzlich `pnpm test:e2e`.

## Produktregel
Häufige Arbeitsschritte stehen zuerst. Seltene Optionen werden progressiv eingeblendet. Ein neuer Kunde benötigt zunächst nur den Firmennamen. Ein Angebot benötigt Kunde, Titel, Position und Preis. Vollständige Empfängerangaben werden erst vor dem Versand validiert.

## Regression
Bedeutende Bugs erhalten, wenn praktisch möglich, zuerst einen reproduzierenden Test; danach wird der Bug behoben.
