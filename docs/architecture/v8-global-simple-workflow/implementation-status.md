# V8 – lokaler Implementierungsstand, 28. Oktober 2026

Fortsetzung auf dem unveränderten Budget-Checkpoint 39f6a19c3cf3972907b1643153ba9dd5fa253829.
Noch kein neuer Release und keine V8-Gesamtabnahme. Details, führende Dateien und
bekannte Grenzen: [Abrechnungsintegration](billing-integration.md).

| Anforderung | Status | Beleg / Restumfang |
| --- | --- | --- |
| Budgetkorrekturen erhalten | Erledigt | Keine Änderung an Migration 0109, lib/projects.ts und Budget-Testfällen; tatsächliche API/RLS-Budgetregression erneut ausgeführt |
| Gemeinsame sechs Modelle | Erledigt lokal | Bestehender gemeinsamer Vertrag erweitert; eine unveränderte Geld-/Steuer-Engine |
| Angebot → Auftrag → Rechnung | Erledigt lokal für sechs Standardketten | Echte APIs, Migrationen, eingeschränkte Datenbankrolle und Ausstellung je Modell |
| Preis/Menge/Steuer/Quellen | Erledigt lokal im geprüften Umfang | Unveränderliche Vereinbarung, Positions-/Quellbindung, Kapazitätsgrenzen; erweiterte Rabatt-/Cent-Gegenfälle offen |
| Zeiterfassung | Teilweise | Enthaltene Stunden ausgeschlossen, reale Freigaben/Quellen und feste Rate gebunden; externe Minutenvarianten im neuen Modell noch nicht vollständig qualifiziert |
| Teil/Akonto/Schluss/Gutschrift | Teilweise | Gemeinsame Kapazität, Rabattbudget, bisherige Rechnungen, Null-Schluss, Korrektur ohne stillschweigende Quellenfreigabe; variable Akonto-Verrechnung ohne Fixanteil nicht implementiert |
| Mehrere unabhängige Vereinbarungen in einer Rechnung | Offen | Neue strukturierte Auswahl wird sicher begrenzt; bestehende unmodellierte Flüsse erhalten |
| Rollen/RLS/Status/Audit/Idempotenz | Erledigt lokal im geprüften Umfang | Reale eingeschränkte Datenbank-/API-Gegenfälle, unveränderliche historische Snapshots |
| Übersetzungen | Teilweise | Neue Bedien-/PDF-Texte in DE/FR/IT/EN/TR; vollständige linguistische/visuelle Abnahme offen |
| Browser | Gezielt grün | 66 Fälle: 26 Übernahmen aus Angebot/Auftrag/Zeit, 32 Fälle über acht Breiten in Light/Dark, acht schmale FR/IT/EN/TR-Fälle; keine physische Geräteabnahme |
| Nativer Konkurrenztest | Blockiert | Keine laufende lokale PostgreSQL-Engine; PGlite ersetzt keine überlappenden nativen Transaktionen |
| Physische Safari/iOS-PWA/iPad-Abnahme | Blockiert | Keine tatsächliche Geräteprüfung; Browseremulation wird getrennt ausgewiesen |
| Vollständige Pflichtprüfungen finaler Zustand | Grün lokal | pnpm lint, typecheck, build und vollständiger pnpm test mit 92 Pflichtprogrammen erfolgreich; native und physische Gates bleiben offen |
| Übriges V8 | Offen/teilweise | Vorher-Matrix bleibt Inventur, keine automatische Gesamtabnahme |

Keine produktive Migration, kein GitHub-Push, Merge oder Azure-Deployment.
Keine kostenpflichtigen Dienste aktiviert. Kundenlogin und Navigation/FAB bleiben erhalten.


## Nachweise des abschliessenden lokalen Stands

- Vollständiges Lint: Exit 0, v8-billing-lint-final-source.log.
- TypeScript: Exit 0, v8-billing-typecheck-final-source.log.
- Produktionsbuild: Exit 0, v8-billing-build-final-source.log.
- Vollständiger pnpm-test-Lauf (92 Programme): Exit 0, v8-billing-tests-final-source.log.
- 26 Browserfälle für alle sechs Modelle aus Angebot/Auftrag sowie direkte
  Stundenübernahme, einschliesslich Kunden-/Modell-/Währungssperre, korrekter
  Anfangssumme und erneutem Auftragsabruf nach Fehler: Chromium/WebKit, 390 px.
