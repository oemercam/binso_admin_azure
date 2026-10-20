# BINSO ONE V25.5 – PLATTFORM-LIFECYCLE, SECURITY, SAAS, BUSINESS & UX
## Konsolidierter Codex-Folgeauftrag nach Abschluss von V25.4

**Repository:** `oemercam/binso_admin_azure`  
**Auftrag:** Die fachlich bestätigten und sicher umsetzbaren Lücken des beigefügten V25.5-Plattformkonzepts auf dem **tatsächlich aktuellen, nach V25.4 erreichten** Stand implementieren und nachweisen. Bestehende korrekte Lösungen erhalten; keine Doppelimplementierungen.

### 0. Wichtig: Nicht parallel mit dem noch laufenden V25.4-Auftrag starten

Der vorherige V25.4-Codex-Auftrag ist noch in Arbeit. **Starte diesen Folgeauftrag erst, nachdem V25.4 seinen dokumentierten Arbeits-/Übergabestand erreicht hat.** Wenn V25.4 noch auf einem Branch/Draft-PR arbeitet, nicht nebenher dieselben Dateien auf einem neuen widersprüchlichen Branch ändern. Führe keinen eigenen V25.4-Neustart durch. Ermittle erst, was V25.4 tatsächlich geliefert hat (Commit, PR, Tests, Blocker); ein offener Draft-PR ist keine integrierte Main-Änderung. Ist V25.4 nicht integriert, arbeite auf einer explizit nachvollziehbaren Basis/abhängigen Branch-Struktur und mache die Abhängigkeit sichtbar. Keine eigenmächtigen Merges, keine Produktivmigration, kein Deploy.

**Beilagen – zwingend vollständig lesen (alle im ZIP):**

1. `BINSO_ONE_Plattform_Gesamtkonzept_V25_5.md` – 38 Kapitel, fachlicher Lebenszyklus und Normstatus.
2. `BINSO_ONE_V25_5_Plattform_UseCases.csv` – **PL-001–PL-208** mit positiven/negativen Abnahmen.
3. `BINSO_ONE_V25_5_Entscheidungstore.csv` – **PL-G01–PL-G40** mit Freigabestatus und Zuständigkeit.
4. `BINSO_ONE_V25_3_Business_Process_Master_Implementation.md` und `BINSO_ONE_V25_3_UseCase_Umsetzungsmatrix.csv` – **BP-001–BP-045**.
5. `BINSO_ONE_V25_3_Entscheidungsregister.csv` – **D01–D18**, mit neu bestätigten Entscheidungen aktualisieren, IDs beibehalten.
6. `BINSO_ONE_UX_Masterstandard_V1.md` und `BINSO_ONE_UX_Abnahmematrix_V1.csv` – **UX-001–UX-079**.
7. `BINSO_ONE_V25_4_Konsolidiertes_Produkt_UX_Launch_Konzept.md` und `BINSO_ONE_V25_4_CODEX_MASTER_PROMPT.md` – vorherige Arbeitsgrundlage, **kein zweiter, erneut auszuführender V25.4-Auftrag**.
8. In der tatsächlichen Codebasis zuerst `AGENTS.md`, `docs/architecture/ux-current-approval.md`, `docs/architecture/reference-foundation.md`, `docs/audit/v24/reference/IMPLEMENTIERUNG.md`, `app/design-system/manifest.json` sowie aktuelle Architektur- und Abnahmedokumente lesen.

**Normstatus strikt befolgen:**

- `[B]` = ausdrückliche bestätigte Entscheidung, umsetzen soweit fachlich freigegeben und technisch sicher.
- `[V]` = bestehender freigegebener UX-Vertrag, beibehalten.
- `[S]` = definierter Standardvorschlag, **keine** implizite Freigabe für kostenpflichtige, riskante, irreversible, rechtlich relevante oder umstrittene Änderungen; solche Fälle im Gate-Register belassen.
- `[G]` = offenes Fach-/Sicherheits-/Provider-/Legal-/Migrationsgate. Nicht durch Codex eigenmächtig schliessen.
- `[I]` = historische Codebeobachtung; vor Anpassung neu nachweisen.
- `[Q]` = explizite abnahmepflichtige Prüfung; nicht allein mit einem Build als bestanden werten.

