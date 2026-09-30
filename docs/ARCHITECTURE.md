# Binso One Architektur

Binso One bleibt eine Next.js-Anwendung, trennt aber drei Oberflächen logisch: öffentliche Website (`/`), Kundenportal (`/portal` als Einstieg, fachliche Module nach erfolgreicher Sitzung) und Betreiberbereich (`/operator`). Eine spätere Zuordnung zu `binso.ch`, `app.binso.ch` und `admin.binso.ch` ist dadurch vorbereitet.

UI-Komponenten verwenden zentrale Tokens aus `styles/tokens.css`; Komponenten-, Responsive- und Overlay-Regeln liegen zentral in `styles/app.css`, `styles/responsive-central.css` und `styles/overlays.css`. Interaktive Standardbausteine liegen unter `components/ui`. Business- und Datenzugriffslogik bleibt ausserhalb von Präsentationskomponenten in `lib/server`, Repositories und API-Routen. Rollen und Berechtigungen sind zentral in `lib/permissions.ts` definiert.
