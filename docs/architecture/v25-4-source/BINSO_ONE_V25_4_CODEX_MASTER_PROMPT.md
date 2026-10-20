# CODEX MASTER-PROMPT – BINSO ONE V25.4

**Repository:** `oemercam/binso_admin_azure`  
**Auftrag:** Implementiere die freigegebenen Teile des beigefügten V25.4-Gesamtpakets tatsächlich im aktuellen Repository. Arbeite nicht nur einen Plan, Screenshotbericht oder eine neue Parallel-Spezifikation aus.

## A. ZUERST LESEN, PRIORITÄTEN KLÄREN

Lies in dieser Reihenfolge:

1. `AGENTS.md` im aktuellen Repository; `docs/architecture/ux-current-approval.md`; `docs/architecture/reference-foundation.md`; `docs/audit/v24/reference/IMPLEMENTIERUNG.md`; `app/design-system/manifest.json`.
2. Beilage `BINSO_ONE_V25_4_Konsolidiertes_Produkt_UX_Launch_Konzept.md` als **neue verbindliche Ergänzung**.
3. Beilage `BINSO_ONE_V25_3_Business_Process_Master_Implementation.md`, bestehende 45-BP-Matrix und D01–D18-Entscheidungen.
4. Beilage `BINSO_ONE_UX_Masterstandard_V1.md` und vorhandene UX-Abnahmematrix UX-001 bis UX-079.
5. `docs/architecture/app-acceptance.md`, `app-acceptance-routes.md`, `role-business-flow-consistency.md` und aktuelle Dokumentations-/CI-/PR-Befunde im Repository.

**Regelhierarchie:** Sicherheit/Datenschutz/verbindliche Geschäftsregeln > zuletzt explizit freigegebene Produkt- und UX-Entscheidungen > AGENTS/aktuelle UX-Approval > Original-Microsoft-Referenzen > dokumentierte bestehende Komponenten/CSS-Owner. V25.4 ergänzt V25.3/UX V1; alte Berichte bleiben Historie. Bei echten Widersprüchen nicht heimlich neu entscheiden.

**Geschützt und unverändert:** aktuelles Microsoft-Weiss-Blau-UX; bestehende Bottom-Navigation **in Gestaltung und Position**; vorhandener **runder blauer Floating-Plus-Button** in Gestaltung/Position/Funktionsprinzip; bestehende einfache «Mehr»-Liste ohne neue Kategorien; Original-Binso-Logo; zentrale Kontextaktionen über `…`, keine zusätzliche Design-Foundation; keine Glass/Blur-Effekte, keine route-lokalen CSS-Patches. Sichtbares «Auftrag», technische `projects`/`/projekte` nicht grundlos umbenennen.

## B. BESTANDSAUFNAHME UND INTEGRATION OHNE DOPPELTE ARBEIT

1. Prüfe `git status`, aktuelle Branches/Main-SHA, offene PRs/Reviews/Issues, CI/CodeQL und relevante Änderungen. **PR #297** (Foundation/Compliance/CSS) ist beim Konzeptstand offen/Draft; prüfe seine aktuelle Stellung und integriere oder baue darauf **kontrolliert**, ohne Doppelimplementierung oder unbeabsichtigten Cherry-Pick. Andere PRs #267/#271 und laufende Arbeiten nicht überschreiben. Keine pauschalen Resets.
2. Erzeuge einmalig eine **vollständige, aber bounded Repository-Bestandsaufnahme**: öffentliche Seiten, Auth, 76 App-Routen, 13 Operator-Varianten, Komponenten-/CSS-Owner, Server-API/RLS/DB, dynamische Imports, Demo/Fixtures, SaaS/Stripe/Mail/PWA, Tests, Assets, CI/Deploy. Nutze bestehende Inventargeneratoren statt neue parallele Scans.
3. Stelle eine nachvollziehbare Änderungsmatrix bereit: `Anforderung | Ist-Verhalten | Root Cause | zuständiger Owner | geplanter Fix | Schutzfall | negativer Test | Umsetzung | Beleg | Restblocker`. Bestehende korrekte Implementierung nicht neu schreiben. Markiere offene D-Gates aus V25.3 und iOS-Store/Billing ausdrücklich als **nicht automatisch freigegeben**.
4. Beginne nach dem Abgleich mit der tatsächlichen Umsetzung. Dokumentation/Pläne allein sind **kein Abschluss**.

