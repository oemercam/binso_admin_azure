# Mobile / PWA QA – v1.6.6

Zielbereiche: 320, 360, 390, 430 und 768 px sowie PWA standalone mit Safe Areas.

Zentrale Verträge:
- Global Header Mobile/PWA: nur originales Binso-Logo + Avatar; keine globale Suche.
- Header: flach, opak, ohne Blur/Glass/Glow/Gradient/Shadow; Safe Area gleiche Fläche; keine Positionssprünge.
- Bottom Navigation: Start · Kunden · + · Zeit · Mehr; Parent-Bereich über Route-Metadaten.
- Workspace-Content: keine zusätzlichen Back-Buttons, Back-Links, `Zurück zu …` oder `Zur Übersicht`.
- Browser-/PWA-History: Scrollposition wird bei History-Back wiederhergestellt.
- Avatar: gemeinsame Desktop-Account-Logik; Mobile/PWA als Bottom Sheet; Permissions bleiben identisch.
- Mehr: fachlich gruppiert, keine Duplikate von Kunden/Zeit/Account.
- Quick Create: Kunde · Offerte · Rechnung · Projekt · Zeit · Spese; Permission-/Plan-gefiltert.
- Listen: maximal zwei Informationszeilen, keine horizontale Desktop-Tabelle.
- Detail: arbeitsrelevante Daten zuerst, Stammdaten unter `Weitere Angaben`; Kundenort nicht als Primärinformation.
- Create/Edit: Pflichtfelder zuerst, optionale Felder progressiv; Kunde initial nur Firmenname erforderlich.
- Aktionen: eine klare Primäraktion; selten/destruktiv über Overflow/Sheet.
- Formulare/Overlays: 44 px Touch, 16 px Inputs, Viewport- und Safe-Area-konform; zwei gleichwertige Aktionen gleich breit.
- Kundenliste: keine E-Mail und kein Ort als Standardsekundärinformation.
- Dokumentvorschau: on-demand und innerhalb des Overlays viewport-sicher.
- Operator, Public, Auth, Onboarding und Systemseiten dürfen die Viewport-Breite nicht überschreiten.

Automatische Absicherung: `scripts/navigation-architecture-selfcheck.mjs` und `scripts/mobile-pwa-full-audit-selfcheck.mjs` prüfen Route-/Navigationsarchitektur und die zentralen Workspace-Verträge. Reale Visual-QA bleibt zusätzlich erforderlich; siehe `MOBILE-PWA-VISUAL-QA-v1.6.6.md`.
