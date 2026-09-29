# Binso One v1.3.1

## Mobile, PWA und Darstellung
- Mobile/PWA-Typografie und Abstände kompakter vereinheitlicht.
- Buttons und CTA-Beschriftungen bleiben einzeilig; lange Labels werden layoutseitig geschützt.
- Light/Dark-Kontraste erweitert und verbleibende helle Legacy-Flächen im Dark Mode korrigiert.
- Toggle-Geometrie neu ausgerichtet: Thumb vertikal zentriert und symmetrische Endpositionen.
- Theme-Auswahl Hell/Dunkel/System mit klareren aktiven und inaktiven Zuständen.
- Landingpage erhält eine echte Mobile-Navigation mit Hamburger, Drawer, Sprache, Login und Trial-CTA.

## PWA und Zugänge
- Marketing-PWA startet auf `/`.
- Kundenportal erhält `/portal`, `/portal/login` und `/portal/registrieren` sowie ein eigenes Manifest.
- Betreiberbereich erhält ein eigenes PWA-Manifest unter `/operator`; `/admin` dient als Alias.
- Globales Manifest startet nicht mehr direkt auf `/dashboard`.
- Service Worker wurde für die getrennten Oberflächen und Offline-Navigation aktualisiert.

## Demo und Registrierung
- Produktionsdemo erstellt eine echte isolierte Demo-Organisation mit serverseitiger Session und Beispieldaten.
- Demo benötigt keine Registrierung und führt nicht mehr über den lokalen Browser-Speicher in den Produktionsmodus.
- Trial-Registrierung bleibt getrennt von der Demo.
- Passwortanforderung in UI und Backend ist im Produktivbetrieb auf 12 Zeichen abgeglichen.
- Login/Registrierung verfügen über Busy-/Fehlerzustände und bessere Autocomplete-/MFA-Unterstützung.

## Übersetzungen
- Deutsch, Englisch, Französisch, Italienisch und Türkisch verfügbar.
- Türkisch in Benutzerprofil/API und DB-Constraint ergänzt.
- Gefährliche substring-basierte Übersetzung entfernt; Übersetzungen werden als exakte Phrasen angewandt.
- Marketing-, Auth-, Navigation-, Modul-, Status- und zentrale Portaltexte wurden erweitert und fachlich bereinigt.
- Direkte Übersetzung in Auth-Flows reagiert unmittelbar auf Sprachwechsel.

## Azure / CI
- Bewährtes Next.js-Standalone-Deployment beibehalten.
- Build verwendet bis zur späteren Custom-Domain die aktuelle Azure-Web-App-URL als Site URL.
- `release:check` ist Bestandteil der CI.
- Nach Deployment prüft die Pipeline `/api/health`, damit ein technisch grünes Deployment mit nicht startender App nicht unbemerkt bleibt.

## Plattform-Modernisierung ergänzt
- Zentrale semantische Design Tokens in `styles/foundation.css` für Farben, Typografie, Spacing, Radien, Controls, Motion, Z-Index und Light/Dark.
- Wiederverwendbare UI-Primitives für Button, IconButton, Formularfelder, Card, PageHeader, StatePanel und ResponsiveOverlay ergänzt.
- `ResponsiveOverlay` bildet Desktop-Dialog und Mobile/PWA-Bottom-Sheet aus derselben Komponente ab, inklusive Escape, Fokus-Rückgabe, Scroll Lock und Safe Area.
- Mobile Bottom Navigation auf fünf häufige Hauptbereiche reduziert: Start, Projekte, Zeit, Rechnungen, Mehr.
- Zentrale Navigation nach `config/navigation.ts` verschoben; zentrale App-Konfiguration und Entitlements ergänzt.
- Connectivity-State (online/offline/reconnecting), Offline-Hinweis und kontrollierte PWA-Update-UX ergänzt.
- Service Worker speichert keine API-, Portal-, Betreiber- oder fachlichen Kundendaten im Cache.
- Deep Links werden nach erfolgreichem Login über einen validierten `next`-Pfad wieder aufgenommen.
- Logout bereinigt benutzerspezifischen Runtime-/Browser-State, ohne Theme/Locale unnötig zu löschen.
- Notification Center um „alle gelesen“ und mandantenbezogene Kanalpräferenzen für In-App, E-Mail und Push ergänzt.
- Migration `009_platform_foundation.sql` ergänzt Notification Preferences, persistente Idempotency Keys und begründete Indizes.
- Idempotency-Server-Utility für kritische Mutationen ergänzt.
- Betreiberübersicht zeigt Deployment-Version, DB-Latenz sowie konfigurierten Zustand von E-Mail, Billing und Storage ohne Secrets.
- Öffentlicher Health-Endpoint gibt nur minimalen Status, Service, Version und Zeitstempel zurück.
- Landingpage visuell beruhigt: kleinere Headlines, weniger Card-Flächen, kein Fake-Browserrahmen, stärkerer Produktfokus.
- CI auf feste Ubuntu-24.04-Runner sowie aktuelle Node-24-fähige GitHub Actions für Checkout, Node Setup, Artifact Upload/Download und Azure Login aktualisiert.

## Mobile Auth und Onboarding
- Login und Demo erscheinen auf Mobile/PWA als app-artiges Bottom Sheet mit Safe-Area-Unterstützung.
- Registrierung ist bewusst kein Bottom Sheet: zweistufiger Full-Screen-Flow für Plan/Abrechnung und Kontodaten.
- Onboarding auf drei kurze Schritte reduziert, mit Fortschrittsanzeige, Zurück/Weiter, Abbruchbestätigung und Erfolgsmeldung.
- Mobile Onboarding-Aktionen sind sticky und berücksichtigen die iOS Safe Area.
- Onboarding-Texte wurden in Deutsch, Französisch, Italienisch, Englisch und Türkisch ergänzt.

## Marketing motion polish
- Hamburger icon morphs smoothly between menu and close states.
- Mobile menu icon enters subtly from bottom to top on initial load.
- Mobile menu backdrop fades in and drawer keeps the existing calm slide transition.
- Landing-page sections use one-time, low-amplitude reveal-on-scroll motion.
- All marketing motion respects `prefers-reduced-motion`.

## Plan- und Demo-Verifikation
- Produktions-Demo erzeugt serverseitig einen isolierten 24-Stunden-Business-Trial-Mandanten mit eigener Session und vorkonfigurierten Beispieldaten.
- Registrierung persistiert den gewählten Plan (`Start`, `Business`, `Pro`) und den Abrechnungszyklus bereits bei der Organisation.
- Navigation und direkte Portal-Routen werden zentral nach Plan gefiltert; nicht enthaltene Module führen auf eine klare Upgrade-Ansicht.
- Record-APIs prüfen das Plan-Entitlement zusätzlich serverseitig. Ein ausgeblendeter Menüpunkt ist damit nicht die einzige Schutzschicht.
- Benutzerlimits werden serverseitig bei direkter Benutzererstellung, Einladung und Einladungsannahme geprüft.
- Projektlimits werden serverseitig beim Erstellen eines Projekts geprüft.
- Suche liefert nur Module, die sowohl durch Rolle als auch durch den aktuellen Plan erlaubt sind.
- Ein automatischer `plan-demo-selfcheck` ist Teil von `pnpm test`.
