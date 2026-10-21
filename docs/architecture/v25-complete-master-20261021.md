# V25 complete master — Umsetzung und Abnahme

## Verbindliche Grundlage

Die vollständige [Quelle vom 21.10.2026](../audit/v25-complete-master-20261021/source.md) ersetzt den abgeschnittenen Text. Unverändert gesichert; SHA256 `67ABD0EE73996FF68D8C9F898FB148ED9690671533469D0398896F93B9FE72AB`.

Basis und erneut bestätigter Main: `ba4234604ac16b2209bef70a532ccd94f4953035`. Arbeitsbranch: `feat/v25-complete-master-20261021`. PR #267, #271 und #298 bleiben unverändert; deren bereits integrierte Änderungen werden nicht erneut übernommen. Die früheren SHA-Freigaben gelten nicht für dieses neue Paket.

## Umsetzung nach den 18 Master-Kapiteln

| Kapitel | Umsetzung / erhaltener zentraler Owner | Nachweis und Grenze |
| --- | --- | --- |
| 1–2 Foundation, Sheets, iOS | Bestehende Navigation/FAB unverändert; zentrale Controls/FormSheet, VisualViewport, Fokus und Safe Areas weiterverwenden. Gemeinsamer PDF-Dialog statt paralleler Vorschauen für Dokumente, Anhänge und Versionen. | Vorhandene Verträge bleiben; neue öffentliche Ansichten sind abgeleitet. Emulation ersetzt keine physische iOS-Abnahme. |
| 3 Registrierung/Sicherheit | Registrierung als eigene Seite mit Firmen-/Kontaktname, E-Mail, Passwort, Einwilligung und fortsetzbarer Verifikation; optionale Firmeneinrichtung ebenfalls eigene Seite. Verifizierte Passwortanmeldung ohne zusätzliche verpflichtende E-Mail-MFA. Freiwilliges TOTP und Passkeys; aktiviertes TOTP/Recovery bleibt verbindlich. Kritische Änderungen verlangen sitzungsgebundenen frischen Nachweis. | Auth-, Registrierungs-, Session-, Passkey- und Rollen-Gegenfälle. Kein Entfernen von Operator-MFA, RLS, Ratenlimits oder Backend-Rechten. |
| 4 CRM | Hauptkontakt direkt am Kontakt setzen, redundante Zuordnungserklärung entfernen, eine Entwicklungsüberschrift, bestehende Stammdaten/Tabs erhalten. Gemeinsamer Zeitraumfilter und keine Null-Diagramme. | Repository-/Projektions- und bestehende CRM-Tests; keine Stammdatenlöschung. |
| 5 Positionen | Gemeinsame Einheiten mit Erhalt importierter Werte, Nummern 01+, Bearbeiten/Duplizieren/Verschieben/Entfernen. Aufwands-/Zeitnachweise nicht duplizierbar. Nummer aus Editor entfernt, in Detail/PDF erhalten. | Produktionshelfer und echte PDF-/Rundungs-/Prozessprüfungen. Bestehende Schweizer Berechnung bleibt zentral. |
| 6 Versand | Empfänger vorbelegt/editierbar, Betreff/Text, echte PDF, geschützter Link, ausdrückliches Ausstellen beim Entwurfsversand. Idempotenz umfasst Empfänger/Text/Betreff; unbestätigte Versuche werden nicht blind wiederholt. | Graph-Transport mit synthetischen Fixtures geprüft. Providerannahme ist ausdrücklich kein Zustellnachweis. |
| 7 Freigabe | Öffentliche mobile Angebotsseite. Capability nur im URL-Fragment und begrenzten POST-Body, gehasht/verschlüsselt gespeichert; keine Entscheidung per GET. Explizite Version/Betrag/Bedingungen, empfänger-/aktionsgebundener Einmalcode, atomare Entscheidung. | Restricted-RLS-, Replay-, Ablauf-, Widerruf-, Mandanten- und Konflikttests; neuer nativer HTTP-Concurrency-Test für CI. |
| 8 Nachrichten/Tracking | Versionsbezogene Fragen/Antworten, Rechte, Audit und In-App-Mitteilung. E-Mail mit sicherem Rücklink; Seiten-/PDF-Anforderung als unbestätigtes Client-Ereignis, täglich dedupliziert. | Keine Behauptung menschlicher Lektüre. Signierte Zustell-/Bounce-Webhooks fehlen im bestehenden Graph-sendMail-Pfad; nicht simuliert. Push weiterhin nicht verfügbar. |
| 9 Versionen | Gleiche Angebotsnummer/ID; neue unveränderliche Version mit echten PDF-Bytes/Hash bei Ausstellung. Revision widerruft alte Links. Historische Altverweise bleiben. Bestehende Auftragsübernahme weiterverwendet. | Reale PDF-/SQL-Immutabilität und parallele Revisions-/Entscheidungs-Gegenfälle. Frühere, nie gespeicherte historische PDF-Bytes lassen sich nicht nachträglich beweisen. |
| 10 Mail/Domains | Bestehendes HTML/Plaintext/MIME/Graph-Template erweitert: Originalicon, Mandantenname, nur verifizierte aktive Reply-To-Adresse. Keine neue Versandplattform. | MIME-/Header-Injection-Tests; echte Outlook/Gmail/Apple-Mail-Abnahme, DNS/DMARC/Bounces offen. |
| 11 Finanzen | Bestehende korrekte Cash-/Forderungsprojektionen, kompaktes zweispaltiges Finanzraster, zentraler 1/3/6/12/benutzerdefinierter Zeitraum mit inklusiven Datumsgrenzen. Diagramme nur mit echten Werten. | Zahlungs-/Gutschrift-/Rückzahlungs-/Zeitraumtests; Zahlungssaldo bleibt vom Bankguthaben getrennt. |
| 12 Zeit/Dateien | Timer zuerst; Auftrag/Dateien auf Auftragsdetail. Manuelle Auswahl nutzt berechtigte Zeit-Endpunkte. Gemeinsame Vorschau; berechtigtes Entfernen archiviert, zerstört keine Nachweise. Eingereichte/genehmigte/ausgestellte Vorgänge bleiben gesperrt. | Upload/Scan/Rollen/Mandantentrennung; Archivierung/Replay/Byte-Erhalt/Download-Sperre. Keine produktiven Dateien verändert. |
| 13 Suche/Mitteilungen | Bestehende berechtigungsgefilterte Suche/Quicklinks erhalten. Mitteilungen nach Schweizer Datum gruppiert, individuell/alle gelesen; verbotene Ziele auch serverseitig entfernt. Redundanter Link auf derselben Seite entfernt. | Per-User-/Tenant-Tests; keine erfundenen Fallback-Mitteilungen. |
| 14–15 Daten/Abnahme | Additive Migrationen 0067–0069, fokussierte Regressionen, gemeinsame Build-/Browserqualifikation und unveränderte Pflicht-Gates. | Exakter Prüfstatus im Abschluss; statische Inventare sind keine Seiten- oder Geräteabnahme. |
| 16–18 Lieferung | Eigener Branch und ein Integrations-PR, Quellarchiv ohne Secrets/Builds sowie reproduzierbare Windows-Anleitung. | Kein automatischer Merge oder produktive Migration dieses Pakets. |

