# V25.4 – Public Trial, Tarife und eingeschränkter Arbeitsbereich

Stand: 20.10.2026. Implementierung auf `feat/v25-4-public-trial`, aufbauend auf
PR #297 (`d707edf0e0e6e4231e50059c45af117fb59fcda2`). Main und fremde PRs bleiben
unverändert. Dieser Bericht ist kein neuer UX-Vertrag und keine Produktivfreigabe.

## Quellen und jüngste Entscheidungen

Das unveränderte gelieferte Paket liegt unter [v25-4-source](v25-4-source/README_BINSO_ONE_V25_4.md).
Die ursprünglichen 45 BP-, 79 UX- und 18 D-IDs bleiben dort erhalten. Die drei
zusätzlichen Tarifentscheidungen sind ausdrücklich separate Entscheidungen und
ersetzen nicht gleich nummerierte D-Gates des Business-Registers:

- Pro ohne feste reguläre Benutzerobergrenze; `null` bedeutet unbegrenzt.
- Aufträge bereits in Start; Preise und Jahrespreise unverändert.
- Eigenständige Dokumentenverwaltung nur Pro; normale Moduldateien bleiben erhalten.
- D16 wurde nachträglich freigegeben: beim Profil `time_only` nur erlaubte Ziele,
  auch weniger als fünf. Material, Icons, Höhe, Position und blauer Plus bleiben.

## Implementierung und Ursachen

| Anforderung | Bisherige Ursache | Owner / Korrektur | Gegenfall / Nachweis | Restgrenze |
| --- | --- | --- | --- | --- |
| Öffentliche Demo entfernen | Anonyme Provisionierung und öffentliche CTAs | `/demo` leitet zu Registrierung; Demo-POST benötigt vorhandenen serverseitigen Smoke-Nachweis; Marketing/Auth-Links bereinigt | `demo-session-test`: öffentlich/falscher Nachweis/Origin abgelehnt, isolierte QA erhalten | Kein öffentlicher Reviewer-Zugang eingerichtet |
| Einheitliche Tarife | Drei auseinanderlaufende Konfigurationen und Pro-10000-Limit | `config/plans.ts`; Marketing-, Modul-, Billing-Projektionen; Kapazitäts- und Operatorprüfungen; Migration 0057 | `plan-catalog-test`, Migrationssuite, Auth-/Dateifälle | Migration nur lokal getestet, kein produktives SQL |
| Nur Zeiterfassung | Rolle member erlaubte zusätzlich Kunden/Finanzen; kein eigenes Modulprofil | Mitgliedschaft/Einladung/Session/RBAC, Team-Editor; eigene minimalistische Auswahl; Shell/Mehr/Suche und Cache-Identität | `module-profile-test`, echter Options-Endpunkt unter Runtime-RLS in `workforce-regression-test` | Geräte-/vollständige App-Browserabnahme offen |
| Dateiscope | Allgemeine Dokumentleserechte allein reichen nicht | Eigene Zeit-/Supportdateien und eigenes Profilbild; zusätzliche restriktive Datei-RLS; eigenständige Dokumente Pro | Direkte IDs, anderer Tenant und zugeordnete Kundenanhänge negativ getestet | Keine produktiven Dateien gelesen |
| Solo-Inhaber | Globale Freigabepflicht blockierte alleinigen Inhaber | Funktion `app_is_solo_owner`; nur ohne andere aktive Mitgliedschaft und ohne fremden aktiven Mitarbeiter; manuelle/timergenerierte eigene Zeiten | Solo positiv, Team-Inhaber/Mitarbeiter negativ; bestehende unabhängige Freigabe bleibt | Fachliche Sätze/Delegation unverändert offen |
| Sichtbares Update-Banner | Zweiter sichtbarer Update-Owner | Komponente, beide Einbindungen, CSS und obsolete Komponententests entfernt; SW unangetastet | `app-workspace-test`, PWA-Lifecycle | Reale OS-Wiederaufnahme offen |
| Persistierte Schalter | Benachrichtigungen erschienen vor Serverbestätigung gespeichert | Bestehender Toggle bleibt; Wertwechsel erst nach bestätigtem `{ok:true}` | API lehnt nicht implementiertes Push weiter ab | Keine Push-Zustellung beworben |