- 32 gemeinsame Oberflächenfälle: Chromium/WebKit, 320/375/390/430/768/820/1024/1440 px,
  Light/Dark. Zusätzlich acht WebKit-Fälle mit 320 px, FR/IT/EN/TR und Light/Dark.
  Die explizite EUR-Wahl bleibt beim Modellwechsel erhalten. Synthetische
  HTTP-Darstellungsdaten; echte API-/Datenbankintegrität separat geprüft.
- Tatsächliche API-/RLS-Ketten mit allen Migrationen: sechs Modelle, zusätzlich
  gemischte Pauschale plus ausdrücklich vereinbarte reale Zusatzstunden,
  EUR-Stundenrechnung ohne Umrechnung, früh datierter nachträglicher Entwurf
  gegen ausgestellte Schlussrechnung, legitime Verwaltung alter Teilrechnungen,
  feste Rabatte über Teilrechnungen/Perioden, Akonto, Null-Schluss, Gutschrift,
  Wiederholung, Fremdmandant, Rollen, Nur-Lesen und Audit-Rollback.
- Neue Tabellen: Exportfähigkeit, direkte Unveränderlichkeit und tatsächliche
  Kaskade in kontrollierter Löschreihenfolge geprüft. Die vollständige bestehende
  Lösch-CLI ist damit ausdrücklich nicht qualifiziert; siehe Integrationsbericht.
- Online-Prüfung der Produktivabhängigkeiten: Exit 0, keine bekannten Hinweise
  in den gemeldeten Schwereklassen. Keine Abhängigkeiten verändert.
- Budgetdateien gegenüber 39f6a19c3cf3972907b1643153ba9dd5fa253829 identisch;
  gemeinsame Auftragsdateien enthalten additive Abrechnungsintegration. Die
  Budget-API-/RLS-Regression bleibt im erfolgreichen Pflichtlauf aktiv.

Alle Protokolle, Ergebnis-JSONs und Screenshots liegen vom Checkout aus unter
../audit-20261026/v8-billing-*. Geänderte Dateien sind dort zusätzlich nach Bereichen
in v8-billing-changed-files.json aufgelistet. Git-Identität und abschliessende
Prüfmanifest-Datei: v8-billing-final-evidence.json; der finale lokale Commit wird
in der Übergabe genannt. Kein Release-SHA und keine produktive Freigabe.

Ausgewählte echte Browseraufnahmen (isolierte Darstellungsdaten):

- [Direkte Stundenübernahme, WebKit](../../../../audit-20261026/v8-billing-inheritance-browser-final-source/webkit-time-time.png)
- [Gemischtes Modell, 320 px, Dark](../../../../audit-20261026/v8-billing-surface-verified/webkit-de-320-dark-billing-mixed.png)
- [Meilensteine, Türkisch, 320 px](../../../../audit-20261026/v8-billing-locales-verified/webkit-tr-320-dark-billing-milestone.png)

Zwischenprüfungen fanden eine fehlende Übersetzung, einen veralteten Testadapter,
fehlende Summen im neuen Auftragsentwurf, unvollständige Übernahmesperren und die
Abschlussreihenfolge. Diese wurden korrigiert und die betroffenen Gegenfälle
geprüft; keine Pflichtprüfung deaktiviert. Ein Zwischenlauf brach lokal mit
Windows-Prozesscode 0xC0000005 ab. Der betroffene Block und anschliessend der
vollständige Abschlusslauf waren erfolgreich; die genaue Prozessursache ist
nicht abschliessend bestimmt. Gescheiterte Zwischenprotokolle bleiben erhalten.

Offen bleiben insbesondere die in billing-integration.md genannten unabhängigen
Vereinbarungen je Sammelrechnung, variable Akonto-Verrechnung ohne Fixanteil,
automatische Rabatt-/Cent-Verteilung bei Teilmengen, vollständige neue externe
Minutenvarianten, die Lösch-CLI sowie native Konkurrenz- und echte Geräteprüfungen.
V8 ist daher weiterhin keine vollständig abgenommene Release-Fassung.

---

# Vorheriger Budget-/Foundation-Checkpoint (historischer Nachweis)

Basis `72948d6d`, Branch `feat/v8-global-simple-workflow-20261027`.
Noch kein neuer Release und keine V8-Gesamtabnahme.

## Aktueller fachlicher Status

Die vollständige Vorher-Matrix bleibt unverändert in `matrix.md`; diese Tabelle
beschreibt den aktuellen Delta-Stand und vergibt keine globale Abnahme.

