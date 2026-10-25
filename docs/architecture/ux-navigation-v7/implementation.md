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

Echte lokale Anwendung, synthetische Firma: Kunden-Zentrale bei 320/390/430/768/1024/1440 px, alle acht Zeilen 48 px/14 px, gleiche Zählwert-/Chevron-Ausrichtung, kein horizontaler Überlauf. Kunden-Zentrale → kundenbezogene Rechnungen → Rechnung → exakt dieselbe Liste → Kunden-Zentrale tatsächlich geprüft, im optimierten finalen Build erneut bestätigt. Sichtbarer Titel 18 px/24 px nachgemessen. Mehr → Rechnungen zeigt beide synthetischen Kunden ohne versteckten Kundenfilter. Avatar DE/FR/IT/EN/TR geprüft. Bilder im Workspace-Ordner V7-Vorschau-20261025; keine Produktionsbilder oder private Release-Nachweise im Git.

## Verbleibende Abweichungen und Risiken

- Alle Routen bleiben mindestens Teilweise: statische Vollständigkeit ist keine vollständige Funktions- oder visuelle Abnahme jeder Rolle/jedes Zustands.
- 3443 Katalogeinträge haben weiterhin keine türkische Fassung; V7-Referenznavigation ergänzt, vollständige globale Sprachabnahme offen. Keine Rechtsübersetzungen erfunden.
- Echte iPhone-/iPad-PWA, native Tastatur/Safe Area, sämtliche Rollen, Zoom-/Kontrastfälle, alle fünf Sprachen über alle Seiten und rechtliche Freigaben offen.
- Ticketverlauf zeigt vorhandene Erstell-/Änderungsmetadaten; keine erfundenen Zustell-/Lese- oder Providerereignisse.
- Azure-Konfiguration und Produktionsschema nicht administrativ ausgelesen. Öffentliche Health-/Readiness-GETs erfolgreich; GitHub Main/Schutz lesend geprüft. Externe Mail-/Push-/Billing-/Scannerzustellung nicht ausgelöst oder als abgenommen bezeichnet.
- Vollständige GitHub-Linux-/Chromium-/WebKit-/Scanner-Pflichtmatrix muss auf dem später freigegebenen Commit tatsächlich bestehen. Lokale Ergebnisse ersetzen diese nicht.

## Finaler Prüfstand

Anwendungsstand: e1ffb6e2efa3a2e6780958817d927c9c60dd0235. Danach ausschliesslich QA-Synchronisation/Diagnostik und Dokumentation; keine weitere Anwendungs-, API-, CSS-, Berechtigungs- oder Migrationsänderung.

- Frozen-Lockfile-Installation, Lint, CSS, Typecheck, release:check, security:scan:all und optimierter Produktionsbuild: Exit 0.
- Vollständiger unveränderter pnpm-test-Befehl: alle 82 Gruppen unter Linux erfolgreich, Exit 0. Offizielles node:24.20.0-bookworm-slim, Digest sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e, pnpm 10.17.1. Eigentümerfreigabe zur isolierten Laufzeitausnahme liegt vor. Git-Bundle des exakten Stands, keine Host-Zugangsdaten, keine Produktionsdaten. Unix-Socket-/Manifestprüfungen unverändert bestanden.
- Windows: dieselben 82 Gruppen einzeln protokolliert, 81 erfolgreich; POSIX-getuid-Gruppe dort nicht ausführbar, anschliessend unter Linux bestanden. Windows-Scannertransport war ein In-Memory-Protokollgegenpart; Linux verwendet den echten Unix-Socket, ebenfalls keine Antivirus-Engine.
- Native PostgreSQL-16-Gegenprüfungen für Parallelität, Registrierung, Auth/Passkey sowie reale HTTP-/Mandanten-/Rollenprüfungen: Exit 0, ausschliesslich isolierte synthetische Datenbanken.
- WebKit mit aktivem Service Worker: 20 Start-/Refresh-/Wiederöffnungs-/Navigationsfälle, beide Themes bei 390/1440 px, Exit 0. Oberfläche und Navigation bleiben bei Warmnavigation erhalten; null zusätzliche Sitzungsabfragen. Lokale synthetische Navigationszeiten 917–1545 ms sind keine Aussage über die Produktiv-PWA oder echte Apple-Geräte.
- Zwei vorherige WebKit-Wiederöffnungen erreichten das unveränderte 30-s-Load-Limit. Der vollständige anschliessende Lauf mit zusätzlicher Request-Diagnostik bestand ohne Änderung der Timeouts, Bereitschaftsbedingungen oder Anwendung. Ursache der intermittierenden Load-Verzögerung nicht abschliessend bewiesen; als QA-/Performance-Risiko offen.
- Such-/Header-Browserprüfung nach Warten auf das tatsächlich geladene Eingabefeld: beide Themes erfolgreich; Geometrie, Fokus, Abbrechen/Schliessen und verspätete Suchantworten bleiben streng geprüft.

Der vollständige Chromium-Abschlusslauf und dessen Ergebnis werden im gesonderten QA-Protokoll ergänzt. Keine vollständige visuelle, sprachliche, Geräte- oder Produktionsabnahme behauptet; keine externe Schreibaktion durchgeführt.
