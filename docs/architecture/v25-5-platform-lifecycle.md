# V25.5: nachgewiesener Arbeitsstand und Freigabegrenzen

## Basis und Auftragsgrenze

Aktueller Main zu Beginn: `d2825134deb33cac67a05c6e703b945ff28066e6`.
V25.4 ist übergeben, aber nicht integriert: Draft-PR #298, exakt
`d25bd5b6178f4ae54b5b57d0779e5d845e1f0ee5`, aufbauend auf Draft-PR #297,
`d707edf0e0e6e4231e50059c45af117fb59fcda2`. V25.5 entwickelt davon abhängig
auf `feat/v25-5-platform-lifecycle`. PR #267 und #271 bleiben unverändert.
V25.4 Quality 39410558852 und CodeQL 39410582366 waren erfolgreich. Das ist
kein Main-/Produktivnachweis und keine vollständige Einzelabnahme der 124 Fälle.
Offenes Betriebs-/Geräte-Issue #238 bleibt erhalten. Keine laufenden Actions
wurden abgebrochen; kein Merge/Release/Deployment ist autorisiert.

Die vier neuen unveränderten ZIP-Quellen liegen in `v25-5-source/`. Die sieben
älteren Beilagen sind bytegleich mit den bereits gelesenen Dateien unter
`v25-4-source/` und werden nicht nochmals als konkurrierende Quellen kopiert.
Der ausdrückliche Folgeauftrag ersetzt den historischen Nicht-Prompt-Marker
PL-G36 nur für Entwicklungsbranches und Draft-PRs.

**Ein aktives Register:** [v25-5-traceability.csv](v25-5-traceability.csv),
390 eindeutige IDs: PL 208, BP 45, UX 79, PL-G 40 und D 18. Unveränderte
Quell-CSV und V25.4-Tracking sind historische Belege, keine parallelen aktiven
Freigaberegister. `node scripts/v25-5-traceability.mjs --check` prüft die
reproduzierbare Zuordnung. Status IMPLEMENTED ist keine vollständige Abnahme;
ein vorgeschlagener Test ist kein ausgeführter Test.

## Ist-/Delta-Matrix

