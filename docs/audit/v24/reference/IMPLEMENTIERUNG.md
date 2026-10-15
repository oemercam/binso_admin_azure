# BINSO ONE – verbindliche UX-Referenzen, 15.10.2026

Dieses Paket ergänzt den Implementierungsauftrag. Es enthält Designreferenzen, keinen produktiven Anwendungscode. Bestehende Geschäftslogik und Sicherheitskontrollen bleiben erhalten. Kein Repository wurde zur Erstellung dieses Pakets geändert.

## Gültige Referenzen

1. `desktop-login.html`: Microsoft-Variante des Kundendossiers sowie Login, Registrierung, Reset und MFA. Anmeldung als Startansicht, weitere Ansichten über die oberen Vorschau-Schalter.
2. `landingpage.html`: freigegebene weisse Marketinggestaltung.
3. `mobile-app.html`: App-Ansichten mit Zugang zu den vorhandenen Fachseiten über die Auswahl oberhalb des Smartphones; umfasst Timer/Einträge, Rechnungen, Profil, Benachrichtigungen und Einstellungen.
4. `komponenten.html`: Komponentenreferenz inklusive verbessertem Dateiauswahl-Button. Über Bereich „Alle Komponenten“ den gesamten Katalog öffnen.

`index.html` ist der Einstieg. `sources/` enthält die ursprünglichen Fragmente als ergänzende Referenz. Die Standalone-Seiten laden ausschliesslich Lucide-Icons über CDN; ohne Netzwerk bleiben die Inhalte verfügbar, Icons können fehlen. Im Produkt vorhandenes Lucide verwenden, keinen zusätzlichen CDN-Import einführen.

## Rangfolge und Grenzen

Die jüngsten ausdrücklichen Entscheidungen unten haben Vorrang vor widersprechenden Details der Vorschau. Verworfene Apple-, graue und permanente Toolbox-Varianten sind NICHT gültig. Vorschau-Schalter, Telefonrahmen, Statusuhr und Beispieldaten sind keine Produktanforderungen.

Die Entwürfe sind keine vollständige Spezifikation aller Seiten/Zustände. Vorhandene Hauptansichten konkret übernehmen; nicht dargestellte Ansichten aus den gemeinsamen Komponenten ableiten und als abgeleitet kennzeichnen. Dark Mode und vollständige Adminansichten sind noch nicht visuell freigegeben. Schriftgrössen kleiner Demonstrations-Screenshots nicht unbesehen als Produkttextgrösse übernehmen; Lesbarkeit und Touchziele sicherstellen.

## Verbindliche Entscheidungen

- Light Mode: weisse Seite, Header, Navigation und Inhaltsflächen; keine grossflächigen grauen Flächen. Blaue Akzente für Auswahl, Hover und Fokus.
- Desktop: Microsoft-inspirierte Variante; linke Navigation offen und einklappbar; globale Suche, Glocke, Profil oben rechts; lokale Suche/Filter bei den Daten.
- Desktop-Aktionen in gemeinsamer Aktionsleiste, gleiche Position und Reihenfolge je Seitentyp. Keine einzeln gestapelten Buttons; sekundäre Aktionen ins Menü. Keine permanente Toolbox-Spalte. Keine Desktop-Bottom-Sheets.
- Mobile: kompakte eigene Bedienung; zentrale Sheets; schwarzer runder Plus-Button. Bestehende Bottom-Navigation exakt erhalten – die schematische Vorschau ist kein Ersatz.
- Original-Binso-Assets aus dem Repository nutzen. Textlogos in den Entwürfen sind Platzhalter.
- Trennlinien nur zwischen Einträgen; keine Abschlusslinie und keine doppelten Rahmen.
- Upload-Button: dezente blaue Fläche, konsistente Rundung, Schrift und Hoverzustände wie in der Komponentenreferenz.
- Ringkorrektur: Zahl UND Label exakt zentrieren, Legende daneben vertikal zentriert, passende Farbmarkierungen und Werte. Der originale Ring im HTML ist ein unvollständiger Entwurf; diese Korrektur wurde besprochen und ist bei der Umsetzung verbindlich.
- Timer: Kunde/Projekt, Start/Pause/Stop, Tageszeit und manuelle Erfassung. Einträge gruppiert und filterbar. Kein dekorativer Timer-Ring.
- Rechnungen: Zahlungsfrist, korrekter Zahlungsstand und Bezahldatum; Mobile-Vorschau über weitere Aktionen, Desktop-Seitenwechsel direkt am Dokument.
- App-Motion: direktes Pressedfeedback ca. 100–150 ms, Overlays/Übergänge ca. 180–250 ms; Reduced Motion. Bestehende Bottom-Nav-Animation unverändert.
- Tastatur, Safe Areas, Fokusführung, Datenverlustschutz, Scroll-/Filtererhalt sind echte Produktanforderungen, in den Vorschauen teilweise nur angedeutet.

## Extrahierte Ausgangswerte

Diese Werte aus den Referenzen in bestehende zentrale Tokens übertragen, nicht in jeder Seite kopieren:

| Verwendung | Ausgangswert |
|---|---|
| Grundfläche | #ffffff |
| Primäraktion | #2566bd |
| Weiche Auswahlfläche | #edf4ff / #edf5ff |
| Haupttext | #263950 / #202b3b |
| Sekundärtext | #647080 bis #8390a1; Kontrast im Produkt prüfen |
| Dezente Trennlinie | #edf1f6 |
| Font | Inter, system-ui, sans-serif |
| Desktop Form-/Buttonradius | 5–7 px |
| Mobile Feldradius | 7–8 px |
| Mobile Sheet oben | ca. 17 px |
| Desktop Titel | ca. 27–30 px |
| Mobile Titel | ca. 23–25 px |

Tokens anhand von Zugänglichkeit und echten Bildschirmgrössen konsolidieren. Keine konkurrierenden Foundations.

## Vorgehen vor breiter Umstellung

1. Referenzpaket lesen, aktuellen Repository-Stand inventarisieren.
2. Bestehende Tokens und Komponenten den Referenzen zuordnen, Altlasten erfassen.
3. Login, Kundenliste und Kundendetail für Desktop/Mobile im echten Produkt umsetzen.
4. Bei gleichen Viewports mit den Referenzen vergleichen; Abweichungen dokumentieren. Statische Textprüfungen reichen nicht.
5. Danach übrige Seiten, Admin und Landingpage über dieselbe Foundation umstellen.
6. Funktions-, Rollen-, Responsive-, Light/Dark- und Releaseprüfungen durchführen.
7. Deploy gemäss ausdrücklicher Freigabe des zugehörigen Implementierungsauftrags, niemals bei fehlgeschlagenen Pflicht-Gates.

## Nicht aus den Vorschauen übernehmen

Keine Fake-Zahlungen, Beispielkontakte, lokalen Demo-Loginabläufe oder funktionslosen Buttons in die produktive Oberfläche kopieren. Die HTML-Interaktionen dienen nur der Anschauung. Vorhandene APIs, Auth, Rollen und Daten verwenden. Keine rechtlichen oder Sicherheitsbehauptungen aus Platzhaltertexten ableiten.
