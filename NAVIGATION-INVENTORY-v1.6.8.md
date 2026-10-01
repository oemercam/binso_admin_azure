# Binso One v1.6.7 — Navigationsinventar

## Primäre Mobile/PWA Navigation
- Start → `/dashboard`
- Kunden → `/kunden`
- Neu → öffnet nur Quick Create
- Zeit → `/zeiterfassung`
- Mehr → öffnet das Modul-Navigationssheet über dem aktuellen Screen

## Quick Create
- Kunde → `/kunden/neu`
- Offerte → `/offerten/neu`
- Rechnung → `/rechnungen/neu`
- Projekt → `/projekte/neu`
- Zeit → `/zeiterfassung/neu`
- Spese → `/spesen/neu`

Quick Create und Mehr sind getrennte Overlays. Alle Aktionen werden über die vorhandenen Plan-/Permission-Prüfungen gefiltert.

## Mehr — vollständige fachliche Modulnavigation
### Verkauf
Kunden, Offerten, Aufträge, Rechnungen, Zahlungen

### Projekte
Projekte, Zeiterfassung, Spesen, Aufgaben

### Einkauf
Lieferanten, Eingangsrechnungen

### Finanzen
Buchhaltung, Bank, MWST, Berichte

### Unternehmen
Mitarbeitende, Abwesenheiten, Lohn, Produkte und Leistungen, Dokumente, Verträge

Start wird nicht dupliziert. Kunden und Zeiterfassung besitzen zusätzlich Bottom-Navigation-Shortcuts, bleiben aber im vollständigen fachlichen Modulbaum auffindbar.

## Benutzerbereich im Mehr-Sheet
- dynamischer Benutzername und E-Mail
- Einstellungen
- Abmelden
- App-Version

Das ist kein zweites Account-Menü. Einstellungen und Logout verwenden dieselben Routen/Handler wie der bestehende Account-Bereich.

## Avatar / Konto
Avatar bleibt der primäre Einstieg für die vorhandenen Account-/Servicefunktionen:
- Mein Profil
- Unternehmenseinstellungen, wenn berechtigt
- Plan und Abrechnung, wenn berechtigt
- Darstellung
- Benachrichtigungen
- Neuigkeiten
- Support
- Feedback
- Abmelden

## Zentrale Quelle
`config/navigation.ts` enthält die kanonischen Business-Routen in `navigationItems`. Desktop Sidebar und Mobile/PWA Navigation komponieren aus diesen Objekten. Route-Ownership/Bottom-Nav-Zuordnung bleibt in `config/route-metadata.ts`; Berechtigungen bleiben in `lib/permissions.ts`.

## Workspace-Abdeckung
Die 69 Workspace-Seiten bleiben über die zentralen List-, Detail-, Create-, Dokument- und Spezialkomponenten abgedeckt. Desktop Rendering bleibt unverändert.


## Vollständiges App-Route-Inventar (109 Page Routes)
- `/`
- `/abo`
- `/abwesenheiten`
- `/abwesenheiten/[id]`
- `/abwesenheiten/neu`
- `/admin`
- `/admin/login`
- `/agb`
- `/aufgaben`
- `/aufgaben/[id]`
- `/aufgaben/neu`
- `/auftraege`
- `/auftraege/[id]`
- `/auftraege/neu`
- `/auftragsbearbeitung`
- `/bank`
- `/bank/[id]`
- `/benachrichtigungen`
- `/berichte`
- `/berichte/[id]`
- `/buchhaltung`
- `/buchhaltung/[id]`
- `/buchhaltung/neu`
- `/checkout`
- `/cookies`
- `/dashboard`
- `/datenschutz`
- `/demo`
- `/dokumente`
- `/dokumente/[id]`
- `/dokumente/neu`
- `/eingangsrechnungen`
- `/eingangsrechnungen/[id]`
- `/eingangsrechnungen/neu`
- `/einladung`
- `/einstellungen`
- `/einstellungen/[id]`
- `/email-bestaetigen`
- `/features`
- `/feedback`
- `/forbidden`
- `/impressum`
- `/kontakt`
- `/kunden`
- `/kunden/[id]`
- `/kunden/neu`
- `/lieferanten`
- `/lieferanten/[id]`
- `/lieferanten/neu`
- `/login`
- `/lohn`
- `/lohn/[id]`
- `/maintenance`
- `/mwst`
- `/mwst/[id]`
- `/neuigkeiten`
- `/offerten`
- `/offerten/[id]`
- `/offerten/neu`
- `/offline`
- `/onboarding`
- `/operator`
- `/operator/ankuendigungen`
- `/operator/audit`
- `/operator/benutzer`
- `/operator/features`
- `/operator/feedback`
- `/operator/kunden`
- `/operator/login`
- `/operator/sicherheit`
- `/operator/support`
- `/passwort-vergessen`
- `/passwort-zuruecksetzen`
- `/personal`
- `/personal/[id]`
- `/personal/neu`
- `/portal`
- `/portal/login`
- `/portal/registrieren`
- `/preise`
- `/produkte`
- `/produkte/[id]`
- `/produkte/neu`
- `/projekte`
- `/projekte/[id]`
- `/projekte/neu`
- `/rechnungen`
- `/rechnungen/[id]`
- `/rechnungen/neu`
- `/registrieren`
- `/sicherheit`
- `/spesen`
- `/spesen/[id]`
- `/spesen/neu`
- `/status`
- `/support`
- `/support/[id]`
- `/support/neu`
- `/unterauftragsbearbeiter`
- `/upgrade`
- `/vertraege`
- `/vertraege/[id]`
- `/vertraege/neu`
- `/zahlungen`
- `/zahlungen/[id]`
- `/zahlungen/neu`
- `/zeiterfassung`
- `/zeiterfassung/[id]`
- `/zeiterfassung/neu`
