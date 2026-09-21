# Binso Admin v18.6 – Mobile shell and viewport hardening

## Ziel
Alle mobilen Overlays und Seiten verwenden dieselbe sichtbare Viewport-Geometrie. Das verhindert Überdeckungen durch iOS Safari, die Home-Area und die schwebende Binso-Navigation.

## Zentralisierte Regeln
- normale Seiten reservieren unten Platz für die schwebende Navigation
- Mobile-Pill folgt dem sichtbaren VisualViewport
- Navigation ist ein echtes Bottom Sheet und reserviert keinen Platz für die ausgeblendete Pill
- kurze Aufgaben sind Bottom Sheets
- lange Formulare sind Fullscreen-Editoren
- Fullscreen-Editoren werden auf die tatsächliche sichtbare iOS-Viewport-Höhe begrenzt
- Header und Footer bleiben erreichbar
- Safe Area wird zentral berücksichtigt
- das sichtbare X hat überall einen 44x44 Touch-Bereich und ist am Inhaltsrand ausgerichtet

## PWA / Service Worker
Next.js JavaScript und CSS werden nicht mehr cache-first ausgeliefert. Dadurch können alte Chunks nach einem Deployment nicht mehr bevorzugt aus dem Service-Worker-Cache geladen werden.
