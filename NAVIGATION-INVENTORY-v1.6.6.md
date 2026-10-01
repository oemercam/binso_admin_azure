# Binso One v1.6.6 — Navigationsinventar

## Primäre Mobile/PWA Navigation
- Start → `/dashboard`
- Kunden → `/kunden`
- Neu → Aktion, öffnet Quick Create; kein Navigationsbereich
- Zeit → `/zeiterfassung`
- Mehr → fachliche Sekundärnavigation

## Quick Create
- Kunde → `/kunden/neu`
- Offerte → `/offerten/neu`
- Rechnung → `/rechnungen/neu`
- Projekt → `/projekte/neu`
- Zeit → `/zeiterfassung/neu`
- Spese → `/spesen/neu`

Alle Einträge werden über die bestehenden Plan-/Permission-Prüfungen gefiltert.

## Mehr
### Verkauf
Offerten, Aufträge, Rechnungen, Zahlungen

### Arbeit
Projekte, Aufgaben, Spesen

### Einkauf
Lieferanten, Eingangsrechnungen

### Finanzen
Buchhaltung, Bank, MWST, Berichte

### Personal
Mitarbeitende, Abwesenheiten, Lohn

### Stammdaten
Produkte und Leistungen, Dokumente, Verträge

Kunden und Zeiterfassung werden nicht im Mehr-Menü dupliziert, da sie bereits Primärziele der Bottom Navigation sind.

## Avatar / Konto
Primärer Einstieg für persönliche und servicebezogene Funktionen. Die vorhandenen Desktop-Funktionen werden gemeinsam genutzt:
- Mein Profil
- Unternehmenseinstellungen, nur mit Berechtigung
- Plan und Abrechnung, nur mit Berechtigung
- Darstellung
- Benachrichtigungen
- Neuigkeiten
- Support
- Feedback
- Abmelden

Diese Ziele werden nicht zusätzlich in der Bottom-/Mehr-Navigation dupliziert.

## Route-Metadaten
`config/route-metadata.ts` besitzt die zentrale Parent-Zuordnung für Workspace-Routen. Damit bleibt z. B. `Kunde Detail` unter Kunden aktiv und Projekt-/Rechnungs-/Personal-Unterseiten unter Mehr.

## Workspace Route-Familien
69 Workspace-Seiten werden über gemeinsame List-, Detail-, Create-, Dokument- oder Spezialkomponenten abgedeckt. Die Businesslogik wird nicht für Mobile dupliziert.


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
