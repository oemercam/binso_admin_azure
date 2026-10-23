# V26 P01 — Modul- und Übergabevertrag v1

Implementierungsbasis `a64582c7`, Feature-Branch `feat/v26-modular-revision3`. Zielquelle [Revision3](v26-source/BINSO_ONE_V26_MODULAR_MASTERKONZEPT.md), Planung [P01–P51](v26-gap-and-packages.md). Nutzerfreigabe22.10.2026: Pakete lokal umsetzen, lokale Commits, keine fortlaufenden Push-/Volltestzyklen. Diese Freigabe ersetzt das bisherige Warten nach jedem Paket, nicht die fachlichen/produktiven Grenzen.

## Owner und Datenverträge

| Aggregat | Vorhandener Owner | V26-Ergänzung / erlaubte Übergabe |
| --- | --- | --- |
| Identity/Membership | `lib/server/session.ts`, Auth-/Team-APIs, `organization_memberships` | Nur eindeutige optionale Referenz `employees.user_id`; kein HR-API-Schreiben in app_users/Sessions. |
| HR-Stamm | `/api/employees`, `lib/server/repositories/business-api.ts`, `employees` | Stamm/Ein-/Austritt/Arbeitsort; sensible Bank-/Versicherungs-/Familien-/Payrollfelder bleiben aus dem allgemeinen DTO ausgeschlossen. |
| Anstellung/Familie | HR-Repository, abhängige Objekte am vorhandenen Mitarbeiter | Gültige Revision liefert fachlich freigegebene Inputs; Mitarbeiter ohne Konto und Konto ohne Mitarbeiter bleiben möglich. |
| Supplier/Vertrag/Ressource | `suppliers`, `contracts`, `workforce_assignments` | Externe Ressource referenziert Lieferant und Einsatz, nicht fingierten Mitarbeiter; Einkauf/Verkauf getrennte Konditionen. |
| Time | `/api/time-entries`, `time-workspace.ts` | Besitzt Zeit/Review und später verbleibende allokierbare Menge; Aufrufer schreiben keine fremden Zeitaggregate direkt. |
| AR/Billable | `/api/documents`, `document-process.ts`, `business-api.ts`, `money.ts` | Anfrage auf autorisierte Restmenge; Snapshot/Zuordnung zur konkreten Rechnungsposition atomar. Keine neue Rechnungsengine. |
| AP/Expenses/Payments | `supplier_invoices`, `/api/expenses`, bestehende Finanz-/Idempotenzowner | Eigenständiger Anspruch/Beleg mit bestätigten Zahlungen; Freigabe ist weder Zahlung noch Bankauftrag. AR-Zahlungen nicht umdeuten. |
| Payroll | `payroll_runs`, vorhandene Mitarbeiter-/Finanzfelder | Validierte Parameter-/Input-/Laufrevision; unvalidiert blockiert. Keine produktive Engine/Zahlung/Meldung durch Vorbereitung freigegeben. |
| Dateien/Report/Mail | bestehende File-Zwecke, `document-pdf.ts`, Report-/Share-/Outboxowner | Fachobjekt autorisiert jeden Bytezugriff; sensibler Payrollzweck separat, Graph202 nicht delivered. |
| Tarif/Navigation | `config/plans.ts`, `config/plan-access.ts`, `lib/permissions.ts`, bestehende V25-Route-/State-Register | Keine zweite Registry; vorhandene Preise/Rechte/Mobile-Navigation/FAB erhalten. Jede neue Seite dort inkrementell zuordnen. |

## Gemeinsamer Übergabevertrag

Versionierte Fachoperationen führen `organizationId` ausschliesslich aus der authentifizierten Session, `actorUserId`, `sourceId`, `sourceRevision`, `idempotencyKey`, fachlichen Zweck und erwarteten Prozesszustand. IDs aus Requests müssen im Sessiontenant aufgelöst werden. Beträge als exakte Dezimalstrings plus Währung; Dauer als ganzzahlige Minuten. Keine Kinderdaten, Tokens, Bankdaten oder Lohndetails im allgemeinen Ereignis-/Logpayload.

