# Binso Admin – Manueller End-to-End Testplan

Diesen Ablauf nach jedem grossen Merge auf Azure Production durchführen.

## 1. Navigation und Quick Create

1. Dashboard öffnen.
2. Desktop `+` bzw. Mobile/PWA `+` öffnen.
3. **Kunde erfassen** wählen – Formular muss sofort öffnen, auch wenn man bereits auf `/customers` ist.
4. Dasselbe für Angebot, Auftrag, Zeit, Rechnung und Zahlung wiederholen.
5. `Ctrl/Cmd + K` öffnen und einen bestehenden Kunden, Auftrag, ein Angebot und eine Rechnung suchen. Der konkrete Datensatz muss sich öffnen.

## 2. Kunde → Angebot → Auftrag

1. Neuen Testkunden mit vollständiger Adresse/E-Mail erfassen.
2. Kunde in globaler Suche öffnen und Daten bearbeiten.
3. Angebot erstellen, zwei Positionen erfassen und speichern.
4. A4-Vorschau öffnen; Empfänger, Adresse, Positionen, Total und Texte prüfen.
5. Senden im Demo-Modus; Status muss `Versendet` werden.
6. Neue Version erzeugen; Version muss erhöht und Status wieder Entwurf sein.
7. Angebot annehmen.
8. `Auftrag erstellen`; konkretes Auftragsdetail muss geöffnet werden.

## 3. Auftrag / Personen / Regeln

1. Auftrag bearbeiten und Referenzen/Budget speichern.
2. Regeln öffnen: `both`, täglicher Nachweis, PDF/Signatur/Kundenfreigabe einschalten, Fakturierung bei fehlendem Nachweis blockieren.
3. Mitarbeiter oder externe Firma zuweisen.
4. Für eine Person einen Override definieren und speichern.
5. Seite neu laden; Regeln müssen im Demo-Store erhalten bleiben.

## 4. Zeit → Evidence → Freigabe

1. Über `+ → Zeit erfassen` Zeit auf den Auftrag buchen.
2. Ohne erforderlichen Nachweis prüfen: Freigabe/Fakturierung muss blockiert sein.
3. Im Auftrag einen PDF-Nachweis zur Zeit erfassen und Signatur/Kundenbestätigung setzen.
4. Nachweis prüfen/verifizieren.
5. Zeit freigeben.
6. Zeit muss als verrechenbar erscheinen.

## 5. Zeit → Rechnung

1. In Zeiterfassung geeignete Zeit auswählen und `Rechnung erstellen` ausführen **oder** unter Rechnungen einen Auftrag auswählen.
2. Nur freigegebene, noch nicht verrechnete und evidence-konforme Zeiten dürfen auswählbar sein.
3. Zusätzliche freie Position ergänzen.
4. Rechnungsentwurf erstellen.
5. Prüfen, dass jede Zeit als eigene Rechnungsposition vorhanden ist.
6. Ursprungszeiten dürfen nicht nochmals zur Fakturierung angeboten werden.

## 6. Rechnung bearbeiten / PDF / Versand / Zahlung

1. Entwurf öffnen und bearbeiten: Adresse, Datum, Fälligkeit, Intro/Outro, Position, Menge, Preis, MWST.
2. Fehlendes Pflichtfeld erzeugen; Versand muss blockiert sein.
3. A4-Vorschau prüfen und Browser-PDF/Druck aufrufen.
4. In Einstellungen Rechnungs-Absender setzen.
5. Versanddialog öffnen: `Von`, Empfänger, Betreff und Nachricht müssen sichtbar sein.
6. Demo-Senden; Status muss `Versendet` sein.
7. Teilzahlung erfassen; Status `Teilbezahlt`.
8. Restzahlung erfassen; Status `Bezahlt`.

## 7. Storno

1. Neuen Rechnungsentwurf aus einer Zeit erstellen.
2. Rechnung stornieren.
3. Status muss `Storniert` sein.
4. Die zuvor verwendete Zeit muss danach wieder fakturierbar sein.

## 8. Kreditoren

1. Lieferantenrechnung für externe Firma erfassen.
2. Auftrag zuordnen.
3. Status `In Prüfung` → `Freigeben` → `Bezahlt` testen.
4. CSV exportieren und prüfen, dass Debitoren und Kreditoren enthalten sind.

## 9. Mitarbeitende und Rollen

1. Stundenlohn-Mitarbeitenden erfassen.
2. Aktiv/Inaktiv-Toggle testen.
3. Rolle/Anstellungsart ändern und speichern.
4. Als Employee-Konzept prüfen: Navigation enthält keine Kunden/Angebote/Rechnungen/Buchhaltung.

## 10. Einstellungen

1. Unternehmensdaten ändern und speichern.
2. Rechnungs-/Angebots-/Mahnungs-Absender konfigurieren.
3. Workflow-Toggles ändern.
4. Dokumenttexte ändern und neues Dokument erstellen; Vorlage muss übernommen werden.
5. Hell/Dunkel/System prüfen.
6. Mobile/PWA: Suche antippen – kein iOS Auto-Zoom; Pille/Bottom Sheet scrollen und schliessen.

## Akzeptanz

Ein Release gilt im Demo-Umfang als funktionsfähig, wenn alle obigen Schritte ohne leere Zielseite, tote Buttons, verlorene Demo-Daten oder doppelte Fakturierung durchlaufen.

Echte E-Mail, DB, Blob, Scheduler, serverseitiges PDF/Audit und Push-Zustellung werden separat als Produktionsintegration getestet.

## Overlay and Bottom-Sheet Migration Tests

### Behaviour

1. Open and close a standard create/edit form.
2. Close with Escape on desktop.
3. Close with the visible close control.
4. Verify backdrop dismissal where allowed.
5. Submit via the footer button that targets the form by form ID.
6. Trigger a validation error and verify the invalid field remains reachable.
7. Use a long form and scroll from first to last field; header/footer must not scroll away.
8. Verify no second body/page scrollbar exists while an overlay is open.
9. Open a second overlay from an existing overlay where supported and verify the scroll-lock depth is restored correctly.
10. Close the overlay and verify focus returns to the original trigger.

### Viewport / keyboard

- 320x568
- 375x667
- 390x844
- 430x932
- 768x1024
- 820x1180
- 1366x768
- 1920x1080

On mobile browser and installed PWA test text, numeric and multiline keyboards near the bottom of long forms. The focused control must remain reachable, footer behaviour must stay predictable, and closing the keyboard must not leave a stale viewport height.

### Document preview

Invoice/PDF/image/attachment/report previews use ResponsivePreview, not StandardFormSheet. On mobile/PWA the preview is fullscreen or near-fullscreen; on desktop it is a large controlled presentation. Preview header/actions remain outside the document scroll region.