## Bestehende korrekte Grundlagen

Keine zweite Foundation. AppStart bleibt initial; keine neue Fortschrittsanzeige.
Bestehende Quiet-Loading-, Back-/Draft-, Toggle-, Dateiauswahl-, Modal-, Safe-Area-
und Notification-Channel-Owner werden weiterverwendet. Keine pauschalen CSS- oder
Testlöschungen. PR #297 liefert bereits die CSS-/Compliance-Korrekturen.

Gezielter gerenderter Chromium/Edge-Adapter: Standardnavigation für alle sieben kanonischen Rollen unverändert gegen
d707; time_only mit zwei Zielen bei 320/390/760 px in Light/Dark, Tastatur, Scrollen
und Material-Gegenfällen erfolgreich. Quelle ist das tatsächliche Shell-Nav-JSX und
die aktuelle CSS-Kaskade; kein Ersatz für die vollständige App-/Geräteabnahme. Die
neue Referenz unter docs/assets/20261020 wurde nur über den bestehenden Generator
mit `--approved-time-only` nach diesem Vergleich erzeugt. Historische Referenz bleibt.

Der einmalige bestehende Inventargenerator erfasst aktuell 76 Routen, 12
Operator-Varianten, 556 Module und keine statischen Runtime-Zyklen. Die Spezifikation
nennt 13 Operator-Varianten: die Zähldifferenz bleibt offen; keine Variante wurde
für dieses Paket entfernt. Statische Reichweite ist kein visueller Nachweis.

## Abnahme und Grenzen

Die ergänzende [BP-/UX-Nachweismatrix](v25-4-acceptance-tracking.csv) enthält alle
124 IDs. Kein statischer Fall wird automatisch visuell bestanden. E01–E10 werden
nicht aufgrund eines isolierten Unit-/Datenbanktests als vollständig abgenommen.

Erfolgreich gezielt ausgeführt: Demo-Grenze, Tarifkatalog, Modulprofil/Navigation,
Workspace, Session-/Logout-/Cache-Isolation, Berechtigungen, Auth-Integrität,
Lokalisierung und Source-Copy-Coverage, Time/Workforce-RLS und Migrations-/fachliche
Regressionen. Lokaler Produktionsbuild, Typecheck und vollständiges ESLint sind erfolgreich.
Endgültige CI-/Browserergebnisse gehören zum finalen SHA und
werden im PR dokumentiert.

Der lokale Gesamtaufruf `pnpm test` ist NICHT erfolgreich: `readiness-integrity-test`
kann seinen Bash-Testprozess hier nicht starten (`spawnSync`-Status null statt 0).
Die Assertion bleibt unverändert. Linux-GitHub-Quality muss diesen Nachweis liefern.
Keine Behauptung einer grünen vollständigen lokalen Suite.

Offen bleiben freigegebene visuelle Einzelabnahmen bei 320/390/760/761/1024/1440,
Light/Dark und Rollen; reale iPhone-Safari/iOS-PWA, Android-PWA, Assistive Technology,
physische Tastatur/Safe Areas; finaler Linux-Postgres-/Quality-/CodeQL-/Browserlauf.
`braces@3.0.3` bleibt die bekannte Dev-Advisory ohne qualifizierten Upstreamfix;
keine Ausnahmeverlängerung (bestehendes Ende 24.10.2026).

## Native Vorbereitung, keine Store-Freigabe