Die vorhandenen HTTP-/ApiError-Owner bleiben zuständig:401 bei abgelaufener Sitzung,403 bei fehlendem Recht/Tarif,404 bei nicht sichtbarem Objekt,409 bei Revision/Prozess-/Idempotenzkonflikt,400 bei ungültigem Input;503 bei tatsächlich gestörter Abhängigkeit. Keine API erzeugt durch GET eine Freigabe oder verbraucht ein Einladungstoken.

Kritische Operation: Auth/Entitlement → Tenanttransaktion → Quellrevision sperren → Prozess/Rechte erneut prüfen → eindeutige Allokation/Mutation → Audit und falls nötig Outbox atomar → gespeicherten Status antworten. Bei verlorener Antwort zuerst Status/Idempotenz abgleichen. Kontrollierte Wiederholung nur bei sicher bekanntem Nichtvollzug; unbekannter Versand-/Zahlstatus bleibt unbekannt. Kein universelles neues Jobsystem für noch nicht implementierte Events.

| Spätere Übergabe | Fachlicher Minimalinhalt | Schutz / aktueller Zustand |
| --- | --- | --- |
| `time.approved.v1` | Zeit-ID/Revision, freigegebene Minuten, Arbeits-/Lohn-/Billable-Klassifikation | Freigabe erzeugt keine Rechnung/Payroll. Klassifikation erst P17. |
| `service.allocated.v1` | Quell-ID/Revision, Menge, Rechnungs-ID/Position, Satzsnapshot/Währung | Restmenge unter Lock, Consumerreceipt dedupliziert; erst P19. |
| `ap.match-reviewed.v1` | AP-ID/Revision, Vertrags-/Rapportrevision, Abweichungsentscheidung | Kein stiller Toleranzwert, keine Zahlung; erst P23/P24. |
| `payroll.input-approved.v1` | Input-/Perioden-/Regelrevision, geprüfter Anspruchsbezug | Keine allgemeine HR-PII; Parameter müssen fachlich validiert sein; erst P31–34. |
| `payment.confirmed.v1` | Fachlicher Zahlungstyp, Beleg-ID, Datum/Betrag/Währung, Allokationsrevision | Tatsächlicher Beleg, kein Genehmigungsersatz; AP/Payroll später, kein Banktransfer. |

## Erste Seitenverträge: bestehende Registrierung erweitern

| Route / Registereinstieg | Zweck / Owner / Hauptaktion | Rechte/Tarif | Zustände / Rückkehr |
| --- | --- | --- | --- |
| `/mitarbeiter`, `/mitarbeiter/neu`, `/mitarbeiter/[id]` | Bestehender Mitarbeiterstamm, `components/pages/employees.tsx`; vorhandene Liste/FormSheet, explizit speichern | employees:read/write + personal-Entitlement; keine neuen Payrollfelder | Empty/Loading/Error/ReadOnly, Dirty/Abbruch,409/Sessionablauf; sicherer `returnTo`, kein automatisches Einladen |
| `/lieferanten` und zukünftige Detail-/Neurouten | Supplier-Stamm im vorhandenen List-/FormSheetowner; explizit speichern | purchasing:read/write + lieferanten-Entitlement; Business/Pro-Bestandsrecht | Lokal implementierter Lieferantenstamm mit geschütztem Bankunterbereich und manuellen AP-Entwürfen/zentralen Belegen; gerenderte Abnahme offen. Keine AP-Freigabe/Zahlung. Rückkehr zum Ursprungsprozess |

Titel, Modul und Rollenzuordnung weiter aus `lib/modules.ts`/`permissions.ts`/`plan-access.ts`; gerenderte Route-/API-/State-Evidence wird mit bestehendem Generator nach betroffenem Funktionsblock aktualisiert. Dieser Vertrag ist keine ausführbare zweite Navigationsregistrierung.