**Rangfolge:** jüngste ausdrückliche Nutzerentscheidung > aktuelle `AGENTS.md`/UX-Approval > V25.5 für neue Lücken > V25.4 > V25.3 > alte/historische Referenzen. Sicherheits- oder Datenschutzkonflikte offen dokumentieren, nicht verdeckt umgehen.

### 1. Pflichtphase: Realen Iststand und V25.4-Ergebnis abgleichen

1. Vor Änderungen aktuellen `main`-SHA, laufende Branches, offene PRs/Issues, relevante Actions/Quality/CodeQL-Checks, Security-Befunde, Migrationen und mögliche Parallelaufträge erfassen. Historische PR-Nummern – einschliesslich #297 – nur prüfen, nicht als immer noch offen voraussetzen.
2. V25.4-Lieferstand nachweisen: tatsächlich implementiert, teilweise implementiert, nicht implementiert, fachlich blockiert, bereits bestehend. Kein Fortschrittsurteil allein aufgrund eines Markdown-Plans oder eines grünen CI-Laufs.
3. Erstelle **eine einzige referenzierbare Traceability-Matrix** über `PL-001–PL-208`, `BP-001–BP-045`, `UX-001–UX-079`, `PL-G01–PL-G40` und `D01–D18`: Normstatus, betroffene Komponenten/API/DB, Ist, Änderungsbedarf, PR/Commit, Testnachweis, Blocker. Vermeide doppelte Register mit widersprüchlichem Status.
4. Markiere bereits korrekte, vollständig getestete Funktionen als erhalten. Löse zu Beginn nur tatsächliche Widersprüche; definiere keine neuen Preise, Fristen, Sicherheitsausnahmen oder Rechtsbehauptungen.
5. Wenn V25.4 noch nicht abgeschlossen ist: auf den Abschluss warten bzw. sauber Übergabe/Basis festhalten. Keine parallelen widersprüchlichen Codeeingriffe.

### 2. Verbindliche Produktinvarianten

