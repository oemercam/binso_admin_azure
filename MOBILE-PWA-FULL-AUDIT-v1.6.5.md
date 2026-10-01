# Binso One v1.6.5 – vollständiger Mobile/PWA UX-Audit

## Umfang
Der Audit deckt alle 69 Workspace-Seiten sowie die gemeinsamen Public-, Auth-, Onboarding-, Operator- und System-Seiten ab. Die 68 API-Routen wurden nicht optisch umgebaut; ihre Funktionen bleiben über dieselben Berechtigungen und Businessregeln erreichbar.

## Einheitliches App-Modell
- Topbar: Binso Logo · globale Suche · Benutzeravatar.
- Bottom Navigation: Start · Kunden · zentrale Neuerstellen-Aktion · Zeit · Mehr.
- Kein textueller «Zurück zu …»-Link. Detail-, Create-, Dokument- und Support-Flows verwenden die zentrale icon-only Zurück-Navigation.
- Listen zeigen auf Mobile maximal zwei Informationszeilen pro Datensatz. Status und Chevron liegen separat in derselben Zeile.
- Kunden und Lieferanten zeigen in der Übersicht keine E-Mail-Adresse als primäre Information.
- Suche ist icon-first; Filter, Sortierung und Ansicht verwenden das zentrale Overlay/Bottom-Sheet-System.
- Neue Datensätze verwenden Progressive Disclosure: Pflicht-/Arbeitsfelder zuerst, Stammdaten unter «Weitere Angaben».
- Offerten/Rechnungen: Kunde, Datum/Fälligkeit und Positionen zuerst; E-Mail, Projekt, Sprache, Rabatt und Einleitung sind sekundär.
- Detailseiten zeigen zuerst Identität, Status und arbeitsrelevante Werte. Adresse/Ort und andere Stammdaten werden nicht automatisch prominent dargestellt.
- Seltene und destruktive Aktionen liegen im Overflow/Action Sheet; Löschen bleibt bestätigungspflichtig.
- Scrollposition wird bei Browser-/PWA-Zurücknavigation wiederhergestellt.
- Laufende Zeiterfassung bleibt portalweit sichtbar und persistent.
- Benutzeravatar enthält Profil, Firma, Plan, Darstellung, Benachrichtigungen, Neuigkeiten, Support, Feedback und Abmelden gemäss Berechtigungen.

## Geprüfte Workspace-Familien
- Dashboard
- 22 generische Modul-Listen
- generische Detailseiten
- generische Create-Formulare
- Offerten/Rechnungen Create + Detail + Vorschau
- Zeiterfassung inkl. persistenter Timer
- Einstellungen und Benutzerverwaltung
- Support Liste/Create/Detail/Diagnose
- Berichte
- MWST
- Lohn
- Abonnement
- Benachrichtigungen
- Neuigkeiten
- Feedback

## Weitere Oberflächen
- Login, Registrierung, Passwort, E-Mail-Bestätigung, Einladung und Onboarding
- Marketing, Preise, Features, Kontakt und Rechtstexte
- Offline-, Fehler-, Wartungs- und Statusseiten
- Operator Dashboard, Kunden, Benutzer, Support, Audit, Features, Feedback, Sicherheit und Ankündigungen

## Viewports
- 320 px
- 360 px
- 390 px
- 430 px
- 768 px
- PWA standalone mit Safe Areas

## Grundregeln
- kein horizontales Seiten-Scrolling
- mindestens 44 px Touch-Ziele für primäre Interaktionen
- 16 px Form-Control-Schrift auf Mobile gegen iOS Auto-Zoom
- keine Card-in-Card-Kaskaden als Mobile-Navigation
- keine Desktop-Tabellenbreite als Mobile-Ersatz
- Buttons in gemeinsamen Action Rows gleich hoch und gleich breit
- Safe Areas für Topbar, Bottom Navigation, Overlays und sticky Actions
- Desktop-Businesslogik und Berechtigungen bleiben unverändert