## Fachentscheidungen und sichere Fortsetzung

F01/F02 wurden nach der Planung ausdrücklich bestätigt: bestehende Preise/Bestandsmodule, zusätzliche HR-/Payroll-Fachgrants und separate eigene Lohnabrechnungen. Siehe tatsächlicher Fortschritt und Entscheidungsprotokoll in v26-execution.md. F03–F10 bleiben sichtbar. Keine abweichende Provisionierung, keine implizite Feiertags-/Lohn-/Steuerregel und keine neuen bezahlten Dienste. Existierende Mitarbeiter-Basisrechte werden erhalten; neue sensible Funktionen bleiben serverseitig gesperrt. Sichere Stamm-/Schnittstellenarbeit kann weitergehen.

## Implementierter Lohnvertragsowner (P06)

`employee_wage_definitions` ergänzt die bestehende employee-/Anstellungsidentität; die allgemeine Mitarbeiterprojektion liefert keine Lohnbeträge. `/api/employees/[id]/wages` und revisionsbezogenes PATCH verlangen persistierte `hr_sensitive:read/write`, bestehendes Personalentitlement sowie bei Mutation Fresh-Auth. Künftige Payroll übernimmt nur ausdrücklich validierte Definition-/Anstellungsrevisionen über einen fachlich freigegebenen Adapter, niemals Beträge aus allgemeinen DTOs oder alte pauschale Stammdaten. Finanz-/Familien-/Self-Service-Grants bleiben getrennt. Ein einfacher Auszahlungstag und 13.-Auszahlungsmonat sind Vertragsmetadaten und lösen weder Abrechnung noch Zahlung aus. Geteilte 13.-Auszahlungen/zeitanteilige Berechnung benötigen den späteren fachlichen Vertrag, keine automatische 12-/13-Division.

## Kinder und Kassenentscheid (P07)

Der abhängige HR-Familienowner verwendet `family:read/write` unabhängig von `hr_sensitive` und `payroll`. Manuelle Kassenentscheide sind revisionierte Nachweise mit unabhängigem Review, keine durch Geburtsdatum ausgelöste Auszahlung. Allgemeine Audits halten nur Revision/Status/Objektreferenz fest. Zentral gespeicherte Idempotenzantworten unterliegen zusätzlich denselben Feldgrants. `claim_current` bedeutet ausschliesslich aktueller, geprüfter manueller Nachweis mit gültigen Quellen/Datum; produktive Payroll benötigt zusätzlich F04-validierte Engine-/Regel-/Periodenprüfung und eigene Freigaben. Kein Support- oder allgemeiner Finance-Zugriff auf Kinderdaten.

## Abwesenheitsantrag (P09)

`absences` bleibt der einzige Antrag-/Statusowner. `/abwesenheiten` bietet HR-Teamansicht mit ausdrücklichem HR-Grant; `/einstellungen/abwesenheiten` bietet identitätsgebundene eigene Anträge. Beide verwenden denselben API-/FormSheetowner. Diagnose-/medizinische Freitexte werden nicht angenommen; Projektkapazität darf später nur die zulässige Blockzeitprojektion erhalten. Eigener Zugriff ersetzt keine Dossier-/Payrollrechte. Jede Genehmigung prüft Creator und begünstigte Identity, Revision, aktuelle Anstellung und Fresh-Auth. Freigabe ist noch keine Ferien-Saldobuchung oder Lohnzahlung; P10/P11/P31 müssen ihre eigenen Nachweise und atomaren Übergaben ergänzen. Neue Seiten sind aus der gemeinsamen Foundation abgeleitet und noch nicht gerendert abgenommen.

## Einkaufs-/Verkaufskondition (P15)

