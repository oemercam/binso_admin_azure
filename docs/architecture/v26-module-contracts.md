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
