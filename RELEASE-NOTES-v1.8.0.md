# Binso One v1.8.0

## Mobile/PWA Mockup Parity

- Mobile/PWA wurde strukturell auf das freigegebene App-First-Mockup ausgerichtet; nicht nur per CSS-Override.
- Eigenes Mobile-Dashboard mit Begrüssung, kompakten KPI-Kacheln, letzten Aktivitäten und offenen Punkten.
- Neue vollständige Modulübersicht unter `/module`, erreichbar über das Grid-Symbol.
- Listenansichten mit kompakter Titel-/Zählerhierarchie, direktem Ansichtswechsel und flachen Datensatzzeilen.
- Detailseiten mit eigener Mobile-Topbar, Zurück-Navigation, Modulzugriff und kontextbezogenen Aktionen.
- Create/Edit-Formulare mit Mobile-Topbar, Progression und sticky Aktionen.
- Zeiterfassung visuell als App-Timer ausgerichtet; globaler laufender Timer bleibt persistent sichtbar.
- Mobile Einstellungen/Profile, Auth und Onboarding wurden auf die kompakte App-Hierarchie angepasst.
- Bottom Sheets, Safe Areas, Top-Toasts sowie Light/Dark bleiben zentral in `styles/mobile-pwa.css`.
- Neue i18n-Texte für DE/EN/FR/IT/TR ergänzt.
- Desktop bleibt unverändert; neue Regeln sind auf max. 760 px gescoped.
- Keine neue Datenbankmigration.