| Bereich | Status | Tatsächlicher Stand / verbleibend |
| --- | --- | --- |
| Inventur | Vorhanden | Statische Routen-/Feld-/Aktion-/Rollenmatrix; dynamische Zustände nicht pauschal bestätigt |
| Zentrale Oberflächen | Teilweise | FormPage-Kollision und native Disclosure-Validierung korrigiert; vollständige Routenabnahme offen |
| Firmeneinrichtung | Teilweise | Einseitiger Ablauf, Fortschritt, Recovery und gezielte Browser-/API-Prüfungen; echte Geräte/Mailkette offen |
| Kunden | Teilweise | Direkte Erfassung und optionale Angaben; bestehende Kunden-Zentrale erhalten, vollständige Fachkette offen |
| Aufträge/Budgets | Teilweise | NULL/0, Kostenbudget, Rollen/RLS, Versionsschutz, Migration und Rückweg geprüft; vollständige Planung/Zentrale offen |
| Gemeinsame Abrechnungsmodelle | Teilweise | Strikter gemeinsamer Entwurfsvertrag getestet; Persistenz, Übernahme, Kapazitäten und Rechnungsschutz offen |
| Zeit/Rechnungen/Zahlungen | Teilweise | Bestehende Engine und Regressionen erhalten; neue modellübergreifende End-to-End-Kette offen |
| Spesen/Ausgaben | Teilweise | Begrenzte sichere OCR-Schnittstelle und Formulargegenfälle geprüft; echter Provider nicht qualifiziert |
| Support/Mitarbeiter/Berichte/Finanzen | Teilweise | Bestehende führende Datensätze/Regeln erhalten; neue vollständige Geräte-/Rollenabnahme offen |
| Einstellungen/Admin | Teilweise | Passwortlogin und zwingende Operator-MFA erhalten; reale Entra-Policy-/Geräteabnahme offen |
| Fünf Sprachen | Teilweise | Neue Schlüssel vollständig, gezielte Locale-Browserfälle; vollständige linguistische/visuelle Abnahme offen |
| GitHub/Azure | Teilweise | Nur-Lese-Stand dokumentiert; Branchschutz-Details via Connector nicht zugänglich |
| Native PostgreSQL / physische iOS-PWA | Blockiert | Keine laufende native lokale Engine bzw. tatsächliche Geräteprüfung vorhanden |

## Geklärte Owner-Entscheidungen

- Vollständige 12-Kapitel-Quelle aus der Textantwort ersetzt den abgeschnittenen Anhang.
- Kundenlogin bleibt E-Mail/Passwort. Keine erneute Login-MFA-/Passkey-Aktivierung.
- Sechs gemeinsame Abrechnungsmodelle und fehlende/Nullbudgets dürfen lokal mit
  isolierten Tests umgesetzt werden. Historische Dokumente bleiben unverändert.
- Keine produktive Migration, Push, Merge, Deployment oder neue kostenpflichtige Dienste.

## Bereits lokal geändert, Integration noch offen

- Statische Inventur und abgeleitete Matrix für 91 Quellanforderungen, 666 Kontrollen,
  10 Feldfabrik-Aufrufe, 476 Aktionen, 1'408 Tenant-Rollen-/Profilfälle und 60 Operatorfälle.
- Zentraler FormPage-Owner bekommt eine eindeutige Markierung gegen alte gleichnamige
  Inhaltscontainer. Native Validierung kann eine betroffene Disclosure öffnen.
- Kundenerfassung ohne Zwischenschritt, optionale Angaben unter „Weitere Angaben“.
- Firmenvervollständigung mit kompaktem Fortschritt, zentraler Draft-Recovery und
  Aktion „Einrichtung abschliessen“. QR-Sondereinstellungen ausserhalb.
- Auftragserstellung öffnet bestätigte Auftragsdetails mit sicherem Rückweg.
- Zentraler Draft-Owner entfernt zurückgenommene Änderungen ohne initiale Recovery
  oder spätere Bearbeitung zu löschen; echte Hook-Gegenfälle erfolgreich.
- Belegerkennung: ressourcengebundene URL/keine Redirects, Zeit-/Byte-/Pollgrenzen,
  echte HTTP/RBAC-/Origin-/Rate-Limit-Tests, typisierte unsichere Vorschläge. Kein
  echter Provider aufgerufen oder aktiviert und keine Buchung erzeugt.
