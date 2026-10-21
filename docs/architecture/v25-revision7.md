# Revision 7 — Arbeitsstand und Abnahmegrenzen

Verbindliche Quelle: [bytegetreue Revision 7 mit allen 56 Kapiteln](../audit/v25-revision7/source.md).
P0/P1/P2 vollständig im Auftragsumfang; P3 ausgeschlossen. **Dieser Zwischenstand ist keine Gesamtfertigstellung und keine Produktionsfreigabe.**

## Basis und parallele Arbeiten

- Main geprüft: ba4234604ac16b2209bef70a532ccd94f4953035.
- Ausgangspunkt: PR305, 26dc1ffc7bf61a4058deba8b25b0271e1dc5dad1, bestehende technische Prüfungen erfolgreich.
- Eigener Folgebranch feat/v25-revision7; PR305 und PR306 bleiben unverändert. PR306 betrifft ausschliesslich einen Timer im Browser-Test; diesen Bereich nicht parallel bearbeiten.
- PR267, PR271, PR298 und Sicherheitsbranch bleiben erhalten. Keine produktiven Schreibaktionen.
- Die alten 399 Review-Fälle und realen Geräte-/Zustellabnahmen sind weiterhin offen. Alte grüne CI gilt nicht für neue Änderungen.

## Register

[Anforderungen](../audit/v25-revision7/requirements.csv), [Routen/Rollen/Zustände](../audit/v25-revision7/route-role-states.csv), [Routen, Komponenten, APIs und Migrationen](../audit/v25-revision7/routes.json).
Generator: scripts/revision7-inventory.mjs. Erfasst 56 Kapitel, 151 Textklauseln, 77 Routen, 5588 geplante Route/Rolle/Zustand-Fälle. Zusammengesetzte Klauseln behalten den kompletten Originaltext; sie sind nicht pauschal bestanden.
Das Register ist eine Vollständigkeitskontrolle, kein Beleg ausgeführter Tests. Noch nicht einzeln ausgeführte Zustands-/Rollen-/Visualfälle bleiben ausdrücklich nicht abgenommen.

## Zusammenhängende Pakete

1. Identity/Foundation: rahmenlose Sprachwahl mit dem bestehenden zugänglichen Listbox-Owner; DE/FR/IT/EN mit ausgeschriebenen Sprachnamen im Popover; globale 12px/48px/16px Feldtokens, 28/22/16px Überschriften, keine Änderung an Navigation/FAB. Schrittweise Vollbildregistrierung, strukturierte Namen bis zur Datenbank und Einladung. Profilsprachpräferenz beim Laden berücksichtigen.
2. Dateien/Profile: begrenzte echte Bilddekodierung, automatische Orientierung, EXIF-/GPS-Entfernung, 512px-Avatar und proportionale Firmenlogos; definierte JPEG/PNG/WebP-Unterstützung, HEIC nicht als unterstützt ausgeben. Avatarentfernung nur eigener Datei und bedingte Löschung der aktuellen Referenz. Schadsoftware-/Quarantäneregeln bleiben bestehen.
3. Consent/Public: gleiche Optionen für Annehmen/Ablehnen/Einstellungen, versionierte datenarme Präferenz, zentrale Toggles, Fokusführung und Fehler bei blockiertem Speicher. Unveränderte ältere Kategorien werden kompatibel gelesen; keine neue Trackingzustimmung unterstellt. Notwendiger Speicher bleibt aktiv. Bestehender Web-Vitals-Sender prüft die Einwilligung unmittelbar vor jeder Übermittlung. Öffentlicher Footer erhält reale Kontakt-/Support-/Funktionsziele. Rechtstexte inhaltlich unverändert; keine juristische Übersetzung veröffentlicht.
4. Dokumente/Reporting: QR-Zahlteil für neue Ausstellungen auf eigener letzter A4-Seite mit freiem oberen Bereich. Historische Layouts ohne Rendererrevision bleiben erhalten; Migration0070 speichert künftig ausgestellte Rechnungs-PDFs unveränderlich. Keine rückwirkende Scheinarchivierung. Entwürfe ohne Bankdaten zulässig, Ausstellung ohne gültige Zahlungsdaten weiterhin gesperrt. Standard-Neuversand verwendet archivierte Bytes; Mahnung ist eine gesonderte aktuelle Zahlungsinformation. Reporting nutzt vorhandene autorisierte Datenquelle und PDF-Owner für echte PDF-/CSV-Exporte mit Audit, Vorschau und Gerätefreigabe. Sichere öffentliche Rapportlinks, direkte Berichts-E-Mails und vollständige Detailrapporte sind damit **noch nicht** abgenommen.
5. PDF-Viewer: zentraler Pointerpfad für Fit-Seitenwechsel, begrenzten Pinch-Zoom, Doppeltipp und Panning; Navigation nicht nach Pinch/Pan; begrenzte Canvas-Ressourcen. Tastatur und bestehende Seitenbuttons bleiben als Alternative. Echte iOS-/Android-Gestenabnahme offen.
6. Noch vollständig abzuarbeiten: atomarer Abgleich aller P0–P2-Klauseln, fehlende Import-/Merge-/Reminder-/Report-Funktionen nach Istprüfung, rollenbezogene KPI-Prüfung jeder Route, vollständige Sprachausgabe/Formatierung und juristische Sprachabnahme, Desktop/Public/Admin-Sonderzustände, reale End-to-End-/visuelle Abnahme. Keine pauschale Erfolgsmeldung für diese Bereiche.