- **Eine Benutzeridentität/eine Firma für Produkt V1.** Keine Mehrfirmenauswahl, kein Firmenwechsel in der UI, keine zweite aktive Unternehmensmitgliedschaft für dieselbe Login-Identität. Eine andere Firma benötigt vorerst ein separates Konto mit eigener E-Mail. Vor bestehenden Datensätzen/Einladungen **Migrationsanalyse**; niemals blind Mitgliedschaften oder Benutzer löschen. Physische Mandantentrennung, `organization_id` und PostgreSQL-RLS behalten.
- **Passkeys/WebAuthn bevorzugt** für Browser/PWA und spätere App; Face ID, Touch ID, Windows Hello und Android-Gerätefreigabe nur über lokale Geräte-Benutzerverifikation. Nie biometrische Daten serverseitig speichern. Passwort + bestehende sichere Authenticator-Verfahren bleiben als Fallback. Für Owner/Admin/Finance darf die aktuelle MFA-Pflicht nicht geschwächt werden: Passkey-Äquivalenz vor Änderung der privilegierten MFA-Richtlinie explizit freigeben lassen.
- **Passkey-Lifecycle vollständig:** Registrierung, erneute starke Authentifizierung beim Hinzufügen/Entfernen, Liste vertrauenswürdiger Credentials, Recovery, verlorenes Gerät, widerrufene Sitzungen, Audit, echte serverseitige WebAuthn-RP-/Origin-/Challenge-/Replayprüfungen, keine bloße biometrische UI-Attrappe.
- **Keine gefährliche Support-Selbstentsperrung:** Hochrisiko-Recovery, Break-Glass, Owner-Transfer nur nach unabhängig freigegebener Sicherheitsrichtlinie (PL-G04–07). Kein einfacher E-Mail-Link oder Supportanruf als alleiniger Eigentumsnachweis.
- **Rollenrechte** = gültige Identität × genau eine aktive Mitgliedschaft × Firmenstatus × Tarif/Feature × Rollenobergrenze × individuelle Aktions-/Modulrechte × Daten-/Auftragszuordnung × objektbezogener Status. Durchgehend UI, API, Dateien/Downloads, Suche, RLS und Jobs; `deny` bei unbekanntem Berechtigungszustand. Legacy-Zugänge bei Migration vorsichtig und explizit abbilden.
- **Time-only-Mitarbeiter** startet mit persönlicher Zeiterfassungsübersicht, sieht nur eigene Zeiten und minimal notwendige zugewiesene Kunden-/Auftragsbezeichnungen zur Zeiterfassung; keine allgemeine Kundenliste, Finanzen oder HR. Profil, Sicherheit und Support bleiben möglich. Zeitfreigabe durch unabhängige Verantwortliche; Solo-Inhaber-Ausnahme dokumentiert.
- **Visuelle Bestandsregeln**: Original-Microsoft-Foundation, bestehende Bottom-Navigation samt Layout/Icons/Position und blauer schwebender Plus-Kreis unverändert. Nur berechtigte Navigationsziele anzeigen (weniger Ziele zulässig), vorhandene einfache «Mehr»-Liste beibehalten. Keine zweite Foundation, Glass/Blur, verstreute Doppelaktionen, zusätzliche Plus-Buttons oder grossen Empty States. Sichtbar durchgehend **«Auftrag»**, bestehende technische `projects`-/`/projekte`-Strukturen nicht ohne Grund umbenennen.
- **Keine sichtbare PWA-Update-Meldung**, kein unaufgeforderter Reload, kein Datenverlust. Touch, Safe Areas, Keyboard, FormSheet, Zurück, Draft-Recovery, Loading, Erfolg/Fehler und Offline-Verhalten gemäß UX-Masterstandard.
- **Keine vertraulichen Daten** in Logs, offenen PRs, Screenshots oder ungeschützten Testfixtures.

### 3. Umsetzung in nachvollziehbaren Etappen (nur echte Lücken)

**Etappe A – Registrierung, Identität, Sicherheit und Recovery (P0)**

Öffentliche Website → Registrierung → E-Mail-OTP oder Link → Session → privilegierte MFA/Passkey → Firmen-Onboarding → Dashboard als echten Ablauf implementieren, soweit freigegeben. Registrierungs-Doppeltap, E-Mail bereits vorhanden, fehlerhafte Mail, abgelaufener OTP/Link, erneuter Versand, Tab-/Gerätewechsel, Kontoübernahme, sichere Rückkehr und Rate Limits prüfen. Einfache QR-basierte TOTP-Einrichtung mit manueller Alternative, Recovery Codes und barrierefreier UX; keine Klartext-Secrets in Logs. Passkey als echter WebAuthn-Flow, nicht als simulierte Face-ID-Schaltfläche. Passwort-Reset, Passwortwechsel, E-Mail-Änderung, Session-Revoke, Logout und geräte-/tenantübergreifende Cache-Bereinigung technisch absichern. Fehlende riskante Recovery-Beweispfade hinter Gate belassen; nutzbaren sicheren Fallback bereitstellen.

**Etappe B – Unternehmen, Mitglieder, Profil und Rechte (P0)**

Inhaber-/Admin-/HR-/Finance-/PM-/Member-/Reader-Rechte samt Delegationsgrenzen zentralisieren. Mitarbeiter einladen, E-Mail bestätigen bzw. bestehendes Konto im **selben** Unternehmen sicher verwenden, Einladung erneut versenden/widerrufen/ablaufen lassen. Eigenes Profil unabhängig von Personaldossier; Anstellung, Austritt, offene Timer/Zeiten/Spesen, Aufgaben-/Freigabevertretungen, sofortige Deaktivierung, Sitzungsentzug, Rollenherabstufung und Audit klar definieren. Keine Selbstprivilegierung, kein Verlust des letzten aktiven Owners. Hochrisiko-Owner-Transfer nur nach PL-G06 freigeben; nicht eigenmächtig live schalten. Profileinstellungen sauber getrennt von Firmeneinstellungen, binäre Settings über zentrale Toggles mit sicheren Speichervorgängen. One-Admin-Rollen strikt isolieren.

