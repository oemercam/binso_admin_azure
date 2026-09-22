# Binso Admin v20 – Mobile/PWA Foundation

## Ziel
Mobile und PWA werden nicht mehr durch historische CSS-Patches korrigiert. Eine einzige Foundation besitzt das Layout unter 760 px.

## Zentrale Regeln
- Desktop-Basis bleibt in `globals.css`.
- Mobile/PWA lebt ausschliesslich in `ui-foundation-v20.css`.
- `visualViewport` liefert `--app-vw` und `--app-vh`.
- Seiten nutzen adaptive Gutters und iOS Safe Areas.
- Die Bottom-Pille reserviert zentral Platz im Content.
- Lange Aufgaben sind Fullscreen-Editoren.
- Kurze Aufgaben sind Bottom Sheets.
- Dokumente laufen in einem separaten Fullscreen-Viewer.
- Listen sind auf Mobile kompakt und nutzen dieselbe Zeilengeometrie.
- Logo rendert genau ein Bild.
- Toggle hat eine einzige Geometrie.
- Navigation, X und Chevron nutzen dasselbe 44-px-Action-Raster.

## Kompatibilität
Bestehende `form-sheet`-Markup-Varianten werden von der Foundation zentral normalisiert. Neue UI sollte `AppSheet` verwenden.

## Quality Gate
`npm run audit:mobile-ui` verhindert, dass alte versionierte Stylesheets wieder eingeführt werden.