| Bereich | Erhalten | Nachgewiesene Lücke / Änderung | Grenze |
| --- | --- | --- | --- |
| Öffentlicher Trial/Tarife | V25.4 Tarifquelle, Preise, Pro-unbegrenzt, Aufträge Start, DMS Pro, sichere QA | Verbliebener Demo-Button im tatsächlichen Login entfernt | Keine produktive Abo-/Preisänderung |
| Identität | Tenant-ID, RLS, sichere Registrierung und MFA | Fremde aktive/historische Identitäten bei Einladung ablehnen; Akzeptanz erneut prüfen; mehrdeutige Sessions/Login/Issuance verweigern | Bestehende Mehrfirmen-Daten erhalten; Preflight vor Rollout |
| Einladungen | Token-/Status-/Ablauf-/Rollen-/Kapazitätsprüfungen | Pending-Mitglied kann Firma unter RLS nicht lesen; enges tokengebundenes Metadaten-Gateway statt breiter RLS-Freigabe | Kein Geschäftszugriff vor Aktivierung |
| Passkeys/MFA | Passwort, TOTP, Recovery-Codes und privilegierte MFA-Pflicht | Echte WebAuthn-Registrierung/Signaturen, Challenge-/RP-/Origin-/UV-/Replay-/Counter-Kontrollen; frisches Passwort+TOTP bei Hinzufügen/Entfernen; Liste/Widerruf/Audit/Sicherheitsmail; QR lokal | Keine Passkey-TOTP-Äquivalenz; keine Hochrisiko-Selbstentsperrung; Geräteabnahme offen |
| Trial | Einmaliger Start nach E-Mail-Bestätigung; Ablauf/read_only | Exakt 336 Stunden statt DST-abhängigen Kalendertagen; erneute E-Mail-Verifikation ersetzt keinen bestehenden starken Login | PL-G08 technisch geprüft, kein neuer Vertragsstichtag |
| Stripe | Echte Preisreferenzen, Signatur, idempotente Events und aktueller Providerzustand | Frühen kostenpflichtigen Checkout bei verbleibendem/unbekanntem Trial blockieren, bevor Kunde/Checkout angelegt wird | PL-G10 bleibt offen; kein erfundener Abbuchungszeitpunkt |
| Zeit | Assignment/RLS, gesperrte Historie und enge Solo-Ausnahme | Normaler Eintrag muss vorher submitted sein; kein Abschalten über Legacy-Flag; interne Arbeitszeit kann unabhängig von Fakturierbarkeit geprüft werden | Kein Umbuchen alter Zeiten; keine neue Freigabevertretung |
| Export/Datenschutz | Bestehende Export-/Lösch-Holds | Authentifizierungstabellen und verschachteltes Passkey-/Challenge-Material vom Geschäftsexport ausschliessen | Keine produktive Löschung oder neue Retentionfrist |
| UX/Betrieb | Microsoft-Owner, Navigation/FAB, ruhige Updates und bestehende Pflichtgates | Auth-/Zeitoberflächen und ausschliesslich berechtigte Navigationsziele für alle Rollen/Tarife; keine neue CSS-Foundation | Visuelle Einzelabnahme und physische Geräte offen |
| Teamsperre | Identität, HR-Akte und Geschichte bleiben getrennt | Eigener/Owner-Zugang nicht sperrbar; fremde IDs abweisen; Timer in derselben Transaktion pausieren, Sessions/Einladungen entziehen; Rollen-/Profilwechsel widerrufen Sessions | Keine automatische Wiederanstellung, neue Beschäftigungsperiode oder Freigabevertretung |
| Teamkapazität | Kanonische Limits bleiben unverändert | Fehlende Entitlements werden als unbekannt markiert, nicht als geratenes Start-Limit oder unbegrenztes Pro; neue Einladungen bleiben blockiert | Keine neuen Quotas oder Rechte |
| Transaktionsmail | Microsoft Graph bleibt einziger Versandweg | Zentraler MIME-Renderer übergibt jetzt tatsächlich Klartext, HTML und PDF; Light/Dark-Template mit lesbarem Fallback; Umschlag-/Headerkontrollen | Keine echte Client-/Empfangsabnahme oder Testmail |

## Konkrete Sicherheitskontrollen

- Passkeys speichern nur Credential-ID, öffentlichen Schlüssel, Counter und
  notwendige Metadaten. Keine biometrischen Daten, kein privater Geräteschlüssel.
- `APP_URL` ist die feste RP-/Origin-Quelle, keine Forwarded-Header-Vertrauensgrenze.
  Privilegierte Konten benötigen weiter TOTP. Für das erste Hinzufügen ist deshalb
  zunächst ein bestätigter Authenticator nötig; Passwort/TOTP bleiben Recovery-Fallback.
- Challenges sind kurzlebig, HttpOnly/SameSite an den Browser gebunden und vor
  Verifikation atomar verbraucht. Registrierung ist an Session und aktuellen
  Sicherheitszustand gebunden. Credential-Widerruf verhindert auch späte Issuance.
- Entfernen widerruft alle anderen Sessions; der aktuelle sicher bestätigte Zugang
  bleibt erhalten. Security-Mail läuft unabhängig von Marketing-Toggles über die
  bestehende Outbox/Graph-Strecke. Providerannahme ist kein Empfangsnachweis;
  bei Unsicherheit kein automatischer Wiederholversand.
- Der Metadaten-Helper ist SECURITY DEFINER mit festem search_path, ohne PUBLIC
  EXECUTE und mit gültigem Pending-Token als einzigem fachlichem Eingang. Kein
  beliebiger Tenant-Parameter, keine allgemeinen Firmendaten oder Passwörter.

## Prüfungen und ausstehende Nachweise

