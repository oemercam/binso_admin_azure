# Binso Admin v18.5.1 – Build Stabilisierung

- Produktionsbuild verwendet explizit den stabilen Webpack-Pfad (`next build --webpack`) statt des Next.js-16-Turbopack-Defaults.
- GitHub Actions ist auf `ubuntu-24.04` fixiert, damit die angekündigte `ubuntu-latest`-Migration auf Ubuntu 26 den Build nicht unerwartet verändert.
- Next.js Telemetrie ist im CI-Build deaktiviert.
- Release-Audit und TypeScript-Prüfung bleiben unverändert aktiv.
- Der vorhandene `package-lock.json` im Repository bleibt bestehen und soll nicht ersetzt werden.
