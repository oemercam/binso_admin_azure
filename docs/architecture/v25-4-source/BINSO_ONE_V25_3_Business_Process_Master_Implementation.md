# BINSO ONE – V25.3 BUSINESS PROCESS & IMPLEMENTATION MASTER

**Konsolidierte fachliche und technische Soll-Spezifikation / eindeutiger Einstieg für Codex**  
**Stand:** 20.10.2026 · **Schweiz** · **Repository:** `oemercam/binso_admin_azure`  
**GitHub-Basis bei Erstellung:** Main `d2825134deb33cac67a05c6e703b945ff28066e6`  
**Bestehender Foundation-Draft:** [PR #297](https://github.com/oemercam/binso_admin_azure/pull/297), HEAD `d707edf0e0e6e4231e50059c45af117fb59fcda2`, offen/Draft; Standard-Quality und CodeQL an diesem HEAD erfolgreich, vollständige Browser-/Geräte-/Produktabnahme nicht dadurch belegt.  
**Dokumentstatus:** Fachliches Zielbild und konsolidierter Implementierungsauftrag. Dieses Dokument **ist keine Behauptung, dass die Änderungen implementiert wurden**, und **keine Freigabe für Merge, produktive Migration oder Deploy**.

## 0. Entscheidung, Geltung und Quellenhierarchie

Der Benutzer hat zugestimmt, das Business Process Master Concept mit V25.2 zusammenzuführen. Hiermit ist **die Konsolidierung und das gemeinsam besprochene Zielbild** bestätigt, nicht automatisch jede einzelne neu vorgeschlagene Geschäfts-, Sicherheits-, Rechts- oder Zahlungsregel. Bei Widersprüchen gilt folgende Rangfolge:

1. Verbindliche Sicherheit, Datenschutz und rechtliche Pflichten sowie ausdrücklich bestätigte geschäftliche Entscheidungen.
2. Zuletzt freigegebener Binso-One-UX-Standard (`AGENTS.md`, `docs/architecture/ux-current-approval.md`, `docs/architecture/reference-foundation.md`, `app/design-system/manifest.json`), unveränderte Gestaltung und Position des bestehenden runden blauen Plus-Buttons, bestehende Bottom-Navigation und einfache «Mehr»-Liste.
3. **Bestätigte** Produktgrundsätze aus diesem Master (`[V]`).
4. Bereits gültige Implementierungsverträge V25, V25.1, V25.2, soweit konfliktfrei.
5. Fachliche Standardvorschläge (`[S]`) nur nach Prüfung; offene produktentscheidende Bereiche (`[O]`) nicht eigenmächtig als erledigt erklären.
6. Historische Reviews und UX-Berichte sind Beweismittel, keine aktiven Designanforderungen.

**Zwingend beibehalten:** Das Wort **«Auftrag»** in der sichtbaren Oberfläche; `projects` darf als technische Bezeichnung bleiben. Keine zweite UX-Foundation, keine neue Glass-/Blur-Optik, keine CSS-Workarounds, keine neuen universellen Businesslogiken. Dokumente/PDF/Datei-Aktionen gemäss freigegebenem zentralem Aktionssystem. Leere Zustände kompakt, ohne wichtige Fehlermeldungen oder Accessibility-Inhalte abzuschneiden.

**Wichtiger Konflikt mit ausdrücklichem Freigabebedarf:** Für «Nur Zeiterfassung» dürfen keine unberechtigten Finanz-/Kunden-/Auftragsziele angeboten werden. Das bestehende Bottom-Navigationsdesign inklusive Plus bleibt unangetastet. Soweit das Filtern/Entfernen unberechtigter Ziele die verbindliche Fünf-Punkte-Struktur verändern müsste, vor diesem konkreten visuellen Eingriff eine Alternativenentscheidung einholen. **Keinesfalls** unberechtigte Links nur aus Geometriegründen belassen oder ihr Ziel durch Umbenennung fälschen.

### Verbindliche Quellen zur Nachverfolgung

- `BINSO_ONE_Business_Process_Master_Concept_V1.md`: 45 BP-Fälle, 18 Prozessbeschreibungen, Code-Gaps G01–G18, Entscheidungspunkte D01–D18.
- `BINSO_ONE_V25_2_Foundation_Rollen_Prozess_Implementation.md`: technische Reihenfolge, Rollen-/UI-/API-/RLS-Konsistenz, Integration Foundation, QA, E01–E10.
- `BINSO_ONE_UseCase_Gap_Matrix_V1.csv`: priorisierte Original-IDs und Negativfälle. Dieses Master bewahrt alle 45 IDs unverändert.
- Aktuelle Repository-Belege `docs/architecture/app-acceptance.md`, `docs/architecture/app-acceptance-routes.md`, `docs/architecture/role-business-flow-consistency.md`; nicht blind auf ältere Zwischen-SHAs oder dortige PR-Zustände vertrauen.
- Foundation-PR #297 **nicht neu implementieren oder ungeprüft als bereits integriert deklarieren**. Bestehende offene PRs und aktuelle Main-Differenz vor jedem Arbeitsbeginn überprüfen.

## 1. Zusammengeführte Produktentscheidungen

**Verbindlich vereinbarte Grundsätze [V]:**

- **Auftrag** als einziger allgemeiner sichtbarer Begriff; kein zweites, konkurrierendes Modul Projekt.
- Benutzer können rollen- und modulbezogen eingeschränkt werden; insbesondere ein Mitarbeiter mit **ausschliesslich Zeiterfassung** erhält nur seine fachliche Zeitsicht, zugewiesene minimale Auswahldaten, eigenes Konto/Sicherheit und Support; keine Finanzdaten oder fremde Mitarbeiterdaten.
- Mitarbeiterzeiten werden grundsätzlich bewusst eingereicht und durch **eine andere zuständige Person** genehmigt. **Keine Selbstfreigabe** durch normale Mitarbeiter.
- **Allein tätiger Inhaber ohne Mitarbeitende** kann eigene Zeiten ohne künstliche Fremdfreigabe abrechnungsreif machen. Diese Ausnahme ist eng gebunden, nachweisbar und darf keine Umgehung für Mitarbeiter ermöglichen.
- Einreichung, Prüfung, Abrechnung, Zahlung und Mahnung sind getrennte fachliche Zustände mit unabhängigen zuständigen Personen.
- **Rechnung/Versand** und **Mahnung** sollen standardmässig vorbereitet und durch eine berechtigte Person kontrolliert werden. Automatischer externer Versand nur mit bewusstem Opt-in und verlässlicher Infrastruktur.
- One Admin und Kunden-App sind getrennte Sicherheits- und Arbeitsbereiche; kein Betreiberzugriff auf beliebige Mandantendaten.

**Noch nicht abschliessend als Geschäftsregel abgenommen [S/O]:** Tarif-/Preispriorität, Vertragstypen und Sammelfaktura, Arbeitszeit-/Abwesenheitsrichtlinien, automatische Eskalationsfristen, Bankimporte/Überzahlungen, Schwellenwerte für Vier-Augen-Prüfung, juristische Mahnfristen/Gebühren und konkrete mobile Slot-Lösung. Diese Punkte werden unten einzeln geführt und nicht stillschweigend implementiert.

### 1.1 Rollen, Datenräume und Einstiege

| Rolle | Startansicht / täglicher Auftrag | Zulässiger Grundbereich | Ausdrücklich ausgeschlossen ohne Delegation |
|---|---|---|---|
| Inhaber | Gesamtüberblick, offene Forderungen, Freigaben, Ausnahmen | Eigenes Unternehmen gemäß Tarif und Datenschutz | Andere Mandanten/One Admin |
| Unternehmens-Admin | Team/Organisation, zugewiesene Freigaben | Eigener Mandant und delegierte Sonderrechte | Eigentümer-/Vertrags-Sonderaktionen ohne Freigabe |
| Finanzen | Abrechnungsstapel, Rechnungen, Zahlungen, Mahnvorschläge | Fachlich erforderliche Kunden-/Finanzdaten | Lohn-/HR-Akten, automatische Zeitfreigabe durch Finanzrolle |
| HR/Personal | Mitarbeitende, Abwesenheiten, personenbezogene Aufgaben | Autorisierter HR-Bereich | Rechnungen, Bankkonto, Auftragsfinanzen |
| Auftragsleitung | Zugewiesene Aufträge, Einsatzplanung, fremde Freigaben | Aktive Zuordnungen, eigene Arbeitsvorgänge | Fremde Aufträge, Lohn, unternehmensweite Accounting-Daten |
| Mitarbeiter | Nur freigegebene Module; time_only: «Meine Arbeitszeit» | Eigene Einträge und minimierte Assignment-Optionen | Finanzen, fremde Leistungen und Genehmigungen |
| Lesen | Explizite, berechtigte Ansicht | Read-Scope | Geschäftliche Schreibaktionen; persönliche Supportanfrage als Ausnahme |
| One Admin Rollen | Je Plattformaufgabe Support/Billing/Audit/Sicherheit | Plattformmetadaten nach konkretem Betreiberrecht | Interne Kundengeschäftsdaten ohne gesonderte gesicherte Ausnahme |

**Effektive Berechtigung (Server-seitig und konsistent):** Identität + Tenant + Rollenobergrenze + individuell erlaubte Module/Operationen + Tarif + Zuordnung/Scope + Objektzustand + Read-only/Sperre. Restriktive individuelle Modulprofile **beschränken**, sie erhöhen nicht die Rollenrechte. Standardprofil `time_only` als konfigurierter `member`, nicht als neue parallele Rolle. Ein Rollenwechsel muss sofort Daten-/UI-/Cache-Zugriff neu bewerten. Login/Profil/Passwort/MFA/eigene Benachrichtigungen und eigene Supportvorgänge als eng definierte Basisfähigkeiten für alle aktiven Nutzer.

### 1.2 Persönliche und betriebliche Einstellungen

**Selbst verwaltet:** eigenes Profilbild, Telefon, Sprache, Darstellung, eigene technisch unterstützte Benachrichtigungen, Passwort/MFA/Sitzungen; E-Mail-Wechsel nur nach Verifikation. Persönlicher Anzeigename und rechts-/lohnrelevanter Personendatensatz bleiben fachlich getrennt.

**Inhaber/berechtigter Admin:** Firmendaten, Branding, Nutzer/Rollen/Assignments, Freigaberegeln, Unternehmenseinstellungen. **HR** für Mitarbeiter-/Abwesenheits-/Lohndaten nur nach Zuständigkeit. **Finanzen** für Rechnungstexte, Zahlungs-/Bank-/MWST-Regeln nur im gewährten Umfang. IBAN-/QR-IBAN-Wechsel, Rolleneskalation, Eigentümerrechte und sensible Export-/Bankaktionen benötigen konkrete separate Rechte, Audit und ggf. Vier-Augen-Freigabe. Auftragsleitung erhält nie pauschal Personal-/Lohnrechte.

**Kein Phantom-Feature:** Nicht eingerichtete Push-, Bank-, E-Mail-, Lohn- oder Abo-Funktionen dürfen nicht als erfolgreich konfiguriert erscheinen. Veränderungen von Firmendaten ändern keine alten Rechtsdokument-/PDF-Snapshots.

## 2. Fachliche Zustandsmaschinen und Verantwortung

| Bereich | Normaler Weg | Regeln für Sonderfälle | Übergabe / Audit |
|---|---|---|---|
| Mitarbeiter-Einladung | Erstellt → zugestellt/ausstehend → angenommen/aktiv | Abgelaufen, widerrufen, Zustellung unsicher, gleiche Identität in anderem Tenant | Einladender, Rolle, Module, Timestamp, Sessionprüfung |
| Arbeitszeit | Entwurf → eingereicht → genehmigt oder zurückgewiesen → ggf. erneut eingereicht | Eigene Zeit nicht selbst freigeben; Sperren/Assignment; Solo-Owner als eng definierter Sonderpfad | Mitarbeiter → Auftragsleitung/Stellvertretung → Abrechnung |
| Abrechenbarkeit | Arbeitszeit geprüft → vertraglich abrechenbar → für Entwurf reserviert → verrechnet | Intern/Festpreis/Sperre/Streitfall dürfen nicht zu Stundenpositionen werden | Leistungs-Snapshot, Vertrag, Preis, Reviewer |
| Spesen | Entwurf → eingereicht → genehmigt/zurückgewiesen → erstattet und/oder verrechnet | Eigene Spese nie eigenfreigeben; Erstattung an Mitarbeiter ≠ Verrechnung an Kunde | Beleg, Prüfer, Erstattungs-/Fakturareferenz |
| Angebot | Entwurf → ausgestellt/versandt → angenommen/abgelehnt/abgelaufen/revidiert | Nachverhandlung/Annahmebeleg; Wiederholung darf Auftrag nicht duplizieren | Kundenkontakt/Nachweis, neue Auftrags-ID |
| Auftrag | Erfasst → aktiv/pausiert → abschliessbar → abgeschlossen, ggf. storniert | Nicht abschliessen, wenn offene Timer, Leistungs-/Rechnungs-/Spesen-/Genehmigungsvorgänge nicht geklärt | Zuständige Auftragsleitung/Owner, Abschluss-Checkliste |
| Rechnung | Entwurf → ausgestellt → Versand bestätigt/ungeklärt → teilbezahlt/bezahlt/überfällig | Betrag und Dokumentstatus getrennt; Storno/Gutschrift/Refund korrekt verknüpfen | Finanzen, QR/PDF-Snapshot, Zustellhistorie |
| Zahlung | Importiert/erfasst → ungeklärt → eindeutig zugeordnet → bestätigt | Überzahlung, Duplikat, falsche Referenz, Rückbuchung | Finanzbearbeiter/Provider, Zuordnungs-Audit |
| Mahnung | Bei Fristablauf Vorschlag → geprüft → Versand bestätigt oder fehlgeschlagen → ggf. nächste Stufe | Zahlung, Streitfall, Sperre, Friständerung, unklare Bankzahlung → halten | Freigebende Finanzrolle, frischer Restbetrag, gesendete Stufe |
| Support | Neu → offen/in Bearbeitung → gelöst/geschlossen → explizit wiedereröffnet | Interne Notiz nie Kundensicht; Berechtigung und Ticketnummer auch bei Retry | Kunde ↔ Platform Support, eigene Aufgaben/Audit |

**Grundinvarianten:** Kein Zustand «gesendet/bezahlt/erstattet» ohne bestätigten Vorgang. Alle relevanten Mutationen mit Server-Authorisierung, Tenant-RLS, Versions-/Idempotenzschutz und Audit. Bearbeitung nach Freigabe/Verrechnung nur per dokumentierter Korrektur oder Gutschrift, nie stille Überschreibung. Bei fehlendem Reviewer darf nichts verloren gehen: offene zuständige Aufgabe mit blockierendem Hinweis und Eskalation.

### 2.1 Verrechnungslogik je Auftragstyp – Freigabegrenze

| Typ | Interne Zeit | Kundenseitige Verrechnung | Offene Produktentscheidung |
|---|---|---|---|
| Zeit und Material | Ja | Freigegebene Stunden × vertraglich gültiger Preis + freigegebene Material-/Spesenpositionen | Preispriorität D08 |
| Festpreis | Ja | Vereinbarte Pauschale, **keine doppelte Stundenabrechnung** | Teilrechnungs-/Meilensteinregeln D14 |
| Wiederkehrende Leistung | Ja, falls Arbeit anfällt | Vertragsbetrag und eindeutiges Intervall | Abrechnungsturnus/Deduplizierung D14 |
| Meilenstein | Ja | Nach nachweislich erfülltem Meilenstein | Meilenstein-/Abnahmebeleg D14 |
| Interner Auftrag | Ja | Keine externe Rechnung | Arbeitszeit-/Lohnbestätigungsregeln D07 |

**Schweizer Besonderheiten:** CHF/Dezimalpräzision, Schweizer QR-Rechnung aus gültigen Zahlungsdaten, MWST-Sätze entsprechend Datum/Leistungsart, Mahnungen ohne ungeprüfte gesetzliche Pauschalgebühren, Datum und Geschäftstage Europe/Zurich. Keine rechtlichen Automatismen behaupten; MWST/Lohn/Betreibung fachlich separat qualifizieren.

## 3. Priorisierte Arbeitsfolge für Codex – ohne erneutes Ganz-Repo-Audit

**Phase 0 – Basis & Konfliktprüfung (kein Produktivcode, soweit nur Abgleich):** aktuellen Main/PRs/Issues/CI prüfen, PR #297 nicht doppeln, bestehende Verträge und offene D-Gates abgleichen, Task-Matrix auf heutigen SHA aktualisieren. Bewahrte, bereits getestete Codepfade unangetastet lassen.

**Phase 1 – P0 Rollen/Datenschutz:** individuelle Modul- und Datenrechte als Erweiterung der bestehenden Permission-Owner, Zeit-only Login/Dashboard, minimaler Assignments-Picker, serverseitige API-/RLS-/Datei-Scopes, dynamische Navigation/QuickCreate/Suche, Token-/Cache-Invalidierung, Team- und Profil-Einstellungen. Keine visuelle Umgestaltung.

**Phase 2 – P0 Zeit/Freigaben:** Übergang Entwurf → Einreichung → unabhängige Freigabe strikt durchsetzen, Solo-Owner-Sonderfall, Reviewer-Stellvertretung/Blocker, interne/abrechenbare Zeit, Monatsrapport, korrigierte/archivierte/abgerechnete Einträge, Protokolle und idempotente Benachrichtigungen.

**Phase 3 – P0 Vertrieb/Abrechnung:** Angebot/Annahme/Revision → Auftrag; Auftragsart, Konditionssnapshot und Budget; freigegebene Leistungsverrechnung nach Tarifregel; Rechnungsvorschlag/-entwurf, Schweizer QR/PDF, Versandfreigabe, Teil-/Sammelrechnung, Gutschriften, Dubletten- und Doppelabrechnungsschutz. Ungeklärte D08/D14-Varianten isolieren, nicht erfinden.

**Phase 4 – P0/P1 Zahlung und kontrolliertes Mahnwesen:** manuelle Zahlungen/Teileingänge und Salden sichern, ungeklärte Zahlungen behandeln; Mahnvorschläge dedupliziert, Payment-/Dispute-Hold, manueller Versand; Bankimport/Auto-Mails nur nach Provider-/Fristen-Opt-in und eigener Abnahme.

**Phase 5 – P1/P2 Lebenszyklus und Qualität:** Mitarbeiter-Austritt/Abwesenheit, Auftragsabschluss, Spesen-Erstattung, Support/One Admin, Abo-Read-only, Benachrichtigungsfehler, Datenexport/Retention; anschließend E01–E10 + BP-001…045, 76-Routen-Compliance, Gerätematrix, Abnahmebericht.

**Arbeitsregel:** Während der Entwicklung nur gezielte `qa:plan`, `qa:fast`, relevante Lint/Typecheck/Integrationstests. Am Ende auf **dem exakten finalen HEAD** vollständige erforderliche GitHub-Quality-/Security-/PostgreSQL-/Chromium-/WebKit-Gates ausführen. Fehlende echte iPhone-/Android-PWA-/OS-Tastatur-/Screenreader- und Providerbeweise explizit offen lassen, auch wenn CI grün. Nicht alles pro Prompt wieder und wieder testen.

## 4. Abnahmemapping E01–E10 ↔ 45 Business Processes

| E2E-Test | Abgedeckte BP-IDs (fachliche Zuordnung) | Zwingende Gegenfälle |
|---|---|---|
| E01 Registrierung/Login | BP-001,002,003,004,005,040,042 | OTP/MFA, Sessionwechsel, andere Rolle, Einladung abgelaufen, Tenant A/B |
| E02 Kunde/Angebot/Auftrag | BP-009,010,011,012,013,014 | Pflichtkontakt, Dublette, Annahme-/Revision, Preis-/Tarif-Snapshot, Wiederholung |
| E03 Mitarbeiter/Zeit/Freigabe | BP-003,007,014,015,016,017,018,019,020,021,023 | Nur-Zeit, fremder Auftrag, Entzug, Solo-Ausnahme, fehlender Reviewer |
| E04 Monatsrapport | BP-015,016,017,018,021,022,023 | Scan/Upload, 198 Stunden, Überschneidung, Sperre, Rückweisung |
| E05 Rechnung/Zahlung/Korrektur | BP-008,012,013,025,026,027,028,029,030,031,032,034,044 | doppelte Rechnung/Zahlung, falsche Währung, Gutschrift, Erstattung, Streit/Restbetrag |
| E06 Spesen | BP-007,024,025,028,029 | eigene Genehmigung, Beleg fehlt, Erstattung ≠ Kundenrechnung |
| E07 Support zwei Apps | BP-001,037,038,039,042 | interne Notiz, Ticket geschlossen, Wiederöffnung, fremder Tenant |
| E08 Plattformverwaltung | BP-001,039,040,041,042 | Operatorrollen, Sperre, Billing, Audit, Plattform-/Tenant-Trennung |
| E09 Einstellungen/Rechte | BP-003,004,005,006,007,036,040 | eigene vs. Unternehmensdaten, Downgrade, Rollenerhöhung, Sessionrecht |
| E10 2 PWAs/Device | BP-001,005,037,042,043 | installierte Apps getrennt, Safe Areas, Keyboard, Offline/Resume |

**Erweiterte End-to-End-Nachweise:** Die BP-Fälle mit Schwerpunkt Frist/Automatik/Vertrag/Auftragsabschluss (z. B. BP-032, BP-033, BP-035, BP-045) benötigen zusätzlich eigene fachliche Negativtests; E01–E10 allein erfüllen sie nicht.

## 5. Produktentscheidungstore, die ein Agent nicht stillschweigend schliessen darf

Eine fachliche Unklarheit blockiert **nur die direkt betroffene riskante Funktion**, nicht die komplette Basisarbeit. Codex dokumentiert Alternativen und implementiert sichere unabhängige Grundlagen. Die Entscheidung wird danach explizit eingeholt.

| ID | Bereich | Bis zur Entscheidung sichere Regel | Nicht stillschweigend aktivieren |
|---|---|---|---|
| D07 | Interne Arbeitszeit | Erfassen/anzeigen, nie als externe Rechnung positionieren | Automatische HR-/Lohnbestätigung |
| D08 | Stundensatz-Snapshot | Bereits gespeicherte Kund-/Vertragsansätze unverändert, unklaren Tarif zur Prüfung markieren | Preis mit falschem oder Nullansatz fakturieren |
| D09 | Vertreter/Eskalation | An eindeutig berechtigten unabhängigen Inhaber/Admin übergeben oder blockiert anzeigen | Self-Approval und frei erfundene Eskalationsfristen |
| D10 | Auftrags-/Kundenerstellung durch Projektleitung | Bestehende Owner/Admin-Grenzen erhalten | Pauschale `customers:create`-/`projects:create`-Ausweitung |
| D11 | Bankimport/Abgleich | Manuell, bestätigte Zahlungen und Idempotenz | Zahlungsprovider als angeblich vorhanden darstellen |
| D12 | Mahnfristen/Verzugsfolgen | Aktuelle berechnete und manuell geprüfte Mahnstufen | Gebühren, Inkasso, automatisch Fristen behaupten |
| D13 | Ferien/Abwesenheit | Bestehende HR-Genehmigungen und Zuordnungsgrenzen erhalten | Automatische generelle HR-Freigaben |
| D14 | Vertragstypen/Sammelfaktura | Bestehende Stundenrechnung schützt vor Doppelverrechnung | Wiederkehrende automatische Rechnungs- und Versandjobs |
| D15 | Rechnungsstreit | Mahnung pausieren und verantwortliche Person anzeigen | Streit ignorieren/weiter mahnen |
| D16 | Rollen-Navigation | Unerlaubte Ziele aus Geschäftsführung heraus halten, Gestaltungs-/Freeze unverändert | Layout ohne visuelle Freigabe neu gestalten |
| D17 | Abo-/Read-only | Nur im bestehenden Read-only-Policyrahmen erlaubte Aktionen, persönliche Sicherheit/Support gesondert | Tenantdaten löschen oder unberechtigt zugänglich machen |
| D18 | Kritische Freigabe-/Exportlimits | Bestehende Rollenobergrenzen erhalten, sensible Aktionen auditieren | Ungeprüfte Schwellenwerte/Vier-Augen-Finanzaktion |

## 6. Konkrete Ist-Code-Lücken gegenüber dem Ziel (Stand genannter Main)

| Gap | Nachgewiesener Ort | Soll / Einordnung |
|---|---|---|
| G01 | `lib/permissions.ts`, `components/team-settings.tsx` | `member` hat mehrere Module; individuell reduziertes Zeitprofil nicht durchgängig – **echte P0-Lücke** |
| G02 | `components/app-shell.tsx` | Mobilen Finanzlink mit effektivem Recht abgleichen – **UI-Sackgasse** |
| G03 | `components/pages/time.tsx` | Kunden-/Auftragsauswahl nutzt normale Modul-APIs; minimierten Assignment-Picker für time_only schaffen |
| G04 | `app/api/time-entries/[id]/route.ts` | Freigabe normaler abrechenbarer Zeiten muss tatsächliches `submitted_at` voraussetzen |
| G05 | `app/api/time-entries/route.ts`, `app/api/time-tracker/route.ts` | Allein-Owner-Ausnahme und interne-Zeit-Richtlinie fachlich zentralisieren |
| G06 | `lib/server/workforce-access.ts`, `database/migrations/0055_workforce_assignments_and_reports.sql` | Server-RLS/Assignments erhalten; prüfbare Reviewer-/Stellvertretungslogik ergänzen |
| G07 | `app/api/time-entries/billing/route.ts` | Freigegebene unverrechnete Einträge existieren; preis-/vertragsabhängige Abrechnung ergänzen |
| G08 | `lib/server/document-process.ts` | Angebot-/Rechnungs-Snapshots, Revisionen und QR erhalten; Versandfreigabe/Annahmenachweis prüfen |
| G09 | `app/api/payments/route.ts` | Manuelle Zahlung/Idempotenz vorhanden; Unklar-/Überzahlungs-/Rückbuchungsprozess definieren |
| G10 | `lib/payment-reminder.ts` | Manuelle Mahnstufen vorhanden, **kein automatische Scheduler**; Vorschläge und Streit-Pause als spätere Erweiterung |
| G11 | `lib/server/database.ts`, `app/api/expenses/*` | Mitarbeitererstattung und Kundenverrechnung als getrennte Buchungs-/Statusdimensionen absichern |
| G12 | `components/pages/dashboard.tsx` | Rollenabhängige UI-Grundlage; time_only/HR/Reviewer-Inhalte vervollständigen |
| G13 | `components/settings-navigation.tsx`, `components/pages/settings.tsx` | Selbst-/Unternehmens-/Personal-Einstellungen fein erlauben, doppelte Datenowner verhindern |
| G14 | `config/plan-access.ts` | Planmodule von individueller Berechtigung sauber trennen |
| G15 | `app/api/settings/notifications/route.ts` | Unverfügbare Kanäle als solche; Folgeaufgaben/Unbestätigtes nicht als zugestellt anzeigen |
| G16 | `components/app-version-notice.tsx` | Sichtbare PWA-Update-Meldung laut aktueller Freigabe entfernen, Update-/Sitzungssicherheit erhalten |
| G17 | `docs/architecture/app-acceptance.md` | Bestehende E01–E10 nur Teilnachweise, kein Geräte-/Produkt-Go-live |
| G18 | PR #297 | Compliance/CSS-Paket vorhanden, **nicht** als gemergt oder produktiv behaupten |

## 7. Foundation- und Security-Abnahme bleibt verpflichtend

PR #297 enthält laut geprüftem Diff die Korrektur des Review-/Physical-Aggregators, 36 aktuelle Anforderungen mit **768 geplanten Mindestfällen**, synchronisierte Style-Verträge, Evidence-Digest-Erweiterungen und Entfernung von acht nachgewiesen überholten CSS-Deklarationen. Die **392 historischen Anforderungen** ohne neue Fallzuordnung bleiben offen. Aus diesen Fallzahlen dürfen keine angeblich bestandenen Tests abgeleitet werden.

Das gemeldete High-Advisory `GHSA-vfj7-8cjw-p6xm` im Dev-ESLint-Pfad `braces@3.0.3` ist im Foundationbericht offen; ein verlässlicher gepatchter Upstream wurde für diesen Stand nicht nachgewiesen. Die bestehende befristete Ausnahme endet am **24.10.2026 00:00 UTC**. Kein Blind-Upgrade, keine frei erfundenen Overrides oder pauschale Ausnahmeverlängerung; bei künftig verfügbaren Reparaturen neu qualifizieren. Produktionsdependencies gesondert testen.

**Verifikation:** Standard-Quality und CodeQL für Draft-HEAD `d707edf0` grün (Abruf während Konzepterstellung); vollständige Browsermatrix, tatsächliche Produktflows und echte iOS-/Android-PWA-Geräteabnahmen daraus **nicht nachgewiesen**. Für den finalen Codestand nur Testnachweise mit passendem Commit/Umgebungszustand verwenden.

## 8. Umsetzungsvertrag / Stopps / Nachweise

1. **Kein doppeltes Fundament:** Vorhandene PRs und Merge-Base prüfen; V25.2 und den BP-Master als ein fachliches Arbeitspaket nutzen, aber risikogerechte kleine, gut prüfbare technische Commits.
2. **Nur tatsächliche Root Causes:** Jede Abweichung erhält konkrete Code-/API-/RLS-Quelle, Vorher/Nachher und Negativtest. Kein einfaches Umbenennen oder Verstecken verbotener Aktionen, wenn der Server sie noch erlaubt.
3. **Verbindliche Rechteprüfung:** Echte Sessions mit Besitzer, HR, Finanzrolle, Auftragsleitung, time_only und Reader; zusätzlich One Admin Support/Billing/Auditor. Tenant A/B, widerrufene Zuordnung, fremde UUID, gleiche Namen, Downgrade, zwei Sitzungen.
4. **Transaktions- und Fehlersemantik:** Keine Doppelrechnung, Doppelzahlung, Doppel-Freigabe oder Duplikatmail nach Retry; Race-Tests; nur echte Zahlungs-/E-Mail-Bestätigung führt zu abschliessenden Zuständen.
5. **Testeffizienz:** Während Entwicklung geführte kleine Tests (`pnpm qa:plan --files`, gezielte `pnpm qa:fast`, Typecheck, Lint, PostgreSQL-/UI-Tests). Vor Integration vollständige erforderliche Quality/Security/Browser-Gates auf dem konkreten finalen SHA. Kein dauerndes komplettes Browser-Replay nach jeder Textanpassung.
6. **Historische Belege:** 76 App-Routen, 13 Operatorvarianten, E01–E10, 45 BP-IDs, alte Reviewfälle und physische Gerätefälle sauber referenzieren. Geplante `expectedCases` = **nicht** bestanden; fehlende Pixelbaselines/echte Geräte = **offen**.
7. **Erforderliches Ergebnis:** konsolidierte Ist-/Soll-/Gap-/Testmatrix, aktualisierte Prozess- und Rollenverträge, Codeänderungen nur für geklärte Geschäftsregeln, QA-Nachweise, offene Entscheide, nachvollziehbare Draft-PRs. Keine einzige pauschale «fertig»-Behauptung.
8. **Freigabegrenze:** Diese Dokument-Zusammenführung erteilt **keine** direkte Berechtigung für produktive Migrationen, reale Bank-/Mailvorgänge, Tarifänderungen, Rechteeskalationen oder Azure-Deploy. Merge und Deploy separat. Bei sicherheits- oder geldrelevanter unklarer Business Policy konkret nachfragen und diesen Zweig offen lassen.

## 9. Vollständiges BP-Register: 45 unveränderte IDs aus der Originalmatrix

Der folgende Katalog erfasst alle 45 Original-BP-IDs, vorläufige P0/P1/P2, Codebelege und noch offene D-Entscheidungen. **Er ist eine Implementierungs-/Testliste, kein Nachweis, dass ein Use Case erfolgreich abgenommen wurde.**

| ID | P | Ist (Code-/Konzeptprüfung) | Bereich | Use Case | D-Gate |
|---|---|---|---|---|---|
| BP-001 | P0 | TEIL | Identität | Registrierung, E-Mail/OTP, MFA, Login, Logout, Sessionwechsel | — |
| BP-002 | P0 | TEIL | Identität | Einladung annehmen, abgelaufen, widerrufen, mehrfacher Tenant | — |
| BP-003 | P0 | LÜCKE | Rollen | Individuelles Modulprofil «Nur Zeiterfassung», Assignment Picker, serverseitig | D02 |
| BP-004 | P0 | TEIL | Rollen | Rollen-/Modulwechsel, Rechteentzug, Session/Cache invalidieren | — |
| BP-005 | P0 | TEIL | Rollen | Rollenabhängiger Start, globale Suche, Nav, QuickCreate, direkte URLs | D16 |
| BP-006 | P1 | TEIL | Einstellungen | Persönliches Profil/Sicherheit von Unternehmenskonfiguration getrennt | — |
| BP-007 | P0 | TEIL | Mitarbeiter | Mitarbeiterkonto/Dossier/Lohn- und Auftragsdaten sauber trennen | — |
| BP-008 | P1 | OFFEN | Personal | Eintritt, Austritt, offene Arbeit/Vertretung, Datenaufbewahrung | — |
| BP-009 | P0 | IST/TEIL | Kunden | Firma + Pflichtkontakt, Dublettenprüfung, atomare Erstellung | — |
| BP-010 | P1 | TEIL | Kunden | Kundendossier, Aktiv/Inaktiv, Daten-/Dokumenten-Scopes | — |
| BP-011 | P0 | TEIL | Angebote | Angebot, Nachverhandlung/Revision, PDF, Zustellung, Annahmenachweis | — |
| BP-012 | P0 | IST/TEIL | Aufträge | Einmalige Übernahme angenommenes Angebot → Auftrag | — |
| BP-013 | P0 | OFFEN | Aufträge | Stunden-/Pauschal-/Wartungs-/Meilenstein-/interner Auftrag | D14 |
| BP-014 | P0 | TEIL | Aufträge | Mitarbeiterzuordnung, Budget, Stellvertretung, gültiger Status | — |
| BP-015 | P0 | TEIL | Zeit | Timer offline/Hintergrund, Pausen, Datum, Überlappung | — |
| BP-016 | P0 | IST/TEIL | Zeit | Eigene Zeit erfassen, Draft, bewusst einreichen | — |
| BP-017 | P0 | LÜCKE | Freigabe | Nur submitted durch andere zuständige Person genehmigen | D03 |
| BP-018 | P0 | IST/TEIL | Freigabe | Zurückweisen mit Grund, korrigieren und erneut einreichen | — |
| BP-019 | P0 | OFFEN | Freigabe | Abwesenheit, Fallback, Eskalation ohne Eigenfreigabe | D09 |
| BP-020 | P0 | OFFEN | Zeit | Solo-Owner ohne Fremdfreigabe, keine Mitarbeiter-Ausnahme | D04 |
| BP-021 | P0 | TEIL | Zeit | Interne vs. verrechenbare Stunden, separate Bestätigung | D07 |
| BP-022 | P0 | IST/TEIL | Zeit | Monatsrapport/Scan/Unterschrift/Überlappungsprüfung | — |
| BP-023 | P0 | OFFEN | Zeit | Kontrollierte Korrektur nach Freigabe/Verrechnung | D18 |
| BP-024 | P0 | IST/TEIL | Spesen | Eigene Spesen, Datei, Genehmigung ohne Eigenfreigabe | — |
| BP-025 | P0 | TEIL | Spesen | Mitarbeitererstattung separat von Kundenweiterverrechnung | — |
| BP-026 | P0 | TEIL | Rechnung | Automatischer Vorschlagsstapel, Preis-Snapshot, Faktura-Freigabe | D08/D14 |
| BP-027 | P0 | IST/TEIL | Rechnung | PDF/Schweizer QR, Rechnung ausstellen, Zustellung bestätigen | D05 |
| BP-028 | P0 | TEIL | Rechnung | Teilfaktura, Sammelrechnung, keine Doppelverrechnung | — |
| BP-029 | P0 | IST/TEIL | Zahlung | Manuelle Zahlung, Teilzahlung, Idempotenz, Saldo | — |
| BP-030 | P0 | OFFEN | Zahlung | Bankimport/Abgleich, ungeklärte Zahlung, Überzahlung, Rückbuchung | D11 |
| BP-031 | P1 | IST/TEIL | Mahnung | Restbetrag, manuelle Mahnstufen, History-Duplikate | — |
| BP-032 | P1 | OFFEN | Mahnung | Automatische Vorschläge, Pausengründe, manuelle Freigabe | D06/D12 |
| BP-033 | P2 | OFFEN | Mahnung | Automatischer Versand nur per explizitem Opt-in/Provider | D06 |
| BP-034 | P1 | TEIL | Reklamation | Streitfall, Mahnstopp, Gutschrift/Korrektur/Refund | D15 |
| BP-035 | P1 | OFFEN | Vertrag | Wiederkehrende Rechnung/Intervall/Ende/Kündigung | D14 |
| BP-036 | P1 | TEIL | Personal | Ferien/Krankheit, Aufgabenübergabe, Genehmigung | D13 |
| BP-037 | P1 | TEIL | Kommunikation | Zustellstatus, In-App-Ereignis, Retry/Eskalation, nur verfügbare Kanäle | — |
| BP-038 | P1 | IST/TEIL | Support | Kunden-Ticket ↔ One Admin, interne Notiz, wiederöffnen | — |
| BP-039 | P0 | TEIL | Plattform | Rollengetrennter One Admin, Audit, Sperre, Abonnement | — |
| BP-040 | P1 | TEIL | Tarif | Trial, Planwechsel, read-only, Kündigung, Datenerhalt | D17 |
| BP-041 | P1 | TEIL | Datenschutz | Mandantenexport, Zugriffswiderruf, Aufbewahrung, Löschung | — |
| BP-042 | P0 | TEIL | Zuverlässigkeit | Offline, doppelte Aktionen, verzögerte API, Race, Sessionablauf | — |
| BP-043 | P1 | ABNAHME OFFEN | Mobile | iOS-/Android-PWA, OS-Tastatur, Datei, PDF, Screenreader | — |
| BP-044 | P0 | IST/TEIL | Finanz-KPIs | Rechnungsumsatz, Zahlungseingang, Saldo, Forderung/Bank strikt getrennt | — |
| BP-045 | P1 | OFFEN | Abschluss | Auftrag nur mit bearbeiteten offenen Zeiten/Spesen/Abrechnungen schliessen | — |

## 10. Original-BP-Konzept und V25.2 – vollständige normative Anlagen

Die beiden Anlagen werden im selben Dokument **unverändert als Quelltext** aufgenommen, damit keine materiellen Einzelanforderungen, technische Einschränkungen, 18 Prozessfälle oder Prüfgrenzen beim Zusammenführen verloren gehen. Bei Konflikten entscheidet **Abschnitt 0–8 dieses konsolidierten Masters**, danach gelten die bestätigten Entscheidungen und die expliziten offenen Gates. Die Anlagen sind **nicht** zusätzlich als zwei parallele Aufträge auszuführen.

### Anlage A – Business Process Master Concept V1 (Originaltext)

# BINSO ONE – BUSINESS PROCESS MASTER CONCEPT V1

**Fachkonzept, Rollen-/Einstellungsmodell, End-to-End-Geschäftsprozesse und Code-Gap-Analyse**  
**Stand:** 20.10.2026 · **Zielmarkt:** Schweiz · **Repository:** `oemercam/binso_admin_azure`  
**Geprüfter Main-Stand:** `d2825134deb33cac67a05c6e703b945ff28066e6` · **Offener Foundation-Draft:** PR #297 (`d707edf0e0e6e4231e50059c45af117fb59fcda2`)  
**Status dieses Dokuments:** Fachkonzept mit **bereits bestätigten Entscheidungen**, **begründeten Soll-Vorschlägen**, **offenen Freigaben** und **Code-Nachweisen**. **Noch kein Implementierungs- oder Produktivdeploy-Nachweis.**

## 0. Leseschlüssel und Verbindlichkeit

- **[V] Vereinbart:** Vom Benutzer im bisherigen Konzept ausdrücklich bestätigt (insbesondere «Auftrag» in der Oberfläche, Mitarbeiter mit nur Zeiterfassung, selbstständiger Inhaber ohne Fremdfreigabe, getrennte Rollen/Sichten, kontrollierter Rechnungs-/Mahnprozess).
- **[S] Soll-Vorschlag:** Hier fachlich vollständig definierter Standard, vor einer geschäftsverändernden Implementierung noch abzunehmen.
- **[O] Offen:** Echtes Produkt-/Rechts-/Betriebsentscheidungsfeld; nicht von einem Code-Agenten stillschweigend zu entscheiden.
- **[I] Im Code ersichtlich:** Auf Basis der benannten Quelldatei auf dem referenzierten Main nachvollziehbare Funktion; **nicht** gleichbedeutend mit vollständiger visueller, Geräte- oder produktiver Abnahme.
- **[L] Lücke:** Fehlende Durchgängigkeit, konkrete Inkonsistenz oder nur teilweise implementierter Ablauf. Nicht jeder Vorschlag ist bereits ein nachgewiesener Defekt.

**Prioritäten:** P0 = Datenschutz/Sicherheit/Finanzintegrität/Kernvorgang; P1 = alltäglicher Abschluss und Automatisierung; P2 = Komfort/Skalierung. Implementierte Teilfunktionen nicht neu schreiben. Arbeiten aus PR #297 nicht parallel neu erzeugen. Verbindlicher UX-Owner bleibt `AGENTS.md`, `docs/architecture/ux-current-approval.md` und die freigegebene Microsoft-Referenz. Kein Redesign, keine zweite Foundation, keine Änderung von Erscheinungsbild/Position des blauen Floating-Plus, keine neue Gruppierung in «Mehr», keine verstreuten Einzelaktionsbuttons; Bottom-Navigation in freigegebenem Design und Grundkonzept erhalten.

## 1. Zielbild und Begriffe

**Ziel:** Jede Rolle erledigt ihre Aufgaben vom Login bis zum Abschluss ohne unverständliche Sackgasse. In jeder Fachansicht sind nur autorisierte, relevante Daten sichtbar; der nächste Verantwortliche und nächste Schritt sind eindeutig. Automatik schlägt vor oder führt nur ausdrücklich freigegebene reversible/beherrschte Schritte aus. Finanz-, Rechte- und Historienänderungen sind prüfbar.

- **Auftrag [V]** = einheitlicher sichtbarer Begriff für Kundenauftrag/Arbeitseinsatz, auch grössere Vorhaben; technische `projects`-Pfade/-Tabellen dürfen bestehen. Kein zweites allgemeines Modul «Projekt» eröffnen.
- **Angebot** = vorgeschlagene Konditionen; **angenommenes Angebot** ist eine bestätigte geschäftliche Entscheidung, nicht bloss ein Klick ohne Nachweis.
- **Arbeitszeit** = tatsächlich erfasste Zeit; **abrechenbare Leistung** = vertraglich geschuldete, abrechnungsfähige Leistung. Nicht jede Arbeitsstunde wird fakturiert.
- **Einreichen** = Mitarbeiter übergibt zur Prüfung; **Freigeben** = unabhängige fachliche Entscheidung; **Abrechnungsfreigabe** = Leistung darf in einen Rechnungsentwurf gelangen.
- **Rechnungsentwurf** ≠ ausgestellte/versandte Rechnung; **Zahlung angekündigt** ≠ **Zahlung bestätigt/zugeordnet**; **überfällig** ≠ **Mahnung versandt**.
- **Mitarbeiterdossier** (HR/Vertrag/Lohn) ≠ **Benutzerkonto** (Login/Module/Rechte) ≠ **persönliches Profil** (selbst gepflegte Kontakt-/Darstellungsdaten).
- **Unternehmensrechnung** = Kundenforderung; **Plattformabonnement** = Binso-One-Tarif. Niemals dieselben Billing-Berechtigungen voraussetzen.

## 2. Zentrale Regeln, die für alle Module gelten

### 2.1 Rechte und Datensicht [V/S]

Zulässige Aktion = **aktive Identität + gültige Mandantenzugehörigkeit + maximale Rollenrechte + freigegebene Module/Aktionen + Mandanten-Tarif + Datensatz-/Zuordnungsscope + aktueller Geschäftsstatus + Organisations-Read-only/Sperren**. Individuelle Freigaben schränken die Rolle standardmässig ein; sie dürfen keine Rollenobergrenze erhöhen. Eine Ausnahme/Delegation erfordert einen eigens definierten, befristbaren und auditierten Mechanismus. API und Datenbank-RLS entscheiden, nicht sichtbare Buttons. Fehlende positive Berechtigung führt zu *kein Zugriff*, nicht zu Daten aus alten Caches. Direkte URL, Suche, Exporte, Dateivorschau und API folgen denselben Regeln.

Alle Benutzer behalten notwendige **eigene Konto-, Sicherheits-, Sprach-/Darstellungs- und Supportfunktionen**; diese sind bewusst eng definierte Ausnahmen vom Geschäftsmodulzugriff. Bei einer Rolle «Nur Zeiterfassung» darf die Auftragsauswahl nur minimal erforderliche Zuordnungsdaten laden, **ohne** Vollzugriff auf Kunden-/Auftragslisten zu gewähren. Berechtigungen bei Entzug, Mitarbeiter-Austritt, Planwechsel und Sessionwechsel sofort neu bewerten; bereits laufende Timer sicher behandeln, ohne vertrauliche Daten weiter auszuspielen.

### 2.2 Fachzustände und Kontrolle [S]

Jede Mutation prüft vor dem Schreiben **Actor, Vorzustand, fachliche Vorbedingungen, Betrag/Referenz/Datumswert, Version, Idempotenz-Key**, dokumentiert den Übergang mit Actor/Zeitpunkt/Grund und löst eine deduplizierte Benachrichtigung beziehungsweise Folgeaufgabe aus. Fremd-Mandant-ID, fremder Mitarbeiter, widerrufene Zuordnung, stornierter Auftrag, bereits abgerechnete Leistung und veralteter Datenstand werden serverseitig zurückgewiesen. Vorgänge mit unsicherer externer Zustellung erhalten den Status **unbestätigt**, niemals automatisch **erfolgreich**.

### 2.3 Geld, Zeit und Historie [S]

CHF-Genauigkeit mit dezimalen Werten und expliziter Währung; kein Addieren unterschiedlicher Währungen; Zeitzone für Geschäftstage Europe/Zurich; Steuersatz und Zahlungskonditionen pro Dokument als Snapshot; vertragliche Konditionen bleiben erhalten. Freigegebene oder verrechnete Daten nicht still überschreiben: Korrektur/Ersatz/Gutschrift mit Verknüpfung, Historie und separater Freigabe. Alle externen Versandvorgänge müssen wiederholbar **ohne Duplikate** sein. Keine unberechtigten Nebeneffekte durch erneutes Laden, Doppeltippen oder Retry.

### 2.4 Benachrichtigung [S]

Geschäftsevent ⇒ geeigneter Empfänger (User/Gruppe/Vertretung), In-App-Eintrag, bei tatsächlich eingerichtetem Provider optional E-Mail, eskalieren nach Frist. Kanal-Einstellung darf keine vorhandene technische Funktion vortäuschen: der aktuelle Push-Pfad weist aktivierende Push-Präferenzen ab. Kanalfehler dürfen Geschäftsstatus nicht als erfolgreich darstellen.

## 3. Rollen, Module und Einstiege

### 3.1 Unternehmensrollen [V/S]

| Rolle | Startseite: wichtigste Aufgabe | Erlaubter Datenbereich | Grundsätzlich keine automatische Berechtigung |
|---|---|---|---|
| Inhaber (`owner`) | Geschäftszahlen, Aufgaben, offene Forderungen, Freigaben, Ausnahmen | Mandant nach Tarif | Fremde Mandanten/Operatorbereich |
| Administrator (`admin`) | Team, organisatorische Vorgänge, Freigaben, Unternehmenszustand | Mandant, innerhalb delegierter Sonderrechte | Eigentümerwechsel/Vertrags-Sonderaktionen ohne separate Freigabe |
| Finanzen (`finance`) | Rechnungen, Zahlungen, überfällige Forderungen, Abrechnungsstapel | Erforderliche Kunden-/Finanzdaten | Lohn/HR und Zeit-/Spesengenehmigung nur wegen Finanzrolle |
| Personal (`hr`) | Mitarbeitende, Abwesenheiten, Personalaufgaben | Vertraulicher HR-Scope | Kundenrechnungen, Cash, vollständige Auftragsfinanzen |
| Auftragsleitung (`project_manager`, `manager` als Legacy-Alias) | Zugewiesene Aufträge, offene Freigaben, Termine/Budgets | Eigene Zuordnungen und eigene Zeit/Spesen | Fremde Aufträge, Bank/Accounting, Mitarbeiterlohn |
| Mitarbeiter (`member`) | Eigene zu erledigende Arbeit, Zeit, ggf. freigegebene weitere Module | Eigene Einträge und minimal benötigte Zuordnungsdaten | Unternehmensfinanzen, fremde Zeiten, Freigaben für eigene Arbeit |
| Lesen (`reader`) | Zulässige Informationen, keine Fachmutationen | Nur expliziter Read-Scope | Geschäftsdaten schreiben; eigene Support-Anfrage als separate Ausnahme prüfen |

**Plattformrollen getrennt:** `platform_owner`, `platform_admin`, `platform_support`, `platform_billing`, `platform_auditor`. One Admin darf seine Aufgaben (Mandantenstatus, Support, Abo, Audit, Sperren) erfüllen, sieht aber nie per Default interne Kunden-Geschäftsdaten. Betreiberzugriff ist kein automatischer Tenant-Owner-Zugriff.

### 3.2 «Nur Zeiterfassung» [V] – konkretes Sollprofil

- Benutzerrolle `member`, Profil `time_only`, freigegeben nur `time:read_own`, `time:create_own`, `time:edit_own_draft`, `time:submit_own`, `time:view_own_history` plus eigene Konto-/Sicherheitsfunktionen und Support.
- **Keine** generellen `customers:read`, `projects:read`, `expenses:*`, `documents:*`, `invoices:*`, `reports:*` nur als Voraussetzung der Zeit-Auswahl erteilen. Stattdessen eigener auf Zuordnungen begrenzter **Assignment Picker** (ID, Kurzlabel, ggf. Kunde, Aktivität, Gültigkeit); keine Preise/Umsätze/Kontaktdetails.
- Nach Login Dashboard «Meine Arbeitszeit» mit Timer, heutigen Stunden, offenen Entwürfen, eingereichten/abgelehnten Einträgen, Monatsrapport und erlaubten Status. Keine Finanz-KPIs oder fremde Vorgänge.
- Schnellaktionen ausschliesslich für die erlaubten Erfassungen. Persönliche Einstellungen und eigene Support-Anfrage über bestehenden Zugang erreichbar.
- Einzureichende Stunden wechseln in Warteschlange des zuständigen fremden Freigebers, nicht zur eigenen Genehmigung. Status und Rückweisungsgrund bleiben für Mitarbeiter sichtbar.
- Eine ausschliesslich auf Zeit eingeschränkte Rolle ist im aktuellen `tenantGrants.member` **noch nicht vollständig modelliert**; die allgemeine Mitgliedsrolle besitzt zusätzliche Modulrechte. UI-Ausblenden allein genügt nicht.

### 3.3 Modulare Unterrechte [S]

Für jedes Modul fachliche Operationen unterscheiden: `view_scope`, `create_own`, `edit_own_draft`, `submit_own`, `view_assigned`, `edit_assigned`, `approve_other`, `manage`, `export`, `read_files`, `settings_read`, `settings_manage`. **Nicht jede Aktion existiert in jedem Modul.** Die feineren Rechte müssen zentral und serverseitig geprüft werden; keine zweite parallele Permission-Foundation. Rollen-/Modulvorlagen sind vom Inhaber/autorisiertem Admin konfigurierbar innerhalb tariflicher und rollenrechtlicher Obergrenzen. Änderungen gelten nach erneutem Capability-Check; sensible Rechte entziehen oder erteilen mit Audit/Bestätigung.

### 3.4 Persönliche und betriebliche Einstellungen

| Einstellungsgegenstand | Lesen | Ändern/Freigeben | Grenzen |
|---|---|---|---|
| Eigener Avatar, Telefon, Anzeigepräferenz, Sprache, Theme | Selbst | Selbst | Kein Ändern fremder HR-/Vertragsdaten |
| Eigener Name | Selbst | Selbst mit Organisationsrichtlinie | Personaldossier/Vertragsname unabhängig |
| Login-E-Mail, Passwort, MFA, Sitzungen | Selbst | Selbst nach gesicherter Bestätigung | E-Mail-Wechsel nur nach erneuter Verifikation; privilegierte MFA-Pflicht |
| Persönliche Benachrichtigungen | Selbst | Selbst | Nur technisch verfügbare Kanäle |
| Firmendaten, Logo, UID, Adresse | Owner/Admin, fachlich Notwendiges für andere | Owner/Admin | Änderungs-/Dokumentenwirkung beachten |
| IBAN/QR-IBAN, Steuer-/Dokumentvorgaben, Nummernkreise | Owner/Finanzen/berechtigter Admin | Owner bzw. ausdrücklich Berechtigte | Kritische Zahlungsdatenänderung bestätigen und auditieren; alte PDF-Snapshots unverändert |
| Zeit-, Spesen-, Freigaberegeln | Owner/Admin, betroffene Funktionsverantwortliche lesend | Owner/Admin/delegierte Richtlinienverwaltung | Keine rückwirkende Veränderung von freigegebenen Einträgen |
| Benutzer, Rollen, Module, Zuordnungen | Owner/Admin; HR nur zuständigkeitsbezogene Sicht | Owner/Admin; Delegation beschränkt | Kein Self-Elevation, keine Entfernung des letzten Inhabers |
| Mitarbeiterdossier, AHV/Bank, Lohn | Betroffene Person eingeschränkt, HR, berechtigte Unternehmensleitung | HR/berechtigte Leitung | Projektleitung sieht nur Einsatzdaten |
| Abonnement/Plan | Owner, ggf. Admin/Finanzen lesend | Owner oder expliziter Vertragsverantwortlicher | Fachliche Rechnungsrolle ≠ Plattform-Abonnementverwaltung |
| Audit/Sicherheitsregeln/Datenschutz | Berechtigte Unternehmensleitung, betroffener Benutzer eigene Daten | Definierte Leitung; Audit nie frei änderbar | Gesetzliche Aufbewahrung/DSG gesondert prüfen |
| Eigene Support-Anfrage | Alle aktiven Nutzer | Erstellen/Antworten im eigenen Scope | Kein Zugriff auf andere Support-Tickets oder interne Notizen |

**Konfigurations-Hierarchie:** System-Sicherheitsgrenzen > Tarif > Unternehmen/Workflowrichtlinie > Rollenobergrenze > persönliche Modulfreigabe > konkrete Zuordnung > Datensatz-/Statusbedingung. Ein Benutzerschalter darf keine externe Providerfunktion aktivieren, die technisch nicht eingerichtet ist.

### 3.5 Dashboard/Navigation [V/S]

Vorhandene AppShell, SettingsNavigation, ActionRow, Module/Katalog und berechtigungsgesteuerte QuickCreate wiederverwenden. Es bleibt **eine** Dashboard-Implementierung mit rollenabhängigen Datenblöcken. «Aufträge» konsequent sichtbar, `projects` intern zulässig. Kein neuer Produktbereich «Projekte».

**Zu lösender UX-/Rechte-Konflikt:** Die mobile Bottom-Navigation enthält aktuell ein direktes Finanzziel. Für Zeit-only darf es weder einen unzulässigen Finanzlink noch eine irreführende «Kein Zugriff»-Sackgasse geben. **Freigegebenes Bottom-Navigationsdesign und blauer Plus bleiben unverändert.** Rechteabhängige Navigation ist fachlich erforderlich; falls die bestehende Fünf-Ziele-Geometrie dafür strukturell verändert werden müsste, vor dieser konkreten Änderung visuelle Freigabe einholen. Keinen neuen Nav-Stil oder Ersatz-Plus-Button erfinden.

## 4. Zuständigkeit und Freigabegrundsätze

1. Pro Auftrag existieren **verantwortliche Auftragsleitung** und optional Stellvertretung; die Zuordnung ist zeitlich gültig. Abwesenheit oder Entzug führt zu einer neuen verantwortlichen Bearbeitungsinstanz, nicht zu verlorenen Aufgaben.
2. Keine Person genehmigt ihre **eigenen** Zeiten/Spesen; für **allein tätigen Inhaber ohne weitere genehmigende Person** gilt die **vereinbarte Ausnahme**, eigene Leistungen ohne separate Fremdfreigabe zur Abrechnung freizugeben. Das ist **kein allgemeines Recht zur Selbstfreigabe durch Mitarbeiter**.
3. **Mitarbeiterunternehmen:** Zeitfreigabe standardmässig aktiviert. Abweichende unternehmensweite Policy nur mit ausdrücklicher Eigentümerentscheidung, begründeter Konfiguration und Audit; keine stillschweigende Selbstfreigabe.
4. Freigaben nur für tatsächlich **eingereichte** abrechenbare Einträge; unzureichende/unklare Auftragszuordnung verhindert das Einreichen. Interne, nicht verrechenbare Arbeitszeit ist grundsätzlich Teil des persönlichen Arbeitszeitkontos und folgt einer **gesondert zu definierenden** Bestätigungspolitik; sie darf nicht in die Kundenabrechnung geraten.
5. Genehmigung prüft Authentizität, Vollständigkeit, Zuständigkeit, tatsächliche Leistung und Vertragsbezug; Abrechnungsreife ist ein davon getrenntes fachliches Prädikat.
6. Bei Urlaub/Krankheit/gesperrtem Konto: Stellvertretung, andernfalls Inhaber/berechtigter Admin; ein blockierter Fall muss sichtbar, mit Zuständigkeitsangabe und Eskalation erscheinen.
7. Ein Ergebnis wird erst als «gesendet», «bezahlt», «erstattet» markiert, wenn der reale Vorgang bestätigt ist; «vorbereitet»/«unbestätigt» bleiben getrennt.

## 5. Fachliche End-to-End-Use-Cases

Jeder Use Case erhält **Auslöser – Actor – Voraussetzungen – Schritte – Zustandswechsel – Folgerolle – Benachrichtigung – Negativ-/Ausnahmefälle – Audit – Abnahmetest**. Die folgende Ausarbeitung ist für Kernfälle verbindlicher Vorschlag; weitere Fälle im Register §6.

### UC-01: Anmeldung, Einladung und rollenbezogener Einstieg [P0]

**Auslöser:** Inhaber lädt Mitarbeiter ein. **Actor:** Inhaber/Admin für Einladung; Mitarbeiter für Annahme. **Voraussetzungen:** aktiver Tenant, freie Benutzerlizenz, erlaubte Rolle, gültige Einladung und verifizierte Identität. **Ablauf:** Rolle + ggf. modulreduzierendes Profil + Auftragzuordnung vorbereiten → Einladung senden/Versandstatus protokollieren → Benutzer nimmt an und richtet Konto-/Sicherheitsdaten ein → Server ermittelt effektive Capabilities → Dashboard/Navigation auf Aufgaben reduzieren. **Status:** invited → active, expired/revoked; bei fehlender Mitarbeiterzuordnung «Einrichtung erforderlich», niemals freier Fremdauftrag. **Fehler:** abgelaufener Link, gleiche E-Mail in anderem Tenant, Versand unbestätigt, Lizenzgrenze, MFA, Planwechsel, entzogenes Recht. **Audit:** Einladender, Rolle, Modulprofil, Gültigkeit, Aktivierung. **Test:** Zeit-only sieht keine anderen Module, deren API und Dateien sind gesperrt; Profil und Support bleiben erreichbar.

### UC-02: Kunde und Angebot zur Auftragsübernahme [P0]

**Auslöser:** berechtigte Person legt Kunden an. **Actor:** Owner/Admin/Finanzen für Kundenerstellung nach bestehender Regel; Angebot entsprechend Verkaufsrecht; Auftragsanlage bisher Owner/Admin. **Voraussetzungen:** Firmenname + strukturierter Pflichtkontakt bei Firmen, Dublettencheck, Mandant, Stundensatz-/Preis-/MWST-/Währungskontext. **Ablauf:** Kunde+Kontakt atomar → Angebot mit Version/Snapshot → ausgestelltes Angebot sicher versenden → Kundenentscheidung nachweisbar erfassen → einmalige Übernahme in Auftrag, vertragliche Konditionen behalten. **Status:** Angebot draft/sent/accepted/declined/expired/revised; Auftrag in zulässiger aktiver Phase. **Fehler:** veraltetes Angebot, Annahme nach Gültigkeit, mehrfacher Klick, nachverhandelte Positionen, unbekannte Kontaktperson, falscher Tenant, Auftragslimit, fehlende Erstellerberechtigung. **Audit:** Annahmeart, Actor, Zeitpunkt, externe Belegreferenz; Änderungsrevision ohne Ursprung zu überschreiben. **Test:** identische Angebots-ID kann nur einen verknüpften Auftrag erzeugen; spätere Preis-Defaults ändern keinen bestehenden Vertrag.

### UC-03: Auftragsart, Budget und Zuständigkeiten [P0]

**Auslöser:** Auftrag aus Angebot oder direkt. **Actor:** berechtigte Unternehmensleitung; Auftragsleitung im zugewiesenen Scope bearbeitet nur zulässige Felder. **Pflichtdaten:** Auftragstyp `time_material`, `fixed_price`, `recurring`, `milestone`, `internal` (fachliche Enum-Bezeichnungen, **nicht** zwingend neue Datenbankenum). Dazu Kunde (wenn extern), interne verantwortliche Person, Abrechnungsregel, Währung, Konditionen, Budget/Fälligkeit soweit relevant. **Ablauf:** Konditionensnapshot und Zuordnungen festlegen → Mitarbeitereinsätze aktivieren → Budgetabweichung prüfen → Auftragsabschluss nach offener Zeiterfassung/Spesen/Abrechnung/Tickets. **Sonderfälle:** interne Arbeit ohne Kunde, Kunde gesperrt, Budget überschritten, Auftrag pausiert, aktive Timer, wiederkehrende Kündigung. **Test:** Festpreisstunden nie nochmals als Stundenposition verrechnen; abgebrochener Auftrag darf nicht ungesehen weiter fakturiert werden.

### UC-04: Zeit-only – Timer, manuelle Zeit und Einreichen [P0]

**Auslöser:** Mitarbeiter beginnt Arbeit. **Actor:** autorisierter und gültig zugeordneter Mitarbeiter. **Schritte:** Startseite Zeiterfassung → nur Assignment Picker für gültige Kunden-/Auftragsoptionen → Start/Pause/Stop oder manuelle Zeit → interne/verrechenbare Zuordnung → Plausibilisierung (Zeit, Überlappung, Datum, aktiver Auftrag) → zunächst Entwurf → bewusstes «Zur Freigabe einreichen» → Benachrichtigung an Zuständigen. **Sichtstatus:** draft → submitted; Fehler bei erneuter Übertragung idempotent behandeln. **Sonderfälle:** Browser offline, Timer läuft während Bildschirmwechsel, Assignment wird widerrufen, Schicht über Mitternacht, gleicher Eintrag doppelt, Entwurf bei Sessionende, Nullzeit, fehlender Freigeber. **Soll:** Keine Änderung fremder Zeiten, keine Preise und kein Zugriff auf Finanzmodule. **Test:** SQL/API/UI-Rollentest, physisches Smartphone für Hintergrundtimer/Keyboard.

### UC-05: Fremdfreigabe von Stunden, Rückweisung und Vertretung [P0]

**Auslöser:** eingereichter abrechenbarer Eintrag. **Actor:** gültige Auftragsleitung/Vertretung, ansonsten unabhängiger Owner/Admin. **Ablauf:** Warteschlange zeigt nur tatsächlich zugewiesene Einträge → prüfen → genehmigen oder mit Pflichtbegründung zurückweisen. **Status:** submitted → approved **oder** rejected/returned → Mitarbeiter korrigiert → draft → submitted. **Wichtig:** Kein Approve aus draft, kein Selbst-Approve für Mitarbeiter, keine Genehmigung bei widerrufener Zuordnung, keine Freigabe bereits verrechneter Zeit. **Bei Abwesenheit:** Stellvertretung oder Eskalation; falls keine gültige Person vorhanden, sichtbarer Blocker. **Test:** `approve` gegen nicht eingereichten Eintrag wird serverseitig abgelehnt – aktuell [L] für Normalzeiten prüfen/korrigieren, Monatsrapport ist enger geschützt.

### UC-06: Einzelfirma ohne Personal [V/P0]

**Actor:** alleiniger Inhaber; keine fremden Mitarbeiter. **Ablauf:** Eigene Stunden erfassen → durch explizit vereinbarte Owner-Solo-Ausnahme unmittelbar als abrechnungsreif behandeln, sofern Kunde/Auftrag/Preis gültig; keine fiktive Genehmigung durch dieselbe Person. **Grenze:** Ausnahme entfällt, sobald fachlich fremde Mitarbeiterzeiten betroffen sind. **Test:** Einzelinhaber kann eigenen abrechenbaren Eintrag fakturieren; Mitarbeiter kann nicht durch Solo-Ausnahme Selbstfreigaben erzwingen; Wechsel von Solo zu Unternehmen verändert historische genehmigte Einträge nicht.

### UC-07: Interne Zeit, Monatsrapport und Korrekturen [P0]

**Ablauf:** Nicht verrechenbare Stunden (Weiterbildung, Administration, Reise ohne vertragliche Fakturierung) werden fürs interne Arbeitszeitkonto erfasst, nie automatisch Rechnungsposition. Monatsrapport mit Dokument-/Unterschriftsnachweis nutzt getrennte Pflichtprüfung und darf mit Einzelzeiten im selben kundenspezifischen Zeitraum nicht doppelt zählen. **Korrektur:** Draft selbst editierbar, submitted nur nach definierter Rücknahme/Rückweisung, approved nur mit kontrolliertem Korrekturdatensatz und Freigabe, billed nur nach sauberer Rechnungs-/Gutschrift-/Leistungskorrektur. **Offene Entscheidung:** Soll interne Zeit ebenfalls separat genehmigt werden? Empfohlen: ja, für personalrelevante Arbeitszeitkonten; aber unabhängig von Kundenabrechnung. **Test:** keine Überschneidung, genehmigte/abrechnete Historie revisionssicher.

### UC-08: Abrechnungsstapel aus Zeit, Material und Spesen [P0]

**Auslöser:** bestätigte abrechnungsreife Leistungen. **Actor:** System bereitet vor, Finanzen/Owner/berechtigter Admin prüft. **Ablauf:** Leistungen filtern nach Kunde/Auftrag/Periode, Vertragsart und Status → Zeit, Material, zulässige Spesen und schon verrechnete Positionen trennen → Kundenkonditionen/Steuer/Währung aus vertraglichen Snapshots anwenden → **Entwurf** mit Herkunftsreferenzen, niemals sofortiges Senden → Vorschau/PDF/QR validieren → freigeben/ausstellen/senden. **Sonderfälle:** Pauschalpreis, bereits fakturierte Einträge, Teilabrechnung, Projektbudget, übernommene Spesen/Quittungen, unterschiedliche MWST, Währung, Rechnungsdatum nach Monatsabschluss, parallele Benutzer. **Test:** kein Doppelfakturieren auch bei zeitgleichem Aufruf, kein impliziter Preis `0` wegen Mitarbeitersicht.

### UC-09: Rechnung und Versandfreigabe [P0]

**Actor:** Finanzen/Owner/berechtigter Admin. **Status:** draft → issued/sent (fachlich unterscheiden: «ausgestellt», «Versand bestätigt») → open/partial/paid/overdue/cancelled/credited nach Zahlungs-/Zeitlogik. **Regeln:** Eine ausgestellte Rechnung behält Positions-/Absender-/Empfänger-/QR-/Währungs-/MWST-Snapshot; Druck/PDF im Kontextmenü. Bestätigter E-Mail-Versand mit Idempotenz; fehlender Mailprovider/status=unknown darf nicht «versandt» vortäuschen. **Sonderfall:** aufeinanderfolgende Rechnungskorrekturen, ungültige QR-IBAN, unbekannter Kundenkontakt, Reverse Charge/steuerbefreit nach zu prüfender Schweizer Konfiguration. **Test:** Kundendokument von Angebot/Auftrag ohne Überschreiben; erneuter Versand nicht doppelt.

### UC-10: Zahlungen, Differenzen, Rückerstattungen [P0]

**Actor:** Finanzrolle oder explizite verantwortliche Freigabe; System nur bei bestätigtem Bankimport. **Ablauf:** Bank-/manuelle Zahlung → eindeutige Rechnungszuordnung per Referenz, ID, Währung, Betrag → bei eindeutiger Übereinstimmung buchen; ansonsten **ungeklärt**, keine fiktive Bezahltmeldung. **Status:** offen → teilbezahlt → bezahlt, oder weiterhin überfällig; mögliche Überzahlung/Gutschrift/Rückbuchung gesondert behandeln. **Sonderfälle:** mehrere Teilzahlungen, Doppelimport, Rundungsdifferenzen, falscher Kunde, mehrere Rechnungen, Zahlung nach Gutschrift, Rückzahlung. **Test:** Saldoformel stimmt in API, Kundendossier, Dashboard, Diagramm und PDF; keine doppelte Zahlung. **Hinweis:** Manuelle Zahlungsverbuchung ist im Code, ein produktiver automatischer Bankabgleich ist nicht als durchgehend abgenommen belegt.

### UC-11: Mahnungen, Ausnahmen, Eskalation [P0/P1]

**Auslöser:** Rechnung überfällig und Restbetrag > 0. **Standard [V]:** System erkennt und bereitet Mahnvorschlag vor; **Versand erst nach Bestätigung durch berechtigte Person**. **Eskalation:** Zahlungserinnerung → 1. Mahnung → 2. Mahnung nach verbindlich konfigurierten Mindestabständen; bestehende Standardfristen 10 Tage als Ausgangswert, **kein automatischer gesetzlicher Anspruch aus dieser Zahl**. Vor jedem Versand aktuellen Saldo, bestätigte Zahlungen, Gutschriften, Zustellstatus, Mahnhistorie und **Pause-Gründe** prüfen (`disputed`, `payment_pending`, `promise_to_pay`, `manual_hold`, `refund_pending`, `legal_review`). **Bei bestrittenen Forderungen:** pausieren, Fall der Finanzrolle zuweisen. **Bei fehlgeschlagener Zustellung:** unverifiziert/fehlgeschlagen, keine nächste Eskalationsstufe ohne geklärte Historie. Keine automatische Inkassoübergabe, Gebühren, Verzugszinsen oder Betreibung ohne gesondertes rechtliches/fachliches Konzept und ausdrückliches Opt-in. **Test:** Teilzahlung ändert Restforderung; vollständig bezahlt stoppt; tägliche Job-Wiederholung erzeugt keinen zweiten Vorschlag/Versand.

### UC-12: Spesen und zwei voneinander unabhängige Geldflüsse [P0]

**Actor:** Mitarbeiter erfasst eigene Spese+Beleg; unabhängige freigabeberechtigte Person genehmigt; Finanzen wickelt Erstattung ab. **Trennung:** (1) interne **Mitarbeitererstattung** (geprüft/ausbezahlt) und (2) **Kundenweiterverrechnung** (vertraglich verrechenbar/auf Rechnung). Beide Prozesse haben andere Status und können unabhängig voneinander abgeschlossen werden. **Fehler:** Eigenfreigabe, fehlender/infizierter Scan, doppelte Quittung, Fremdzuordnung, Erstattung zurückgebucht, Kundenrechnung bereits ausgestellt. **Test:** eine erstattete Spese wird nicht ohne Vertrag nochmal dem Kunden berechnet; eine kundenverrechnete Spese wird nicht fälschlich als erstattet markiert.

### UC-13: Abwesenheit, Stellvertretung und Mitarbeiteraustritt [P1]

**Ablauf:** Mitarbeiter meldet Ferien/Abwesenheit, HR/Vorgesetzter gemäss Firmenregel genehmigt; Freigabewarteschlangen werden bei tatsächlicher Abwesenheit umgeleitet. Bei Austritt: Zugang und aktive Sessions sperren, Timer/Entwürfe und nicht freigegebene Zeit kontrolliert abschliessen, offene Freigaben/Aufträge auf neue zuständige Personen übertragen, Mitarbeiter-/Lohnhistorie entsprechend Aufbewahrung erhalten. **Sonderfälle:** Eintritt mitten im Monat, Austritt während offener Spesen, Widerruf einer Kundenzuordnung, HR-Abwesenheit. **Test:** nach Entzug keine API-/Dateisicht; keine verwaisten Genehmigungen; kein unzulässiges Löschen historischer Abrechnungsnachweise.

### UC-14: Reklamation, Storno, Gutschrift und Vertragsänderung [P1]

**Ablauf:** Kunde bestreitet Leistung/Teilbetrag → Rechnung beziehungsweise Mahnprozess angehalten, Fallverantwortlicher zugewiesen, Verlauf dokumentiert → Prüfung → Zahlungstermin anpassen, korrigierte Rechnung oder Gutschrift/Rückerstattung nach zulässiger Dokumentlogik → Zahlungssaldo neu berechnen, Audit. **Nicht:** bereits versandte PDFs oder akzeptierte Angebote unbemerkt überschreiben. **Test:** keine Mahnung während Streitfall; Teilgutschrift reduziert Forderung überall korrekt.

### UC-15: Wiederkehrende Leistungen und Vertragsverwaltung [P1]

**Ablauf:** Vertrag mit Intervall, Beginn/Ende, Kündigungsfrist, Preis- und Steuer-Snapshot → Fälligkeit erzeugt einmalig einen **Rechnungsentwurf** oder Auftrag, nicht unbeaufsichtigt einen Zahlungsanspruch → berechtigte Prüfung und Versand. Wiederholungen, Pause, Tarifänderung, Kündigung, Feiertage, Monatsende und Zahlungsfehler müssen definiert sein. **Test:** genau ein Entwurf pro Abrechnungsperiode, Preisänderungen wirken erst in der vorgesehenen nächsten Periode und ändern keine historischen Rechnungen.

### UC-16: Support über Kunden-App und One Admin [P1]

**Ablauf:** berechtigter Kundenbenutzer erstellt eigenes Ticket mit klarer Nummer → Platform Support sieht zuständige Queue, interne Notiz bleibt intern, Kundenantwort bleibt im Kundenscope, Statuswechsel sind explizit, Wiedereöffnung nur per erlaubter Aktion → Abschluss mit nachvollziehbarem Ergebnis. **Fehler:** eigener Firmenkontext wechselt, Ticket geschlossen, Nachricht doppelt, Dateiansicht/Scan gesperrt, iPhone-Tastatur. **Test:** Kundenbenutzer sieht nie Operator-Interne Notiz oder andere Tenant-Tickets.

### UC-17: Tarif, Read-only, gescheiterte Provideraktionen [P1]

**Ablauf:** Testphase, Tarifwechsel, unbezahltes Plattformabonnement, read-only und Kündigung. Noch offene Forderungen/Geschäftsdokumente bleiben entsprechend zulässiger Aufbewahrung zugänglich; neue fachliche Schreibaktionen können gesperrt sein, eigene Sicherheit/Support/Zahlungsabwicklung der Plattform soweit ausdrücklich vorgesehen. **Fehler:** abgelehnter Checkout, doppelter Stripe-Webhook, Kapazitätsgrenze, Tarif-Downgrade, Statusinkonsistenz. **Test:** keine unberechtigte Reaktivierung/Überschreitung; Freigaberegeln und Datenhistorie bleiben konsistent.

### UC-18: Datenexport, Aufbewahrung und One Admin Governance [P1]

**Ablauf:** berechtigte Anfrage auf Datenauskunft/Export/Löschung; PII und Rechnungshistorie nur mit Mandanten- und Rollenrecht; gesetzliche Aufbewahrung getrennt von Konto-Sperre/Datenschutz-Einwilligung behandeln. Plattformadministratoren erhalten kein pauschales Geschäftsdatendurchgriffsrecht. Administrative Eingriffe (Sperren, Betreiberrechte, Verträge, Security) erfordern Grund/Audit und bei kritischen Overrides ausdrücklich definierte Freigabe. **Test:** Export enthält nur berechtigte Daten, RLS/Dateirechte auch nach Rollenwechsel, Audit bleibt unverändert.

## 6. Vollständiges Use-Case-Register (Umsetzungs- und Abnahmematrix)

**Spalten:** `IST` = Codebeleg, keine vollständige Abnahme; `TEIL` = fachliche/technische Lücke; `OFFEN` = noch kein komplett verifizierter Prozess. Die separate Datei `BINSO_ONE_UseCase_Gap_Matrix_V1.csv` enthält alle 45 Fälle maschinenlesbar, inklusive Zuständigkeit, Implementierungsphase, Codebeleg, offener Entscheidung und negativem Akzeptanzfall.

| ID | Bereich | Pflicht-Use-Case | Status | Priorität |
|---|---|---|---|---|
| BP-001 | Identität | Registrierung, E-Mail/OTP, MFA, Login, Logout, Sessionwechsel | TEIL | P0 |
| BP-002 | Identität | Einladung annehmen, abgelaufen, widerrufen, mehrfacher Tenant | TEIL | P0 |
| BP-003 | Rollen | Individuelles Modulprofil «Nur Zeiterfassung», Assignment Picker, serverseitig | LÜCKE | P0 |
| BP-004 | Rollen | Rollen-/Modulwechsel, Rechteentzug, Session/Cache invalidieren | TEIL | P0 |
| BP-005 | Rollen | Rollenabhängiger Start, globale Suche, Nav, QuickCreate, direkte URLs | TEIL | P0 |
| BP-006 | Einstellungen | Persönliches Profil/Sicherheit von Unternehmenskonfiguration getrennt | TEIL | P1 |
| BP-007 | Mitarbeiter | Mitarbeiterkonto/Dossier/Lohn- und Auftragsdaten sauber trennen | TEIL | P0 |
| BP-008 | Personal | Eintritt, Austritt, offene Arbeit/Vertretung, Datenaufbewahrung | OFFEN | P1 |
| BP-009 | Kunden | Firma + Pflichtkontakt, Dublettenprüfung, atomare Erstellung | IST/TEIL | P0 |
| BP-010 | Kunden | Kundendossier, Aktiv/Inaktiv, Daten-/Dokumenten-Scopes | TEIL | P1 |
| BP-011 | Angebote | Angebot, Nachverhandlung/Revision, PDF, Zustellung, Annahmenachweis | TEIL | P0 |
| BP-012 | Aufträge | Einmalige Übernahme angenommenes Angebot → Auftrag | IST/TEIL | P0 |
| BP-013 | Aufträge | Stunden-/Pauschal-/Wartungs-/Meilenstein-/interner Auftrag | OFFEN | P0 |
| BP-014 | Aufträge | Mitarbeiterzuordnung, Budget, Stellvertretung, gültiger Status | TEIL | P0 |
| BP-015 | Zeit | Timer offline/Hintergrund, Pausen, Datum, Überlappung | TEIL | P0 |
| BP-016 | Zeit | Eigene Zeit erfassen, Draft, bewusst einreichen | IST/TEIL | P0 |
| BP-017 | Freigabe | Nur submitted durch andere zuständige Person genehmigen | LÜCKE | P0 |
| BP-018 | Freigabe | Zurückweisen mit Grund, korrigieren und erneut einreichen | IST/TEIL | P0 |
| BP-019 | Freigabe | Abwesenheit, Fallback, Eskalation ohne Eigenfreigabe | OFFEN | P0 |
| BP-020 | Zeit | Solo-Owner ohne Fremdfreigabe, keine Mitarbeiter-Ausnahme | OFFEN | P0 |
| BP-021 | Zeit | Interne vs. verrechenbare Stunden, separate Bestätigung | TEIL | P0 |
| BP-022 | Zeit | Monatsrapport/Scan/Unterschrift/Überlappungsprüfung | IST/TEIL | P0 |
| BP-023 | Zeit | Kontrollierte Korrektur nach Freigabe/Verrechnung | OFFEN | P0 |
| BP-024 | Spesen | Eigene Spesen, Datei, Genehmigung ohne Eigenfreigabe | IST/TEIL | P0 |
| BP-025 | Spesen | Mitarbeitererstattung separat von Kundenweiterverrechnung | TEIL | P0 |
| BP-026 | Rechnung | Automatischer Vorschlagsstapel, Preis-Snapshot, Faktura-Freigabe | TEIL | P0 |
| BP-027 | Rechnung | PDF/Schweizer QR, Rechnung ausstellen, Zustellung bestätigen | IST/TEIL | P0 |
| BP-028 | Rechnung | Teilfaktura, Sammelrechnung, keine Doppelverrechnung | TEIL | P0 |
| BP-029 | Zahlung | Manuelle Zahlung, Teilzahlung, Idempotenz, Saldo | IST/TEIL | P0 |
| BP-030 | Zahlung | Bankimport/Abgleich, ungeklärte Zahlung, Überzahlung, Rückbuchung | OFFEN | P0 |
| BP-031 | Mahnung | Restbetrag, manuelle Mahnstufen, History-Duplikate | IST/TEIL | P1 |
| BP-032 | Mahnung | Automatische Vorschläge, Pausengründe, manuelle Freigabe | OFFEN | P1 |
| BP-033 | Mahnung | Automatischer Versand nur per explizitem Opt-in/Provider | OFFEN | P2 |
| BP-034 | Reklamation | Streitfall, Mahnstopp, Gutschrift/Korrektur/Refund | TEIL | P1 |
| BP-035 | Vertrag | Wiederkehrende Rechnung/Intervall/Ende/Kündigung | OFFEN | P1 |
| BP-036 | Personal | Ferien/Krankheit, Aufgabenübergabe, Genehmigung | TEIL | P1 |
| BP-037 | Kommunikation | Zustellstatus, In-App-Ereignis, Retry/Eskalation, nur verfügbare Kanäle | TEIL | P1 |
| BP-038 | Support | Kunden-Ticket ↔ One Admin, interne Notiz, wiederöffnen | IST/TEIL | P1 |
| BP-039 | Plattform | Rollengetrennter One Admin, Audit, Sperre, Abonnement | TEIL | P0 |
| BP-040 | Tarif | Trial, Planwechsel, read-only, Kündigung, Datenerhalt | TEIL | P1 |
| BP-041 | Datenschutz | Mandantenexport, Zugriffswiderruf, Aufbewahrung, Löschung | TEIL | P1 |
| BP-042 | Zuverlässigkeit | Offline, doppelte Aktionen, verzögerte API, Race, Sessionablauf | TEIL | P0 |
| BP-043 | Mobile | iOS-/Android-PWA, OS-Tastatur, Datei, PDF, Screenreader | ABNAHME OFFEN | P1 |
| BP-044 | Finanz-KPIs | Rechnungsumsatz, Zahlungseingang, Saldo, Forderung/Bank strikt getrennt | IST/TEIL | P0 |
| BP-045 | Abschluss | Auftrag nur mit bearbeiteten offenen Zeiten/Spesen/Abrechnungen schliessen | OFFEN | P1 |

## 7. Code-Gap-Bewertung auf dem geprüften Main (nachweisbar vs. Soll)

| G-ID | Quellbereich | Nachweis / Ist | Erweiterung/Entscheidung | Art |
|---|---|---|---|---|
| G01 | `lib/permissions.ts`, `components/team-settings.tsx` | Feste sieben Rollen, `member` hat über Zeit hinaus weitere Module; Einladung setzt vor allem Rolle | Individuelles Module-/Actions-/Scope-Profil mit API/RLS-Vertrag, `time_only` | **Lücke P0** |
| G02 | `components/app-shell.tsx`, `config/create-actions.ts` | `canOpen` vorhanden; mobiler Finanz-Tab direkt verlinkt | Rollen-/Tarif-/Datenscope über alle Navigationen konsistent, ohne UX-Redesign | **Inkonsistenz P0** |
| G03 | `components/pages/time.tsx` | Kunden/Projekte über generelle `/api/customers`, `/api/projects` | Zuweisungsbasierter minimaler Picker, ohne volle Modulrechte | **Lücke P0** |
| G04 | `app/api/time-entries/[id]/route.ts` | Submit/Approve/Reject/Correct; Submit vor Approve bei Normaleinträgen nicht generell erzwungen | Approve nur bei `submitted_at` und durch unabhängige berechtigte Person | **Konkrete Logiklücke P0** |
| G05 | `app/api/time-entries/route.ts`, `app/api/time-tracker/route.ts` | `time_approval_required`, Timer/manuell; Eigentümer-Solo nicht als vollständiger eigener Policy-Fall | Solo-Owner-Ausnahme und interne-Zeit-Bestätigung fachlich zentralisieren | **Teil-/Soll P0** |
| G06 | `lib/server/workforce-access.ts`, `database/migrations/0055_workforce_assignments_and_reports.sql` | Assignment-Scope, RLS, Mitarbeiterbindung vorhanden | Delegation/Stellvertretung/Eskalation für Freigabekette, Entzug testen | **Teil/Soll P0** |
| G07 | `app/api/time-entries/billing/route.ts` | Freigegebene unverrechnete billable Stunden abrufbar | Vertragstyp, Preispriorität, Sammelperioden, Rechnungsfreigabe | **Teil/Soll P0** |
| G08 | `lib/server/repositories/business-api.ts`, `lib/server/document-process.ts` | Dokumentstatus, Snapshots, Idempotenz, PDF/QR/Revisionen teilweise vorhanden | Beleg für externe Angebotsannahme, Abrechnungs-Freigabeworkflow | **Teil/Soll P0** |
| G09 | `app/api/payments/route.ts` | Manuelle Zahlungsverarbeitung/ID-Zuordnung und Idempotenz | Bankimport, ungeklärt/Überzahlung/Chargeback, Providerabnahme | **Teil/Soll P0** |
| G10 | `lib/payment-reminder.ts`, `app/api/documents/[number]/send/route.ts` | Drei manuelle Mahnstufen, aktuelle Salden-/Fristenprüfung; kein Scheduler | Deduplizierte Vorschläge, Streitfall-/Zahlungs-Pause, getrennte Versandautorisierung | **Teil/Soll P1** |
| G11 | `lib/server/database.ts`, `app/api/expenses/*` | Spesenfreigabe, Fremdprüfung, Status/Erstattungsfelder | Mitarbeitererstattung und Kundendurchlauf fachlich als zwei separate Ledgers | **Teil/Soll P0** |
| G12 | `components/pages/dashboard.tsx`, `lib/server/repositories/dashboard.ts` | Rollenabhängige Arbeit/Finanzdaten teilweise vorhanden | Task-orientierter `time_only`-/HR-/Freigabe-Einstieg | **Teil/Soll P0** |
| G13 | `components/settings-navigation.tsx`, `components/pages/settings.tsx` | Persönliche/betriebliche Gruppen, verschiedene Bearbeitungsrechte | Individuelles Profil/HR-Trennung, sensible Unternehmensfelder und Freigaben präzisieren | **Teil/Soll P1** |
| G14 | `config/plan-access.ts`, `lib/server/plan-access.ts` | Feature-/Tariflimits, Projektschutz | Modulspezifische Capability-Kaskade mit Einschränkungen und Downgrades | **Teil/Soll P1** |
| G15 | `app/api/settings/notifications/route.ts` | Nur Präferenzen; Push-Aktivierung wird zurückgewiesen | Tatsächlich nutzbare Benachrichtigungen und Eskalationsrouting | **Teil/Soll P1** |
| G16 | `components/app-version-notice.tsx` | Sichtbares Versionsbanner möglich | Entsprechend aktueller Freigabe vollständig ohne sichtbares Banner, SW-Sicherheit erhalten | **Bekannte UX-Abweichung P1** |
| G17 | `docs/architecture/app-acceptance.md`, `docs/architecture/app-acceptance-routes.md` | E01–E10 dokumentiert, Geräte-/Mehrrollen-Tests nicht abgeschlossen | E01–E10 und BP-Register als unabhängige Abnahme, keine grünen Teiltests als Endnachweis | **Abnahme offen P0** |
| G18 | PR #297 (Draft) | Aggregator, 768 geplante Fälle/36 Regeln und CSS-Verträge laut PR; nicht in Main | Erst prüfen/qualifizieren/integrieren, nicht erneut neu implementieren | **Bestehender Draft, separat** |

**Wichtig:** Die hier beschriebenen neuen fachlichen Konzepte sind **noch nicht im Code implementiert**. Live-/Geräte-, E-Mail- und Banknachweise wurden für diesen Bericht nicht neu ausgeführt.

## 8. Automations- und Zuständigkeitsvertrag

| Ereignis | Systemreaktion | Zuständige Person | Timer / Eskalation | Nie automatisch |
|---|---|---|---|---|
| Zeit eingereicht | Prüffall erzeugen, deduplizierte Mitteilung | Assignment-Owner oder Stellvertretung | Erinnerung nach betrieblich freigegebenen Fristen | Eigene Mitarbeiterzeit freigeben |
| Zeit zurückgewiesen | Fehlergrund an Mitarbeiter, Neueinreichung ermöglichen | Mitarbeiter | Erinnerung an Korrektur | Verwerfen ohne nachvollziehbaren Nachweis |
| Zeit genehmigt | Abrechnungsbestand aktualisieren | Finanzen | Abrechnungsperiode oder Auftragsschluss | Rechnung ohne definierte Versandfreigabe verschicken |
| Spese eingereicht | Genehmiger bestimmen, Beleg/Scan prüfen | Freigabezuständige Person | Eskalation bei Abwesenheit | Eigene Spese selbst genehmigen |
| Rechnung ausgestellt | Offener Betrag, Frist und Zustellstatus überwachen | Finanzen | Fälligkeit gemäss Rechnung | Unbestätigten E-Mail-Versand als Erfolg markieren |
| Bankzahlung zugeordnet | Saldo/Status atomar aktualisieren | System/Finanzen | Sofort nach bestätigtem Matching | Unklare Zahlung als bezahlt verbuchen |
| Rechnung überfällig | Deduplizierten Mahnvorschlag mit Restbetrag erstellen | Finanzen | Nach kundenspezifischer Frist | Ohne Opt-in Mahnung senden |
| Forderung bestritten/ungeklärt | Mahnsperre, Support-/Finanzfall erstellen | Finanzen/Owner | Nachverfolgung | Betreibung/Inkasso/Gebühren ohne eigene Freigabe |
| Benutzer verlässt Firma | Sessions/Zuordnungen invalidieren, Arbeit übergeben | Admin/HR/Owner | Sofort | Historische Zeit-/Rechnungsdaten löschen |
| Abo wird read-only | Neue Geschäfts-Schreibvorgänge blockieren; berechtigte Einsicht erhalten | Owner/Platform Billing | Nach Abo-Policy | Fremde Mandanten entsperren |

**Betriebssicherheit:** Künftige Timer/Jobs idempotent und mandantensicher, eindeutiger fachlicher Schlüssel pro Ausführung, Datenbank-Transaktionsgrenzen und echtes Versand-Outbox-/Confirmation-Modell. Vorsicht bei asynchroner Zustellung, Zahlungsabgleich und genau-einmal-Effekten. Anbieterabhängige Aktionen erst aktivieren, wenn technisch nachweislich konfiguriert.

## 9. Fachliche Entscheidungen – vor Umsetzung überprüfen

| D-ID | Frage | Vorgeschlagener Default | Entscheidung |
|---|---|---|---|
| D01 | Sichtbarer Begriff Auftrag/Projekt | **Auftrag**, technische `projects` behalten | **[V] bestätigt** |
| D02 | Nur-Zeit-Mitarbeiter | Benutzer mit rein zeitbezogenem Modulprofil und minimalem Assignment-Picker | **[V] Ziel bestätigt**, technische Ausgestaltung [S] |
| D03 | Unabhängige Mitarbeiterfreigabe | Ja, standardmässig; Selbstfreigabe verboten | **[V] Grundsatz**, Policydetails [S] |
| D04 | Alleiniger Inhaber | Eigene Zeiten direkt abrechnungsreif, keine Fremdfreigabe | **[V] bestätigt** |
| D05 | Rechnungsversand | Automatisch vorbereiten, manuell freigeben | **[S] empfohlen**, im bisherigen Dialog als Standard befürwortet |
| D06 | Mahnungen | Automatischer Vorschlag, manueller Versand als Start; Auto nur explizites Opt-in | **[S] empfohlen**, im bisherigen Dialog als Standard befürwortet |
| D07 | Interne Zeit | Arbeitszeitbestätigung unabhängig von Kundenabrechnung | **[O] HR/Arbeitszeitpolicy freigeben** |
| D08 | Stundensatz-Priorität | Annahme-/Vertragssnapshot > vereinbarter Auftragsansatz > Kundenkondition > Firmenstandard; kein stiller Nullansatz | **[O] fachliche Freigabe** |
| D09 | Zuständiger Freigeber | Auftragsleitung → Stellvertretung → unabhängiger Owner/Admin | **[O] Fristen und Delegationsrechte** |
| D10 | Projektleiter neu erfassen | Bestehende Owner/Admin-Grenze behalten, Delegation nur explizit | **[O] Delegation bei Bedarf** |
| D11 | Interne Zahlungs-/Bankmethoden | Manuelle Zahlungen sofort; Bankimport nur nach Providerintegration/Abnahme | **[O] Provider/Umfang** |
| D12 | Mahnfristen/Respite | Vertrags-/Kundenvorgabe vor Firmenstandard; Reminder-Abstand 10 Tage nur Startwert | **[O] Rechts-/Betriebsprüfung** |
| D13 | Abwesenheitsfreigabe | HR/zugewiesene Leitung, nicht automatisch bei allen Rollen | **[O] Zuständigkeitsmatrix** |
| D14 | Vertragstypen und Sammelfaktura | Stunden, Festpreis, Wartung, Meilenstein, intern; Rechnung pro Auftrag oder pro Kunde/Periode | **[O] Produktumfang** |
| D15 | Rechnungsstreit | Mahnsperre, verantwortliche Person und nachvollziehbarer Ausgang | **[S] zur Freigabe** |
| D16 | Mobile Nav bei Zeit-only | Berechtigte Ziele ohne irreführende Sackgasse; Design/Plus unverändert | **[O] konkrete Slot-Geometrie, falls nötig** |
| D17 | Read-only und personenbezogene Daten | Persönliche Sicherheit, Support und zulässiges Lesen weiterhin möglich | **[S] zu bestätigen** |
| D18 | Freigabekontrollen/Approval-Limits | Schreib-, Prüf-, Zahlung- und Exportrechte getrennt, ggf. Vier-Augen-Prinzip für sensible Änderungen | **[O] Schwellenwerte** |

**Keine verdeckte Entscheidung:** Solange eine mit [O] markierte Frage nicht bestätigt ist, darf Codex nur sichere, reversibel konfigurierbare Grundlagen umsetzen oder die konkrete Geschäftsregel als blockiert dokumentieren. Fachliche Entscheidungen, die Geld, DSG, Lohn oder externe Kommunikation betreffen, **nicht** eigenmächtig treffen.

## 10. Implementierungsreihenfolge ohne doppelte Arbeit

### Phase 0 – Konsolidierung (kein neues Redesign)

- Aktuellen GitHub-Stand und PR #297 qualifizieren und gegen die V25.2-Spezifikation abgleichen. Keine parallele Compliance-Foundation; Foundation-/Testfixe übernehmen, wenn freigegeben.
- Ist-/Soll-/Owner-/Rollen-/Testmatrix aus §6/§7 als lebendes Register ablegen; jede Änderung mit Pfad/SHA nachweisen.
- Kritische offene fachliche Entscheidungen §9 per Zustimmung fixieren; keine impliziten Migrations-/Deploy-Freigaben.

### Phase 1 – Berechtigungsmodell und Zeit-only [P0]

- Effektive Capabilities zentral berechnen und serverseitig erzwingen, inklusive Benutzer-Modulprofil und fein begrenztem Assignment Picker.
- Team-UI zum Einladen/Ändern von Modulprofilen und Zuständigkeiten auf vorhandene Sheets erweitern; keine neue Designkomponente.
- Dashboard, globaler QuickCreate, Einstellungen, Suche und Navigation im tatsächlich zulässigen Scope ausrichten.
- Tests: owner/admin/finance/hr/project_manager/member/reader, two tenants, identische Namen, direkte APIs, Entzug während Session, read-only, Tarifwechsel.

### Phase 2 – Freigabekette und Zeitkonsistenz [P0]

- Normalzeit-Approve nur nach Einreichen; unabhängige Freigabe mit Audit. Solo-Inhaber-Ausnahme exakt definieren.
- Stellvertretung/Eskalation, Rückweisung/Neueinreichen, interne vs. verrechenbare Bestätigung, Monatsrapport und Korrekturzustände.
- Keine Neuanlage von parallel benannten Tabellen/Workflows ohne nachgewiesenen Bedarf.

### Phase 3 – Auftrag → abrechenbare Positionen → Rechnung [P0]

- Auftragstyp und Vertrags-Snapshot; Zeit/Material/Spesen nach Berechenbarkeit; Prüf-/Versandfreigabe und Doppelabrechnungsschutz.
- Authentische Angebotsannahme und verantwortliche Auftragsanlage ohne Änderung bereits bestätigter Preise.

### Phase 4 – Zahlung/Mahnwesen/Kommunikation [P0/P1]

- Vorhandene Zahlungserfassung/Saldo-/Gutschriftlogik erhalten; ungeklärte Zahlungsereignisse, Rückbuchung und Bankintegrationsvertrag ergänzen.
- Mahnvorschläge und Hold-Status sicher implementieren; manueller Freigabestandard. Kein automatischer Versand, bevor Provider und Opt-in real geprüft wurden.
- Benachrichtigungs- und Escalation-Routing nur über tatsächlich verfügbare Kanäle, ohne fiktive Erfolgsnachrichten.

### Phase 5 – übrige Prozesse und vollständige Abnahme [P1/P2]

- Mitarbeiteraustritt/Abwesenheit, wiederkehrende Verträge, Rechts-/Datenschutz-/Supportfälle.
- E01–E10 und BP-001…BP-045 als tatsächliche Mehrrollen-End-to-End-Fälle; reale iOS-/Android-PWA und Screenreader getrennt, keine Emulation als physischer Test.

## 11. Abnahmekriterien (nicht durch grünen Build zu ersetzen)

1. **Time-only:** Nutzer sieht nach Anmeldung ausschliesslich eigene Zeitfunktionen plus eigene Kontoverwaltung/Support; Kunden-/Auftragsauswahl minimal; Finanz-/Kunden-/HR-/API-/Download-Scopes wirksam gesperrt.
2. **Freigabekette:** Draft kann nicht direkt genehmigt werden; submitted kann durch zuständige andere Person genehmigt werden; eigene Mitarbeiterzeit wird nie selbst genehmigt; Vertretung und Solo-Inhaber-Sonderfall verifiziert.
3. **Geldkette:** Nur freigegebene abrechenbare Leistungen → Entwurf → geprüft/ausgestellt → bestätigter Versand → Teilzahlung/bezahlt/überfällig → Mahnvorschlag, mit korrekter Quelle, Währung, Saldo und Audit.
4. **Finanzintegrität:** Kein Doppelabrechnen, keine Überzahlung, kein doppelter E-Mail-Versand; Gutschrift und Rückerstattung reduzieren den passenden Saldo.
5. **Sonderfälle:** Personenaustritt, Auftrag abgeschlossen, Streitfall, Übertragungsfehler, offline/Sessionwechsel, Abwesenheit, negative Fremdrollen- und Tenanttests; keine still verlorenen Entwürfe.
6. **UX:** Zugewiesene Rolle erkennt Aufgaben und nächste Handlung; die freigegebene Bottom-Navigation und der blaue Floating-Plus bleiben gestalterisch unverändert; «Mehr» einfache Liste; globale Kontexte und Empty States bleiben kompakt.
7. **Qualifikation:** relevante Code-/API-/RLS-/PostgreSQL-/Quality-/CodeQL-/Browser-Nachweise am konkreten Commit. Kein finaler Pass bei fehlender Baseline/Geräte-/Testabdeckung; `compliant=false` ist keine Abnahme.
8. **Betriebsfreigabe:** Keine produktive DB-Migration, Automatik mit echtem Geld-/Kundenkontakt, Merge oder Azure-Deploy ohne ausdrückliche Freigabe.

## 12. Referenzen (Quellen am angegebenen Main-SHA)

- Verbindliche Produktregeln: `AGENTS.md`, `docs/architecture/ux-current-approval.md`, `docs/architecture/v25-requirements.md`, `docs/architecture/v25-1-requirements.md`.
- Bisherige Prozess-/Abnahmebasis: `docs/architecture/role-business-flow-consistency.md`, `docs/architecture/app-acceptance.md` (E01–E10), `docs/architecture/app-acceptance-routes.md`.
- Rollen/Module/Navigation: `lib/permissions.ts`, `config/plan-access.ts`, `components/app-shell.tsx`, `components/settings-navigation.tsx`, `components/team-settings.tsx`, `components/pages/dashboard.tsx`, `components/pages/time.tsx`.
- Zeit/RLS: `app/api/time-entries/route.ts`, `app/api/time-entries/[id]/route.ts`, `app/api/time-entries/billing/route.ts`, `lib/server/workforce-access.ts`, `lib/server/repositories/time-workspace.ts`, `database/migrations/0055_workforce_assignments_and_reports.sql`.
- Angebote/Rechnungen/Zahlung/Mahnung: `lib/server/document-process.ts`, `lib/server/repositories/business-api.ts`, `app/api/payments/route.ts`, `lib/payment-reminder.ts`, `app/api/documents/[number]/send/route.ts`, `config/domain.ts`.
- Spesen/Profil/Kommunikation/Operator: `lib/server/database.ts`, `app/api/expenses/route.ts`, `app/api/settings/notifications/route.ts`, `lib/server/operator/rbac.ts`, `lib/operator-pages.ts`.
- Foundation-Arbeiten offen: [PR #297](https://github.com/oemercam/binso_admin_azure/pull/297) – nicht als integriert behandeln.
- Bereits vorbereiteter Implementierungsauftrag: `BINSO_ONE_V25_2_Foundation_Rollen_Prozess_Implementation.md` (separater bisheriger Artefaktstand; vor Umsetzung mit diesem Konzept abgleichen).

---

**Fachliche Abschlussdefinition:** «Abgenommen» bedeutet, dass die Rollen und tatsächlichen Benutzerwege inklusive Ausnahmefällen in geeigneter Testumgebung und auf den vorgeschriebenen Geräten/mit den nötigen Berechtigungen nachgewiesen sind. **Die Erstellung dieses Master Concepts ist eine Konzeptleistung, keine Implementierung oder Produktabnahme.**

### Anlage B – V25.2 Foundation, Rollen, Navigation & Business Flow Implementation (Originaltext)

# BINSO ONE – V25.2 CONSOLIDATED FOUNDATION, ROLE, NAVIGATION & BUSINESS FLOW IMPLEMENTATION

**Repository:** `oemercam/binso_admin_azure`  
**Auftragsart:** Verbindlicher, tatsächlich umzusetzender Implementierungsauftrag (kein reiner Analyse-/Planungsauftrag).  
**Stand der Zusammenstellung:** 20.10.2026  
**Ausgangsbasis beim Erstellen:** `main` = `d2825134deb33cac67a05c6e703b945ff28066e6`; offener Draft-PR **#297** „Fix foundation acceptance coverage and consolidate CSS ownership“, Head `d707edf0e0e6e4231e50059c45af117fb59fcda2`. **Diese SHAs sind Referenzen, keine Anweisung, gegen einen veralteten Stand zu arbeiten. Vor Arbeitsbeginn erneut live prüfen.**

## 0. Ziel, Priorität und Grenzen

Führe die bereits vorliegende **technische Foundation-Analyse** und den **fachlichen Rollen-, Navigations-, Inhalts- und Prozess-Audit** zu einer konkreten, durchgängigen Umsetzung zusammen. Entscheidend ist nicht nur, dass jede Seite schön aussieht oder kompiliert, sondern dass jede Benutzerrolle nach der Anmeldung intuitiv ihre zulässigen Aufgaben erledigen kann, ohne fremde Daten, unberechtigte Aktionen oder fachlich irreführende Zahlen zu sehen.

**Arbeite bis zu einem vollständig dokumentierten, technisch qualifizierten Draft-PR.** Ein Plan allein, oberflächliche Stilkorrekturen oder nachträgliches Grünfärben von Tests erfüllen den Auftrag nicht. Für produktiven Merge/Deploy, riskante Datenbankmigrationen, neue produktive Infrastruktur, echte Mail-/Zahlungsversendungen und Änderungen an produktiven Berechtigungen ist eine **separate ausdrückliche Freigabe** nötig.

**Verbindliche Quellen und Hierarchie:** `AGENTS.md`, `docs/architecture/ux-current-approval.md`, `docs/architecture/reference-foundation.md`, `app/design-system/manifest.json`, aktuell gültige V25-/V25.1-Verträge sowie neueste ausdrücklich freigegebene fachliche Entscheidungen. Historische V21–V24-Dokumente sind nur gültig, soweit ihnen nicht widersprochen wird. Bei Konflikten gilt die neueste explizite Freigabe; Sicherheits- und gesetzliche Anforderungen dürfen nicht abgeschwächt werden. Kläre echte Konflikte mit konkreten Vorher-/Nachher-Beispielen statt stillschweigender Produktentscheidungen.

**Unveränderlich:**
- Bestehende fünfteilige Bottom-Navigation in Gestaltung, Reihenfolge, Position und grundsätzlich freigegebenem Verhalten beibehalten.
- Den bestehenden runden **blauen Floating-Plus-Button** in Gestaltung, Position, Grösse und Funktion beibehalten. Ihn nicht als UX-Fehler problematisieren oder durch andere Bedienelemente ersetzen.
- Das Menü **«Mehr»** bleibt eine **einfache Liste ohne neue Gruppierungen**. Nur belegbare Doppelungen/Fehlzuordnungen korrigieren, ohne notwendige Funktionen zu verlieren.
- Aktueller Microsoft-orientierter klarer Weiss-Blau-Standard bleibt; **kein Glassmorphism, Blur, dekorative Transparenz, Redesign, zweite UX-Foundation oder ungeprüfte neue Schatten**.
- Kein lokales CSS-Überschreiben als Symptombehandlung; vorhandene Komponenten-, CSS- und Daten-Owner weiterverwenden.
- Ein leerer Zustand umfasst maximal **zwei Textzeilen**, bevorzugt eine. Keine grossen Illustrations-/Aktionskarten.
- Kontextaktionen an bestehenden Objekten gehören in `…`, neue Objekte in den bestehenden passenden Erstellungsweg. Keine verstreuten zusätzlichen PDF-, CSV-, Datei- oder Plus-Aktionsbuttons; echte primäre Formularaktionen und Timersteuerung bleiben direkt bedienbar.
- Formulare benötigen dauerhafte Labels, sinnvolle Schweizer Muster-/Formattexte, passende Validierung und klare Fehler. Mustertexte sind keine gespeicherten Daten.
- Bei **Firmenkunden** bleiben Firma sowie Vor- und Nachname der primären Kontaktperson Pflicht; Kunden-Neuerfassung hat zwei klar geführte Schritte, weitere nicht zwingende Angaben optional. Kunde und Kontakt atomar anlegen. Vorhandene Altkunden weiterhin bearbeitbar.
- Die **sichtbare PWA-Update-Meldung darf weder im Web noch auf Mobile erscheinen**, auch nicht in Rechnungsassistenten. Die zugrunde liegende sichere Update-/Service-Worker-Logik darf dadurch nicht verloren gehen; keine automatischen Reloads oder Datenverluste.

## 1. Zuerst Iststand und Überlappungen bestimmen

1. Lies die aktuellen Regeln, `git status`, Branch/HEAD, Main-SHA, offene PRs/Abhängigkeiten und die bestehenden Abnahmeregister. Ermittle, welche Arbeiten bereits in Main sind und welche in PR #297. Berücksichtige auch andere noch offene PRs; keine doppelte Implementierung und keine fremden Branches überschreiben.
2. **PR #297** enthält nach dem bisherigen Bericht bereits: Fix für Review-/Geräteaggregator mit vollständiger erwarteter Fallabdeckung, 36 aktuelle Anforderungen mit 768 geplanten Mindestfällen, Abgleich von Style-Texten mit Bindings, erweiterten Evidence-Digest, Entfernung von acht nachweislich überholten CSS-Deklarationen und Markierung historischer V21-Dokumente. Bestätige tatsächliche Code- und CI-Nachweise. Diese Arbeit nicht neu bauen, sondern auf ihr aufsetzen, ohne den Draft unaufgefordert zu mergen.
3. Erzeuge eine kompakte Gap-Matrix: **Anforderung / aktueller Owner und Datei / tatsächliches Verhalten / fachliches Soll / Rolle / Abweichung / Root Cause / Korrektur / Test / Status**. Kennzeichne pro Punkt ausdrücklich `bereits korrekt`, `bereits in PR #297`, `zu ändern`, `fachlich entscheidungsbedürftig` oder `nur physisch nachweisbar`.
4. Nutze die bestehenden Inventare und Generatoren. Prüfgegenstand sind **alle tatsächlich vorhandenen Seiten, Unterseiten, Modalzustände, Rollen und Operator-Varianten**, nicht bloss die 76 historisch gezählten Routen; erfinde keine zusätzliche Inventar-Foundation.
5. Verwende synthetische Testtenants A/B mit identischen Namen, negativen Rollen-/Mandantenfällen, langen Labels, grossen/negativen Beträgen und typischen Fehlzuständen. Keine produktiven Kundendaten für Tests kopieren.

## 2. Rollenmodell und Berechtigungssemantik fachlich prüfen

Vergleiche die zentralen Definitionen in `lib/permissions.ts`, `config/plan-access.ts`, `lib/server/rbac.ts`, `lib/server/plan-access.ts`, `lib/server/workforce-access.ts`, `lib/server/session.ts`, `lib/server/operator/rbac.ts`, den entsprechenden API-Routen und den PostgreSQL-RLS-Policies mit sämtlichen UI-Verwendungen (`components/app-shell.tsx`, `components/binso-ux.tsx`, `components/pages/*`, `components/settings-navigation.tsx` usw.). **Rechte nicht allein wegen UX-Wünschen erweitern.**

**Verbindlich zu unterscheidende Rollen:**
- `owner` (Inhaber): Unternehmen, Rechnungen, Forderungen, Personal, Team, Freigaben und zulässige Vertrags-/Tarifverwaltung.
- `admin`: operative Verwaltung, fachliche Unternehmensfunktionen und Freigaben; Vertrags-/Abonnement-Sonderrechte separat prüfen.
- `finance`: Rechnungen, Zahlungen, Finanzen, Ausgaben, zugehörige Kundenstammdaten und Berichte; keine HR-/Fremdzeitfreigabe allein aufgrund des Finanzrechts.
- `hr`: Personal, Beschäftigung, Abwesenheiten und berechtigte Personalprozesse; keine Rechnungs-/Zahlungskennzahlen.
- `project_manager` / Alt-Alias `manager`: **nur zugewiesene Kunden, Aufträge und Prozesse**, eigene und zulässige fremde Freigaben, keine volle Buchhaltung.
- `member`: eigene Zeiten, eigene Spesen, zugewiesene Arbeit, keine unternehmensweiten Finance-/HR-Daten.
- `reader`: nur ausdrücklich berechtigte lesbare Daten, keine geschäftlichen Mutationen; die bisher gewollte Ausnahme für eigene Support-Anfragen eindeutig dokumentieren und gegen API prüfen.
- One Admin separat: `platform_owner`, `platform_admin`, `platform_support`, `platform_billing`, `platform_auditor`. Kein Kundenrollen-Zugriff auf Operatorfunktionen, keine unnötigen Operatorrechte und keine fremden Tenantdaten.

Für jede Rolle erstelle eine konkrete Rollenmatrix mit **Seitenlesen / Datenumfang / Erstellen / Bearbeiten / Statuswechsel / Freigeben / Löschen / Export / Datei-PDF / Einstellung ändern**. Unterscheide Rollenzugriff, Mandantenzugriff, Zuweisung, Tarif und Datensatzstatus. Prüfe auch `read_only`, Demo, abgelaufene Sitzung, verlorene Zuweisung und direkte URLs/API-Abfragen. Bei Ablehnung dürfen weder Daten noch personenbezogene Metadaten aus früheren Sessions, fremden Tenants oder unberechtigten Projekten angezeigt werden.

**Konkrete bereits beobachtete Prüfstellen:**
- `components/app-shell.tsx` rendert mobilen Navigationspunkt **«Finanzen»** direkt mit `href="/finanzen"`, während andere Ziele über `canOpen` geprüft werden. `routePermission('/finanzen')` kann Rollen ohne Finance-Overview abweisen. **Verifiziere den Widerspruch im tatsächlichen Rendering.** Ändere nicht eigenmächtig die freigegebene Bottom-Navigation. Löse die Rollen-/Zugriffsfrage innerhalb ihres gültigen Vertrags oder dokumentiere einen konkreten erforderlichen Produktentscheid, bevor Ziel/Verhalten geändert wird. Keine unberechtigten Finanzdaten oder nutzlosen Sackgassen.
- Allgemeine `customers:write`/`projects:write`-Grants versus `tenantCanCreateAt()`: Projektleitung kann Bestände bearbeiten, aber neue Kunden/Aufträge nicht direkt erstellen. Prüfe, dass UI/Erklärung/QuickCreate/API exakt diese bewusst getrennte Regel widerspiegeln; lege einen Änderungsvorschlag vor, **falls** fachlich ein Widerspruch entsteht, statt still zu erweitern.
- `support:write` ist für bekannte Tenantrollen allgemein gewährt; prüfe bewusst, ob `reader` eigene Support-Tickets erstellen und antworten darf. Support-Ausnahme darf kein allgemeines Schreibrecht eröffnen.
- Mit `organization:read` erlaubte persönliche Einstellungen dürfen auch ohne `organization:write` **persönlich** geändert werden; unternehmensweite Konfiguration ausschliesslich mit den jeweiligen Schreibrechten. Prüfe Anzeigen, Formularfelder, Speichern, API und Fehlerzustände.
- Dokumente/Finanzteilansichten bei Rollen mit `sales:read`, `invoices:read`, `documents:read` und `finance-overview:read` dürfen nicht versehentlich Cash, Bank, Margen oder fremde Rechnungen offenlegen.
- `ownRecordOnly`, RLS `app_workforce_access` und Rollen mit breit lesenden Rechten separat gegen tatsächliche Kunden-/Projekt-/Dateizugriffe prüfen. Mitglied sieht keine fremden Zeiten/Spesen; Projektleitung nur gültige Zuordnungen.
- One Admin: Betreiber-Dashboard, Mandantendossier, Supporttickets, interne Notizen, Abonnement, Audit und Sperrungen entsprechend Operatorrolle trennen; korrektes serverseitiges Maskieren und Audit nachweisen.

**Testmatrix:** Positive und negative Testidentitäten aller Rollen, zwei Tenants, identische Kunden-/Projektbezeichnungen, fremde IDs, API-GET/POST/PATCH/DELETE, Deep Links, Sessionwechsel, Planwechsel, Read-only und Widerruf einer Zuordnung. Rechteerwartungen unabhängig definieren; Tests dürfen nicht nur denselben `tenantCan`-Aufruf als Oracle verwenden.

## 3. Navigation, «Mehr», Konto und Einstellungen auf sinnvolle Abläufe prüfen

Ziel: Jeder Benutzer erkennt ohne Suchen, was er tun darf, und gelangt nach einem abgeschlossenen Vorgang zu einer sinnvollen Folgeseite. **Kein Redesign der Navigation.**

1. Vergleiche Desktop-Seitenleiste, mobile Bottom-Navigation, Menü «Mehr», globale Suche, Konto-/Profilmenü, Benachrichtigungen, Detail-Tabs, ActionRows und QuickCreate auf denselben Berechtigungs-/Planvertrag. `ActionRow` besitzt bereits `access.canOpen`; diesen zentralen Schutz beibehalten und fehlende Pfade analog konsistent machen.
2. Auf Hauptseiten stehen Aufgaben und relevante Kennzahlen der Rolle im Vordergrund; Unterseiten behalten Datensatzidentität, Bearbeitung, Kontext, Rückweg und Such-/Filterzustand.
3. «Persönliche Daten», «Sicherheit», «Benachrichtigungen», «Darstellung», «Sprache» sind persönliche Einstellungen. «Firma», «Team/Rollen», «Abo» sowie «Dokument-/Zeiterfassungsregeln» sind organisatorische Einstellungen. Getrennte Schreibrechte prüfen, aber mehrere sinnvolle Einstiege auf dieselbe zentrale Implementierung führen lassen.
4. `settingsGroups` ist die einzige Katalogquelle für Ziele. Entferne belegbare fachliche Doppelimplementierungen, nicht sinnvolle zusätzliche Links. Menü «Mehr» bleibt ohne neue Gruppen.
5. Rücknavigation soll Suchtext, Filter, Listenposition, ausgewählten Kunden und sichere Entwürfe passend bewahren. Keine kaputten `/neu`-Weiterleitungen, verlorenen Formulareingaben oder irreführenden Abbruchbestätigungen.
6. Prüfe Tarif-/Modulkataloge aus `lib/modules.ts` und `config/plan-access.ts` auf **reale erreichbare Funktionen**: „verfügbar“, „teilweise implementiert“, „intern“ und „nicht verfügbar“ müssen sich in UI und Tarifversprechen decken. Keine nicht vorhandenen Lohn-/Bank-/Buchhaltungsfunktionen als voll verfügbar ausgeben.
7. Keine überflüssigen Aktionsbuttons. `PDF anzeigen/herunterladen`, `CSV exportieren`, `Anhang hinzufügen`, Bearbeiten/Duplizieren/Löschen gehören in die bereits vorgesehenen kontextbezogenen `…`-Menüs. Systemgenerierte Dokumente und Uploads deutlich unterscheiden.

## 4. Rollenbezogene Startseiten – fachlicher Inhalt vor dekorativer Darstellung

Prüfe `components/pages/dashboard.tsx`, `/api/dashboard`, `lib/server/repositories/dashboard.ts` und abhängige Statistik-/Finanzdaten. Kein neues Dashboard-Design erfinden; zentrale bestehende KPI/ListRow/Chart-Owner nutzen.

- Inhaber/Admin: unternehmensweite Finanzen **soweit berechtigt**, Forderungen, tatsächlich offene Freigaben und wichtige Geschäftsvorgänge.
- Finanzen: Rechnungen, Zahlungseingänge, fällige und überfällige Forderungen, zu prüfende finanzielle Vorgänge. Keine Personal-/Gehaltsdaten.
- Projektleitung: eigene/zugewiesene Aufträge, Stunden, berechtigte Freigaben, offene Arbeit und nächsten Handlungsschritt.
- Mitarbeiter: eigener Timer, eigene Zeiten/Spesen und zugewiesene Aufgaben/Aufträge. Keine Rechnungsbestände oder Adminlisten.
- HR: Personal- und Abwesenheitsaufgaben und berechtigte organisatorische Aufgaben; keine irreführend leeren Finanzbereiche.
- Leser: berechtigte Übersicht ohne Schreibaktionen, ohne erfundene Daten und ohne nicht autorisierte Gesamtbestände.

Kacheln/Listen nur anzeigen, wenn die Berechtigung und die Datenlage belegt sind. Teil- und Bestandswerte sauber kennzeichnen. Handlungsbedarf muss einen eindeutigen Vorgang und sinnvollen Zielkontext öffnen. Priorität und Sortierung anhand realer Fälligkeit/Dringlichkeit bestimmen. Keine unkontrollierten zusätzlichen Demo-Fälle in Produktivdaten.

## 5. Fachlich zusammenhängende Geschäftsprozesse E01–E10

Prüfe und korrigiere End-to-End in bestehenden Komponenten und API-/Datenbank-Ownern. Die vollständigen Abläufe sind keine Summe voneinander unabhängiger Teiltests. Positive, negative, abgebrochene und wiederholte Versuche berücksichtigen.

**E01 Registrierung/Einladung:** Landingpage → Registrierung → Firmen-/Kontaktpflichten → E-Mail-Verifikation → Login/MFA → erster sinnvoller Einstieg → Logout und sichere Wiederkehr. Rollen, Trial/Read-only, Fehlermeldungen und Einladung korrekt. Echte E-Mails/SSO nur mit eigener Testfreigabe.

**E02 Kunden/Angebot/Auftrag:** Zwei-Schritt-Kunde mit atomarem Pflichtkontakt und eindeutiger Dublettenprüfung → Kunden-360°-Dossier → Angebot mit Kunden-/Firmen-Defaults → PDF-Vorschau → versendet/angenommen/abgelehnt/abgelaufen → zulässige Übernahme in Auftrag/Projekt. Kundenkontext und vereinbarte Konditionen/Snapshots bleiben erhalten. Doppelte Übernahme und unzulässige Projekt-/Kundenerstellung verhindern.

**E03 Aufträge/Zeit/Freigabe:** Verantwortliche weisen Mitarbeiter zu → Mitarbeiter sieht nur die gültige Auswahl → Timer Start/Pause/Stop und manuelle Zeit → eigene Tages-/Monatsübersicht → Einreichen → unabhängige Freigabe/Rückweisung. Nach Widerruf keine neuen unzulässigen Einträge; laufende Zeit nicht verlieren. Timer auf Mobile vor Zuordnungsfeldern; zugängliche primäre Steuerung erhalten.

**E04 Monatsrapport:** Monatsrapport (inkl. 198-Stunden-Fall) → Datei/Scan → Einreichen → Rückweisung/Korrektur → unabhängige Freigabe. Keine Überlappung zu Einzelzeiten; invaliden Monat und fehlenden Nachweis korrekt ablehnen.

**E05 Fakturierung/Zahlung:** Freigegebene Zeiten und Spesen → Rechnung mit Schweizer QR-Zahlteil, MWST, gespeicherten Begleittexten → PDF-Vorschau/Versand → Teilzahlung, Restforderung, vollständig bezahlt, überfällig, Mahnung → Gutschrift und Rückerstattung. Verhindere Überzahlung, Replay und doppelte Fakturierung. Keine Verwechslung von Zahlungssaldo mit Gewinn/Bankkontostand.

**E06 Spesen:** Eigene Spese samt Beleg → Einreichen → unabhängige Genehmigung/Ablehnung → Erstattung → zulässige Weiterverrechnung. Keine Eigenfreigabe; archivierte/erstattete Positionen nicht unzulässig editierbar.

**E07 Support Zwei-App:** Kundenanfrage → One-Admin-Antwort und interne Notiz → Kundenansicht ohne interne Notiz → Status/Abschluss → explizite Wiederöffnung → weitere Antwort. Reply-Replay, Anhänge, Rollen, Tastatur/Chat-Viewport prüfen.

**E08 One Admin:** Plattformlogin/Entra → Tenant suchen → Dossier mit erlaubten Tabs → Support/Billing/Audit/Sperraktion mit atomarem Audit → Rückkehr mit Kontext. Betreiber-Support und Billing dürfen nicht mehr Informationen erhalten als ihre Rolle gestattet.

**E09 Persönliche/organisatorische Einstellungen:** Konto- und Unternehmenseinstellungen öffnen, lesen und je nach Rolle bearbeiten, speichern, abbrechen, Fehler behandeln, zurück navigieren, Sitzung wechseln. Kein duplizierter Datenowner; UI und API sind gleich restriktiv.

**E10 App/PWA-Lebenszyklus:** Kunden-App und One Admin getrennt installieren/anmelden, Start/Background/Resume/Deep Link/Datei/PDF/Logout/Update; keine fremden Session-Caches. Echte physische Nachweise bleiben OFFEN, bis durchgeführt.

## 6. Verbindliche konkrete UX-/Datenkonsistenzprüfungen

Über alle Routen und Unterseiten hinweg die bereits zentralen Owner verwenden:

- **Formulare:** sichtbare Labels, passende Mustertexte (Firma `Muster AG`, Vorname `Max`, Nachname `Muster`, `+41…`, schweizerische PLZ/CHF/IBAN/Datum), klare Pflichtkennzeichnung, Inline-Validierung, eindeutige Defaults und Rückfragen nur bei echten Änderungen.
- **Dateien/PDF:** einheitliche Datei-/Anhangsowner; keine sekundären Plus-Buttons, keine separate PDF- oder CSV-Aktion ausserhalb der Menüs. Upload in Formularen als echtes Formulareingabeelement erlaubt. Quarantäne, Scan-Fehler, Berechtigungen und Dateirückkehr prüfen.
- **Empty States:** maximal zwei Zeilen ohne grosse Karte/Illustration und ohne zusätzliche Aktion.
- **FormSheet/Bottom Sheet:** kurze Menüs inhaltsabhängig, lange Assistenten gescrollt mit erreichbar bleibenden primären Aktionen; iPhone-Safe-Area/Statusleisten-Overlay konsistent, Fokus und Keyboard beachten; keine doppelte Titelzeile.
- **Finanzen und Berichte:** Jahres-/Monatswerte versus offene Bestände, Einzahlungen/Ausgaben/Erstattungen/Gutschriften, mehrere Währungen und fehlende Daten korrekt kennzeichnen. Diagramm und Drilldown müssen dieselbe Datenbasis verwenden, grosse Ringbeträge lesbar ausserhalb des Zentrums anzeigen, wo erforderlich.
- **Kunden-Dossier:** Übersicht mit echten erlaubten Angeboten, Aufträgen, Rechnungen, Zahlungen, Kontakten und Aktivitäten. Vollständige Stammdaten bleiben zugänglich. Keine «keine Rechnungen»-Meldung, wenn das Recht fehlt.
- **Zeit/Chat:** laufender Timer persistent; Chat-Eingabe über echter Tastatur, Nachrichten scrollen unabhängig und interne Kommentare nie beim Kunden.
- **PWA-Update-Meldung:** `components/app-version-notice.tsx` und sämtliche Verwendungen prüfen; die sichtbare Aufforderung «Neue Version verfügbar / Aktualisieren» darf nicht mehr erscheinen. Service-Worker- und Session-Update-Sicherheit sowie Datenschutz unverändert gewährleisten. Keine automatische stille Reload-Aktion, die Entwürfe zerstört.

## 7. Foundation-/CSS-/Compliance-Korrekturen übernehmen, nicht neu erfinden

Der bereits vorhandene Bericht `docs/architecture/foundation-status.md` und PR #297 sind die Basis. Übernimm/prüfe insbesondere:

1. **Abnahme-Aggregator:** Review- und Geräteanforderungen dürfen nur mit allen erwarteten Fallkombinationen und tatsächlichen Freigaben `passed` werden. Negative Tests für fehlende Breiten/Rollen/Themes/Plattformen beibehalten.
2. **36 aktuelle Anforderungen / 768 erwartete Mindestfälle:** Diese sind nur **geplante Fälle**, keine erfolgreichen Tests. Die **392 historischen Fälle** ohne gültige neue Zuordnung bleiben offen, bis einzeln neu zugeordnet oder nachvollziehbar als ersetzt klassifiziert – niemals gelöscht oder pauschal grün.
3. **Style-Text/Token-Synchronisierung:** Natürlichsprachliche Vertragstexte aus verbindlichen Daten ableiten beziehungsweise gegen sie prüfen; keine Rückkehr zu alten Schrift-/Geometriewerten oder v3-Navigationsregeln.
4. **Evidence-Digest:** aktuelle UX-/Domänenkonfiguration einbeziehen; keinen alten Nachweis für veränderte Regeln wiederverwenden.
5. **CSS:** die acht bereits belegbar überholten Deklarationen aus PR #297 nicht erneut bearbeiten. Weitere Kandidaten nur nach Computed-Style-Vergleich pro Owner/Breakpoint/Theme konsolidieren. Keine automatisierte Löschung absichtlicher Varianten oder Fallbacks.
6. **Dokumentation:** einen aktuellen Einstieg, Historie deutlich als historisch; keine generierten Inventare/Hashes von Hand editieren.
7. **Sicherheitsabhängigkeit:** `braces@3.0.3` im Dev-ESLint-Pfad hat das gemeldete High-Advisory `GHSA-vfj7-8cjw-p6xm`; die bisherige Ausnahme läuft am 24.10.2026 00:00 UTC aus. Keine ungeprüfte Next-/ESLint-Aktualisierung, keinen Fantasie-Override und keine pauschale Ausnahmeverlängerung. Erneut Upstream/Registry und kompatible Alternativen prüfen, qualifizierten Fix nur mit Belegen umsetzen. Falls weiterhin kein Fix, als **separaten offenen Security-Blocker** mit Upgrade-/Risikoentscheidung dokumentieren; keine falsche «advisory-free»-Meldung.
8. **Grosse Dateien:** Operator/Dokumente/Settings nur dort entlang konkreter Verantwortungsgrenzen zerlegen, wo echte funktionale Änderungen es rechtfertigen und Regressionstests vorhanden sind. Keine zweite API-/Businesslogik oder Caches.

## 8. Einheitliche Regelquelle für alle Rollen und Seiten – ohne gefährliche Vereinfachung

Prüfe insbesondere `lib/permissions.ts`, `lib/operator-pages.ts`, `lib/page-orientation.ts`, `config/create-actions.ts`, `components/settings-navigation.tsx`, `components/app-shell.tsx`, `/api/dashboard`, `/api/finance/overview`, `lib/server/repositories/customer-workspace.ts`, `lib/server/repositories/project-workspace.ts`, `lib/server/repositories/dashboard.ts`, `lib/server/repositories/business-api.ts`, `lib/server/repositories/reports.ts` und die dazugehörigen RLS-/Migrationstests.

- Eine Navigationsabkürzung ist keine neue Berechtigung; ein ausgeblendetes UI ist kein Ersatz für API-/RLS-Rechte.
- Kein universelles Formular oder Universalmenü, das fachliche Kontextunterschiede versteckt.
- Zustandsrechte einzeln klären, etwa Angebot angenommen, Rechnung teilbezahlt, freigegebene Zeit, erstattete Spese, geschlossenes Ticket.
- Erhaltene IDs und Snapshots statt Namestrings für Zuordnungen verwenden; gleiche Kunden- oder Auftragsnamen dürfen nicht zur falschen Verknüpfung führen.
- Keine pauschalen unautorisierten Nullwerte als echte KPIs. Unbekannte/ausgeblendete Felder als nicht verfügbar statt 0 kennzeichnen.
- Ziele für direkte URLs, globale Suche, Benachrichtigungen, Schnellaktionen, Datei-Downloads und Operator-Deep-Links müssen dieselbe Berechtigungslogik verwenden.

## 9. Teststrategie: schnell in der Entwicklung, vollständig vor Integration

Während der Implementierung: je Korrekturpaket gezielter `pnpm qa:plan --files ...`, relevanter `pnpm qa:fast`, `pnpm typecheck`, Lint und passende Unit-/Integrations-/RLS-Tests. Browser nur für betroffene UI-Flows. Keine acht vollständigen Browserjobs nach jedem Einzelfix.

Vor Integrationsfreigabe: auf dem **resultierenden konkreten HEAD-SHA** die verpflichtenden Quality-, Typecheck-, Build-, PostgreSQL-/HTTP-/RLS-, CodeQL-, Compliance- und vollen relevanten Chromium-/WebKit-Browser-Gates. Die aktuellen historischen Nachweise behalten ihren SHA und dürfen nicht als neue Erfolgsnachweise ausgegeben werden. Playwright/Emulation ersetzt kein echtes iPhone, keine installierte iOS-/Android-PWA und keinen physischen OS-Keyboard-/Screenreader-Nachweis.

Erstelle eine rollenbasierte Abnahmematrix mit Beispielen:
- `member` Login → eigene Zeit/Spesen/zugewiesene Aufträge sichtbar; `/finanzen` zeigt keine unzulässigen Zahlen; fremde URL/API wird verweigert.
- `hr` Login → Personal/Abwesenheiten statt Finance; keine Rechnungs-/Bankinformationen.
- `project_manager` → zugewiesenes Dossier/Projekt, Freigaben anderer Personen; eigene Spese nicht genehmigen; Kundenerstellung nicht unbeabsichtigt offen.
- `finance` → Zahlungen/Rechnungen/Finanzdaten; keine Lohn-/HR-Vertraulichkeit oder Freigaben ohne Rolle.
- `reader` → lesbare berechtigte Daten, keine geschäftlichen Schreiboperationen; Support-Ausnahme ausdrücklich getestet.
- `owner/admin` → zulässige Funktionen, inklusive korrekt unterschiedener Abo-/Billing-Rechte.
- Operator Support/Billing/Auditor → jeweils nur freigegebene Tabs, Felder, Aktionen und API-Antworten.
- Zwei Tenants A/B, gleiche Bezeichnungen, widerrufene Zuordnungen, Accountwechsel, Read-only, Demo, abgelaufene Sitzung, Planwechsel, 1000+ Verzeichniseinträge.

Alle **E01–E10** durchgehend nachweisen, soweit in sicherer isolierter Umgebung ausführbar. Visuelle Vergleichsbilder nur gegen **ausdrücklich freigegebene** Referenzen beurteilen; nie automatisch neue Baselines akzeptieren oder den geltenden UX-Standard zur Erreichung grüner Gates abschwächen. Fehlende physische oder externe Tests bleiben `OFFEN`/`BLOCKIERT`, nicht `BESTANDEN`.

## 10. Implementierungs- und PR-Arbeitsablauf

1. Präzise Bestands-/Gap-Matrix erstellen; nicht in einer endlosen Voll-Repository-Diagnose verbleiben.
2. PR #297 und Main abgleichen; sichere Implementierungsbasis wählen und ihre Abhängigkeit transparent machen. **PR #297 nicht duplizieren.** Vorhandene fremde Branches respektieren.
3. In zusammenhängenden, nachvollziehbaren Korrekturpaketen umsetzen: (A) Rollen-/Navigationskonsistenz; (B) Dashboard-/Funktionsinhalt nach Rollen; (C) E01–E10-Flows und Datenkonsistenz; (D) globale Aktionen/Formulare/Settings; (E) Abnahme-/Security-Restpunkte.
4. Nach jedem Paket gezielte Tests, kurze Root-Cause- und Nachweisdokumentation. Kleine offene Entscheidungen mit einer konkreten Alternative und ihrer Berechtigungswirkung sichtbar machen.
5. Nach Code-Freeze die verpflichtende kombinierte QA auf dem exakten Commit durchführen; bei Fehlern Ursache beheben und betroffene Prüfungen erneut ausführen.
6. Ein Draft-PR mit verständlichem fachlichem Changelog, veränderten Dateien, Rollenmatrix, E01–E10-Status, Test-SHAs, Browser-/Screenshot-Nachweisen und eindeutig getrennten offenen Blockern liefern. Unabhängiges Review ermöglichen.
7. **Kein selbstständiger Merge, kein Azure-Deployment, keine produktive Migration, keine realen Mails/Zahlungen oder produktiven Berechtigungsänderungen ohne separate ausdrückliche Freigabe.** Bereits vorhandene erfolgreiche Deployments nicht als neue Freigabe interpretieren.

### Abnahmekriterien (keine pauschalen Prozentwerte)

- Jede Rolle sieht nur korrekt zugeordnete Daten und Funktionen; UI + API + RLS stimmen, nachgewiesen durch positive und negative Tests.
- Für jede Rolle nach Login klarer, sinnvoller Einstieg und verständlicher nächster Schritt, ohne tote Links oder fachlich verbotene Aktionen.
- Zusammenhängende Geschäftsabläufe E01–E10 im nachweisbaren Umfang durchlaufen; verbleibende Geräte-/Provider-Prüfungen gesondert sichtbar.
- Keine unnötigen Duplicate Owners, kein neues Designsystem, keine veralteten UX-Regeln, keine verschlechterten Daten- oder Sessiongrenzen.
- Das geltende Design, die fünfteilige Bottom-Navigation, der blaue Floating-Plus-Button und die einfache «Mehr»-Liste bleiben unangetastet.
- Compliance-Fälle erhalten nur dann `passed`, wenn **alle erwarteten Einzelprüfungen wirklich erfüllt** sind. 768 geplante Fälle und historische Reviews dürfen nicht als bereits bestanden gelten.
- Aktuelle Quality-, Security- und Browser-Gates bestanden oder explizit als echte Blocker ausgewiesen. Eine grüne CI allein bedeutet keine vollständige UX-Produktabnahme.
- Der finale Bericht erklärt **was tatsächlich verändert wurde, was bewusst nicht verändert wurde, warum und wie es getestet wurde**.

**Jetzt implementieren und bis zum qualifizierten Draft-PR autonom fortfahren. Bei einer echten Änderung der freigegebenen Rollenrechte, Navigation oder dem UX-Freeze zuerst einen konkreten fachlichen Entscheidungspunkt vorlegen; nicht eigenmächtig freigeben.**
