# Mobile / PWA QA – v1.6.5

Geprüfte Zielbereiche: 320, 360, 390, 430 und 768 px sowie PWA standalone mit Safe Areas.

Zentrale Verträge:
- Topbar: Marke · Suche · Benutzerprofil.
- Bottom Navigation: Start · Kunden · + · Zeit · Mehr.
- icon-only Back-Navigation auf Detail/Create/Dokument/Support.
- Listen: maximal zwei Informationszeilen, keine horizontale Desktop-Tabelle.
- Detail: arbeitsrelevante Daten zuerst, Stammdaten unter «Weitere Angaben».
- Create/Edit: Pflichtfelder zuerst, optionale Felder progressiv.
- Aktionen: eine klare Primäraktion; selten/destruktiv über Overflow/Sheet.
- Formulare/Overlays: 44 px Touch, 16 px Inputs, Viewport- und Safe-Area-konform.
- Back-Navigation stellt Scrollposition wieder her.
- Kundenliste zeigt keine E-Mail als primäre Information.
- Dokumentvorschau bleibt on-demand und innerhalb des Overlays viewport-sicher.
- Operator, Public, Auth, Onboarding und Systemseiten dürfen die Viewport-Breite nicht überschreiten.

Automatische Absicherung: `scripts/mobile-pwa-full-audit-selfcheck.mjs` inventarisiert alle Workspace-Seiten und prüft die zentralen Route-Familien und UI-Verträge.