`contracts` bleibt Stamm/Statusowner; `contract_condition_revisions` bindet versionierte Konditionen, keinen zweiten Vertragsbestand. Legacyvertragspositionen bleiben unverändert. Pro-Vertragsrecht und bestehende Einkaufs-/Verkaufs-/Projektgrenzen bleiben wirksam. Neue Quelle wird ausdrücklich über Contract-/Condition-ID und Leistungsdatum gewählt; keine versteckte Vorrang- oder Preisumrechnungsregel. Consumer liest Partner/Projekt/Ressource serverseitig aus der geschützten Leistung und prüft Dokumentwährung/Einheit in seinem bestehenden Finanzowner. Einkaufsquelle ist niemals Verkaufsfallback. Entwürfe verdrängen die letzte genehmigte Revision nicht. Jede Änderung historisiert Konditionsdaten und erhöht die Rootversion; Rootaktivierung bindet diesen aktuellen Stand mit unabhängiger Fresh-Auth-Prüfung. Eigene Geräte-/Dokument-/Rechts- und native Parallelitätsnachweise bleiben getrennt.

## Vertragsansicht, Dokumente und interne Freigabe (P16)

`/vertraege` und `/vertraege/[id]` verwenden Records/FormSheet und denselben kaufmännischen Vertragsowner. Partner, Projekt und Richtung bleiben fest; Preis-/Steuer-/Spesenrevisionen werden ausdrücklich erstellt und unabhängig geprüft. Die betroffene unvollständige Revision bleibt direkt bearbeitbar. Vertragsersteller sieht den Bedarf einer anderen berechtigten prüfenden Person; kein stiller Solo-Override. Ohne Originalreferenz abgeleitete Ansichten bleiben als solche und ohne Browserfreigabe dokumentiert.

`contract_document` ist nur eine neue Relation des zentralen File-Owners, unter Pro-Vertragsrecht und exakter Root-/Projekt-RLS. Vor Freigabe wird das aktuelle SHA256-/Scanstatusmanifest mit der angezeigten Version verglichen. `contract_review_snapshots` hält die tatsächlichen Datei-IDs/Bytehashes und Rootversion unveränderlich; Snapshot-/Rollen-/Auditfehler verhindern die Aktivierung. Die dokumentierten Bytes bleiben erhalten. Keine automatische Rechts-, Signatur-, Malware- oder Browserqualifikation aus einer Datenbankfreigabe ableiten; fehlende echte Provider-/Gerätenachweise bleiben Releasegrenzen.

## Zeitklassifikation und externe Leistung (P17)

`time_entries` und die vorhandenen Time-APIs bleiben die einzigen Zeitowner. Neue externe Einträge binden eine bestehende Ressourcen-/Einsatz-/Lieferanten-/Auftragsidentität, niemals einen erfundenen Mitarbeiter oder Appzugang. Erfassung durch Owner/Admin oder aktuell genau zugewiesene Projektleitung verlangt das bestehende Business-/Pro-Modul und ein Standardprofil. Zeitfreigabe bestätigt die erfassten Leistungsdaten; sie erteilt keine HR-/Payrollrechte und erzeugt weder Rechnung noch Zahlung.

Die drei Angaben Arbeitszeit, beantragte Lohnrelevanz und Kundenverrechnung sind unabhängig. Die ersten beiden sind erklärte Klassifikationsvorschläge; Payroll muss später eigene Perioden-/Fachregeln und Freigaben prüfen. Externe Leistungen sind stets nicht lohnrelevant. Alte Daten, alte Clients und der bestehende Timer erhalten keine geratene Lohnklassifikation. Die gemeinsame manuelle Form erfasst die Vorschläge; die Liste kennzeichnet fehlende Klassifikation ausdrücklich.

