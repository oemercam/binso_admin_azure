# V8 – laufender Paketstand

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
