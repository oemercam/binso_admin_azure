# UX-Master Ergänzung 3

Basis: main mit PR #215 und #216. Die Bottom-Navigation und `components/app-shell.tsx` bleiben unverändert.

## Referenzfälle

| Referenz | Regression |
| --- | --- |
| IMG_9789 | Mitarbeitername, Status daneben, Aktionen rechts, bestehende Tabs |
| IMG_9790 | Eine Speicheraktion nach allen Mitarbeiterfeldern; Validierung auf Client und Server |
| IMG_9791 | Mitarbeiterzeit: Tätigkeit, Datum, 7:30 h, Status |
| IMG_9792 | Spesen: ganze Zeile öffnet Datensatz, Betrag/Datum/Status |
| IMG_9793 | Dokument-Leerzustand, berechtigungsabhängiger Upload |
| IMG_9794 | Einheitlicher kompakter Timer; keine Eintragsfilter im Timer |
| IMG_9795 | Eigene Ansicht-Tabs, Suchfeld/Filter in einer Zeile, Status darunter, eingeklappte Gruppen |
| IMG_9796 | Projekt: eine Aktion „Auftrag starten“, kein zusätzliches Speichern |
| IMG_9797 | Manuelles Zeitsheet: Header und Aktionen sichtbar, Inhalt scrollt, VisualViewport |
| IMG_9798 | Wirkliches A4-PDF, kompakte Rechnung, Vorschau mit eigenem Scrollbereich |
| IMG_9799 | Vollständiger Swiss-QR-Zahlteil, kein erzwungener zusätzlicher Zahlungsbogen |

Alle gefundenen elf Dateien werden berücksichtigt, einschließlich der zusätzlich hochgeladenen IMG_9789.

## Fachliche Entscheidungen

- Geltende Spezifikation am 8.10.2026: SIX Implementation Guidelines QR-Rechnung 2.3 (seit 21.11.2025), insbesondere strukturierte Adressen. Version 2.4 ist zu diesem Zeitpunkt noch nicht eingeführt.
- SwissQRBill generiert den echten Code sowie den Empfangsschein/Zahlteil (210 × 105 mm), Helvetica und Schnittmarken. Keine Ersatzkonten und keine dekorativen QR-Grafiken.
- Der bestehende Prozess erzeugt bei Teilzahlungen einen Zahlteil für den verbleibenden Betrag. Das PDF kennzeichnet dies ausdrücklich als Restzahlungsanforderung zur ursprünglichen Rechnung, weist Total, erhaltene Zahlungen und offenen Betrag aus und erstellt keine neue Zahlungsbuchung.
- Entwürfe: sichtbare Kennzeichnung, kein zahlbarer QR-Code. Versand wird vor Mail/Delivery-Mutation blockiert; Ausstellen prüft Zahlungsdaten. Ausgestellte PDFs, Vorschau und Mail nutzen denselben Renderer.
- Ungespeicherte Vorschau: tenantgeschützter, schreibfreier POST-Renderer, immer Entwurf. Kundendaten werden aus dem aktuellen Tenant gelesen, Summen aus Positionen berechnet.
- Mitarbeiterdokumente verwenden den bestehenden tenantgeschützten Datei-Upload, dieselben MIME/10-MB-Grenzen und Speicherung/Scan- und Downloadregeln.
- Timerstunden werden mit sechs Nachkommastellen gespeichert; auch eine Sekunde bleibt positiv und ein wiederholter Stopp erzeugt keinen zweiten Eintrag. Bestehende Werte bleiben erhalten.
- Eintrittsdatum wird bei der API-Übersetzung zuverlässig gespeichert; ein absichtlich gelöschtes Datum bleibt gelöscht.

## Prüfung und Grenzen

Release-/Unit-/PostgreSQL-Integrationsprüfungen, ESLint, TypeScript, CSS-Architektur, Produktionsbuild und Security-Scans bestanden. Der vollständige Scan akzeptiert ausschließlich die bereits dokumentierte Dev-Tool-Ausnahme GHSA-VFJ7-8CJW-P6XM.

Automatisierte Browsermatrix (Chromium und WebKit/Safari-Engine, zusätzlich Pixel-7-Emulation): Light/Dark, 375/430/820/1024/1440 px, ergänzt um 568/400 px hohe Viewports und Fokus auf das letzte Sheet-Feld. Assertions prüfen Page-Overflow, eine Primäraktion, Feldreihenfolge, Sheet-Header/Footer, Gruppensummen und Dokumentzoom. Die vollständige bestehende Routenmatrix bleibt aktiv.

PostgreSQL-Integration prüft reale Timer-/Rechnungs-/Teilzahlungs-/RLS-Prozesse, Draft-Versandblockade, schreibfreie Entwurfsvorschau und Kundenisolation. PDF-QA rendert kurze/teilbezahlte/Entwurfs-/75-Positionen-Rechnungen und überlange Beschreibungen. Barcode-Decodierung kontrolliert Betrag/Konto/Währung aus dem tatsächlichen PDF; Textprüfung kontrolliert den vollständigen Inhalt und A4-Seiten.

Ergebnis: Chromium 450 Routen-/Theme-/Viewport-Kombinationen, WebKit 60 und Pixel-7-Emulation 15, jeweils mit den Interaktionsprüfungen. Kurze Rechnung, Restzahlungsanforderung und Entwurf haben je eine A4-Seite; lange Dokumente bleiben vollständig. Der echte Code wurde aus dem PDF decodiert (216.20 CHF bzw. Restbetrag 116.20 CHF); Entwürfe enthalten keinen QR-Code.

Browser-Emulation ersetzt keine physische Mobile-Safari-/iPhone-PWA-/Android-Geräteabnahme. Native Tastatur, Installation und Betriebssystem-Teilen sind ohne entsprechende Geräte nicht abschließend geprüft. Diese Geräteabnahme bleibt offen. Merge und Deployment bleiben gemäß dem Auftrag bis zur vollständigen technischen und visuellen Abnahme gesperrt.

Quelle: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.3-en.pdf