## C. ÖFFENTLICHE WEBSITE UND DEMO-UMSTELLUNG – P0

1. Entferne den **öffentlich zugänglichen Demo-Einstieg** konsistent aus `/`, `/produkt`, `/preise`, Marketingheader/mobilem Menü/Footer/CTA/FAQ, Metadaten und allen aktuellen Public-Links. Der neue primäre Weg ist **«14 Tage kostenlos testen» → Registrierung**. Bestehende Links auf `/demo` dürfen kein Public-Demo-Login mehr eröffnen; Legacy-Redirect oder 404 nachvollziehbar, sicher und getestet behandeln.
2. **Erhalte isolierte Demo-/Test-Fixtures**, Regressionstestkonten und einen später geschützten App-Store-Reviewer-Testzugang. Keine produktive Kunden-/Testdatenlöschung; keine Demo- oder Reviewer-Credentials im Repository.
3. Prüfe die vollständige Journey: Landingpage → Tarif informieren/auswählen → Registrierung → E-Mail-Verifikation → Firmen-Onboarding → rollen- und planbezogenes Dashboard → 14 Tage Test → bewusst bestätigtes Abo oder Read-only.
4. Kein Kreditkartenzwang zum Testbeginn und keine automatische Abbuchung ohne ausdrückliche bestätigte Subscription. Vorhandenen Trial-Timer/-Lifecycle wiederverwenden. Nach Ablauf Daten erhalten, angemessenen Read-only-Zustand und sicheren Abo-CTA zeigen; Kunden können nach bestätigtem Abo mit ihren bestehenden Daten weiterarbeiten.
5. Prüfe alle sichtbaren Produktversprechen gegen **echte Funktionen**. Keine falsche Demo-/App-Store-/Push-/Lohn-/Bankimport-/Automations-Behauptung. Einheitlicher Begriff «Auftrag». Marketing-FAQ, Impressum/AGB/Datenschutz/Cookies, SEO/Sitemap/Canonical/Robots, Locales und echte Screenshots prüfen. Bestehende freigegebene Marketing-Foundation schützen.

## D. START / BUSINESS / PRO – EIN ENTITLEMENT-VERTRAG – P0

1. Gleiche `lib/plans.ts`, `config/plan-access.ts`, `lib/subscription-plans.ts`, `config/domain.ts`, Billing-/Checkout-Konfigurationen, API-/DB-Entitlements und Marketingtexte systematisch ab. Der bisherige Code bewirbt Start CHF 29/Monat oder CHF 290/Jahr, Business 69/690, Pro 129/1290. **Preise nicht ohne ausdrückliche fachliche Entscheidung ändern**.
2. Etabliere eine **kanonische, zentral getestete Quelle** für die tatsächlich freigegebenen Planmodule und Limits. Leite Marketing-, Registrierungs-, Account-, Backend- und Provider-Projektionen daraus ab. Jede Funktion hat einen echten Reifegrad; keine als «fertig» beworbene Demo-/Prototypfunktion.
3. Strikt trennen: `Plan-Entitlement` × `Unternehmensrolle` × `individuelle Modul-/Aktionsfreigabe` × `Zuordnung/Datenscope` × `Objektzustand` × `Tenant-Read-only`. Alle Grenzen serverseitig und bei Direkt-URLs/Dateien durchsetzen.
4. Wenn vorhandene Quellen unterschiedliche Nutzerlimits, Leistungsumfänge oder Vertragsregeln vorgeben, **konkreten Konflikt melden**; nicht eigenmächtig ein neues Preismodell erfinden. Sichere konfliktfreie Verbesserungen fortsetzen.
5. E2E inkl. 14-Tage-Ablauf, Checkout-Fehler, doppelter Webhook, Wechsel/Downgrade, kein Datenverlust und kein unerlaubter API-Zugriff je Plan.

## E. PLATTFORMÜBERGREIFENDER UX-MASTERSTANDARD – P0/P1

