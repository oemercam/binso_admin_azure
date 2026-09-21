# Binso Admin v18.6.1 – Build Fix

## Ursache des fehlgeschlagenen GitHub Builds #46

`app/layout.tsx` importierte `./mobile-shell-v18-6.css`, aber diese Datei wurde im Merge-Commit #14 nicht mit hochgeladen. GitHub zeigt im Commit nur sechs geänderte Dateien; die CSS-Datei fehlt. Next.js bricht deshalb im Schritt `Build Next.js application` ab.

## Korrekturen

- `app/mobile-shell-v18-6.css` ist im Release enthalten.
- GitHub Actions nutzt `ubuntu-24.04` statt `ubuntu-latest`.
- `Verify release` läuft vor `next build`.
- Next.js Build nutzt explizit Webpack (`next build --webpack`).
- Der Release-Check erkennt nun auch fehlende lokale CSS-/Asset-Imports.

## Upload-Hinweis

Beim Upload muss auch der versteckte Ordner `.github` übernommen werden. Die bestehende `package-lock.json` im Repository bleibt erhalten.