- Stundenbudget speichert bei neuen Aufträgen fehlende Werte als NULL und erhält
  historische Nullen. Separates Kostenbudget mit CHF/EUR, erzwungener RLS und
  vorhandener Auftrags-Versionsprüfung. Leere und echte Nullwerte bleiben bis zur
  Darstellung unterscheidbar. Ausgelassene Felder und Währungen bleiben erhalten;
  eine Währungsänderung ohne expliziten Betrag wird abgewiesen. Keine Personallöhne.
- Gemeinsamer typisierter Regelbaustein für sechs Abrechnungsmodelle: strikte
  Entwurfsangaben, Freigabereife, expliziter Zusatzaufwand, kalendergebundene
  Monats-/Quartals-/Jahresperioden und stabile Meilenstein-IDs. Noch keine aktive
  Speicherung oder Rechnungsanbindung; dies ist ausdrücklich keine fertige
  Abrechnungsfunktion und erzeugt weder Rechnungen noch automatische Buchungen.

## Bisherige Prüfungen dieses Pakets

Aktueller lokaler Teilstand: `pnpm lint`, `pnpm typecheck`, `pnpm build` und der
erneute vollständige `pnpm test`-Lauf erfolgreich (Exit 0). Der erfolgreiche
Gesamtlauf ist in `v8-tests-final-confirmed.log` dokumentiert. Dies umfasst nur
den tatsächlich implementierten Stand; die noch fehlende Pricing-Integration
und vollständige V8-End-to-End-/Geräteabnahme sind dadurch nicht qualifiziert.
Der neue Hook-Test wurde für den direkten Testaufruf korrekt benannt, ohne eine
React-Hook-Lintregel zu deaktivieren. Gezielte Browser-Gegenfälle siehe unten.

Zusätzlich erfolgreich: vollständiges Lint und ein Produktionsbuild der UI-/Budget-
Zwischenversion, TypeScript nach dem Modellbaustein sowie echte Budget-API/RLS-
Tests in der vorhandenen vollständig migrierten, isolierten PGlite-Integration.
Diese prüfen Null/0, Teilupdates, EUR-Erhalt, fehlerhafte Typen, veraltete Versionen,
Rollen, Nur-Lesen, fremde Mandanten und Audit-Rollback. Der gesonderte Upgrade-Test
wendet die echten Migrationen an: alte Null-/Positiv-/Legacy-Beträge unverändert,
neue fehlende Werte NULL, unzulässige Altwerte brechen die gesamte Migration ab.
Kein nativer PostgreSQL-Konkurrenztest oder produktiver Migrationslauf behauptet.

Erste Browserrunde: 16 Kombinationen aus Chromium/WebKit, 320/390/820/1440 px,
Light/Dark und Deutsch erfolgreich. Geprüft wurden Firmen-Recovery/Abschluss,
Kundenformular, Verlustwarnung/Rückweg, reduzierte 320×400-Ansicht, kurze Aktion
mit Escape/Fokusrückgabe und manuelle Zeit. Synthetische API-Antworten; echte
API-Integrität wird separat geprüft. Weitere acht WebKit-Fälle mit 375 px in
FR/IT/EN/TR und Light/Dark erfolgreich, einschliesslich nativer Validierung in
eingeklappten optionalen Feldern und vollständig erreichbarer Spesenerfassung.
Sechs Chromium-Fälle mit 430/768/1024 px in Light/Dark prüfen zusätzlich
Auftragserstellung → bestätigte Details → tatsächliche gefilterte Auftragsliste.
Diese Breiten/Sprachen sind gezielte kombinierte Stichproben, keine vollständige
Kreuzprodukt-Abnahme aller Routen, Rollen, Themes und Geräte.
Prüfprotokolle und Screenshots liegen ausserhalb des Checkouts unter
`../audit-20261026/v8-*`. Kein finaler Release-SHA und keine V8-Gesamtabnahme.

Frischer `pnpm audit --audit-level high --json`: 579 gemeldete Abhängigkeiten,
keine bekannten Hinweise in irgendeiner gemeldeten Schwereklasse. Read-only Azure:
App läuft, HTTPS erzwungen, TLS/SCM TLS mindestens 1.2, AlwaysOn aktiv, S1 unverändert;
FTP- und SCM-Basic-Publishing beide deaktiviert. PostgreSQL 18 bereit, TLS erzwungen,
7 Tage Backup, Geo-Backup deaktiviert, öffentlicher Netzwerkmodus aktiviert.
Keine Cloud-Einstellungen verändert. HTTP/2 ist deaktiviert; dies ist ein
Optimierungskandidat, kein behaupteter Sicherheitsfehler. Plattformauthentifizierung
ist aktiviert und erlaubt anonyme öffentliche Seiten; Operatoren bleiben zusätzlich
an serverseitige Entra-/MFA-Prüfungen gebunden. Reale Entra-Policy-Abnahme bleibt offen.

