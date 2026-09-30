# Binso One UI Standards v1.4.0

## Ziel
Binso One verwendet für Public Site, Portal, Workspace, PWA und Operator dieselben technischen UI-Grundlagen. Sonderregeln pro Seite werden vermieden.

## Stylesheet-Eigentümerschaft
- `styles/tokens.css`: Farben, Abstände, Typografie, Safe Areas, Motion, Controls und Z-Index-Tokens.
- `styles/app.css`: fachliche Komponenten und bestehende Produktoberflächen, keine generischen Primitive-Duplikate.
- `styles/shell.css`: Header, Sidebar, Mobile Navigation, Marketing Shell und Footer.
- `styles/overlays.css`: Modal, Sheet, Dialog und sonstige Fixed-Surfaces.
- `styles/responsive-central.css`: responsive Layoutregeln und Mobile/PWA-Anpassungen.
- `styles/primitives.css`: Inputs, Buttons, Focus, Cards, States und gemeinsame Control-Kompatibilität. Wird zuletzt geladen.

## Responsive Raster
Zulässige Standard-Breakpoints sind 430, 760, 900, 1024, 1100 und 1280 px. Neue Sonder-Breakpoints benötigen eine technische Begründung und eine Anpassung des Standards-Selfchecks.

## Mobile und PWA
- Form Controls haben auf Mobile mindestens 16 px Schriftgrösse, damit iOS beim Fokus nicht automatisch zoomt.
- Browser-Zoom und Pinch-Zoom bleiben zugänglich; kein `user-scalable=no` und kein `maximum-scale=1`.
- Safe Areas werden über zentrale Tokens berücksichtigt.
- Mobile/PWA verwendet keine scrollgebundenen Dekorationsanimationen.
- Fixed- und Sticky-Surfaces müssen den zentralen Layer-/Safe-Area-Regeln folgen.

## Focus und Touch
- `:focus-visible` ist der Standard für Tastaturfokus.
- Touch-Ziele verwenden die zentralen Control-/Touch-Tokens.
- Keine JavaScript-Zoom- oder Focus-Hacks.

## Internationalisierung
- React-Komponenten übersetzen über `useLocale().t()` bzw. `TranslatedMarkup` für klar abgegrenzte statische Dokumentinhalte.
- Kein `MutationObserver`, kein DOM-Walker und keine nachträgliche Textmutation.
- Persistierte Benutzersprache hat Vorrang; ohne Auswahl wird die Browser-/Gerätesprache verwendet.
- SSR verwendet einen stabilen Snapshot und die Client-Locale wird über `useSyncExternalStore` synchronisiert.
- Datum, Zeit, Zahl und Währung werden ausschliesslich über zentrale Locale-Formatter ausgegeben.
- Statische UI-Schlüssel müssen in DE, EN, FR, IT und TR abgedeckt sein.

## Runtime-Grenzen
- Öffentliche Routen laden keine authentifizierten Workspace-Endpunkte.
- Workspace-Dienste wie Ankündigungen, Support-Telemetrie und Pilot-Feedback werden erst nach erfolgreicher Session-/Permission-Prüfung gemountet.
- Demo-Daten werden unter bestehender PostgreSQL-RLS mit gesetztem Tenant- und User-Kontext geschrieben; RLS wird nicht umgangen.

## CSS-Regeln
- Keine `!important`-Regeln.
- Z-Index über zentrale Tokens.
- Generische Controls werden in `primitives.css` definiert.
- Responsive Ownership bleibt in `responsive-central.css`.
- Neue harte Farben in zentralen Layern sind zu vermeiden; Design-Tokens sind zu verwenden.

## Automatische Prüfungen
`pnpm test` umfasst Architektur, UI-Konsistenz, Rendering, Content, i18n/Mobile, UI-Standards, Runtime-Grenzen, Demo/Trial, Overlays, Berechtigungen, Production und Plan/Demo.