Gezielt erfolgreich: tatsächliche P-256/WebAuthn-Signaturen und Gegenfälle,
Registrierung/Session unter Runtime-RLS, gültige und verspätet fremd gebundene
Einladungen, Workforce-RLS,
Export-Sanitizer und Source-Copy-Coverage. Finale Ergebnisse müssen an den
tatsächlich geprüften V25.5-SHA gebunden und im Draft-PR verlinkt werden.
Der neue Passkeytest ist auch für den vorhandenen isolierten echten PostgreSQL-
CI-Gate vorbereitet; keine zusätzlichen Workflow-Schreibrechte.

Noch offen: vollständige individuelle PL/BP/UX-Abnahmen, E01–E10 als reale
Gesamtprozesse, physische iPhone/Safari/PWA/Android/iPad/AT, echte Mail-Clients und
Empfang, Provider-Testkonto-Nachweise sowie sämtliche nicht freigegebenen
Recovery-/Ownertransfer-/Grant-Migrations-/Retention-/Store-/Billing-Gates.
Automatisierte Kryptografie ist kein physischer Face-ID-/Touch-ID-Nachweis.
Die bekannte braces-Dev-Advisory wird nicht durch eine Ausnahmeverlängerung verdeckt.

Die vollständige CI-Planung ergänzt 600/760/761/820/1920 in beiden Engines;
die bisherigen Breiten bleiben erhalten. Schnelle lokale Pläne bleiben begrenzt.
Graph-MIME folgt der [offiziellen sendMail-API](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0);
der [MailComposer](https://nodemailer.com/extras/mailcomposer) rendert nur im Speicher,
ohne SMTP-Transport und ohne URL-/Dateizugriff. Die bestehende Betriebsqualifikation
verlangt bereits `GRAPH_SENDER_USER_ID=one@binso.ch`; ein GUID statt SMTP-Adresse
wird nicht heimlich durch einen neuen Mailprovider oder Verzeichnisrechte ersetzt.
202 ist Providerannahme, kein Nachweis des Posteingangs. Apple-Mail-/Gmail-/Outlook-
Invertierung bleibt real zu prüfen; keine pauschale Dark-Mode-Garantie.

## Migration, Preflight und Rollback

0060 schützt neue aktive Mitgliedschaften, ohne bestehende Mehrfachzuordnungen
zu löschen. 0061 erhält alte genehmigte Zeiten, sperrt aber neue Draft-Freigaben.
0062 ergänzt geschützte Passkey-/Challenge-Tabellen und Security-Outbox-Art.
0063 ergänzt das enge Einladungs-Metadaten-Gateway. Keine dieser Migrationen
wurde gegen Produktion ausgeführt.

Vor produktiver Freigabe: autorisierte, aggregierte Prüfung mittels
`database/operations/single-company-preflight.sql`, vorhandene Ambiguitäten
gesondert klären und neues Schema mit passender App-Version qualifizieren.
Einzelne alte Clients können die neue Freigabegrenze nicht mehr umgehen und
müssen gegebenenfalls neu einreichen. Kein blindes Entfernen von Triggern oder
Rückfall auf den mehrdeutigen alten Login als Rollback. Passwort/TOTP bleiben
nutzbar; bei Passkey-Problemen gezielter Forward-Fix und getrennte Freigabe.

## Navigation: ausdrücklich freigegebene Berechtigungsgrenze

V25.5 erweitert D16 auf alle Rollen/Tarife. Der alte mobile Finance-Link war
auch ohne Zielberechtigung sichtbar. Sichtbarkeit folgt jetzt derselben zentralen
Rollen-/Tarifprüfung wie das Ziel; API/RLS bleiben unverändert. Weniger Ziele sind
zulässig. Bestehende Höhe, Material, Icons, Position und blauer FAB bleiben erhalten.
Die neue Quellreferenz authorized-navigation-reference.json wurde über den
bestehenden Generator mit --approved-authorized-targets erzeugt, nach gerenderten
Vergleichen aller sieben Rollen und drei Tarife bei 320/390/760 Light/Dark sowie
negativen Berechtigungs-/Materialproben. Volle Fünfer-/Time-only-Geometrie bleibt
exakt; nur durch ausgeblendete unberechtigte Ziele freie Slots werden verteilt.
Historische Referenzen und die V4-Geometrie wurden nicht überschrieben.

Vorhandene vorzeitige Provider-Checkouts werden nicht automatisch storniert oder
verändert. Ihr Bestand wird im lesenden Produktionspreflight gezählt und bleibt
vor einem Rollout gesondert zu klären (PL-G10).

## Lokale Qualifikation vor dem Draft-PR (20.10.2026)

Erfolgreich: pnpm lint, pnpm typecheck, pnpm build, Passkey-/Registrierungs-/
Auth-Integritäts-/Workforce-/Migrations-Business-Regressionen, Mail-MIME,
Datenlebenszyklus, Lokalisierungsabdeckung, QA-Plan, Navigationsvertrag,
Navigationsfoundation, gezielter gerenderter Rollen-/Tarifvergleich, Architektur-
Integration und UX-Vertrag. pnpm audit --prod --audit-level high meldet keine
bekannten produktiven Schwachstellen. Entwicklungsabhängigkeiten bleiben im
bestehenden vollständigen CI-Audit inklusive befristeter braces-Ausnahme.

Lokale DB-Nachweise verwenden eine isolierte PGlite-PostgreSQL-Engine mit
binso_runtime/RLS. Zusätzlicher nativer PostgreSQL-Test und vollständige
Browser-/Security-Qualifikation laufen erst am finalen Draft-PR-SHA in GitHub;
dieser Absatz behauptet keinen dortigen Erfolg. Keine Produktivverbindungen.

## Blockierende lesende Release-Vorprüfung

Der Deployment-Workflow ruft single-company-preflight.mjs vor db:migrate auf,
erst innerhalb der bestehenden Production-/SHA-Freigabe. Die bereits vorbereiteten
vier Aggregatabfragen sind auf public qualifiziert und laufen READ ONLY mit
row_security=off. Dies umgeht RLS nicht: eingeschränkte Sicht führt zum Fehler,
nicht zu falschen Nulltreffern. Mehrdeutige aktive Identitäten, fremde offene
Einladungen, aktive Nicht-Demo-Firmen ohne Owner oder alte offene Trial-Checkouts
blockieren. Keine IDs/E-Mails, Reparaturen, neuen Rechte oder Provideraktionen.
Positiv/negativ geprüft: alle vier Zähler, erhaltene Konfliktdaten, abgelaufene
Einladungen/Checkouts, inaktive Firmen, ungültige Metadaten und echter RLS-Fehler.
Der Produktionsbestand ist weiterhin unbekannt, bis der freigegebene geschützte
Lauf diese Vorprüfung ausführt. Bei Blockade kein automatisches Bereinigen.

## Sicherheitsreview: Passkey-Zustandsnachweis

CodeQL meldete den vorherigen schnellen Fingerabdruck der Authentifizierungsfelder
als unzureichenden Passworthash. Dieser diente nicht der Passwortprüfung; diese
bleibt beim bestehenden langsamen Passwortverfahren. Der kurzlebige Reauth-
Zustandsnachweis verwendet jetzt die vorhandene authentifizierte AES-256-GCM-
Verschlüsselung, einschliesslich Identitäts-/Versionsbindung und konstantem
Bytevergleich nach erfolgreicher Entschlüsselung. Kein neuer Schlüssel oder
Algorithmus-Fallback. Veränderte/tamperierte Nachweise blockieren und werden
verbraucht; vorangegangene Änderungen an Passwort/MFA blockieren weiter. Kein
Alert-Dismissal oder Query-Skip. Positive Entschlüsselungs-/Bindungsprüfung und
negative GCM-Manipulations-/Replaytests ergänzen die echten WebAuthn-Nachweise.
Alte ausstehende Zustandsnachweise sind maximal fünf Minuten gültig und schlagen
nach dem Wechsel sicher fehl; Passkeys, Passwörter und Sitzungen werden dadurch
nicht gelöscht. Keine zusätzliche Migration erforderlich.