## Sicherheitsmodell und neue Migrationen

- **0067:** `auth_sessions.step_up_at`, sitzungsgebundene E-Mail-Challenges. Gültiger Nachweis maximal fünf Minuten, exakt Benutzer/Firma/aktive Sitzung. Passwort und eingerichteter TOTP-/Recovery-Faktor; ohne TOTP eigener kurzlebiger E-Mail-Code. Keine neue verpflichtende MFA-Einrichtung. Andere Sitzungen/alte Challenges werden bei Sicherheitsänderungen widerrufen. UI wiederholt nur eine vor der Mutation abgelehnte Anfrage, nie eine unbestätigte Netzwerkmutation.
- **0068:** unveränderliche Angebotsversionen/PDFs, Capability-Links, Nachrichtenereignisse und Einmalcodes; RLS FORCE, keine neue Rolle und kein BYPASS. Capability erlaubt SQL-seitig nur die genaue Linksuche, keine allgemeinen Tenant-Lese-/Schreibrechte. Verarbeitung setzt danach intern den dokumentgebundenen Kontext und prüft aktive ausstellende Mitgliedschaft, Modulprofil und Firma erneut. Angebot und Link werden konsistent gesperrt. Kontrollierte bestehende Firmenlöschung bleibt via FK-Cascade möglich; Direktänderungen einer Version nicht.
- **0069:** Anhänge soft archivieren mit Benutzer/Zeitpunkt; Bytes und Scanbeleg bleiben erhalten. Listen und Download schliessen archivierte Dateien aus. Logos/Avatare sind über diese Aktion nicht löschbar; Domain-Rechte und Eigentümerbezug werden serverseitig geprüft.

