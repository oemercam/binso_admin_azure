# Release-Nachweise: Abgleich am 12.10.2026

Dieser Abgleich schließt keinen Release-Punkt und ersetzt keine Produktabnahme. Keine zusätzlichen laufenden Azure-Kosten sind freigegeben. Main, produktive Daten und Bottom-Navigation werden durch diesen Nachweis nicht verändert.

## Tatsächliches Ergebnis des grünen Kandidaten

Quality [38283351020](https://github.com/oemercam/binso_admin_azure/actions/runs/38283351020) prüfte PR #242 mit Head `2b8edb1f57b7b32e4691685d128babb0eab4b7dc`, Merge-Prüfstand `8bf09a1c204fa525f6d5ab345934925dc1f05b3a`. Das erfolgreiche PR-Gate ist keine vollständige 432-Anforderungen-Abnahme.

Artefakt `ux-compliance-8bf09a1c204fa525f6d5ab345934925dc1f05b3a`, ID `11762644424`, wurde heruntergeladen und gegen SHA-256 `b025e9cc712ea7acf24698a87208e18c224513343f12b070f4e49d60ffbd2ca7` geprüft. Der enthaltene Bericht hat Source-Digest `6a0db414fc9150c30adc05ef6031a6d899b78bc9b8ca6af77df8dd14c351dab4`, Registry-Version `1.0.0` und `compliant: false`.

| Status | Anforderungen |
| --- | ---: |
| passed | 4 |
| partial | 23 |
| review-required | 399 |
| not-tested | 5 |
| manual-required | 1 |
| Gesamt | 432 |

70 von 72 Quellrouten besitzen Runtime-Nachweise. Kein gemessener Check schlug fehl. Bei allen 19 Anforderungen mit Methode `browser` fehlen explizite `expectedCases`. Eine große Zahl erfolgreicher Messungen beweist deshalb keine vollständige Route-/Zustand-/Rollenabdeckung. Die Registry enthält auch keine bestätigte vollständige ursprüngliche Abnahmespezifikation (`approvalScopeComplete`); dies darf nicht ohne Quellenabgleich und tatsächliche Abnahme gesetzt werden.

## Konkreter Fehler in der Messautomatik

`UX-LAY-003` hatte null Einzelmessungen: Der Adapter suchte `.header-actions`, AppShell rendert `.desktop-appbar-actions`. Der korrigierte Adapter prüft diesen tatsächlichen Owner ab 1024px, sichtbare Buttons/Links und die vorgesehenen Glocke-/Avatar-Controls. Die linke Suche gehört nicht zu diesem rechten Container. Zwei beliebige Controls dürfen die Prüfung nicht bestehen.

Der vorhandene Timer-Link rechts ist bei laufender Zeitmessung eine zusätzliche Aktion. Die registrierte Anforderung erlaubt ausschließlich Glocke/Avatar; der Adapter enthält keine erfundene Timer-Ausnahme. Dieser Fall muss fehlschlagen, bis Anforderung oder Produktverhalten fachlich geklärt und geprüft sind. Die Oberfläche wird hier nicht umgebaut.

Der bestehende Browser-Adaptertest erhält positive und negative Fälle für normalen Header, zusätzliche Aktion, falschen Ersatz, laufenden Timer, ausgeblendete Aktion sowie 1024/1023px. Diese isolierten Messfixtures ersetzen keine vollständigen Anwendungsfälle. Browserausführung für die Änderung ist separat nachzuweisen; das grüne Vorgängerartefakt gilt nicht für geänderten Code.

Weitere Browser-Anforderungen ohne Einzelchecks im genannten Artefakt: `UX-LAY-005`, `UX-CTL-001`, `UX-VIS-001`. Deren tatsächliche Owner, Zustände und fachliche Erwartungen müssen vor einer Adapteränderung untersucht werden. Keine Baseline wird automatisch als genehmigt aufgezeichnet.

## Archivquellen tatsächlich vorhanden

Die folgenden Dateien wurden aus den eingefrorenen Git-Objekten gelesen. Ihre Existenz ist bestätigt; sie sind keine neue Abnahme des aktuellen Kandidaten.

| Archiv | Vorhandene Quellen | Aussagegrenze |
| --- | --- | --- |
| #222, `75d5aa04bebfdbc0ea81ff82373d8cdaf2fc5510` | `docs/architecture/deep-ux-audit.md`, `ux-inventory.json` | Audit und Inventar vorhanden; kein aktueller Gesamtpass |
| #231, `3377b50be56df4b97fbf784a6825161d686b2d6e` | `ui-foundation-acceptance.md`, `v21-3-validation.md`, `v21-5-readiness.md`, `v21-7-remediation.md`, Route-/Traceability-CSV, `docs/assets/v21-7/` | Historische technische Nachweise und begrenzte Bild-/Browserartefakte vorhanden |

Die historische Foundation-Matrix unterscheidet ausdrücklich automatisierte Geometrie von visueller Abnahme. `v21-5-readiness.md` nennt fehlende eigenständige V21.2-/V21.4-Nachweise und offene vollständige Zustands-/Rollen-/Geräteabnahmen. `v21-3-validation.md` bestätigt Browser-PWA-Prüfungen, ausdrücklich keine physische Installation. Somit widerlegen die verfügbaren Archive keine dieser offenen Freigabelücken.

## Nächste Arbeit ohne Infrastrukturmehrkosten

1. Den korrigierten Header-Adapter mit beiden vorhandenen CI-Browsern prüfen; entdeckte Abweichungen bleiben blockierend.
2. Für jede Registry-Anforderung fachlich anwendbare Route, Zustand, Rolle, Theme, Breite und Engine bestimmen und explizit binden. Erfolgreiche Beobachtungen allein dürfen diese Sollmatrix nicht definieren.
3. Archivierte Änderungen selektiv gegen aktuellen Main abgleichen; historische Nachweise nur ihrem ursprünglichen Prüfstand zuordnen.
4. Benannte visuelle Abnahmen und physische PWA-/Tastaturprüfung nachreichen. Die vom Nutzer auf später verschobene iPhone-Prüfung bleibt offen.
5. Azure-Ingress, tatsächliche Runtime-Promotion, Alarmzustellung und historische Constraint-Verletzungen anhand konkreter Betriebsnachweise bearbeiten. Migration 0048 und Rescan sind weiterhin nicht produktiv ausgeführt.

Ohne qualifizierte aktive Engine bleibt der Kandidat bei Quarantäne: ungeprüfte Dateien werden nicht freigegeben. Ein eingeschränkter Entwicklungsbetrieb ist von vollständiger Produktionsfreigabe zu unterscheiden. Der strikte Release-Gate, `releaseReady: false` und die Bindung an das exakt geprüfte aktuelle Main-Artefakt bleiben bestehen.
