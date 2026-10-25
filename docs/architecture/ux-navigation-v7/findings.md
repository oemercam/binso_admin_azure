# V7.1 – belegte Ist-Soll-Befunde

Baseline: d35df2c5, mit den separat dokumentierten lokalen PWA-Korrekturen.
Die vollständige Dateiliste, 88 Routen, 158 API-Routen, 108 Migrationen,
Komponenten, CSS-Owner und das isolierte QA-Schema stehen in den JSON-Inventaren.
Das ist statische Abdeckung, keine pauschale fachliche oder visuelle Abnahme.

| ID | Priorität | Beleg/Owner | Ist → V7-Soll | Korrektur und Gegenprüfung |
|---|---|---|---|---|
| V7-01 | P1 | `components/pages/customers.tsx#CustomerDetail` | Drei Tabs, Finanzblöcke, Auftrags-/Zahlungs-/Kontaktlisten auf dem Einstieg → acht kompakte Navigationszeilen | Bestehende Bereiche über dieselbe Kundenroute erreichbar halten; Header-/Zurück-/Zählwertgegenfälle |
| V7-02 | P1 | `components/pages/finance.tsx#FinancialDocumentsPage` | `customerId` wird nicht gelesen → kundengefilterte Angebote/Rechnungen mit sichtbarem Kontext | Vorhandenen API-Filter verwenden; Kontext im Detail-Rückweg erhalten; globale Liste ohne erzwungenen Kundenfilter |
| V7-03 | P1 | `components/pages/projects.tsx#ProjectDetail` | Berechnetes `returnTo` wird im geladenen Header durch `/projekte` ersetzt | Sicheren Rückweg auch im Erfolgszustand verwenden; Listen-/Kunden-Gegenfälle |
| V7-04 | P2 | `config/workspace-navigation.ts#moreNavigation` | Zahlungen fehlen; Reihenfolge/Bezeichnungen weichen ab | V7-Katalog, Rechtefilter und geschützte Dock-/FAB-Geometrie prüfen |
| V7-05 | P2 | `app/design-system/overlays.css`, `settings.css` | 13-px-Aktionsschrift, abweichende Flex-/Icon-Overrides, keine Zählwertspalte | Bestehenden ActionRow zentral erweitern; 14/18/16-px-Raster, 48-px-Ziele, genau eine innere Linie |
| V7-06 | P1 | `app/support/[id]/page.tsx` | Ticketliste öffnet direkt SupportChat | Bestehendes Ticket-/Nachrichten-/Dateimodell verwenden; Detail zuerst, Unterhaltung explizit erreichbar |
| V7-07 | P2 | `components/pages/finance.tsx#FinancePage` | Angebote und Arbeitszeit erscheinen als Finanzbereiche | Finanzübersicht auf echte Finanzdaten begrenzen; Fachfunktionen über Navigation erhalten |
| V7-08 | P1 QA | `scripts/readiness-integrity-test.mjs:40` | Linux-PATH-Trenner und implizites Bash/Python-Testdouble unter Windows | Portablen lokalen Testaufruf herstellen, echte Bash-Gegenfälle und Fail-Closed-Prüfungen erhalten |
| V7-09 | P2 | `lib/locales/messages.json`, Locale-Verträge | Historische Prüfungen qualifizieren vier Sprachen; TR-Fallback ist kein Übersetzungsnachweis | V7-Referenztexte in fünf Sprachen prüfen; fehlende Rechtsfreigaben ausdrücklich offen halten |
| V7-10 | P2 | `components/pages/customers.tsx#CustomerDetail` | Aktivitätszeit ist auf de-CH/Europe/Zurich festgelegt | Bestehende Format-/Locale-Infrastruktur wiederverwenden; Benutzerdaten unverändert |

Nicht als Fehler eingestuft: fachliche Statuskonstanten, historische Migrationen,
öffentliche Original-Asset-URLs und blosse Pattern-Treffer aus `code-candidates`.
Keine Entfernung ohne tatsächlichen Referenz-/Laufzeitnachweis.

Externe Abgrenzung: Main ist geschützt und steht beim lesenden GitHub-Abgleich
auf 8f25f5d. Erforderliche Statuskontexte sind quality und analyze. Keine
Rulesets im sichtbaren Ruleset-Endpunkt. Der Connector unterstützt die angefragte
Workflow-Sammlung nicht; die vorhandenen Workflow-Dateien werden lokal geprüft.
Azure-Schreibaktionen, produktives Schema und reale Provider-/Geräteabnahme sind
damit nicht qualifiziert.

## Umsetzungsstand nach Gegenprüfung

V7-01 bis V7-08 und V7-10 sind lokal korrigiert. V7-09 bleibt teilweise: die Referenznavigation ist in allen fünf Sprachen vorhanden, der globale türkische Katalog und Rechtsfreigaben sind nicht vollständig.

| ID | Priorität | Nachweis | Sichere zentrale Korrektur / Status |
|---|---|---|---|
| V7-11 | P2 | Echter mobiler Titel: 18 px / 23,4 px; Dashboard-Override 20 px | Bestehende Layout-Owner auf V7 18/24 und Abschnitte 14/20 korrigiert. Sechs zusätzliche Token-/CSS-Verträge, bestehende Negativtests erhalten. |
| V7-12 | P1 QA | WebKit mit aktivem Service Worker umgeht Browser-API-Mocks; gehaltene Antworten kamen tatsächlich aus dem Backend | Synthetische Antworten an den realen lokalen HTTP-Rand verlegt. Echter aktiver SW, 20 Start-/Navigationsmessfälle, keine Abschwächung der Bereitschaftsassertionen. |
| V7-13 | P1 QA | Alte Browserverträge erwarten drei Kunden-Tabs, 13-px-Aktionszeilen und alte Menütexte; Records-Hook-Fixture kennt useSyncExternalStore nicht | Konkrete freigegebene Verträge aktualisiert, echte Unteransichten und Finanz-/Rollen-/Entwurfgegenfälle erhalten. Globale Linux-/Geräteabnahme bleibt offen. |
| V7-14 | P1 | Auftragsdetail reicht seinen gefilterten Listenrückweg nicht an verwandte Rechnungen weiter | Gemeinsamer safeAppPath-basierter Return-Owner, genau ein returnTo, verschachtelte Kette und fremde Ziele gegengeprüft. Keine Finanz-/Rechteänderung. |

Windows-Umgebung: jq fehlte; offizielles Windows-jq 1.8.2 mit veröffentlichtem SHA-256 im Workspace geprüft, unveränderte Azure-Predicate-Gegenfälle erfolgreich. Quelle: https://jqlang.org/download/ ; Hash a6fc67fedaf9128a3309a1e2ebb8b986aeccf70122ee46d2cb4849e423f0c627. Keine globale Installation. POSIX-Manifestprüfung bleibt wegen getuid/Unix-Dateirechten offen. Ein zusätzliches Linux-Node-Image wurde von der automatischen Freigabeprüfung wegen der Workspace-Laufzeitregel abgelehnt; keine Umgehung. Eine ausdrückliche Ausnahme wurde angefragt.