**Etappe C – 14-Tage-Trial, drei SaaS-Abos und Stripe (P0)**

Public Demo als öffentliche Conversion-Route entfernen, interne QA-/Review-Fixtures erhalten. Registrierung mit eigener Firma/Testdaten, 14 Tage **ohne** Kreditkarte, keine automatische Abbuchung. Start CHF 29/290 bis 3 Benutzer; Business CHF 69/690 bis 15 Benutzer; Pro CHF 129/1290 **ohne feste Benutzerobergrenze**. Aufträge vollständig schon in Start; erweitertes eigenständiges DMS erst Pro, notwendige Modulanhänge in Start/Business behalten. Preise, Limits, Marketing, Registrierung, Backend-Entitlements und Stripe aus einer fachlichen Quelle ableiten; keine erfundenen Features oder verdeckten Limits. Checkouts nur über korrekt konfigurierte echte Stripe-Preisreferenzen; signed Webhook bestätigt aktiv, nie der bloße Redirect. Eindeutige Zustände bei Abbruch, Zahlungsfehler, verspäteten Events, Doppel-Events, Rückkehr, Kündigung, Reaktivierung und `read_only`. **Noch offene vorzeitige Abostart-/Resttage-/Steuer-/Proration- und Kündigungsdetails nicht selbst erfinden**; an PL-G10/17/28 und die relevanten Entscheidungstore binden. SaaS-Zahlungen an Binso von Kundenrechnungszahlungen strikt getrennt halten.

**Etappe D – Business-Prozesse von Anfang bis Abschluss (P0/P1)**

Kunde mit Pflichtkontakt → Angebot inklusive bestätigter Konditionen → Annahme mit Nachweis → Auftrag nach Vertragstyp → Zeit/Spesen (intern versus abrechenbar) → Einreichen/unabhängig genehmigen → Abrechnungsvorschlag → geprüfter Rechnungsentwurf, Schweizer QR/PDF, Versand → Zahlung/Teilzahlung/Gutschrift/Rückerstattung → Überfälligkeit/Mahnvorschlag → Abschluss. Jede Entität mit Zustandsmodell, Status/Frist, Audit, Rechtegrenze, Versionierung, Konflikt-/Replay-Schutz. `submitted` vor normaler `approved` Zeitfreigabe erzwingen; Solo-Owner-Ausnahme kontrolliert. Eigene Zeit nicht selbst freigeben, Mitarbeiter nur eigene Scopes. Verrechnete Stunden nie unbemerkt erneut abrechnen. Festpreis-, Stunden-, Wartungs- und Meilensteinaufträge mit richtigem Abrechnungsgrund; geschützte Vertragssnapshots. Ohne ausdrücklich freigegebenes Gate keine automatische Rechnungs- oder Mahnmail, kein produktiver Bankprovider, keine volle Payroll. Bestehende korrekte E01–E10-/BP-Abläufe weiterverwenden und negative Gegenfälle erhalten.

**Etappe E – Datenlebenszyklus, Datenschutz und Betrieb (P0/P1)**

Trenne Konto löschen, Mitgliedschaft deaktivieren, Firma schliessen, Testphase beenden, SaaS-Abo kündigen, Archivieren, Exportieren und endgültig Löschen. Read-only muss erlaubte Export-, Support-, Sicherheits- und Aboverwaltung weiter ermöglichen, ohne Geschäftsobjekte unzulässig veränderbar zu machen. Export-/Löschprozess mit Rechts-/Aufbewahrungs-/Provider-/Backup-Gates, gesonderter Bestätigung und eindeutiger Evidenz. **Keine endgültige Löschung, Fristverkürzung oder produktive Datenbereinigung** ohne Legal-/Produktfreigabe; PL-G12/13/31/40. Backups, Blob-Daten, Audit-Logs und Restore-Proben konzeptionell/technisch inventarisieren; RPO/RTO nicht erfinden. Incidents, Health, Monitoring, Retry, Provider-Ausfälle, Audit und Rollback nachweisen.