Alle Migrationen wurden ausschliesslich in isolierten Testdatenbanken ausgeführt. Keine Live-Daten, SMTP-Adressen oder Produktionsrollen verändert.

## Tatsächliche externe Lücken / Freigaben

| Voraussetzung | Tatsächlicher Zustand / nächste Massnahme |
| --- | --- |
| Graph-Zustellung und Bounces | `sendMail` bestätigt nur Annahme. Für echte Zustellereignisse ist ein geeigneter, authentifizierter Transportnachweis mit passender bestehender Providerkonfiguration nötig. Erst nach separater Zugriffs-/Konfigurationsfreigabe einrichten. Keine Dummy-Webhooks. |
| Push | Bestehende Konfiguration bietet keinen ausführbaren Push-Kanal. Subscription-/Sender-/Schlüsselbetrieb und Einwilligung fehlen; separat spezifizieren/freigeben. In-App- und bestätigte E-Mail-Pfade bleiben nutzbar. |
| Domains | Soll: www.binso.ch Website, one.binso.ch App, go.binso.ch Kundenlinks, mail.binso.ch Versand, api.one.binso.ch nur bei Bedarf. Vor DNS/TLS/SPF/DKIM/DMARC-Änderungen aktuelle Records, Graph-Absender und bestehende Website/Mail-Abhängigkeiten prüfen und exakte Änderungen separat freigeben. Aktueller APP_URL bleibt unverändert. |
| Datenschutz/Aufbewahrung | Link maximal 90 Tage; Aktionscode 10 Minuten/5 Versuche, Spam-Ratenlimits; Views/PDF täglich dedupliziert, keine Trackingpixel. Echte menschliche Lektüre unbekannt. Angebots-/Auditnachweise bleiben Geschäftsunterlagen; produktive Aufbewahrungs-/Bereinigungspolitik separat bestätigen. Codes/Token aus Geschäfts-Export ausgeschlossen; kein neuer globaler Löschjob. |
| Rechtliche Sonderfälle | E-Mail-Code dokumentiert Zustimmung, ersetzt keine qualifizierte elektronische Signatur. Bei gesetzlicher Schrift-/Sonderform gesonderten geeigneten Prozess verwenden. |
| Physische Geräte / Mailclients | iPhone Safari/installierte PWA, Android/iPad, echte Tastatur/Autofill/Passkeys sowie Outlook/Gmail/Apple-Mail-Zustellung bleiben echte Abnahmen; Emulation und Fixtures nicht als erledigt ausgeben. |
| Frühere Betriebsnachweise | Application Insights, Alarmzustellung und Restore bleiben separat offen; kein neuer Infrastrukturauftrag. |
| Integration/Produktion | Neuer exakter Head, erfolgreicher quality/analyze und vollständige Main-Qualifikation, Schutzregeln und separate Freigabe für Migrationen 0067–0069/Deployment nötig. Keine alte SHA-Freigabe wiederverwenden. |