## Nächste Arbeit

Das freigegebene Fachpaket an bestehende `business-api`, `document-process`,
`offer-versions`, Zeitreservierungen und exakte `money`-Berechnungen anbinden.
Nullbudgets sind lokal umgesetzt und isoliert geprüft. Als Nächstes folgen
sechs Modellkonfigurationen/Snapshots/Phasenprüfungen und
sichere wiederkehrende/Meilenstein-Zuordnung. Keine zweite Rechnungsberechnung.
Budget-Migration `0109_project_budget_presence.sql` ist ausschliesslich in
wegwerfbaren Testdatenbanken ausgeführt. Pricing-Persistenz/Migration ist noch
offen. Vor produktiver Freigabe müssen unzulässige bestehende Stundenbudgets
mit einer Nur-Lese-Prüfung identifiziert werden; keine automatische Bereinigung.

Gezielte V8-Browsertests sind ausgeführt: gemeinsame Suite unterstützt Breiten/
Sprachen/Engines über Umgebungsvariablen, nutzt echte Übersetzungs-Owner und prüft
Firmen-Draft-Recovery. Die oben beschriebenen Gegenfälle sind gerendert; die
vollständige Routen-/Rollen-/Geräteabnahme steht aus. Vorher-Messung unter
identischen synthetischen Bedingungen liegt
in performance-before.json. Kein behaupteter Live-Performancegewinn.

Die Nachher-Stichprobe in `performance-after.json` verwendet dieselben zwei
Routen, 390/1440 px und je fünf frische Chromium-Kontexte. Mediane vorher → nachher:
Firma 390: 900 → 977 ms; Kunde 390: 928 → 961 ms; Firma 1440: 977 → 953 ms;
Kunde 1440: 1058 → 964 ms. Die Messbereiche überlappen; daraus wird weder ein
belastbarer Geschwindigkeitsgewinn noch eine Live-SLA abgeleitet. Alle 20 Fälle
führen weiterhin genau einen Session-Request aus. Synthetische API-Daten,
lokaler Rechner und keine Last-/Azure-/echte DB-Latenzmessung.

Native lokale PostgreSQL-/vollständige bestehende Browsermatrix zuletzt mangels
laufender Engine blockiert; PGlite-Integration vorhanden. Physische iOS-/PWA-/iPad-
Nachweise und native Browser-Zoom-Abnahme bleiben offen. Alte erfolgreiche Belege
qualifizieren die neuen V8-Änderungen nicht automatisch.

## Während QA korrigierte Testerwartungen

Die zusätzliche Budget-Rollenmatrix erwartete zunächst unbeschränkten Zugriff
für Projektleiter. Die Anwendung verweigerte den nicht zugewiesenen internen
Auftrag korrekt über die bestehende restriktive Workforce-RLS. Der Test prüft nun
diese ausdrücklich dokumentierte Ablehnung (404) statt sie aufzuheben. Die
aktuelle isolierte API-/RLS-Suite besteht. Der erste breite Testlauf mit der
falschen Erwartung war rot; der erneute vollständige Lauf ist nach den unten
beschriebenen Korrekturen erfolgreich.
Ein neuer Rückwegtest verwendete zunächst nur den mobilen Klassennamen; der
Desktop nutzt den vorhandenen `desktop-back`-Owner. Nur der Testselektor wurde
korrigiert, die anschliessenden sechs Fälle sind grün.

Die anschliessende breite Prüfung erkannte zusätzlich den alten Schema-Vertrag
und veraltete Quellzuordnungen. Der echte Schema-Generator ergänzt ausschliesslich
Migration 0109, die neue Tabelle mit erzwungener RLS/Policies und das optionale
Stundenbudget. Der Integrations-Generator weist weiterhin keine Importzyklen
aus. Bei genau drei bereits nicht abgenommenen UX-Routen wurde ausschliesslich
die Komponentenliste aktualisiert; Status und leere Evidenz blieben erhalten.
Keine visuellen Baselines oder Sicherheitsprüfungen wurden abgeschwächt.
Nach diesen Korrekturen ist auch der erneute vollständige Testlauf grün.
