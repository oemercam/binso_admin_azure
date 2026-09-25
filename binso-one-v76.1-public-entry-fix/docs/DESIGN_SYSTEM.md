# Binso One Design System

## Ziel

Binso One verwendet ein gemeinsames Design-System für Public Website, Authentisierung, Desktop-App, Mobile und PWA. Farben, Typografie, Abstände, Radien und Controls werden zentral über CSS Custom Properties in `app/globals.css` definiert. Fachliche Layout-Regeln der Anwendung liegen in `app/app-ui.css`. Neue Seiten dürfen keine parallelen Design-Tokens oder versionierte Stylesheets einführen.

## Verantwortlichkeiten

- `app/globals.css`: globale Brand-, Farb-, Typografie-, Spacing-, Radius- und Control-Tokens sowie neutrale Basisstile.
- `app/app-ui.css`: kanonische Komponenten- und Layoutregeln für App, Public Website und Authentisierung.
- `components/ui/*`: wiederverwendbare UI-Controls.
- `components/public/*`: Public Header, Footer, Cookie Consent und Legal Layout.
- `lib/config/app-identity.ts`: Produktname, Beschreibung und Unternehmens-Kontaktdaten.
- `lib/config/public-site.ts`: öffentliche Navigation und Footer-Struktur.

## Typografie

Die Oberfläche verwendet den System-Font-Stack (`-apple-system`, BlinkMacSystemFont, Segoe UI, Inter, Arial). Keine externe Webfont ist für die Darstellung erforderlich.

| Token | Einsatz |
| --- | --- |
| `--font-size-display-xl` | Public Hero |
| `--font-size-display-lg` | Public Seiten-H1 / Auth Marketing |
| `--font-size-display-md` | Public Abschnittsüberschriften |
| `--font-size-title-lg` | App H1 / grosse UI-Titel |
| `--font-size-title-md` | Karten- und Abschnittstitel |
| `--font-size-body-lg` | Public Lead-Text |
| `--font-size-body` | Standardtext / Felder |
| `--font-size-small` | Sekundärtext / Public Cards |
| `--font-size-caption` | Hinweise / Meta |
| `--font-size-micro` | Eyebrows / kompakte Labels |

Fliesstext verwendet für Lesbarkeit grundsätzlich eine Zeilenhöhe von `--line-body` (1.6). Sehr kleine Schriften sind auf Metainformationen beschränkt.

## Spacing und Geometrie

Spacing verwendet die zentrale Skala `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80`. Radien sind auf `8 / 12 / 16 / 24` standardisiert. Public Content ist maximal `1180px` breit, längere Lesetexte maximal `820px`. Mobile/PWA verwendet den kanonischen Gutter `clamp(14px, 4vw, 18px)`.

## Controls

- Standard kompakt: 34px
- Form Controls: 40px
- Public CTA / Touch: mindestens 46px
- Mobile/PWA primäre Aktionen: 48–50px

Buttons verwenden nur die vorhandenen Varianten `primary`, `secondary` und kontextbezogene Textlinks. Form Controls teilen Border, Radius, Focus, Disabled und Invalid States.

## Brand und Sprache

- Produktname: **Binso One**
- Anbieterin: **Binso GmbH**
- Ton: kurz, sachlich, verständlich, Deutsch (Schweiz).
- Keine unnötigen Fachbegriffe auf Kundenseiten. Technische Details werden nur dort genannt, wo sie für Sicherheit, Datenschutz oder Support relevant sind.
- Kein Marketing-Blabla und keine Aussagen, die technisch oder vertraglich nicht belegt sind.

## Public Website

Header, Footer, Navigation, CTA, Seitenintro und Legal-Seiten verwenden gemeinsame Komponenten. Mobile verwendet dieselben Inhalte über eine kompakte Navigation. Die öffentliche Website darf nicht auf eigene Farb- oder Typografievariablen ausweichen.

## Authentisierung und PWA

Desktop zeigt eine reduzierte Produktfläche plus Login. Mobile und installierte PWA zeigen eine app-artige, vollflächige Anmeldung. Die PWA berücksichtigt Safe Areas und `100dvh`; Marketing-Navigation wird dort nicht benötigt.

## Accessibility

- sichtbarer `:focus-visible` Zustand
- semantische Überschriftenhierarchie
- Labels für Form Controls und Navigation
- Touch-Flächen auf Mobile mindestens ca. 44px
- `prefers-reduced-motion` wird respektiert
- Kontrast basiert auf den zentralen Light/Dark Tokens

## Performance

Die Public Website verwendet keine externe Webfont und keine zusätzliche UI-/Animationsbibliothek. Marketingseiten sind statisch, wo keine Laufzeitdaten benötigt werden. Visuelle Effekte bleiben CSS-basiert und werden sparsam eingesetzt.
