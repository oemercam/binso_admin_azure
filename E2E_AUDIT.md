# Binso Admin – End-to-End Audit

Stand: v10 E2E audited.

## Wichtigster behobener Fehler

Die globalen `+ Neu`-Aktionen verwendeten Query-Links wie `/customers?new=1`. Einige Seiten werteten diese Query zuvor nur beim ersten Mount aus. Befand man sich bereits im gleichen Modul, änderte Next.js nur die URL und es öffnete sich kein Formular – man landete scheinbar auf der leeren Kunden-/Angebots-/Rechnungsseite.

Die betroffenen Seiten reagieren jetzt auf `useSearchParams()` und konsumieren die Aktion bei jeder Navigation:

- Kunde erfassen: `/customers?new=1`
- Angebot erstellen: `/quotes?new=1`
- Auftrag erstellen: `/orders?new=1`
- Zeit erfassen: `/time?new=1`
- Rechnung erstellen: `/invoices?new=1`
- Zahlung erfassen: `/invoices?payment=1`
- Kunden-Deep-Link: `/customers?edit=<id>`
- Angebots-Deep-Link: `/quotes?view=<id>`
- Rechnungs-Deep-Link: `/invoices?view=<id>`

Nach dem Öffnen wird der Query-Parameter mit `router.replace(..., { scroll: false })` entfernt, damit Refresh/Zurück keine Aktion ungewollt erneut öffnet.

## Funktionsstatus

| Bereich | End-to-End im Demo-Stand | Anmerkung |
|---|---|---|
| Entra Login / Logout | ✅ | App Service Authentication; Logout über `/.auth/logout` |
| Rollenbasierte Navigation | ✅ | owner/admin/finance/employee in Navigation und Quick Actions |
| Kunde erfassen/bearbeiten | ✅ | Pflichtfelder, Adresse, Status-Toggle, Persistenz in Demo-Store |
| Globale Kundensuche | ✅ | Öffnet den konkreten Kunden statt nur die Kundenliste |
| Angebot erstellen | ✅ | Kunde, Gültigkeit, Referenz, Positionen |
| Angebot bearbeiten | ✅ | Empfänger, Adresse, Texte, Positionen |
| Angebotsvorschau | ✅ | A4-Dokumentdarstellung / Browser-PDF |
| Angebot versenden | 🟡 | Empfänger/Status/Zeitpunkt werden simuliert; kein echter Mailversand |
| Angebot annehmen/ablehnen | ✅ | Statusänderung im Store |
| Angebotsversion | ✅ | Neue Revision als Entwurf |
| Angebot → Auftrag | ✅ | Annahmeregel wird berücksichtigt |
| Auftrag direkt erstellen | ✅ | Kunde, Budget, Sätze, Abrechnungsmodell |
| Auftragsdetail | ✅ | Übersicht, Regeln, Mitarbeitende/Subunternehmer, Nachweise |
| Auftragsregeln | ✅ | interne/kundenseitige Zeit, Rundung, Evidence, PO, Serviceperiode |
| Mitarbeiter-Override pro Auftrag | ✅ | eigene Evidence-Regeln pro Person/Firma |
| Zeit erfassen | ✅ | Auftrag, Person, Stunden, Beschreibung, verrechenbar |
| Zeitfreigabe | ✅ | Rollen- und Evidence-Regeln werden berücksichtigt |
| PDF-Zeitnachweis erfassen | 🟡 | Dateiname/Metadaten gespeichert; Datei selbst noch nicht Blob-persistent |
| Zeitnachweis prüfen | ✅ | uploaded/verified/rejected-Logik im Demo-Store |
| Fakturierbarkeit | ✅ | freigegeben, verrechenbar, nicht doppelt fakturiert, Evidence-Regeln |
| Rechnung aus Zeiten | ✅ | ausgewählte zulässige Zeiten werden zu Positionen und gesperrt |
| Freie Rechnung | ✅ | Rechnung ohne Auftrag mit manuellen Positionen |
| Rechnung bearbeiten | ✅ | nur Entwurf; Empfänger, Datum, Texte, Positionen, MWST |
| Rechnungsvorschau | ✅ | A4-Darstellung entspricht Browser-Druck/PDF |
| Rechnung versenden | 🟡 | Status/Empfänger/Zeitpunkt simuliert; Microsoft Graph noch nicht verbunden |
| Rechnung stornieren | ✅ | Status + zugeordnete Zeiten werden wieder freigegeben |
| Zahlung erfassen | ✅ | Teil-/Vollzahlung, Status partial/paid |
| Überfällig-Status | ✅ | aus Fälligkeitsdatum abgeleitet |
| Mahnung manuell | 🟡 | Versandstatus simuliert; echte Mail-/Job-Ausführung fehlt |
| Lieferantenrechnung | ✅ | erfassen → prüfen → freigeben → bezahlt |
| CSV Buchhaltungsexport | ✅ | Debitoren + Kreditoren Browser-Download |
| Mitarbeitende | ✅ | erfassen/bearbeiten, Rolle, Anstellungsart, Aktiv-Toggle |
| Unternehmensdaten | ✅ | lokale Demo-Persistenz |
| Dokumentvorlagen | ✅ | Rechnung/Angebot/Mahnung, Intro/Outro/Mailtexte |
| E-Mail-Absender | ✅ Konfiguration | echter Versand noch nicht verbunden |
| Mahn-Automation | 🟡 Konfiguration | kein Scheduler/Worker vorhanden |
| Lohn-Automation | 🟡 Konfiguration | kein Payroll/PDF/Graph-Worker vorhanden |
| Push | 🟡 vorbereitet | Browser-Subscription API vorhanden; DB/Worker/VAPID produktiv noch offen |
| Dark/Light/System | ✅ | lokale Benutzerpräferenz |
| Mobile/PWA Navigation | ✅ | Pille, Suche, Quick Create, Menü; 16px Inputs gegen iOS Auto-Zoom |

## Produktionsblocker

Diese Punkte dürfen nicht als produktiv fertig betrachtet werden:

1. **Azure PostgreSQL:** Aktuell werden Geschäftsobjekte im Browser-`localStorage` gespeichert. Das ist nur für Demo/UX-Tests geeignet.
2. **Azure Blob Storage:** Hochgeladene Zeitnachweise speichern aktuell nur Dateiname/Metadaten, nicht die PDF-Datei dauerhaft.
3. **Microsoft Graph:** Rechnung, Angebot, Mahnung und Lohnabrechnung werden noch nicht wirklich per E-Mail gesendet.
4. **Serverseitige PDF-Erzeugung/Archivierung:** Browser-Druck zeigt A4 korrekt, aber es gibt noch kein unveränderbar archiviertes Server-PDF.
5. **Background Jobs:** Automatische Mahnungen und Lohnprozesse sind konfigurierbar, aber noch ohne Scheduler/Worker.
6. **Audit Log:** Noch kein revisionssicheres serverseitiges Audit-Log.
7. **Serverseitige Autorisierung:** Navigation ist rollenbasiert; Produktions-APIs/DB müssen Berechtigungen zusätzlich serverseitig erzwingen.
8. **Push Backend:** Subscription-API ist vorbereitet, Persistenz und tatsächliche Push-Zustellung fehlen noch.