1. Desktop-Web (Sidebar + Topbar), Tablet mit echter CSS-Breite, Smartphone-Browser und installierte iOS-/Android-PWA müssen **für ihr Eingabegerät optimiert**, nicht pixelgleich dargestellt sein. Vorhandene 760/761-px-Grenze, Tokens und Komponentenowner wahren; responsive Split-View, Portrait/Landscape, Safe-Area und Systemtastatur beachten.
2. Statische geräteübergreifende UX-Regeln schriftlich prüfen und zentral durchsetzen: Seitentitel, Header/Footer, Logo-/Icongrössen, Ober-/Unterabstände, Touchziele, Langtexte, Status, Listen/Tabs, Dialoge/Bottom Sheets, Filter, Aktionen, Validierung, Zoombarkeit, Tastatur/Screenreader. Basis: vorhandene Tokens statt neuer willkürlicher Einzelwerte; Microsoft-Referenz, 27px Desktop-Titel, 25px Mobile-Titel, 18px Abschnitt, 14px Fliesstext, 44px Mindest-Touchziel, 68px mobile Navigation + Safe Area als **Ist-Referenz**.
3. Alle **binären persistierten Einstellungen** («ein/aus», «aktiv/inaktiv») mit dem existierenden barrierefreien zentralen Toggle/Switch-Owner abbilden; `aria-checked`, Fokus, Disabled, Status, tatsächliches Persistenzfeedback. Buttons nur für Aktionen; Radio/Select/Segment für Mehrfachoptionen. Sicherheits-/Billing-Toggle darf nicht ohne Serverbestätigung/erforderliche Freigabe aktiv erscheinen. Nicht vorhandene Kanäle nicht als funktionsfähige Schalter darstellen.
4. Einheitliche **Aktionsstruktur**: Dokument/PDF/Datei/Anhang und sekundäre Objektbefehle im `…`-Menü; Neuerstellung über freigegebenes gemeinsames Erstellen-System; Timer/Submit/Navigation/Suche direkt erreichbar. Leere Zustände knapp (max. zwei inhaltliche Sätze/Zeilen, mit Umbruch bei Accessibility-Zoom), ohne grosse Illustrationen.
5. **Initial Splash:** Original-Binso-Icon nur beim echten Session-/App-Bootstrap (`AppStart`), keine Fake-Progresswerte; normale interne Route wechselt ruhig ohne erneuten Splash/Spinner/Progressbar. Ein Abschnitt darf leise laden; Fehlermeldung und erneuter Versuch bleiben sichtbar.
6. **Speichern/Zurück/Fehler:** Validieren → in Bearbeitung → bestätigter Erfolg oder präziser Fehler/ungeklärter Status. Doppelaktionen verhindern, Entwürfe/Timer erhalten, Browser-Back und mobile Gesten bei ungespeicherter Arbeit schützen. Kein «Erfolgreich gesendet/bezahlt» ohne bestätigten Serverstatus. Fokus und Rückkehr-/Filter-/Scrollzustand erhalten.
7. Die **sichtbare PWA-Update-Meldung** aus dem bestehenden `components/app-version-notice.tsx` muss in **Web, Mobile, PWA und sämtlichen Assistenten** entfallen, inkl. Importpfad/Styling/Tests falls danach wirklich ungenutzt. Internes sicheres SW-/Versionmanagement und Schutz vor Reload während laufender Arbeit erhalten; keine neue alternative Update-Anzeige.
8. **Rollenabhängige Startseiten:** time-only-Mitarbeiter sieht eigene Zeit/Freigabestatus/minimale Zuordnung, keine Finanz-/HR-/fremden Kundendaten; andere Rollen nur relevante Kennzahlen/Funktionen. Landingpage/Business-App/One Admin nicht zu einer gemeinsamen falschen Navigationsstruktur zwingen. Falls Rollenfilter die fest genehmigten fünf Mobile-Nav-Slots verändern würde: fachliche sichere Zugriffsgrenze umsetzen und konkrete **visuelle Änderung separat vorlegen**, nicht selbst Bottom-Nav-Design umgestalten.

## F. NATIVE-APP-READY – TECHNISCH VORBEREITEN, NICHT BLIND VERÖFFENTLICHEN