**Etappe F – UX, öffentliche Site, E-Mail und App-Readiness (P0/P1)**

Landingpage, Produkt-, Preis-, Login-, Registrierung-, Einladungs-, Passwort-, Sicherheits-, Profil- und Abonnementansichten sowie Kunden-App und One Admin anhand aktiver Referenz wirklich rendern und prüfen. Reale, noch gültige, korrekt gekennzeichnete Produktbilder verwenden. Desktop browsergerecht, Tablet adaptiv, Mobile/PWA App-first mit bestehendem mobilen Navigationsvertrag. Einheitliche Typografie/Tokens/Icons/Logo-/Header-/Footer-Grössen, Lade- und Speichersignale, Fehler-/Leerstates, Tastatur-/Safe-Area-/Zoom- und Screenreader-Verhalten. Zentrale Transaktions-E-Mail-Templates gut lesbar in Light/Dark, Apple Mail, Gmail, Outlook mit Plain-Text-Fallback; keine falsche Dark-Mode-Garantie. Web Push nur, wenn echter Provider und Subscription-/Sendepfad nachgewiesen sind. Apple/Google-Store-Ready planen, **keinen** Store-Release oder IAP-Regelannahmen als erledigt behaupten; PL-G28–30.

**Etappe G – Ganzes Repository auf Altlasten prüfen (P1, nachweisgebunden)**

Einmalig gesamtes Repository inkl. `app`, `components`, `lib`, `config`, `database/migrations`, `scripts`, Design-System, Docs, Tests und Workflows inventarisieren. Alte Demo-/Marketingrouten, doppelte Tarif-/Rechte-/Onboarding-/Mail-/Statuslogik, CSS-Owner-Konflikte, veraltete Komponenten/Utilities, Dead Code und historische Verweise identifizieren. **Nichts blind löschen**: vor Entfernung Build-, Import-, Runtime-, API-, Datenbank-/Migrations-, Test-, Release- und Betriebskontext nachweisen. Nur nachgewiesene Altlasten in kontrollierten Commits entfernen. Historische UX-Dokumentation kennzeichnen, nicht kanonische Referenzen überschreiben; kein zweites Designsystem, keine lokalen CSS-Hotfixes, keine verlorenen Daten oder Sicherheitskontrollen.

### 4. Teststrategie, messbare Abnahme und Geschwindigkeit

- Während einer begrenzten Korrektur nur relevante schnelle Tests (`pnpm lint`, `pnpm typecheck`, gezielte Unit/API-/DB-/UI-Suites und `pnpm qa:plan` / `pnpm qa:fast` falls aktuell vorhanden); **nicht nach jeder kleinen Änderung alle Browser-/PWA-Tests neu starten**.
- Vor integrationsreifem Draft-PR vollständige erforderliche Lint/Typecheck/Build, Security/CodeQL, Tests mit echtem PostgreSQL/RLS, Provider-Mocks + signiertem Stripe-Test-Webhook, Idempotenz/Concurrency, API-Authorization, Formularen/Flows, Dokument-/QR-Rechnung, Accessibility und visuellen Referenzen durchführen. Gemäss Repo-Commands arbeiten, keine falschen oder veralteten Befehle voraussetzen.
- Rollen inkl. Owner/Admin/Finance/HR/PM/Time-only/Reader, Plan Start/Business/Pro, Trial/Active/Read-only/Past-due/Cancelled, fremder Mandant, direkt adressierte APIs, negative Datei-/Suche-/Cachefälle und gefährliche Freigaben testen.
- Viewports und Betriebsarten: 320/390/600/760/761/820/1024/1440/1920 px, echte mobile Browser/PWA soweit verfügbar, iOS-Tastatur, Safari, Android, Tablet/Split View, Desktop Browser, Dark/Light/Zoom/Screenreader. **Nur tatsächlich ausgeführte physische Tests als bestanden zählen**, fehlende Hardware explizit als blockiert erfassen.
- Jede Matrixzeile hat `NOT_STARTED/IMPLEMENTED/TESTED/BLOCKED` (oder bestehendes äquivalentes Statusschema), tatsächliche Evidence (SHA, Test, Screenshot/Log), kein pauschales „alle bestanden“. Alte fehlgeschlagene Tests ursächlich beheben, niemals Gates aushebeln oder Screenshot-Baselines stillschweigend ersetzen.

