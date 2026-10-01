# Binso One v1.6.5

## Mobile/PWA App UX Consolidation

Dieser Release konsolidiert die Mobile/PWA-Oberfläche auf allen Ebenen. Alle 69 Workspace-Seiten werden über zentrale Listen-, Detail-, Create-, Dokument- oder Spezialseiten-Patterns abgedeckt; Public/Auth/Onboarding/Operator/System erhalten dieselben Viewport-, Touch- und Safe-Area-Grundregeln.

### Navigation
- Mobile Bottom Navigation: Start · Kunden · + · Zeit · Mehr.
- Zentrale Neuerstellen-Aktion als Bottom Sheet.
- Icon-only Zurück-Navigation ohne «Zurück zu …»-Text.
- Avatar bleibt zentraler Einstieg für Profil, Firma, Plan, Darstellung, Benachrichtigungen, Release/Neuigkeiten, Support, Feedback und Logout.
- Account-Menü wird auf Mobile als app-typische Bottom Surface dargestellt.
- Browser-/PWA-Zurücknavigation stellt die vorherige Scrollposition wieder her.

### Listen
- Maximal zwei Informationszeilen pro Datensatz.
- Kunden/Lieferanten zeigen keine E-Mail als primäre Listeninformation.
- Suche icon-first; Filter, Sortierung und Ansicht über zentrale Sheets.
- Keine Desktop-Tabellenbreite als Mobile-Ersatz.

### Detailseiten
- Identität, Status und arbeitsrelevante Daten zuerst.
- Adresse/Ort und sonstige Stammdaten werden nicht automatisch prominent gezeigt.
- Weitere Stammdaten unter «Weitere Angaben».
- Bearbeiten kompakt; seltene/destruktive Aktionen im Action Sheet.

### Create/Edit
- Quick Create und Progressive Disclosure bleiben zentral.
- Kunden/Lieferanten starten mit Firmenname und optionaler E-Mail.
- Offerten/Rechnungen priorisieren Kunde, Datum/Fälligkeit und Positionen; E-Mail, Projekt, Sprache, Rabatt und Einleitung sind sekundär.
- Sticky Mobile-Aktionen bleiben oberhalb der Bottom Navigation erreichbar.

### Spezialseiten
- Support, Einstellungen, Abonnement, Benachrichtigungen, Neuigkeiten, Berichte, MWST und Lohn folgen derselben Mobile-Hierarchie.
- Operator-Tabellen werden auf Mobile zu kompakten Records statt horizontalen 700px-Tabellen.
- Public/Auth/Onboarding/Systemseiten erhalten zentrale Breiten-, Touch- und Viewport-Grenzen.

### Datenbank
Keine neue Migration. v1.6.5 verwendet weiterhin die mit v1.6.3 eingeführte Migration `0019_v163_productivity_ux.sql`.

### Release-Korrektur r2
- Fehlenden `FolderKanban`-Import in `components/shell.tsx` ergänzt.
- Mobile/PWA-Selfcheck prüft den Quick-Create-Icon-Import zusätzlich.