Externe Tagesleistung speichert volle Minuten als Mengenquelle und zusätzlich die bestehende Stundenrepräsentation mit sechs Dezimalstellen. Ressourcen-/Einsatzwechsel, Deaktivierung und Erfassung teilen kontrollierte Quellsperren, ohne Projektleitung Schreibrechte an Lieferanten zu geben. Inhaltskorrekturen nur beim Ersteller vor Einreichen; danach unveränderliche Quelle, unabhängige Prüfung mit Einreichen davor, auch bei Solo-Owner. Keine physische Löschung oder verdeckte Archivierung dieser neuen Leistungsquellen. Neue externe Monatsaggregate werden noch nicht angenommen; Legacyrapporten wird keine Ressourcenidentität unterstellt.

P18/P19 müssen Verkaufspreisquelle, Währung und genaue Teilmenge ausdrücklich qualifizieren. Bis dahin sind diese neuen externen Einträge im alten Billingpicker und bei direkter Rechnungspositionsverknüpfung gesperrt. Null in den vorhandenen Legacyraten ist kein gültiger externer Verkaufspreis. Einkauf bleibt getrennt. Native Konkurrenz-, Browser-/Geräteabnahme und fachliche Payroll-/Kalenderregeln bleiben offen.

## Explizite Preisbindung einer externen Leistung (P18)

`time_price_sources` ist ein abhängiger, revisionierter Nachweis am vorhandenen Zeitowner. Er dupliziert weder Vertrag noch Berechnungsengine. Nach unabhängiger Zeitfreigabe wählen berechtigte Owner/Admin/Finance eine konkrete freigegebene Stundensatzrevision für Einkauf oder Verkauf. Pro-Vertragsentitlement bleibt erhalten; Business-Ressourcen erhalten dadurch weder ein neues Abo noch ein kostenpflichtiges Zusatzmodul. Bestehende interne Zeit-/Rechnungsfunktionen werden nicht umgestellt.

`/api/time-entries/[id]/pricing` prüft aktuelle Finanzrechte, Standardprofil, Fachmodul, Time-Revision und Fresh-Auth. Der zentrale Vertragsresolver liest Partner, Auftrag, Ressource und Stichtag aus der geschützten Leistung. Die DB vergleicht den vollständigen gespeicherten Snapshot zusätzlich mit der tatsächlich freigegebenen Kondition. Preis, Währung, Steuerbefreiungsgrund, Spesenregel und Quellrevision werden unveränderlich gespeichert. CHF und EUR bleiben getrennte Währungen; kein FX, Einkauf-als-Verkauf oder fehlender Preis als Null. Tag-/Pauschalpreise werden nicht still in Stunden umgerechnet.

Explizites Neubinden ist nur ohne bestehende Rechnungszuordnung möglich und erzeugt eine neue Revision. Alte Snapshots bleiben erhalten, je Seite genau ein aktueller Nachweis; ein aufgeschobener Constraint verhindert eine zwischenzeitlich allein zurückgelassene Deaktivierung. Neue Vertragsentwürfe oder spätere Freigaben verändern keine gespeicherte Preisbindung. Allgemeine Zeit-, HR-, Projekt- und Readeransichten erhalten keine Einkaufs-/Snapshotdaten oder deren Replayantworten. Der gemeinsame FormSheet-Chooser zeigt Preis/Währung/Steuerregel und bindet die tatsächlich ausgewählte Revision. Hintergrundänderungen verlangen eine erneute Auswahl; Sitzungswechsel verwerfen private lokale Antworten.

Die Mengenallokation und Übergabe an zentrale Summen/PDFs bleibt P19/P20. Der bestehende Schutz gegen unqualifizierte externe Billinglinks bleibt bis dahin aktiv. F06 enthält noch die offenen Teilmengen-/Korrekturregeln; die konkrete Minuten-/Währungs-/Reservierungsregel wurde dem Nutzer zur fachlichen Entscheidung vorgelegt. Keine Berechnungsregel daraus still in bestehende Dokumente übernehmen. Native Konkurrenz- und Browserabnahme sind weiterhin offen.


### P19 — F06 umgesetzt

