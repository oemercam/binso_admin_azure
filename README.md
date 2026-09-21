# Binso Admin v4

Modularer Next.js-16-Stand fuer das interne Binso-Admin-Portal.

## Zielbild

Der Ablauf ist durchgaengig aufgebaut:

Kunde -> Angebot -> Auftrag -> Zeit -> Rechnung -> Zahlung -> Buchhaltung / Controlling

Rollen:
- Inhaber: Gesamtuebersicht, Pipeline, Marge, Liquiditaet, Team und Administration
- Admin: Kunden, Angebote, Auftraege, Zeiten, Rechnungen, Mitarbeitende und Einstellungen
- Buchhaltung: Rechnungen, Zahlungen, Forderungen, Belege, Finanzsicht und Export
- Mitarbeiter: eigene Auftraege und Zeiterfassung

## UI / PWA

- kompakter Header mit Binso-Logo, globaler Suche, Quick Create, Benachrichtigungen und Avatar
- Desktop mit schmaler Sidebar und voller Flaechennutzung
- Mobile/PWA mit reduzierter Kopfzeile und schwebender Pill-Navigation
- Suchfeld auf Mobile mit 16 px Eingabeschrift gegen iOS Auto-Zoom
- Light/Dark/System
- keine Business-Daten im Service-Worker-Cache
- native Systemschriften fuer scharfe Darstellung

## Demo-Funktionen

Die UI-Flows fuer Kunde erfassen, Zeit erfassen, Angebotsvorschau und Zahlung erfassen funktionieren im Browserzustand. Sie sind in diesem Stand noch nicht persistent. Fuer Produktion werden die Writes im naechsten Schritt an Azure PostgreSQL angebunden.

## Wichtig fuer GitHub

Die bestehende `package-lock.json` im Repository behalten. Dieses Paket enthaelt absichtlich keine neue Lock-Datei.

Der Azure-Workflow bleibt auf `main` und baut `output: standalone`.