### 5. Artefakte und GitHub-Arbeitsweise

1. Zu Beginn eine kurze Ist-/Delta-Matrix, Auftragsabgrenzung und betroffene PR-Abhängigkeiten liefern. Dann tatsächlich implementieren, nicht beim Plan stehenbleiben.
2. Änderungen in logisch trennbare Arbeitspakete und nachvollziehbare Draft-PRs gliedern. Keine zweite parallele Foundation, keine fremden PRs ohne Freigabe überschreiben. PRs dürfen voneinander abhängen, Abhängigkeiten ausdrücklich dokumentieren.
3. Pro Paket liefern: Problem/Root Cause, Files/DB-Migrationen, Begründung, entfernte Altlast, Testresultate, Rollback-/Migrationsrisiko und erfüllte PL-/BP-/UX-IDs. Neue Dokumente nur als Fortschritts-/Source-of-Truth-Ergänzung, nicht konkurrierendes Masterkonzept.
4. Offene PL-G-/D-Gates in einem **einzigen nachvollziehbaren Freigaberegister** belassen, bei Bedarf mit minimalen Entscheidungsfragen und sicheren Defaults. **Bei einem blockierten Gate an unabhängigen, bereits genehmigten Bereichen weiterarbeiten**, statt eine riskante Annahme zu treffen.
5. Abschlussbericht enthält: aktuelle Branch- und PR-Links, Commit-SHAs, tatsächlich bestandene/geblockte Prüfungen, Fortschritt je Etappe und IDs, bekannte Risiken, noch notwendige Freigaben, mobile/Provider-Tests, Rollback. Niemals ungetestete Vollständigkeit melden.

### 6. Absolute Stopps und Freigaben

**Dieser Folgeauftrag erlaubt die Implementierung bestätigter, klarer und sicher umsetzbarer Anforderungen in Entwicklungsbranches mit Draft-PRs. Er erlaubt ausdrücklich NICHT:**

- Merge in `main`, Veröffentlichung/Release, Azure-Produktivdeploy, produktive Datenbank- oder Infrastrukturmigration;
- automatischen externen Rechnungs-/Mahnversand, ungenehmigte Abbuchungen oder Änderung bestehender Kundenabos;
- Löschung/anonymisierende Veränderung produktiver Unternehmens- oder Mitarbeiterdaten;
- Änderung von Preisen, neuen Quotas, Store-/Stripe-Zahlungskonditionen oder automatischen kostenpflichtigen Stichtagen ohne Freigabe;
- Absenkung privilegierter MFA, ungeprüfte Passkey-Äquivalenz, ungesicherte Recovery-/Break-Glass-/Inhaberwechselrechte;
- Umgestaltung der bestehenden Bottom-Navigation oder des runden blauen Floating-Plus-Buttons;
- künstliches „PASS“, Abschalten von Security-Checks, zusätzliche irrelevante Voll-Browsertests nach jeder Miniänderung.

**Arbeite nach Abschluss von V25.4 autonom an allen zulässigen, im Register nachgewiesenen V25.5-Lücken weiter. Stoppe nur für echte Freigabegates und dokumentiere deren Auswirkungen. Produktivdeployment und Merge benötigen eine separate ausdrückliche Freigabe.**