Microsoft beschreibt [Graph 202 Accepted](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0) ausdrücklich nicht als abgeschlossene Zustellung. Die Schweizer [BAKOM-Hinweise](https://www.bakom.admin.ch/de/23-welche-rechtskraft-haben-elektronischen-signaturen) unterscheiden qualifizierte Signaturen mit qualifiziertem Zeitstempel; die [BIT-Vertragsrechtshinweise](https://www.bit.admin.ch/de/vertragsrecht) benennen Ausnahmen von der Formfreiheit. Keine pauschale rechtliche Abnahme wird behauptet.

## Reproduzierbare technische Prüfung

Aus `repo`, zuerst `. ../runtime.ps1`. Keine produktiven Zugangsdaten für lokale Tests verwenden.

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
# CI führt zusätzlich die bestehenden echten PostgreSQL-/Browser-/Scanner-Gates aus.
```

Der Windows-Bash-Fixture-Harness für Readiness kann lokal an POSIX-Pfadsemantik scheitern; ein solcher Fehler bleibt dokumentiert und wird durch Linux-CI geprüft, nicht übersprungen. Die tatsächlichen Einzelresultate und verbleibenden Grenzen werden nach Abschluss der laufenden Prüfungen ergänzt.

## Lokaler technischer Zwischenstand vor GitHub-Qualifikation

- Typecheck und ESLint ohne Warnungen erfolgreich; Produktionsbuild erfolgreich (Webpack-Kompilierung 120 s, anschliessende Typ-/Seitenprüfung erfolgreich).
- Alle 63 definierten Testprogramme einmal gebündelt ausgeführt, keines übersprungen. Vier unveränderte Linux-abhängige Harnesses lokal blockiert: Readiness/Bash-Pfadsemantik, Unix-Scanner-Socket, Unix-Dateieigentümer (`process.getuid`), `jq`. Diese bleiben für Linux-CI verpflichtend.
- Neu angebundene Testadapter für Session/Fresh-Auth, ausgelagerten Zeitraumfilter, zusätzliche Read-view-Rechte korrigiert und gezielt erneut erfolgreich geprüft; keine Assertions gelockert. Navigation bleibt gegen die unveränderte Referenz grün. Dependency-Inventar ausschliesslich über Generator aktualisiert; Integrationstest erneut erfolgreich.
- Echte isolierte PGlite-Migrationen mit eingeschränktem Runtime-RLS und Geschäftsprozessen erfolgreich. Auth-/Upload-/Archivierungs-Gegenfälle, WebAuthn-Kryptografie und Recovery-Einmaligkeit erfolgreich. Zusätzliche echte PostgreSQL-/HTTP-Parallelfälle sind für CI vorbereitet, lokal mangels PostgreSQL nicht ausgeführt.
- Ein gezielter Chromium/Edge-Browserlauf: 15 Fälle erfolgreich (390/1440, Light/Dark, fünf Registrierungssprachen, Abbruch/Navigation/Netzwerkfehler, explizite öffentliche Angebotsannahme mit Code und Doppelklickschutz). Synthetische UI-Transportfixtures, keine echte Kundenmail. Mobile Screens gerendert geprüft; öffentliche Freigabe und vereinfachte Registrierungsseite sind ausdrücklich abgeleitete Ansichten.
- GitHub-Gesamtqualifikation noch ausstehend. Kein Merge, keine produktive Migration und kein Deployment dieses neuen Pakets.

### Nachgewiesene CI-Korrekturen im selben Paket

Der eingeschränkte PostgreSQL-HTTP-Lauf hat fehlende Testzuordnungen sichtbar gemacht: Projektleiter/Manager/Mitarbeiter erhalten nur die synthetischen Kunden-/Auftragszuordnungen der Positivfälle; ein zusätzlicher nicht zugeordneter Kunde bleibt 404. Keine Produktionsrechte erweitert. Der Folgelauf bestätigte 80 echte Schreib-/Persistenzfälle, alle acht Leserollen, fremde IDs, Dokument-/Dateizugriff und zwei parallele öffentliche Entscheidungen unter NOBYPASSRLS.

Das anonyme API-Gate prüft den öffentlichen Empfängerendpunkt separat: GET 405 und ungültige Capability für Lesen/PDF/Code/Entscheidung jeweils 410. Dabei wurde die fehlende await-Fehlerbehandlung des öffentlichen PDF-Pfads korrigiert (vorher 500 bei ungültigem Token). Die privaten 140 Methoden bleiben weiterhin auf 401/403 beziehungsweise die ausdrücklich stillgelegten Methoden geprüft.

Bestätigungs-/Antwortmails übernehmen nun die gespeicherte Empfängersprache; ein französischer Mailfall ist direkt im tatsächlichen Angebotsservice geprüft. Zusätzlich verhindert die Client-Identitätsgrenze eine Wiederholung einer geschützten Mutation, wenn während der Sicherheitsbestätigung die Sitzung/Firma gewechselt wurde. Ein negativer Regressionstest weist nach, dass dann keine zweite Schreibanfrage gesendet wird. Die öffentliche PDF-Vorschau erhält einen echten synthetischen PDF-Browserfall.
