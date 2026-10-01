# Binso One v1.6.9 — Mobile/PWA Master Audit

Der v1.6.9-Stand konsolidiert den finalen Mobile/PWA-Master-Audit in zentrale Komponenten statt Screen-spezifischer Patches.

## Zentrale Owner
- `styles/tokens.css`: semantische Tokens und Safe Areas
- `styles/mobile-pwa.css`: kanonischer Mobile/PWA-Vertrag, ausschliesslich <= 760 px
- `config/navigation.ts`: Navigation und Quick Create
- `config/route-metadata.ts`: Parent Area und aktiver Bottom-Nav-Bereich
- `components/mobile/mobile-overlays.tsx`: Quick Create, Account, Mehr
- `components/mobile/mobile-list-record.tsx`: kompakte Record-Hierarchie und Duplicate-Guard
- `components/ui/form-controls.tsx`: Form-Primitives
- `components/ui/list-toolbar.tsx`: lokale Suche, Filter, Sortierung, Ansicht
- `components/time-tracking/*`: persistenter Timer
- `components/toast-host.tsx`: globale Meldungen

## Route-Abdeckung
69 Workspace-Seiten wurden automatisch inventarisiert. Die gemeinsamen Route-Familien decken List, Detail, Create und die vorhandenen Edit-Flows ab. Spezialseiten wie Dashboard, Einstellungen, Berichte, MWST, Lohn, Support, Abo, Benachrichtigungen, Neuigkeiten und Feedback sind Teil des Inventars.

## Desktop
Die neue kanonische Designschicht ist auf `max-width:760px` begrenzt. Desktop-Routen, Desktop-Sidebar, Desktop-Tabellen und Desktop-Formgeometrie werden durch diese Schicht nicht neu gestaltet.

## Prüfung im Artefakt-Lauf
Alle dependency-freien Architecture-/UI-/Mobile-/I18N-Selfchecks wurden ausgeführt. Der vollständige `pnpm test` Lauf erreicht in der Artefaktumgebung den `permission-selfcheck`, der das nicht installierte Paket `typescript` benötigt. `pnpm lint`, `pnpm typecheck` und `pnpm build` können hier ohne `node_modules` nicht vollständig ausgeführt werden und werden deshalb im bereitgestellten lokalen Release-Block zwingend vor Migration/Commit/Deployment ausgeführt.