Am 20.10.2026 anhand der [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
geprüft: 2.1 verlangt vollständige, auf Geräten geprüfte Funktionen und Review-Zugang;
3.1.3(c) ist auf den konkret passenden Organisationsvertrieb begrenzt, keine pauschale
Ausnahme für Einzelkunden; 4.2 verlangt Mehrwert über eine verpackte Website hinaus.
Daraus folgt hier keine neue native Kaufoberfläche oder Stripe-Verlinkung.
Build/Signierung/Wrapper/Storefront-/Billing-Entscheidung und isolierter Reviewer-Zugang
bleiben separate Voraussetzungen. Browser und PWA sind kein nachgewiesener nativer Build.

## Rollout

0057 macht Pro-Benutzergrenzen nullable und bereinigt nur Entitlement-Metadaten.
0058 ergänzt Profile mit Default `standard`, ohne bestehende Rechte zu ändern.
0059 definiert die eng begrenzte Solo-Inhaberprüfung. Reihenfolge im regulären
Migrationsprozess erforderlich; keine Ausführung gegen Produktion aus diesem Auftrag.
Keine Kundendatenlöschung, Kontoneuanlage, externe Mail/Buchung, Merge oder Deployment.
D07–D15/D17–D18 bleiben offen; nur D16 wurde im Dialog zusätzlich geschlossen.

## Erste Linux-Qualifikation und Korrekturen

Run 39403819211 auf c7403ff4 hat zwei echte veraltete Nachweise gefunden:
Runtime-Smoke verlangte den anonymen Demo-Login, und die aktive Seitenmatrix
führte den gelöschten Banner-Owner weiter. Der Smoke-Owner prüft nun öffentliches
404 ohne Cookie plus Legacy-Redirect und getrennt geschützte lokale QA mit einem
pro Prozess neu erzeugten Testnachweis. Die neue Prüfung testet die tatsächliche
Verifier-Funktion positiv/negativ. Kein Zugriffsschutz wurde geöffnet.
Die Seitenmatrix wurde ausschliesslich über ux-contract-inventory.mjs erneuert;
alle 76 Routen/12 Varianten bleiben ungeprüft statt erfundener visueller Abnahme.
Die finale Linux-Qualifikation muss den Nachfolgecommit prüfen.

Der zweite Linux-Lauf hat die Legacy-Weiterleitung noch vor der Browsermatrix
abgewiesen. Next kann im Streaming-Kontext einen Seitenredirect als HTTP-200-
Meta-Refresh ausliefern; deshalb wird `/demo` zusätzlich im bestehenden Next-
Konfigurationsowner vor dem Rendern per 307 nach `/registrieren` umgeleitet.
Der HTTP-Redirect-Test bleibt streng, mit zusätzlichem Test der echten Next-Konfiguration.

Weitere Browser-Gegenfälle haben die Unterscheidung fehlender Entitlements von
explizitem Pro-unbegrenzt sowie den neuen bestätigten Speicherschalter geprüft.
`entitlements_configured` trennt die API-Zustände; fehlende Konfiguration bleibt
unbekannt und ist kein unbegrenztes Konto. Der echte Datenbank-/Operator-Test
prüft beide Fälle. Benachrichtigungs-Browsertests halten die Serverantwort
kontrolliert an: Schalter bleibt beim bestätigten Wert, erst das ACK ändert ihn.
Die freigegebene Solo-Inhaber-Ausnahme gilt auch beim Einreichen eines belegten
Monatsrapports; der echte PATCH-Handler und die restriktive Runtime-Rolle prüfen
fehlenden Nachweis, Team-Selbstfreigabesperre und den echten Solo-Fall.

Die Team-API projiziert auch die gespeicherten Tarif-Aliasse starter/professional
auf start/pro; andernfalls zeigte die Plananzeige trotz gültigem Abo «Unbekannt».
Der reale Migrations-/API-Test prüft Namen und Grenzen für alle drei Tarife.

Der Entwicklungs-Lab-Lauf wartete einmal auf globale Netzwerkinaktivität trotz
Next-Hot-Reload-Verbindungen. Nur dieser Entwicklungsweg wartet jetzt auf einen
nach React-Hydration gesetzten Marker und fertige Schriften, ohne Timeout-Erhöhung
und ohne entfernte Funktions-/Geometrieassertionen. Fehlende Hydration/Schriften
bleiben im Gegenfalltest blockierend. Der echte lokale Lab-Lauf bestand Light/Dark
bei 390/1440 mit Formular-/Dialog-/PDF-Interaktionen (vier Kombinationen).
Tarifbeschreibungen bewerben keine pauschalen Einkaufs-/Prototypfunktionen mehr;
Business beschreibt Mitarbeitende, Produkte und Finanzübersicht, Pro den
freigegebenen unbegrenzten Benutzerumfang. Preise bleiben unverändert.
