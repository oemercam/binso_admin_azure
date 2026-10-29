# Statisches Oberflächeninventar, 27.10.2026

Ergänzt die kanonische Routen-/Komponentenzuordnung aus ux-inventory.json.
Erfasst zentrale JSX-Aufrufe einschliesslich selbstschliessender Komponenten.
Dies ist eine Bestandsaufnahme, keine visuelle Gesamtabnahme.
Fachliche Gründe stehen in docs/architecture/global-surfaces-20261027.md.

| Quelle | Owner | Kontext | Fachliche Bewertung |
| --- | --- | --- | --- |
| components/absence-requests.tsx:38 | ActionsMenu | "Abwesenheitsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/absence-requests.tsx:45 | ActionsMenu | "Abwesenheitsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/absence-requests.tsx:49 | FormSheet | "Abwesenheit beantragen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/absence-requests.tsx:60 | ConfirmDialog | {review?reviewTitles[review.status]:'Antrag genehmigen?'} | Zentrale kritische Bestätigung beibehalten |
| components/app-shell.tsx:351 | ConfirmDialog | "Änderungen verwerfen und abmelden?" | Zentrale kritische Bestätigung beibehalten |
| components/app-shell.tsx:353 | ConfirmDialog | "Änderungen verwerfen?" | Zentrale kritische Bestätigung beibehalten |
| components/app-shell.tsx:406 | HeaderPanel | {sheet==="search"?"Suche":sheet==="account"?"Konto":"Benachrichtigungen"} | Zentrales kompaktes Desktop-/Headerpanel beibehalten |
| components/app-shell.tsx:411 | ActionSheet | "Mehr" | Kontextaktionen beibehalten |
| components/avatar-upload.tsx:17 | FormSheet | "Profilbild prüfen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/binso-ux.tsx:61 | ActionSheet | {label} | Kontextaktionen beibehalten |
| components/binso-ux.tsx:71 | ActionSheet | "Neu erstellen" | Kontextaktionen beibehalten |
| components/binso-ux.tsx:206 | ConfirmDialog | {discardText?.title??"Änderungen verwerfen?"} | Zentrale kritische Bestätigung beibehalten |
| components/binso-ux.tsx:214 | HeaderPanel | {props.ariaLabel??props.label} | Zentrales kompaktes Desktop-/Headerpanel beibehalten |
| components/binso-ux.tsx:249 | ConfirmDialog | "Änderungen verwerfen?" | Zentrale kritische Bestätigung beibehalten |
| components/binso-ux.tsx:261 | HeaderPanel | {label} | Zentrales kompaktes Desktop-/Headerpanel beibehalten |
| components/binso-ux.tsx:261 | ActionSheet | {label} | Kontextaktionen beibehalten |
| components/cash-statistics.tsx:94 | ActionsMenu | "Analysewerkzeuge" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/cash-statistics.tsx:108 | ActionSheet | "Datenhinweise" | Kontextaktionen beibehalten |
| components/commercial-contracts.tsx:44 | FormPage | {item?'Vertragsentwurf bearbeiten':'Vertrag erstellen'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/commercial-contracts.tsx:86 | FormPage | {item?'Konditionsrevision erfassen':'Konditionen erfassen'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/commercial-contracts.tsx:120 | ActionsMenu | "Vertragsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/commercial-contracts.tsx:137 | ActionsMenu | "Konditionsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/commercial-contracts.tsx:143 | ActionsMenu | "Konditionsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/commercial-contracts.tsx:150 | ConfirmDialog | {command?.kind==='condition'?(command.status==='approved'?'Konditionen freigeben?':'Konditionen ablehnen?'):rootConfirmTitles[command?.status as keyof typeof rootConfirmTitles]??'Vertrag freigeben?'} | Zentrale kritische Bestätigung beibehalten |
| components/customer-data-actions.tsx:19 | FormSheet | "Kundenarchiv" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/customer-data-actions.tsx:20 | ActionsMenu | "Kundenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/customer-data-actions.tsx:22 | ConfirmDialog | "Kunde wiederherstellen?" | Zentrale kritische Bestätigung beibehalten |
| components/customer-import.tsx:46 | ActionsMenu | "Listenwerkzeuge" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/customer-import.tsx:47 | ActionsMenu | {tools?"Listenwerkzeuge":customerId?'Kontaktaktionen':'Kundenaktionen'} | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/customer-import.tsx:47 | FormPage | {customerId?'Kontakte importieren':'Kunden importieren'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/customer-import.tsx:47 | ActionsMenu | "Importbericht" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/customer-merge.tsx:52 | FormPage | "Kundendubletten zusammenführen" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/document-settings.tsx:36 | FormPage | "Dokumente" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/documents.tsx:469 | ConfirmDialog | "Änderungen verwerfen?" | Zentrale kritische Bestätigung beibehalten |
| components/documents.tsx:471 | ActionSheet | "Weitere Aktionen" | Kontextaktionen beibehalten |
| components/documents.tsx:490 | FormSheet | {adjustmentIsRefund?"Rückerstattung erfassen":"Gutschrift erfassen"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/documents.tsx:491 | FormSheet | {sendingReminder?"Zahlungserinnerung senden":"Dokument senden"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/documents.tsx:492 | FormSheet | "Entwurf verwerfen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/documents.tsx:652 | FormSheet | {"Position bearbeiten"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/documents.tsx:653 | FormSheet | "Gesamtrabatt" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/employee-family.tsx:44 | ActionsMenu | "Familienaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/employee-family.tsx:47 | ActionsMenu | "Familienaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/employee-family.tsx:50 | FormPage | {mode==='child'?(child?'Kinderdaten korrigieren':'Kind erfassen'):'Kassenentscheid'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/employment-periods.tsx:37 | ActionsMenu | "Anstellungsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/employment-periods.tsx:42 | ActionsMenu | "Anstellungsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/employment-periods.tsx:44 | FormPage | {selected?'Vertragsstand korrigieren':'Anstellungsperiode hinzufügen'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/entity-files.tsx:39 | ActionsMenu | "Dateiaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/entity-files.tsx:47 | ActionSheet | "Dateiaktionen" | Kontextaktionen beibehalten |
| components/entity-files.tsx:49 | ConfirmDialog | "Datei entfernen?" | Zentrale kritische Bestätigung beibehalten |
| components/external-resources.tsx:48 | ActionsMenu | "Ressourcenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/external-resources.tsx:50 | ActionsMenu | "Ressourcenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/external-resources.tsx:51 | ActionsMenu | "Ressourcenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/external-resources.tsx:53 | FormSheet | {mode==='assignment'?'Einsatz hinzufügen':selected?'Externe Person bearbeiten':'Externe Person hinzufügen'} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/external-resources.tsx:61 | ConfirmDialog | "Einsatz beenden?" | Zentrale kritische Bestätigung beibehalten |
| components/fresh-authentication-dialog.tsx:34 | FormSheet | "Aktion bestätigen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/maintenance-control.tsx:16 | ConfirmDialog | {resource.data?.enabled?"Wartung beenden":"Wartung aktivieren"} | Zentrale kritische Bestätigung beibehalten |
| components/monitoring.tsx:57 | FormSheet | {selectedMetric?.label??selectedService?.name??'Messwert'} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/monitoring.tsx:61 | FormSheet | "Datenquellen und Grenzen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/monthly-time-report.tsx:29 | FormSheet | "Monatsrapport" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/offer-followup.tsx:17 | FormSheet | "Erinnerung planen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/offer-followup.tsx:31 | FormSheet | {canSchedule?'Erinnerung planen':'Erinnerung'} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/offer-history.tsx:38 | ActionsMenu | "Nachrichtenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/offer-history.tsx:39 | FormSheet | "Zum Angebot antworten" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/operator.tsx:166 | ActionsMenu | "Kundenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/operator.tsx:169 | HeaderPanel | "Konto" | Zentrales kompaktes Desktop-/Headerpanel beibehalten |
| components/operator.tsx:175 | ActionSheet | "Weitere Admin-Bereiche" | Kontextaktionen beibehalten |
| components/operator.tsx:504 | FormSheet | {String((selected?.tenant as {name?:string}/undefined)?.name??"Kunde")} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/operator.tsx:562 | FormSheet | "Einschränkung erstellen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/operator.tsx:575 | ConfirmDialog | {confirm==="create"?"Zugriff einschränken?":"Einschränkung aufheben?"} | Zentrale kritische Bestätigung beibehalten |
| components/operator.tsx:629 | FormSheet | "Ankündigung erstellen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/customers.tsx:184 | ActionSheet | "Kundenaktionen" | Kontextaktionen beibehalten |
| components/pages/customers.tsx:185 | ActionSheet | "Kontaktaktionen" | Kontextaktionen beibehalten |
| components/pages/customers.tsx:186 | FormSheet | {contactId?"Kontakt bearbeiten":"Kontakt hinzufügen"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/customers.tsx:187 | ConfirmDialog | "Kontakt entfernen?" | Zentrale kritische Bestätigung beibehalten |
| components/pages/customers.tsx:270 | FormPage | {customerId?"Kunde bearbeiten":"Kunde erstellen"} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/customers.tsx:313 | ActionSheet | "Dokument erstellen" | Kontextaktionen beibehalten |
| components/pages/employees.tsx:145 | ActionsMenu | "Mitarbeiteraktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/employees.tsx:171 | FormPage | {existing?"Mitarbeiter bearbeiten":"Mitarbeiter hinzufügen"} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/expenses.tsx:193 | ActionSheet | "Spesenaktionen" | Kontextaktionen beibehalten |
| components/pages/expenses.tsx:197 | FormPage | {existing?"Spese bearbeiten":"Spese erfassen"} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/expenses.tsx:198 | FormSheet | {"Erfolgte Erstattung erfassen"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/payments.tsx:88 | FormSheet | "Zahlung erfassen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/products.tsx:107 | ActionsMenu | "Produktaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/products.tsx:116 | FormPage | {existing?"Produkt bearbeiten":"Produkt erstellen"} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/projects.tsx:51 | ActionsMenu | "Auftragsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/projects.tsx:56 | FormSheet | "Auftrag bearbeiten" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/settings.tsx:113 | ActionsMenu | "Weitere Aktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/settings.tsx:113 | ActionsMenu | "Weitere Aktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/settings.tsx:118 | FormPage | "Persönliche Daten bearbeiten" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/settings.tsx:221 | ActionsMenu | "Weitere Aktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/settings.tsx:221 | ActionsMenu | "Weitere Aktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/settings.tsx:224 | FormPage | "Firmendaten bearbeiten" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/settings.tsx:227 | ConfirmDialog | "Änderungen verwerfen?" | Zentrale kritische Bestätigung beibehalten |
| components/pages/settings.tsx:356 | FormSheet | {"Plan auswählen"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/suppliers.tsx:67 | ActionsMenu | "Lieferantenaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/suppliers.tsx:72 | FormPage | {existing?'Lieferant bearbeiten':'Lieferant hinzufügen'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/support.tsx:104 | FormSheet | "Neue Support-Anfrage" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/pages/support.tsx:214 | ActionsMenu | "Ticketaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/time.tsx:39 | ActionsMenu | "Rapportaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/time.tsx:220 | ActionsMenu | "Listenwerkzeuge" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/pages/time.tsx:227 | FilterSheet | "Zeitfilter" | Kurze Filterauswahl beibehalten |
| components/pages/time.tsx:252 | ActionSheet | "Auftrag wählen" | Kontextaktionen beibehalten |
| components/pages/time.tsx:253 | FormPage | "Zeit erfassen" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/pages/time.tsx:254 | FormSheet | "Zeiten verrechnen" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/passkey-settings.tsx:48 | FormSheet | {target?'Passkey verwalten':'Passkey hinzufügen'} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/project-form.tsx:54 | FormSheet | "Auftrag starten" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/public-offer.tsx:65 | FormSheet | {decision==='accept'?'Angebot annehmen':decision==='decline'?'Angebot ablehnen':'Frage stellen'} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/records.tsx:141 | FilterSheet | {placeholder.replace(/\.\.\.$/,'')} | Kurze Filterauswahl beibehalten |
| components/records.tsx:266 | FormSheet | "Zeiteintrag" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/registration/registration-page.tsx:102 | ConfirmDialog | {t('leaveTitle')} | Zentrale kritische Bestätigung beibehalten |
| components/report-actions.tsx:39 | ActionsMenu | {label} | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/report-mail.tsx:32 | FormSheet | "Bericht senden" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/report-share.tsx:28 | FormSheet | "Bericht freigeben" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/report-share.tsx:37 | ConfirmDialog | "Freigabe widerrufen?" | Zentrale kritische Bestätigung beibehalten |
| components/security-settings-page.tsx:123 | FormSheet | "Passwort ändern" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/security-settings-page.tsx:131 | FormSheet | "Zusätzliche Sicherheitsbestätigung" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/security-settings-page.tsx:168 | ConfirmDialog | {revokeTarget==="all"?"Andere Sitzungen abmelden?":"Sitzung abmelden?"} | Zentrale kritische Bestätigung beibehalten |
| components/security-settings-page.tsx:169 | ConfirmDialog | "Authenticator deaktivieren?" | Zentrale kritische Bestätigung beibehalten |
| components/sensitive-access.tsx:31 | FormSheet | "Sensible Fachrechte" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/setup-process.tsx:47 | FormPage | "Firma vervollständigen" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/setup-process.tsx:55 | ConfirmDialog | "Änderungen verwerfen?" | Zentrale kritische Bestätigung beibehalten |
| components/statistic-period-picker.tsx:26 | HeaderPanel | "Zeitraum" | Zentrales kompaktes Desktop-/Headerpanel beibehalten |
| components/statistic-period-picker.tsx:26 | FilterSheet | "Zeitraum" | Kurze Filterauswahl beibehalten |
| components/supplier-bank.tsx:27 | ActionsMenu | "Bankverbindung" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/supplier-bank.tsx:29 | FormSheet | "Bankverbindung bearbeiten" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/supplier-invoices.tsx:43 | ActionsMenu | "Eingangsrechnungen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/supplier-invoices.tsx:45 | ActionsMenu | "Eingangsrechnungen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/supplier-invoices.tsx:49 | FormPage | "Eingangsrechnungsbelege" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/supplier-invoices.tsx:50 | FormPage | "Eingangsrechnungsentwurf" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/supplier-invoices.tsx:70 | FormPage | "Freigaberegeln" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/supplier-invoices.tsx:79 | FormPage | "Freigaberegeln" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/supplier-invoices.tsx:97 | FormPage | "Rechnung prüfen" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/supplier-invoices.tsx:128 | FormPage | "Leistungen abgleichen" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/team-settings.tsx:54 | ActionsMenu | "Einladungsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/team-settings.tsx:56 | ConfirmDialog | "Einladung erneut senden?" | Zentrale kritische Bestätigung beibehalten |
| components/team-settings.tsx:57 | FormSheet | {"Mitarbeiter einladen"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/team-settings.tsx:58 | ConfirmDialog | "Rolle ändern?" | Zentrale kritische Bestätigung beibehalten |
| components/team-settings.tsx:59 | ConfirmDialog | "Zugang sperren?" | Zentrale kritische Bestätigung beibehalten |
| components/team-settings.tsx:60 | FormSheet | {selected.name//selected.email//"Mitarbeiter"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/time-price-source.tsx:41 | FormPage | "Preisquelle bestätigen" | Umfangreicher Prozess / Bearbeitung / Detail |
| components/time-report.tsx:16 | FormSheet | "Zeitrapport" | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/timer-resume-notice.tsx:34 | ConfirmDialog | "Deine Zeitmessung läuft noch" | Zentrale kritische Bestätigung beibehalten |
| components/ux-lab.tsx:40 | HeaderPanel | {panel==="search"?"Suche":panel==="notifications"?"Benachrichtigungen":"Konto"} | Testbeispiel |
| components/ux-lab.tsx:41 | ActionSheet | "ActionSheet" | Testbeispiel |
| components/ux-lab.tsx:42 | FormSheet | "FormSheet" | Testbeispiel |
| components/ux-lab.tsx:43 | FilterSheet | "FilterSheet" | Testbeispiel |
| components/ux-lab.tsx:44 | FormSheet | "WizardSheet" | Testbeispiel |
| components/ux-lab.tsx:45 | ConfirmDialog | "Synthetische Bestätigung" | Testbeispiel |
| components/wage-definitions.tsx:41 | ActionsMenu | "Lohnvertragsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/wage-definitions.tsx:50 | ActionsMenu | "Lohnvertragsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/wage-definitions.tsx:52 | FormPage | {selected?'Lohndefinition korrigieren':'Lohndefinition hinzufügen'} | Umfangreicher Prozess / Bearbeitung / Detail |
| components/workforce-assignments.tsx:24 | ActionsMenu | "Zuordnungsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/workforce-assignments.tsx:25 | ActionsMenu | "Zuordnungsaktionen" | Zentrales kontextbezogenes Aktionsmenü beibehalten |
| components/workforce-assignments.tsx:27 | FormSheet | {identityOnly?"Mitarbeiterzugang verknüpfen":"Zuordnung"} | Kompakte Kontextaktion oder Auswahl beibehalten |
| components/workforce-assignments.tsx:38 | ConfirmDialog | "Zugriff entziehen?" | Zentrale kritische Bestätigung beibehalten |
