# Binso One v1.6.7 — Mobile/PWA Navigation Drawer

## Neu
- `Mehr` öffnet ein grosses, aber content-adaptives Bottom Sheet statt einer Vollbildnavigation.
- Aktueller Screen bleibt hinter neutralem Backdrop sichtbar.
- Bottom Navigation bleibt `Start | Kunden | Neu | Zeit | Mehr`.
- Quick Create, Modulnavigation und Avatar/Account bleiben klar getrennt.
- Fachlich neu strukturierte Mobile-Navigation: Verkauf, Projekte, Einkauf, Finanzen, Unternehmen.
- Zentrale `MobileNavigationRow` ohne Icon-Cards, mit aktivem Zustand und optionalem Badge.
- Dynamischer Benutzerbereich im Navigationssheet mit Einstellungen, Abmelden und App-Version.
- Browser-/PWA-Back-State schliesst das Navigationssheet sauber.
- Zentrale Layer-Tokens für Bottom Navigation, Backdrop, Sheet, Dialog und Toast.

## Architektur
- Business-Routen in `config/navigation.ts` zentral als `navigationItems` definiert.
- Desktop Sidebar und Mobile/PWA Navigation verwenden dieselben Route-Objekte; Desktop Rendering bleibt unverändert.
- Produktions-Benutzerdaten im Shell werden aus `/api/me`, Firmenname aus `/api/organization` geladen.
- Veraltete branded/animated Header-Varianten des generischen Overlay-Primitives entfernt; Standard-X ist zentral.

## QA
- neuer `mobile-navigation-sheet-selfcheck.mjs`
- Navigation Architecture, Full Mobile/PWA Audit und UI Interaction Contract auf den neuen Drawer-Vertrag aktualisiert
- reale Visual-QA-Matrix erweitert

## Datenbank
Keine neue v1.6.7-Migration. Die bestehende Forward-Migration `0019_v163_productivity_ux.sql` bleibt Teil des Release, solange sie produktiv noch nicht bestätigt wurde.
