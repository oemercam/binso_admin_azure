# Binso One Architektur

Binso One bleibt eine Next.js-Anwendung, trennt aber drei Oberflächen logisch: öffentliche Website (`/`), Kundenportal (`/portal` als Einstieg, fachliche Module nach erfolgreicher Sitzung) und Betreiberbereich (`/operator`). Eine spätere Zuordnung zu `binso.ch`, `app.binso.ch` und `admin.binso.ch` ist dadurch vorbereitet.

UI-Komponenten verwenden zentrale Tokens aus `styles/foundation.css`. Interaktive Standardbausteine liegen unter `components/ui`. Business- und Datenzugriffslogik bleibt ausserhalb von Präsentationskomponenten in `lib/server`, Repositories und API-Routen. Rollen und Berechtigungen sind zentral in `lib/permissions.ts` definiert.
