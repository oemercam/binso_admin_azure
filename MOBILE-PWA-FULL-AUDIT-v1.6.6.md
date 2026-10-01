# Mobile/PWA Full Audit — v1.6.6

## Zusammengeführter Zielzustand
Die Anforderungen aus dem 90-Punkte Mobile/PWA-Audit und den Ergänzungen 137–174 werden gemeinsam behandelt. Mobile/PWA ist keine verkleinerte Desktop-Seite, sondern dieselbe Businesslogik mit kompakter App-Präsentation.

## Root-Cause-Komponenten
- `components/shell.tsx`: globaler Header, Avatar, Bottom Navigation, Quick Create, Mehr
- `config/navigation.ts`: Desktop-, Mobile-Mehr- und Quick-Create-Definitionen
- `config/route-metadata.ts`: Parent-Area und aktive Navigation
- `components/module-page.tsx`: zentrale Listen
- `components/detail-page.tsx`: zentrale Detailseiten
- `components/entity-form.tsx`: zentrale Create-Flows / Progressive Disclosure
- `components/business-document-editor.tsx`: Offerte/Rechnung
- `components/ui/list-toolbar.tsx`: Suche/Filter/Sortierung/Ansicht
- `components/ui/responsive-overlay.tsx`: Bottom Sheet/Dialog
- `styles/shell.css` und `styles/responsive-central.css`: zentrale responsive Geometrie

## Navigation
Workspace-Content enthält keine separate Back-Komponente mehr. Mobile/PWA verwendet Bottom Navigation, Mehr, fachliche List-/Detailnavigation sowie Browser/PWA-History. Desktop verwendet seine bestehende Navigation. `PageBackButton` wurde entfernt, nicht nur versteckt.

## Header
Mobile/PWA: nur originales Binso-Logo und Avatar. Globale Suche ist Mobile/PWA nicht Teil des Headers; Listen verwenden kontextbezogene Suche. Header-Hintergrund und Safe Area bilden eine einheitliche, flache Fläche ohne Glass/Blur/Glow/Gradient/Shadow.

## Account
Desktop-Popover bleibt erhalten. Mobile/PWA verwendet `ResponsiveOverlay` als Bottom Sheet. Inhalt, Berechtigungen, Links, Theme und Logout stammen aus derselben React-Quelle.

## Informationsdichte
Listen bleiben kompakt, Detailseiten priorisieren Arbeitsdaten, zusätzliche Stammdaten liegen unter `Weitere Angaben`. Für Kunden ist PLZ/Ort keine primäre Detailinformation und die Kundenliste zeigt weder E-Mail noch Ort als Standardsekundärzeile.

## Formulare
Create-Flows zeigen zuerst notwendige Angaben; zusätzliche Felder bleiben progressiv. Kunde startet mit Firmenname, E-Mail ist optional. Offerte/Rechnung behält Kunde, Datum/Fälligkeit und Positionen als Kern und öffnet die vollständige Dokumentvorschau nur bei Bedarf.

## QA-Gates
- `navigation-architecture-selfcheck.mjs`
- `mobile-pwa-full-audit-selfcheck.mjs`
- `mobile-pwa-standard-selfcheck.mjs`
- bestehende UI/I18N/Overlay/Responsive/Document/Productivity Selfchecks
- lint
- typecheck
- security audit
- production build
- release check

Reale Browser-/PWA-Visual-QA bleibt zusätzlich erforderlich und ist in `MOBILE-PWA-VISUAL-QA-v1.6.6.md` definiert; sie darf nicht durch Selfchecks ersetzt werden.
