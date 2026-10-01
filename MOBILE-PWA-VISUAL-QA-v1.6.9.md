# Binso One v1.6.9 — Visual QA Matrix

## Viewports
375x667, 390x844, 393x852, 430x932 sowie 844x390 Landscape.

## Modi
Mobile Light, Mobile Dark, Browser und installierte PWA. Desktop bleibt Regression-Scope.

## Repräsentative Screens
Dashboard; Kundenliste; Kundendetail; Kunde erstellen; Offerte erstellen Schritte 1–4; Rechnung erstellen Schritte 1–4; Projektliste/-detail/-create; Zeiterfassung idle/running; Quick Create; Mehr; Account Panel; lokale Suche; Filter/Sort/View; Dropdown/Relationship Picker; Success/Error Toast.

## Verbindliche Prüfpunkte
- Light: Hauptflächen weiss, Text schwarz.
- Dark: Hauptflächen schwarz, Text weiss.
- Keine graue Card-Landschaft oder Card-in-Card-Struktur.
- Header stabil: Logo + Avatar, kein Blur/Glow/Gradient/Schatten.
- Floating Bottom Pill verdeckt keinen Content.
- Quick Create nur inhaltshoch; Mehr vollhoch; Account von oben.
- Kein identischer title/subtitle; keine technischen `lokal/yerel`-Marker.
- Lokale Suche verursacht keinen Layout Shift.
- Dropdowns/Keyboard/Safe Areas schneiden nichts ab.
- Sticky Actions liegen oberhalb Bottom Nav/Home Indicator.
- Running Timer nur aktiv sichtbar; Toasts oben und ohne Timer-Kollision.
- DE/EN/FR/IT/TR ohne gemischte Fallback-Sprache.

Automatisierte Source-/Contract-Checks sind Teil von `pnpm test`. Echte Browser-/Geräte-Screenshots werden nicht als bestanden behauptet, solange sie nicht in einer Browserumgebung ausgeführt wurden.
