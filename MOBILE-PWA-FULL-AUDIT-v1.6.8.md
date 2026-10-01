# Mobile/PWA Full Audit — v1.6.7

## Zusammengeführter Zielzustand
v1.6.7 übernimmt den bisherigen vollständigen Mobile/PWA-Audit und ergänzt den verbindlichen Navigationsstandard 217–245. Mobile/PWA bleibt dieselbe Businesslogik wie Desktop, erhält aber eine eigenständige, kompakte App-Navigation.

## Root-Cause-Komponenten
- `config/navigation.ts`: eine kanonische Quelle für Business-Routen; Desktop Sidebar, Mobile Mehr und Quick Create komponieren daraus
- `config/route-metadata.ts`: Parent-Area und aktive Bottom-Navigation
- `components/shell.tsx`: Header, Avatar, Bottom Navigation, Quick Create, Mehr, PWA/Browser-Back-State
- `components/navigation/mobile-navigation-row.tsx`: zentrale Navigationszeile
- `components/ui/responsive-overlay.tsx`: gemeinsamer Dialog-/Bottom-Sheet-Primitive mit Standard-X
- `styles/overlays.css`: content-adaptives Navigationssheet, Safe Areas, internes Scrolling
- `styles/tokens.css`: zentrale Layer-Hierarchie

## Mobile/PWA Navigation
Bottom Navigation bleibt `Start | Kunden | Neu | Zeit | Mehr`. `Neu` öffnet ausschliesslich Quick Create. `Mehr` öffnet keine Route und keine Vollbildnavigation, sondern ein content-adaptives Bottom Sheet über dem aktuellen Screen. Der Hintergrund bleibt sichtbar und wird nur neutral abgedunkelt.

Das Sheet besitzt die fachlichen Gruppen Verkauf, Projekte, Einkauf, Finanzen und Unternehmen. Die Einträge stammen aus den realen Workspace-Routen und werden vor dem Rendern über Plan und Berechtigungen gefiltert. Start und Quick Create werden nicht im Gesamtmenü dupliziert; Kunden und Zeiterfassung bleiben als fachlich sinnvolle Einträge im vollständigen Modulbaum vorhanden.

## Navigation Row
Jeder Eintrag nutzt dieselbe Zeilenkomponente: Icon, Bezeichnung und optional Badge/Chevron. Keine Icon-Cards, keine Card-in-Card-Navigation. Die gesamte Zeile ist klickbar, mindestens 48 px hoch und der aktive Bereich wird dezent über bestehende Surface-Tokens markiert.

## Benutzerbereich
Am Ende des Mehr-Sheets stehen dynamischer Benutzername/E-Mail, Einstellungen, Abmelden und die laufende App-Version. Benutzerwerte werden in Produktion aus `/api/me` geladen; der Firmenname wird aus `/api/organization` geladen. Logout verwendet weiterhin dieselbe sichere Session-Logik wie das Avatar-Menü.

## Avatar / Header
Der Mobile/PWA Header bleibt Logo + Avatar ohne globale Suche und ohne Blur/Glow/Gradient. Avatar bleibt der Account-/Einstellungs-Einstieg und nutzt denselben Inhalt wie Desktop. Mehr, Avatar und Quick Create sind funktional getrennte Oberflächen.

## History / PWA
Beim Öffnen von Mehr wird ein transienter History-State gesetzt. Browser/PWA Back schliesst das Sheet statt eine History-Schleife zu erzeugen. X, Backdrop und Zielauswahl schliessen ebenfalls korrekt. Bei Zielauswahl wird der transiente Overlay-State vor der Navigation bereinigt.

## Desktop-Schutz
Die Desktop-Sidebar behält Struktur, Darstellung und Verhalten. Nur die Route-Definitionen werden aus derselben kanonischen Quelle bezogen. Der neue Drawer-CSS-Vertrag liegt ausschliesslich im Mobile-Breakpoint.

## QA-Gates
- `mobile-navigation-sheet-selfcheck.mjs`
- `navigation-architecture-selfcheck.mjs`
- `mobile-pwa-full-audit-selfcheck.mjs`
- `ui-interaction-contract-selfcheck.mjs`
- bestehende UI/I18N/Overlay/Responsive/Document/Productivity Selfchecks
- lint, typecheck, security audit, production build, release check

Reale Browser-/PWA-Visual-QA bleibt zusätzlich erforderlich und ist in `MOBILE-PWA-VISUAL-QA-v1.6.7.md` definiert.
