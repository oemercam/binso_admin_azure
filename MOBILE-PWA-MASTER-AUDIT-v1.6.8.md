# Binso One v1.6.8 — Finaler Mobile/PWA UX/UI Master-Audit

## Scope
Codeweiter Audit der zentralen Mobile/PWA-Schichten auf Basis des bestehenden Route-Inventars und der kanonischen List/Detail/Create/Document/Specialist-Familien. Desktop-Regeln bleiben ausserhalb der neuen Mobile-Media-Regeln.

## Zentrale Änderungen
- Mobile Theme-Vertrag auf echte monochrome Flächen zentralisiert: Light `#FFFFFF/#000000`, Dark `#000000/#FFFFFF`; semantische Statusfarben bleiben funktional erlaubt.
- Shell: Bottom Navigation als eingerückte Floating Pill; Header bleibt flach, Logo + Avatar, ohne globale Mobile-Suche.
- Account: bestehende Account-Funktionen und Berechtigungen bleiben geteilt mit Desktop; Mobile öffnet die Oberfläche als Top Panel statt Bottom Sheet.
- Quick Create: eigener content-adaptiver Bottom-Sheet-Kontext; nicht mit Navigation oder Account vermischt.
- Listen: zentrale Normalisierung verhindert identische Title/Subtitle-Werte. Technische `lokal/yerel`-Quellmarker werden nicht mehr in Record-Zeilen dargestellt.
- Detail-/Content-Flächen: Mobile Standardflächen werden flach über Typografie, Abstand, Border und Divider strukturiert; keine zusätzliche graue Surface-Hierarchie.
- Timer: vorhandene servergestützte Timer-Logik bleibt Source of Truth; aktiver Timer wird Mobile/PWA kompakt unmittelbar am Header dargestellt, inaktiv gar nicht.
- Toasts: Mobile/PWA zentral in den oberen Bereich unter Header/Safe Area verschoben.
- Inputs/Overlays/Sheets: Mobile Oberflächen verwenden die monochromen semantischen Tokens; bestehendes z-index-/Focus-/Scroll-Lock-System bleibt zentral.
- Safe Areas und Content Bottom Padding bleiben zentral berücksichtigt.

## Geänderte zentrale Dateien
- `styles/tokens.css`
- `styles/shell.css`
- `styles/responsive-central.css`
- `styles/overlays.css`
- `components/shell.tsx`
- `components/module-page.tsx`
- `scripts/ui-consistency-selfcheck.mjs`
- `scripts/mobile-pwa-master-audit-selfcheck.mjs`

## Tests
In der Build-Umgebung ohne installierte Projekt-Dependencies erfolgreich ausgeführt: Architecture, UI consistency, rendering, content, i18n-mobile, UI standards, hardcoding, runtime boundary, trial/demo, overlay sowie die dependency-freien Mobile/PWA-, Navigation-, I18N- und Release-Selfchecks. Der vollständige Testlauf stoppt lokal in dieser Artefaktumgebung beim `permission-selfcheck`, weil das npm-Paket `typescript` hier nicht installiert ist.

Darum müssen `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm audit --audit-level high` und `pnpm build` vor Migration/Deployment auf dem Projekt-Rechner erfolgreich sein. Der mitgelieferte Deployment-Block erzwingt genau diese Reihenfolge und stoppt bei jedem Fehler.

## Datenbank
v1.6.8 enthält keine neue Migration. Die bestehende Forward-Migration `0019_v163_productivity_ux.sql` bleibt enthalten, weil der produktive Stand ab v1.6.3 noch nicht als erfolgreich migriert bestätigt wurde.
