# Formular-Auswahlfelder: begrenztes UX-Paket, 17.10.2026

## Integration und Ausgangslage

PR #274 wurde nach ausdrücklicher Freigabe exakt des Heads d941ed100c67828c84c7e5961aef5ef0fc051100 regulär in main integriert: 630228cc7ed05bcac30886663749be2ff890bb7f. Aktuelle quality/analyze-Jobs, Mergefähigkeit, leere Reviews/Threads und main-Schutz wurden vor dem Merge geprüft. Keine Schutzregel geändert, kein Deployment.

Das folgende Paket verwendet nur die vorhandene zentrale UX-Foundation. Quelle: Microsoft-Referenzpaket vom 15.10. und bestätigte Rangfolge vom 17.10. Die Referenz verlangt lesbare Texte, geeignete Touchziele, Tastatur und Fokus; der bestehende Touch-Token beträgt 44 px. Nicht dargestellte Mehrzeilen-/Dark-/Fehlerzustände bleiben abgeleitet.

## Nachgewiesene Ursache und minimale Korrektur

Die zentrale form-check-Zeile verwendete bisher den Control-Token (auf Desktop 40 px; auf mobilen Ansichten bereits teilweise 44 px). Eine neue Browserprüfung gegen den bisherigen Build schlug bei der Mindest-Touchfläche tatsächlich fehl. Der native Checkbox-Kasten ist bewusst kleiner als die gesamte klickbare Beschriftung.

- Im bestehenden Primitives-Owner min-height auf var(--touch) umstellen; native Kontrollgrösse unverändert.
- Der bestehende, von Field generierte Label-Span erhält flex:1 und min-width:0. Lange Beschriftungen umbrechen damit neben dem Feld statt als neues Flex-Element darunter.
- Fehler und Hinweise behalten ihre volle Zeile. Keine neue lokale CSS-Klasse/Datei und kein weiterer Komponenten-Owner.
- Kein JSX-, Validierungs-, Rechtszustimmungs-, API-, Speicher-, Auth- oder RBAC-Ablauf geändert. Keine produktive Zustimmung oder Testmail.

Bestehende Nutzungen sind insbesondere Kundenkontakt, Dublettenentscheidung, manuelle Zeit und Registrierung. Die zentrale Regel gilt auch für denselben Field-Typ mit Radio-Inputs; das hier tatsächlich bediente native Feld ist eine Checkbox. Nicht als vollständige Radio-/Registrierungsabnahme ausgeben.

## Testumfang und Nachweise

Die vorhandene isolierte Kunden-Interaktion öffnet den echten Kontakteditor. Neue Prüfungen messen bei 1440/390/320 px die Touchfläche und die Anordnung eines absichtlich langen synthetischen Textes. Anschliessend werden Originaltext und ursprünglicher Checkbox-Wert wiederhergestellt. Label-Klick und Space prüfen native Bedienung. Zwei negative Kontrollen müssen scheitern: min-height 18 px und altes Flex-Verhalten. Keine Serveränderung wird dazu abgesendet.

Vorher-Nachweise: ux-form-choice-before (erwartet rote Regression, Kontakt-/Fehler-/Lade-Screenshots). Nachher wird unter ux-form-choice-after mit Screenshots/DOM erfasst. Generierte Architektur-Inventare werden ausschliesslich mit den vorhandenen Generatoren aktualisiert. Ein grosser JSON-Diff kann CSS-Regelnummern verschieben; keine manuell eingesetzten Hashes.

Lokal bestanden: Lint, Typecheck, Produktionsbuild; Architektur-/Integrations-/UI-/CSS-/Style-/UX-Vertragsprüfungen, Lokalisierungsabdeckung und beide unveränderten Navigationsverträge. 18 Chromium/Edge-Routen-/Viewport-/Theme-Fälle plus Kunden-Interaktionen bestanden in Light/Dark, einschliesslich echter Klick-/Space-Bedienung, langer Texte und beider negativer Kontrollen. Zusätzlich bestand die bestehende Registrierungsregression mit direkter Choice-Geometrieprüfung: 6 Responsive-/Theme-Fälle bei 320/390/1440 px und 5 Sprachabläufe (DE/FR/IT/EN/TR), ausschliesslich synthetische POST-/Mailantworten. Mobile-/Desktop-Langtext sowie die Registrierung wurden visuell geprüft. GitHub-Pflichtchecks bleiben vor Integration erforderlich. Mobile Navigation, ihre Hashes und Assertions bleiben unverändert. Der neue PR darf ohne weitere ausdrückliche Freigabe nicht integriert werden.

## Offen

Vollständige Formular-/Registrierungsabnahme in allen Sprachen und physischen Geräten bleibt Teil der späteren UX-/Releaseabnahme. Getrennte weitere Pakete: Dokumentvorschau, Timer und übrige Formulare; kein automatischer Übergang in Infrastruktur-/Monitoringarbeiten. Keine produktiven Änderungen.