1. Definiere und prüfe app-gerechte Interaktionen: Kamera/Dateiauswahl, PDF/Share/Download, Deep Links, OS-Back, Keyboard/VisualViewport, Session/Foreground-Resume, Offline/Netzfehler, Push nur bei funktionierendem Kanal, Datenschutz/Konto-Löschung soweit fachlich verbindlich.
2. PWA- und Browser-UI sind heute zu qualifizieren. **App Store iOS Build, Signierung, nativer Wrapper/Container, TestFlight und Apple-Einreichung sind separate Folgephasen**, keine Behauptung einer bereits existierenden nativen App. Eine Website lediglich zu verpacken ist kein bestätigter Store-Abnahmeweg.
3. **Apple-App-Review- und Billing-Gate:** Vor nativer Kaufoberfläche/Stripe-Link in einer App die aktuellen Apple-Richtlinien speziell 2.1, 3.1.3 und 4.2 überprüfen; Enterprise-Ausnahmen nicht pauschal behaupten. Bis zur Klärung keine neue externe Kauf-CTA innerhalb eines Store-Clients freigeben. Einen isolierten internen Reviewer-Testzugang planen und schützen.
4. Reale iOS-PWA-/iPhone-OS-Tastatur-, Android-PWA- und Assistive-Technology-Prüfungen dürfen nicht mit Playwright-Emulation als bestanden behauptet werden.

## G. VOLLSTÄNDIGES REPOSITORY-ALTLASTEN-AUDIT UND GEZIELTES ENTFERNEN – P1

1. **Das gesamte aktuelle Repository einmal inventarisieren**: Komponenten, CSS/Tokenkaskade/Manifest, Module, Imports/Exports inkl. dynamischer Imports, API, Datenmodell, RLS, Auth, Sessions, PWA/SW, Formulare/Layouts, Rollen, Tarifkonfiguration, E-Mail/Stripe/Benachrichtigungen, Produktbilder, Public Demo, Footer/Header, Testfixtures, Sicherheitskonfiguration, GitHub-Workflows/Deployscripts, aktive vs historische Dokumentation.
2. Für jeden Kandidaten **technisch belegen**: Zweck, aktuelle/indirekte Verwendung, betroffene Routen und Verträge, Owner, ersetzender Pfad, Migrations-/Kompatibilitätsrisiken, Root Cause, Vorher/Nachher und mindestens einen geeigneten Regressions-/Gegenfall.
3. **Entferne wirklich obsolete, widersprüchliche, doppelte oder fehlerhafte Implementierungen**, statt nur CSS darüberzulegen: Legacy-Marketing-Demo, inaktive UI-Banner, nutzlose Overrides, doppelte aktive Logik, tote Assets/Codewege – soweit Verwendung ausgeschlossen.
4. **Nicht pauschal entfernen:** Datenbankmigrationen, produktive Daten, Idempotenz-/Auditbelege, Sicherheits-/RLS-Owner, notwendige E2E-Fixtures, Apple-Reviewer-Isolation, historische Nachweise, externe Schnittstellen oder beliebige Dateien nur aufgrund einer fehlenden statischen Referenz. Keine `DROP TABLE`-/Massenlöschungen, keine stillen Umgehungen und keine zweite Businesslogik.
5. PR #297: Falls bereits mit demselben Ergebnis korrigiert, nicht wieder ändern. High Advisory `braces@3.0.3` im Dev-Pfad: nur echten qualifizierten Upstream-/Ersatzfix einsetzen, keine erfundene Version oder ungeprüfte Ausnahmeverlängerung; Befund aktuell offen melden.

## H. ARBEITSREIHENFOLGE, TESTS UND ABNAHME

**Phase 0:** aktueller SHA, PR-Kollisionen, verbindliche Quelle, begrenzte Baseline, Ist-/Soll- und Gating-Tabelle. Keine Neuimplementierung bereits erledigter Änderungen.

**Phase 1:** Public Demo/CTA/Trial Signup/Marketing; Tarifsynchronisierung und Feature-Reifegrad; Auth/Read-only/Stripe negative Tests. Zuerst sichere, semantisch klare P0-Bugs; keine laufenden Kundenänderungen.

**Phase 2:** globale UI-/Settings-Toggles, Header/Footer/Logos/Iconmessungen, App-/Browser-/Tablet-Zustände, initialer Splash/quiet Navigation/Save/Toast und sichtbare Update-Meldung. Zentrale Foundation-Owner statt Seitenpatches. Rollen-/Time-only-Einstiege konsistent mit V25.3.

**Phase 3:** kontrollierte Repo-Bereinigung und historisches Vertragsindexing mit pro Kandidat bewiesener Löschbarkeit. Kein neuer oder paralleler CSS-Owner ohne Notwendigkeit.

