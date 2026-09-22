# Manuelle Abnahme – Binso Admin v10

Nach dem GitHub-Actions-Deploy einmal mit privatem Browserfenster prüfen:

1. `+` → **Kunde erfassen** → Formular erscheint → Pflichtfelder ausfüllen → speichern → Kunde ist in Liste.
2. `+` → **Angebot erstellen** → Positionen erfassen → Vorschau → senden → annehmen → Auftrag erstellen → Auftrag öffnet sich.
3. Auftrag → **Regeln bearbeiten** → externer täglicher PDF-Nachweis aktivieren → Mitarbeiter-Override speichern.
4. `+` → **Zeit erfassen** → Zeit auf Auftrag buchen → bei Nachweispflicht Nachweis hochladen/prüfen → Zeit freigeben.
5. **Rechnungen** → Rechnung erstellen → Auftrag wählen → freigegebene Zeiten auswählen → Entwurf erstellen.
6. Rechnung → Vorschau → Bearbeiten → Pflichtfelder → Drucken/PDF → Demo-Senden → Teilzahlung → Restzahlung.
7. Überfällige Rechnung → Mahnung öffnen.
8. Buchhaltung → Lieferantenrechnung für externe Firma erfassen → Auftrag zuordnen → CSV exportieren.
9. Mitarbeitende → Mitarbeiter erfassen → Status per Toggle ändern.
10. Einstellungen → Absender, Mahnregeln, Lohnworkflow, Dokumenttemplates ändern → Reload → Werte bleiben im Demo-Browser gespeichert.
11. Mobile/PWA → Suche, `+`, Menü, Bottom-Sheets, Eingabefelder ohne iOS-Autozoom und Scrollen prüfen.

## Canonical Overlay / Sheet Regression Matrix (V20 migration)

The canonical overlay system must be checked at these viewports:

- 320x568
- 375x667
- 390x844
- 430x932
- 768x1024
- 820x1180
- 1366x768
- 1920x1080

For each relevant viewport verify:

- short form uses the centralized StandardFormSheet presentation
- long form keeps header and footer visible while only AppSheetContent scrolls
- fullscreen form fills the visible viewport without a second page scrollbar
- desktop form is presented as a bounded dialog where mode=auto is used
- footer does not overlap the final field
- text, numeric and multiline keyboard focus remains reachable on mobile
- portrait -> landscape -> portrait updates without reload
- background scroll is locked while an overlay is open
- Escape closes and focus returns to the trigger
- safe-area bottom padding remains visible in installed PWA mode
- invoice/PDF preview remains fullscreen or near-fullscreen on mobile and does not use StandardFormSheet

Visual regression screenshots are required before production release. They are not considered passed until captured in a real browser/PWA test environment.
