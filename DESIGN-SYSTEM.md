# Binso One Design System

Der aktive CSS-Stack ist zentralisiert und besteht nur aus vier Einstiegspunkten:

- `styles/tokens.css` — semantische Farben, Typografie, Spacing, Safe Areas, Motion und Z-Index.
- `styles/app.css` — zentrale Komponenten- und Anwendungsstile.
- `styles/responsive-central.css` — Mobile/PWA-, Tablet- und responsive Layoutregeln.
- `styles/overlays.css` — einzige Quelle für Dialoge, Bottom Sheets und Overlay-Geometrie.

Neue versionsspezifische CSS-Dateien wie `v1.x.x.css` sind nicht zulässig. Neue Komponenten verwenden die zentralen Tokens und UI-Primitives unter `components/ui`.

## Mobile/PWA

- Seitenränder und Safe Areas werden über `--safe-*` und `--page-gutter-mobile` gesteuert.
- Der App-Header und die Bottom-Navigation verwenden dieselben zentralen Höhen- und Z-Index-Tokens.
- Dialoge und Bottom Sheets verwenden ausschliesslich `ResponsiveOverlay`.
- Zwei gleichwertige Aktionen wie Zurück/Weiter oder Abbrechen/Speichern werden gleich breit dargestellt.
- Inhalte dürfen nicht mit `100vw` in gepaddeten Content-Containern arbeiten.

## Themes

Light und Dark verwenden dieselben semantischen Tokens. Kontrast entsteht über Surface-Ebenen, Borders und Typografie, nicht über willkürliche lokale Schwarz-/Weisswerte.