**Phase 4:** Integration: alle bestehenden **76 App-Routen und 13 Operator-Varianten**, Public/Marketing/Auth/Store-Ready-Querschnitt; BP-001…045, UX-001…079, E01–E10 soweit fachlich und technisch anwendbar. Browser-Rollen- und Tenant-A/B-Gegenfälle, Session/Read-only, CSS computed styles und autorisierte Screenshots gegen **ausdrücklich freigegebene** Referenzen. Keine neuen Baselines automatisch akzeptieren.

**Entwicklungstempo:** Während Implementierung nur betroffene Tests; `pnpm qa:plan --files <pathliste>`, `pnpm qa:fast --files <pathliste>`, gezielte Lint/Typecheck und passende Browserfalltests. Nicht die vollständige Browsermatrix nach jedem kleinen CSS-Patch. **Vor Integrationsfreigabe** auf finalem SHA erforderliche `pnpm lint`, `pnpm typecheck`, `pnpm build`, Security/CodeQL, Postgres/Workflows, GitHub-Quality, vollständige systemweite Browsermatrix. Wenn Environment Einschränkungen hat: offenen Nachweis dokumentieren, nicht umgehen und nicht als bestanden melden.

**Pflicht-Gegenfälle:** `/demo` öffentlich gesperrt, QA-Fixture bleibt; Trial ohne Kreditkarte, abgelaufenes Abo; Plan-Mismatch und Direkt-API; Rolle/time-only-/Tenant-Wechsel; feste Mobile-Nav-Referenz; 320/390/760/761/1024/1440 px, Light/Dark; Upload/PDF; Timer-Hintergrund; iOS-Keyboard und Modal; Update-Banner-Abwesenheit; kein doppelt gesendeter Versand; nicht verfügbare Feature-Toggles; Footer-Links/SEO; Fehlermeldungen/Retry.

## I. GIT / LIEFERUMFANG / STOPPREGEL

- Arbeite in einer **sauberen eigenen Branch- und Draft-PR-Struktur** auf dem nachweislich aktuellen Stand, ohne fremde ungemergte PRs zu überschreiben. Bei komplexen Abhängigkeiten kontrolliert aufbauende PRs statt paralleler Implementierungen. Keine pauschale `git reset --hard`- oder Merge-/Rebase-Verlustaktion.
- Pro Phase: Dateiliste, Root Cause, konkrete Codeänderung, gelöschte Altlasten samt Beleg, QA-Ergebnis, noch offene Produkteinstellungen, SHA und URL zum PR/CI.
- Erstelle/aktualisiere die Dokumentation im Repo als **ergänzendes Kapitel** (z. B. `docs/architecture/v25-4-ux-marketing-app-ready.md`) und verlinke sie im aktuellen Architekturindex. Alte freigegebene Referenzen und Testregister erhalten.
- Wenn die Arbeitsumgebung es erlaubt, liefere am Ende zusätzlich ein **vollständiges sauberes Source-ZIP** des PR-Stands (ohne `.env`, Zugangsdaten, `.git`, `node_modules`, `.next` und generierte Assets) sowie eine reproduzierbare PowerShell-QA-Sequenz. Führend bleiben Commit und Draft-PR.
- **Keine produktiven Bank-/Stripe-Buchungen, externen Rechnungs-/Mahnversände, realen Kundenkontodatenänderungen, produktiven SQL-Migrationen, PR-Merges, Azure-/Store-Deployments oder App-Store-Uploads ohne separate ausdrückliche Freigabe.** Sichere konfliktfreie Codeänderungen bis zum geprüften Draft-PR durchführen; bei fachlichem Gate nur den betroffenen Teil blockieren.
- Nicht nach einer Planung stoppen. Arbeite bis zur *nachweislich* geprüften Implementierung aller bereits freigegebenen, im aktuellen Repository tatsächlich machbaren Aufgaben; bei externen/Hardware-/Apple-Abnahmen den präzisen Blocker offen lassen.

**Erfolgskriterium:** Nutzer sieht eine verständliche öffentliche Registrierung statt öffentlicher Demo; exakt drei konsistent beschriebene SaaS-Pläne mit echten Funktionen; eine einheitliche, rollen-/gerätegerechte Binso-One-Erfahrung im Browser und PWA ohne sichtbare Update-Meldung; echte Buttons/Schalter-Semantik und nachvollziehbares Save-/Back-/Loading; eine nachweislich bereinigte Codebasis ohne entfernte notwendige Funktionen; nachvollziehbare CI-, Security-, Browser- und fachliche Abnahme. **Ein grüner Build allein genügt nicht.**