## Nachgewiesene Ursachen und Datenfluss

| Feld/Defekt | Ursache / Pfad | Korrektur / Grenze |
|---|---|---|
| Registrierungsname | UI übermittelte einen Kontaktnamen; provisioning schrieb nur display_name, Profil las first_name/last_name | Explizite Felder → Register-DTO → provisioning → app_users.first_name/last_name → Profil-API. Keine Namen aus Firmen-/Displaynamen erraten; kein produktives Backfill. |
| Einladung | Aktivierung schrieb ebenfalls nur display_name | Neue UI übergibt beide Namen, Aktivierung setzt sie für neue eingeladene Benutzer. Bestehende aktive Identitäten werden nicht überschrieben. |
| E-Mail/Firma/Sprache | Vorhandene atomare provisioning-/Verifizierungslogik | Beibehalten; Sprache in app_users, Firma in organizations, eine aktive Mitgliedschaft. |
| Avatar | Produktiver ursprünglicher Uploadfehler hier nicht reproduziert. Nachgewiesen war bislang Signaturprüfung ohne vollständige Dekodierung/Metadatenbereinigung. | Sichere Verarbeitung ergänzt; Quarantäne blockiert weiterhin. Tatsächliche Produktionsantwort/Scannerstatus und Geräteprüfung bleiben für die konkrete Fehlermeldung nachzuweisen. |
| Rechnungsentwurf | Bankprüfung in create/update_document_atomic vor Statusprüfung | Bankprüfung gehört in den bestehenden Ausstellungsprozess; positive Entwurf- und negative Ausstellungsregression. |
| PDF-Historie | Rechnungen wurden bei jedem Abruf aus Snapshot neu gerendert | Neue Ausstellungen erhalten unveränderliche PDF-Bytes und SHA256; Altbestand unverändert, fehlende historische Originalbytes nicht nachträglich behauptet. |

## Verifikation und offene Grenzen

Tatsächliche Testergebnisse werden in evidence.json und im Paketbericht fortgeschrieben, niemals aus Dateiexistenz abgeleitet. Zwischenprüfungen: Registrierung/PGlite, Bildverarbeitung, PDF-/QR-Berechnungen, Lokalisierungsabdeckung, Navigation und Gestenhelfer. Gebündelte Build-/Browser-/CI-Abnahme steht noch aus.

Die fachlichen Inhalte rechtsverbindlicher Übersetzungen benötigen qualifizierte Prüfung. DNS/TLS/SPF/DKIM/DMARC, reale Graph-Zustellung/Bounces, Push-Infrastruktur und Wiederherstellungsnachweis sind externe Voraussetzungen. Keine neue Berechtigung oder Infrastruktur eigenmächtig anlegen. Physische Geräte-/PWA-/Tastaturprüfungen nicht durch Desktopemulation ersetzen.

SIX-Referenz für die QR-Prüfung: [offizielle QR-Rechnungsstandards](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html), [Version2.4](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.4-en.pdf). Eigene Layoutvorgabe «oben frei» von SIX-Payload-/Massvorgaben unterscheiden; keine Zertifizierung behaupten.

Für eine spätere Integration/Produktion braucht dieses neue Paket eine eigene exakte SHA-Freigabe einschliesslich Migration0070 sowie vorheriger, noch nicht integrierter Migrationen0067–0069. Kein Merge, keine Migration und kein Deployment ausgeführt.
