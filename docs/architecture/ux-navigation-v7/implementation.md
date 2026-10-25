# V7.1 – Umsetzung und Abnahmegrenzen

Stand: 25. Oktober 2026. Lokaler Feature-Branch, keine externen Schreibaktionen.

## Inventur und Ausgangsstand

Baseline d35df2c5; dessen Inhalt entsprach dem deployten Main 8f25f5d. Bereits vorhandene eigene PWA-Korrekturen wurden erhalten und integriert. Das ursprüngliche Inventar erfasst 2273 Dateien, 88 Seiten, 158 API-Routendateien, 108 Migrationen und 14 zentrale CSS-Owner. Die aktuelle AST-Inventur umfasst 293 Komponenten. Datenbankschema: ausschliesslich Metadaten der isolierten synthetischen QA-Datenbank. Keine Produktionsdaten oder Zugangsdaten exportiert.

API-Inventar nennt Methoden, Quellorte und statische Guard-Indikatoren. Das ist kein vollständiger Laufzeitnachweis aller delegierten Request-/Response-/Berechtigungsverträge. Bestehende native Mandanten-, Finanz-, Auth- und RLS-Gegenprüfungen ergänzen es. Historische Migrationen und Geschäftsberechnungen wurden nicht umgeschrieben.

## Zentrale Änderungen

- ActionRow: ein gemeinsamer 48-px-Owner mit 14-px-Text, 18-px-Icon, 16-px-Chevron, rechter Zählwertspalte und einer inneren Trennlinie. Widersprüchliche Settings-Overrides entfernt.
- Kunden-Zentrale: acht Zeilen; bestehende Detailbereiche bleiben erreichbar. Berechtigte tatsächliche Zählwerte aus derselben mandantengeprüften Datenquelle, unbekannte Werte bleiben unbekannt.
- Kundenfilter für bestehende globale Auftrags-, Angebots-, Rechnungs- und Zahlungslisten. Einzelnes Zurücksetzen erhält übrige URL-Auswahlen. Detail-Rückwege erhalten den Listen-/Kundenkontext.
- Mehr: freigegebene Kategorien und Reihenfolge; Avatar persönlich. Ein zentraler Sprachwähler, native vollständige Optionsnamen.
- Ticketdetail vor Unterhaltung, bestehender Chat/Dateien und Entwurfsschutz erhalten. Explizite Conversation-Eigenschaft bestimmt Chat-Chrome statt einer pauschalen Pfadannahme.
- Finanzübersicht auf Finanzdaten begrenzt; Angebote/Zeiten über ihre vorhandenen Hauptorte erreichbar.
- Einrichtungstitel Unternehmen, Adresse, Zahlungskonto; Anforderungen und sensible Speicherung unverändert.
- Vorbereitete PWA-Korrekturen: stabiler Shell-/Listenaufbau, begrenzter sitzungsgebundener Query-/Toolbar-Cache, verzögert geladene Panels und vorsichtiger Versionshinweis ohne automatischen Reload bei Entwürfen/Mutationen. Details im separaten PWA-Bericht.
- QA: portable Bash-Gegenprüfungen unter Windows, aktuelle Navigation-/Routen-/Komponentenverträge und tatsächliche Hub-/Tenant-Gegenfälle. Keine Baselines stillschweigend angenommen, keine Pflichtprüfung deaktiviert.

## Browsernachweise

Echte lokale Anwendung, synthetische Firma: Kunden-Zentrale bei 320/390/430/768/1024/1440 px, alle acht Zeilen 48 px/14 px, gleiche Zählwert-/Chevron-Ausrichtung, kein horizontaler Überlauf. Kunden-Zentrale → kundenbezogene Rechnungen → Rechnung → exakt dieselbe Liste → Kunden-Zentrale tatsächlich geprüft. Mehr → Rechnungen zeigt beide synthetischen Kunden ohne versteckten Kundenfilter. Avatar DE/FR/TR geprüft; weitere Nachweise im finalen QA-Protokoll. Bilder im Workspace-Ordner V7-Vorschau-20261025; keine Produktionsbilder oder private Release-Nachweise im Git.

## Verbleibende Abweichungen und Risiken

- Alle Routen bleiben mindestens Teilweise: statische Vollständigkeit ist keine vollständige Funktions- oder visuelle Abnahme jeder Rolle/jedes Zustands.
- 3443 Katalogeinträge haben weiterhin keine türkische Fassung; V7-Referenznavigation ergänzt, vollständige globale Sprachabnahme offen. Keine Rechtsübersetzungen erfunden.
- Echte iPhone-/iPad-PWA, native Tastatur/Safe Area, sämtliche Rollen, Zoom-/Kontrastfälle, alle fünf Sprachen über alle Seiten und rechtliche Freigaben offen.
- Ticketverlauf zeigt vorhandene Erstell-/Änderungsmetadaten; keine erfundenen Zustell-/Lese- oder Providerereignisse.
- Azure-Konfiguration und Produktionsschema nicht administrativ ausgelesen. Öffentliche Health-/Readiness-GETs erfolgreich; GitHub Main/Schutz lesend geprüft. Externe Mail-/Push-/Billing-/Scannerzustellung nicht ausgelöst oder als abgenommen bezeichnet.
- Vollständige GitHub-Linux-/Chromium-/WebKit-/Scanner-Pflichtmatrix muss auf dem später freigegebenen Commit tatsächlich bestehen. Lokale Ergebnisse ersetzen diese nicht.

## Finaler Prüfstand

Befehle, Exitcodes und Identität werden nach den finalen lokalen Gates in qa-results.json ergänzt. Bis dahin keine abschliessende Abnahme oder Deploymentfähigkeit behauptet.
