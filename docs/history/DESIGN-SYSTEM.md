# Binso One v0.8.0 – Design System

## Zentralisierung
`app/globals.css` enthält nur noch Imports:
- `styles/legacy.css`
- `styles/design-system.css`
- `styles/responsive.css`

Neue und übergreifende Styles gehören nicht mehr direkt in einzelne Komponenten oder an das Ende von `globals.css`.

## Typografie
Primär:
- Segoe UI Variable Text / Display
- Fallback: Segoe UI, System UI, Apple System Font, Arial

Zentrale Schriftgrössen:
- XS 11 px
- SM 12 px
- MD 14 px
- LG 16 px
- XL 20 px
- 2XL 28 px
- 3XL 34 px

## Spacing
4 / 8 / 12 / 16 / 20 / 24 / 32 px über CSS-Variablen.

## Mobile/PWA
- keine seitliche Navigation
- kompakter Header
- schwebende Bottom-Navigation
- zentrale `+`-Aktion
- Aktionen als Bottom Sheet
- Navigation „Mehr“ als gruppiertes Bottom Sheet
- Suche als Bottom Sheet
- Filter/Relationen als mobile Sheet-Popover
- Safe-Area berücksichtigt

## Dokumentvorschau
- Desktop: zentriertes Modal mit 24 px Rand
- Mobile/PWA: nahezu vollhohes Bottom Sheet
- A4-Vorschau wird je Viewport skaliert
- Toolbar hat konsistente Höhe, Abstände und Icon-Buttons
- Druck bleibt A4 ohne Mobile-Skalierung
