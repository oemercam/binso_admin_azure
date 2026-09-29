# Binso One – Modern Web / PWA / SEO / Device Baseline (Working vNext)

## Implementiert
- Originale Binso SVG-Logos ohne Hintergrundflächen, transparent und enger zugeschnitten.
- Grössere Logo-Darstellung passend zu Sidebar, Header, Auth und Marketing.
- Zentraler Hell/Dunkel/System-Modus mit passenden schwarzen/weissen Markenassets.
- Initialer App-Loader und Route-Loader mit Binso Icon; `prefers-reduced-motion` berücksichtigt.
- Favicon + PNG-Iconset 48/96/144/180/192/256/384/512/1024.
- Apple Touch Icon 180x180 sowie maskable PWA Icons 512/1024.
- erweitertes Web App Manifest mit Shortcuts, Kategorien, Scope und Display-Fallbacks.
- Metadata: canonical, Open Graph, Twitter, Keywords, App-Metadaten und Theme Colors.
- `robots.ts` und `sitemap.ts` mit Trennung öffentlicher und angemeldeter Bereiche.
- Organization/LocalBusiness und SoftwareApplication JSON-LD.
- öffentliche Kontaktseite mit Anschrift, Telefon, E-Mail und Google-Maps-Link.
- responsive Baseline für Desktop, Laptop, Tablet, Mobile und kleine Mobilgeräte.
- Safe Areas, Touch-Interaktion und Reduced-Motion-Baseline.
- Desktop-Sidebar Hover/Active-Zustände sauber getrennt.

## Vor Go-Live extern erledigen / verifizieren
- Google Search Console Property und Sitemap registrieren.
- Google Business Profile beanspruchen/verifizieren und NAP-Daten exakt identisch halten.
- Bing Webmaster Tools registrieren.
- echte OG/Social-Cover-Grafik in 1200x630 bereitstellen (statt App-Icon).
- finale Produktionsdomain in `NEXT_PUBLIC_SITE_URL` setzen.
- Lighthouse / WebPageTest / Core Web Vitals unter Produktionsbedingungen messen.
- reale Browser-/Device-Tests: Chrome, Edge, Firefox, Safari; iOS/iPadOS Safari; Android Chrome; Samsung Internet.
- PWA Installation auf iPhone/iPad, Pixel/Samsung, Windows und macOS prüfen.
- strukturierte Daten mit Google Rich Results Test und Schema Validator prüfen.
- 404/500/Offline/Service Worker und Update-Szenarien testen.

## Ziel-Breakpoints
- >= 1281 px: Desktop / Wide Desktop
- 1025–1280 px: Laptop
- 761–1024 px: Tablet / Small Laptop
- 421–760 px: Mobile
- <= 420 px: Compact Mobile

Browserstrategie: Standards und Feature Detection statt User-Agent-Sonderlogik.