F06 ist ausdrücklich bestätigt (Minuten/exakte Stundenpreisanteile/kein FX; Freigabe nur unissued Draft, nicht bei Issue oder Cancel). Die bisherigen F06-Offenhinweise sind historische Zwischenstände. service.allocated.v1 verwendet die vorhandene invoice_line_time_entries-Verknüpfung mit allocated_minutes und price_source_id. Bestehende Ganzzuordnungen bleiben bestehen. invoice_lines.price_base_quantity=60 bedeutet ganze Minuten zu einem unveränderten Stundenpreis; zentrale calculateDocument-Brüche und gespeicherte SALE-Snapshots sind alleinige Finanz-/PDF-Grundlage. Sperren aller betroffenen Time-IDs, DB-Kapazität und deferred Mengenvollständigkeit sichern die atomare Reservierung ab. READ COMMITTED wird für neue Mengen-/Preisbindungen verlangt; native Konkurrenzprüfung noch offen. Kontrolliertes Draftverwerfen archiviert und gibt Mengen atomar frei. Issued/Cancelled bleiben gebunden; keine ungeprüfte Korrekturfreigabe. P20 verwendet diese vorhandenen APIs, keine zweite Engine.


### P20 — UI-Übergabe

DocumentEditor bleibt der einzige Rechnungsowner. timeAllocations/priceBaseQuantity werden in Save, Preview und Reload erhalten. Neue externe Quellen sind einzelne Minutenpositionen mit bestätigtem Stundenpreis/Steuer, Währung und Basis60; kein Einkaufspreistransfer. Billing-GET mit draft=Nummer zeigt die Kapazität einschliesslich eigener Reservation ausschliesslich für einen sichtbaren unarchivierten Draft, keine Mengenfreigabe. Clientänderung erhält Source-ID und ganze Minuten; Serverguards bestimmen das tatsächliche Ergebnis. Ausgestellte/stornierte Zuordnungen bleiben auch bei Abfrage ihrer Nummer belegt. Controlled discard verwendet bestehende DELETE-/FormSheet-/Retryowner. Native Mehrverbindungs- und echte Browserabnahme bleiben offen.


## Bestätigte Ergänzungen23.10.2026

F07: Solo-Owner-Selbstfreigabe für AP, optionale unabhängige Vier-Augen-Prüfung bei mehreren Benutzern, konfigurierbare währungsgetrennte Betragsgrenzen, null automatische Abweichungstoleranz und keine Zahlung durch Freigabe. Verbindlicher [AP-Vertrag](v26-ap-approval-contract.md). Dies ändert keine unabhängige Freigabe externer Zeitnachweise.

F03/F04: Nutzer bestätigt eine mandantenfähige konfigurierbare Grundlage statt einheitlicher Firmenregeln. Ferienanspruch muss gesetzliche Mindestvorgaben und anwendbare Verträge/GAV/Reglemente berücksichtigen; Feiertage richten sich nach dem massgeblichen Arbeitsort und anwendbaren kantonalen/lokalen Regeln. Überträge, Korrekturen und Stichtage werden historisiert, kein pauschaler automatischer Verfall. Gesetzliche Parameter und individuelle Regelstände brauchen fachliche Nachweise; keine unbestätigten Werte einbauen.

Payroll: unterschiedliche Lohn-/Anstellungsmodelle, Versicherungen, Kinder-/Ausbildungszulagen, Quellensteuer und individuelle Parameter modular am bestehenden Owner vorbereiten. Noch kein validierter Schweizer Anbieter gewählt; keine erfundenen Beitragssätze, Steuerregeln oder Providerintegration. Fehlende validierte Parameter/Referenzfälle blockieren produktive Berechnung, Lohnabrechnungsfreigabe und Auszahlung serverseitig. Bestehende Identity/Rollen/Audit/Dokumente/Time wiederverwenden. Unabhängige V26-Funktionen können ohne diese Entscheidungen weitergehen.
