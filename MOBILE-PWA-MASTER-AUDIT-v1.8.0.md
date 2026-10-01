# Mobile/PWA Master Audit v1.8.0

## Architektur

- Eine primäre Mobile-Navigation: Start | Kunden | Neu | Zeit | Profil.
- Kein permanenter authentifizierter Mobile-Header mit Logo/Avatar.
- Eigene mobile Strukturen für Dashboard, Modulübersicht, Listen, Details und Formulare.
- Gemeinsame Businesslogik bleibt zwischen Desktop und Mobile erhalten.
- Mobile/PWA-Styling bleibt zentral in `styles/mobile-pwa.css`.

## Route Coverage

70 Workspace-Seiten werden durch die kanonischen Route-Familien abgedeckt. Neu hinzugekommen ist `/module` als vollständige mobile Modulübersicht.

## Interaktionen

- Quick Create: Bottom Sheet.
- Profil: Bottom Sheet.
- Filter/Sortierung: Bottom Sheet.
- Ansicht Liste/Karten: direkter Toggle ohne Zwischenmenü.
- Detailaktionen: Mobile-Topbar + Bottom Sheet.
- Create/Edit: progressive Felder + sticky Abschlussaktionen.
- Timer: serverseitig persistenter bestehender Timer-Workflow; Mobile-Darstellung app-zentriert.

## Themes

Light: weisser Hintergrund, schwarzer Text. Dark: schwarzer Hintergrund, weisser Text. Semantische Farben bleiben ausschliesslich für Status/Feedback bestehen.

## Datenbank

Keine neue Migration für v1.8.0.
