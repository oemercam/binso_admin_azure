# Design System

Die UI-Basis ist seit v1.4.0 zentralisiert:

- `styles/tokens.css`: semantische Tokens für Farben, Typografie, Spacing, Safe Areas, Controls, Motion und Z-Index.
- `styles/app.css`: gemeinsame UI- und Produktkomponenten.
- `styles/responsive-central.css`: alle Mobile/PWA- und responsive Regeln.
- `styles/overlays.css`: Dialog-/Bottom-Sheet-System.

`ResponsiveOverlay` ist der einzige Standard für Dialoge und Bottom Sheets. Es rendert per Portal auf `document.body`, sperrt den Hintergrund, behandelt ESC und Fokus und stellt Action-Bereiche auf Mobile/PWA safe-area-konform dar.

Versionierte CSS-Patchdateien sind nicht mehr Teil der aktiven Architektur.

## Shell and navigation ownership

Header, sidebar, mobile bottom navigation, account menu, public marketing navigation and footer are canonical components. Their layout rules live only in `styles/shell.css`. Mobile/PWA chrome uses opaque token-based surfaces, central safe-area variables and shared z-index tokens. Do not add page-specific header/navigation CSS overrides.
