# BINSO ONE V26 – Modulare Gesamtplattform
**Stand:** 21.10.2026 · **Status:** verbindlicher V26-Implementierungsauftrag (Revision 3), noch nicht implementiert · **Repository:** `oemercam/binso_admin_azure`

## 1. Leitbild und Abgrenzung
V25 läuft unverändert weiter. V26 erweitert bestehende Module, statt sie neu zu bauen. Zielgruppe sind Schweizer KMU ohne vertiefte IT-Kenntnisse. Der Benutzer soll pro Aufgabe nur die notwendigen Felder und einen eindeutigen nächsten Schritt sehen. Eingaben bleiben bei Fehlern, Modulwechseln, Verbindungsabbruch und erneuter Anmeldung erhalten. Nach einem unterbrochenen Prozess geht es an derselben Stelle weiter. Keine erfundenen Daten, Preise, Steuer- oder Lohnregeln. P0 = Sicherheit/Datenintegrität, P1 = Kernprozess, P2 = Komfort/Reporting; P3 nicht umsetzen.

## 2. Architektur: modularer Monolith
Gemeinsame Infrastruktur für Identity, Mandanten, Rollen, Audit, Dokumente, Benachrichtigungen, E-Mail, Statusdarstellung, Genehmigungen, Hintergrundjobs, Reporting und Abonnements. Fachmodule besitzen ihre Daten und Geschäftsregeln selbst und kommunizieren über versionierte Schnittstellen und fachliche Ereignisse. Kein direkter Schreibzugriff in fremde Fachaggregate. Transaktionale Outbox, Idempotenz, kontrollierte Retries und migrationsfähige APIs für kritische Abläufe.

| Modul | Datenhoheit / Verantwortung |
|---|---|
| Identity & Access | Benutzerkonten, Anmeldung, Passkeys, Sitzungen, Policies |
| Tenant & Organization | Unternehmen, Einstellungen, Rechnungs-/Steuergrunddaten |
| CRM | Kunden und Kontakte |
| People/HR | Mitarbeiterdossier, Familie, Anstellungsperioden |
| Absences & Leave | Ferien, Krankheit, Unfall, Absenzen, Salden |
| Payroll | Lohnarten, Berechnung, Lohnläufe, Abrechnungen |
| Suppliers | Externe Lieferantenfirmen, Kontaktdaten |
| External Resources | Externe Personen, Einsatzzuordnungen, Partnerzugang |
| Contracts | Kunden-/Lieferantenverträge, Laufzeiten, Konditionen |
| Work & Projects | Aufträge, Projekte, Ressourcen, Aufgaben, Budgets |
| Time | Timer, manuelle Zeiten, Zeitarten, Freigaben |
| Billable Services | Verrechenbare Leistungen, Preisfindung, Teilabrechnung |
| Quotes & Sales | Angebote, Versionen, Kundenfreigaben |
| Accounts Receivable | Ausgangsrechnungen, Gutschriften, Mahnungen |
| Accounts Payable | Eingangsrechnungen, Abgleich, Freigabe |
| Expenses | Spesen, Belege, Erstattungsansprüche |
| Payments | Zahlungen, Teilzahlungen, Auszahlungsstatus, Abgleich |
| Documents & Communications | Uploads, PDF, Vorlagen, E-Mail, sichere Freigaben |
| Analytics & Reporting | Definierte Kennzahlen, Dashboards, PDF/CSV |
| Support | Tickets, asynchrone Antworten, optionaler Chat |
| Billing & Entitlements | SaaS-Tarife, Add-ons, Kontingente, Testphasen |
| Platform Admin | Interne Governance, Audit, Supportfreigaben |

**Fachliche Trennungen:** Benutzerkonto ≠ Mitarbeiter ≠ externe Ressource ≠ Lieferantenfirma; Vertrag ≠ Auftrag ≠ Zeitnachweis ≠ Rechnung; Arbeitszeit ≠ lohnrelevante Zeit ≠ verrechenbare Zeit; Lohnkosten ≠ Einkaufssatz ≠ Verkaufssatz; Spesen ≠ Eingangsrechnung; Genehmigung ≠ Zahlung; Rechnungsstatus ≠ Versandstatus ≠ Zahlungsstatus. Diese Konzepte dürfen gemeinsame Referenzen, aber keine vermischten Datenmodelle besitzen.

## 3. Durchgängige UX und Readiness
- Registrierung: E-Mail, Passwort, Firmenname, Bestätigung; keine obligatorische MFA für normale Erstnutzung. Danach direkt starten.
- Einrichtungshinweise auf Übersicht; Pflichtangaben erst bei betroffener Aktion verlangen. Entwurf erlauben, verbindliche Ausstellung/Auszahlung nur nach gültiger Prüfung.
- Jede Aktion: Erfassen → Prüfen → Freigeben (wenn nötig) → Verarbeiten → Ergebnis/Weiterführung. Nur erforderliche Felder anzeigen; sinnvolle Defaults, keine stillschweigenden Annahmen.
- Klare Fehlerfälle: ungültig, offline, fehlende Rechte, abgelaufene Sitzung, Duplikat, Konflikt, gescheiterter Versand, unbestätigte Zahlung. Entwürfe erhalten; Status beim Wiederholen zuerst abgleichen.
- Gleiche fachliche Daten auf Desktop, Tablet, Mobile, PWA; eigenständige Layouts erlaubt. V25-Designstandard übernehmen. Mobile Bottom-Navigation und blauen Floating-Plus-Button nicht verändern.

## 4. Personalakte und Anstellung
Vor-/Nachname, Wohnadresse, Kontakt, Geburtsdatum, Eintritt/Austritt, Funktion, Arbeitsort, Vertrag, Pensum, Sollstunden, Ferienanspruch, Bankverbindung, relevante Versicherungsdaten. Familie/Kinder nur soweit für berechtigte HR- und Zulagenprozesse nötig, mit besonders restriktiven Rechten. Unbefristet/befristet, Teilzeit, Stundenlohn, Monatslohn, Jahreslohn, Arbeit auf Abruf, Lernende/Praktika nach fachlicher Eignung. Jahreslohn inklusive/exklusive 13. Monatslohn explizit festhalten; Auszahlungsplan separat. Vertragsänderungen mit Gültigkeitsdatum historisieren, Wiedereintritt als neue Periode. Mitarbeiter ohne Benutzerkonto möglich; externe Benutzer ohne Mitarbeiterakte möglich. Mitarbeiter-Self-Service für eigene Zeiten, Spesen, Ferien und Lohnabrechnungen.

## 5. Schweizer Payroll – fachlich geprüft
Monats-/Stunden-/Jahreslohn, 13. Monatslohn, variable Zuschläge, Überstunden, Ferien-/Feiertagsbehandlung, Ein-/Austritte, Schlussabrechnung, Spesenersatz. Zeitabhängige und konfigurierbare AHV/IV/EO, ALV, BVG, UVG/NBU, KTG, Quellensteuer und Arbeitgeberbeiträge; keine fest verdrahteten Sätze. Kinder- und Ausbildungszulagen nur bei geprüftem Anspruch, zuständiger Ausgleichskasse, Zeitraum und kantonalen Bedingungen – Kinderdaten allein lösen keine Auszahlung aus. Lohnlauf: Periode → variable Daten prüfen → berechnen → Abweichungen prüfen → berechtigte Freigabe → unveränderliches PDF → Auszahlungsvorbereitung → Zahlung bestätigen → Abschluss. Korrekturen als nachvollziehbare Nach-/Differenzabrechnung. Lohnausweis, Meldungen, Swissdec/ELM auf reale fachliche Anforderungen prüfen, keine Zertifizierung behaupten.

**P0-Freigabegrenze:** Keine produktive Lohnberechnung, Auszahlung oder Behördenmeldung mit unvalidierter Payroll-Engine, fehlenden Versicherungsparametern oder ungetesteten Regeln. Vorbereitende Module implementieren und offene Fachfreigaben dokumentieren.

## 6. Ferien, Absenzen, Kapazität
Ferienantrag, Genehmigung, Saldo, Teilzeit, Feiertagskalender nach Arbeitsort, Übertrag und Austritt; Krankheit/Unfall mit datensparsamer Erfassung und getrennten Zugriffsrechten. Auswirkungen auf Payroll nur nach geprüften Regeln. Projektkapazität und Auslastung aus gültigen Soll-/Istwerten berechnen; keine erfundenen Verfügbarkeiten.

## 7. Lieferanten, Partner und Verträge
Externe Firma als Lieferant mit Ansprechpartner, Bankdaten, UID soweit nötig, Zahlungsbedingungen und Vertragsdokumenten. Externe Personen als separate Ressourcen, einer Lieferantenfirma und Einsätzen zugeordnet, ohne Payroll-Zugehörigkeit. Dienstleistungsvertrag mit Gültigkeitszeitraum, Einkaufsstundensatz, Abrechnungsperiode, Kündigungsfrist, Spesenregelung, Währung, Steuerbehandlung und Freigaben. Ein Lieferant kann mehrere Personen für mehrere Kundenaufträge stellen. Optionaler beschränkter Partnerzugang nur für eigene Einsätze/Zeiten/Belege; keine internen Margen oder fremde Daten.

## 8. Aufträge, Projekte und Zeiterfassung
Kundenauftrag kann Stundenansatz, Pauschale, Kontingent, Retainer oder Mischmodell haben. Interne/externe Ressourcen, Budgets, Aufgaben, Kostenstellen und gültige Preisvereinbarungen. Timer und manuelle Zeiten, Mitarbeiter/Ressource, Kunde, Auftrag, Tätigkeit, Zeitart, Datum, Dauer, Freigabe. Arbeitszeit, lohnrelevante Zeit und Kundenverrechnung getrennt. Stundenfreigabe erzeugt noch keine Rechnung und noch keinen Lohn. Rechnungsassistent zeigt freigegebene, noch nicht verrechnete Leistungen, erlaubt Gruppierung/Teilabrechnung und übernimmt Kunde, Positionen, vereinbarten Verkaufssatz. Verrechnete Zeitanteile referenzieren konkrete Rechnungspositionen; keine Doppelverrechnung. Vertragspreise historisieren.

## 9. Externe Monatsrechnung – konkreter End-to-End-Fall
Externe Partnerfirma erbringt 120 Stunden bei Kunde A. Partnervertrag legt Einkaufsstundensatz fest; Kundenvertrag den Verkaufssatz. Partner-/Mitarbeiterzeiten erfassen/importieren → zuständige Freigabe → Monatsrapport → Partner sendet PDF-Eingangsrechnung → Belegerkennung extrahiert Rechnungsnummer, Zeitraum, Stunden, Satz, Steuer und Betrag → Abgleich gegen Vertrag und freigegebene Zeiten → Abweichung anzeigen und Rückfrage oder Freigabe → Zahlung vorbereiten und tatsächlich ausgezahlten Betrag bestätigen. Parallel können freigegebene verrechenbare Stunden in Kundenrechnung übernommen werden. Eine Lieferantenrechnung darf mehrere Aufträge enthalten; Teilzahlungen, Gutschriften, Stornos, verspätete Rapporte und Satzänderungen ab Stichtag behandeln. Einkaufsrechnung und Kundenrechnung bleiben unabhängig. Marge nur als nachvollziehbarer Deckungsbeitrag vor weiteren Kosten darstellen.

## 10. Spesen und Eingangsrechnungen trennen
Spesen: Kamera/HEIC/JPG/PNG/PDF oder manuell, sichere Belegerkennung, nur Betrag/Datum/Kategorie/Zahlungsart plus bedingte Felder, unsichere Erkennung sichtbar; Einreichen → Rückfrage/Prüfen → Genehmigen/Ablehnen → Erstattung vorbereiten → Auszahlung bestätigen. Privat bezahlt/Firmenkarte/direkt bezahlt trennen. Lieferantenrechnungen: eigener AP-Prozess mit Dublettenprüfung, Vertrags-/Leistungsabgleich, Steuer- und Zahlungsprüfung. Nie automatisch als Payroll-Lohn oder Mitarbeitererstattung behandeln. Alle Dokumente mandantengeschützt und auditierbar.

## 11. Weitere zusammenhängende Geschäftsprozesse
- Kundenangebot → digital annehmen/ablehnen/Rückfrage → Auftrag/Projekt → Zeiten/Leistungen → Ausgangsrechnung → Teil-/Vollzahlung → Abschluss.
- Wiederkehrende Serviceverträge und Rechnungen mit kontrollierter Automatik, Preis-/Laufzeitänderungen, Erinnerungen und ausdrücklichen Freigaben.
- Gutschriften, Storno, Mahnung, Überzahlung, Rückerstattung und Korrekturen ohne stille Änderung historischer Belege.
- Mitarbeiter-Austritt: offene Zeiten, Ferien, Spesen, Lohn, Aufgaben, Geräte/Sitzungen und Übergaben prüfen.
- Lieferanten-Austritt/Vertragsende: offene Leistungen, Eingangsrechnungen, Zugriff und Archivierung prüfen.
- Kostenstellen und Projektbudgets nur bei tatsächlicher Nutzung aktivieren; nicht jeden Nutzer mit Pflichtfeldern belasten.
- Sichere Dokumentfreigaben, Genehmigungen, Vorlagen, Import/Export, verständliche Aktivitäten und Benachrichtigungen modulübergreifend wiederverwenden.

## 12. Reports und Kostenanalysen
Auswertungen nach Mitarbeiter, Kunde, Auftrag, Projekt, Lieferant, Vertrag, Kategorie, Zeitraum und Kostenstelle. Arbeitsstunden, abrechenbare Stunden, Personalkosten, Fremdleistungskosten, Spesen, fakturierte Leistungen, Zahlungseingänge und offene Beträge strikt unterscheiden. Keine doppelte Zählung von Spesen/Payroll/AP; keine erfundenen Benchmarks oder Einsparpotenziale. Ringdiagramme für Verteilungen, Balken-/Liniendiagramme für Verläufe, klare Statusfarben, keine leeren Charts. Jede Kennzahl mit fachlicher Definition und Drill-down bis zum Beleg. PDF/CSV-Export, sichere Freigaben, rollenbasierte Datenbegrenzung.

## 13. Abonnements und Monetarisierung
**Vorhandene V25-Tarife, Preise und Bestandskundenrechte prüfen und nicht stillschweigend verändern.** Diese Paketzuordnung ist ein zu validierender Produktvorschlag, keine Behauptung über veröffentlichte Tarife.

| Angebot | Zielgruppe | Enthalten | Geschäftsmodell |
|---|---|---|---|
| Start | Selbstständige | CRM, Angebote, QR-Rechnungen, einfache Zeit, Basisberichte | niedrige Einstiegshürde, definierte Nutzergrenze |
| Business | KMU mit Team | Start + Mitarbeiterzugänge, Projekte, Spesen/Genehmigungen, Berichte | höherer Grundpreis, zusätzliche aktive Nutzer |
| Pro | Dienstleistungsbetriebe | Business + Lieferanten, externe Ressourcen, Verträge, Eingangsrechnungen, Leistungsabgleich, Projektkosten | Premium für konkreten betriebswirtschaftlichen Nutzen |
| Payroll Add-on | Arbeitgeber | HR/Payroll, Absenzen, Lohnabrechnungen, sichere Mitarbeiterdokumente | Grundpreis + aktive abgerechnete Mitarbeitende, transparent |
| Partner/AP Add-on | Unternehmen mit Fremdleistungen | erweiterter Partnerzugang, Belegerkennung/Volumen, Lieferantenabgleich | nur dort separat, wo nicht schon im Pro enthalten |

Monatlich und jährlich (jährlich 2 Monate gratis, wenn kommerziell bestätigt), transparente Preise, keine versteckten Gebühren. Preise erst nach Kostenanalyse für E-Mail, Dokumentenerkennung, Speicherung, Payroll-Lizenz, Support und Zahlungsanbieter festlegen. Freie Testphase ohne Kreditkarte, wenn bestehendes V25-Modell so freigegeben ist. Entitlements zentral serverseitig erzwingen; UI erklärt Upgrade verständlich, blockiert keine berechtigten historischen Daten. Feature-/Nutzer-/Dokumentkontingente und Overages transparent. Kündigung, Downgrade, Zahlungsausfall, Testablauf, Datenexport und Reaktivierung ohne überraschende Datenlöschung. Kein doppeltes Berechnen derselben Funktion. Conversion, Aktivierung, Churn und Kosten pro aktivem Mandanten nur aus echten Daten messen.

## 14. Einfache Oberfläche trotz komplexer Module
Rollen- und abonnementabhängige Navigation, keine technischen Modulnamen. Desktop darf Sidebar und Tabellen/mehrspaltige Ansichten nutzen; Mobile bleibt touchoptimiert mit unveränderter Bottom-Navigation und Floating-Plus. Auf jeder Seite nur sinnvolle KPIs, Aktionen und Zustände. Kurze Aktionen als kompakte Dialoge, längere als geführte Seiten. Bei fehlenden Angaben direkt zum betroffenen Feld und danach zurück zur Aufgabe. Einmal erfasste Stammdaten wiederverwenden; historische Dokument-Snapshots nicht überschreiben. Kunden- und Partnerportale ohne unnötige Registrierung, aber mit verifiziertem Zugriff.

## 15. Sicherheit, Recht und Betrieb
Strikte Mandantentrennung und RBAC/ABAC serverseitig, HR-/Payroll-Daten gesondert schützen, rollenbasierte Exporte, Audit, Vieraugenprinzip für sensible Freigaben, sichere Bankdatenänderung, Sitzungskontrolle, verschlüsselte Dateien, Malware-Scanning, Datenminimierung, Aufbewahrung/Löschung, Schweizer DSG und anwendbare weitere Regeln. Personalverleih, Selbstständigkeit, Quellensteuer, Sozialversicherung und Lohnberechnung fachlich prüfen; keine automatische rechtliche Einordnung. Backups, Wiederherstellung, Monitoring, idempotente Finanzaktionen, Transaktionsgrenzen, sichere Migrationen und Rollback-Pläne. Schweizer QR-Standards und mehrsprachige Dokumente aus V25 übernehmen.

## 16. Implementierungsplan ohne V25 zu stören
1. Aktuellen Repository-Stand, V25-PRs, Module, Datenmodelle und Schnittstellen inventarisieren; bestehende Arbeit nicht überschreiben.
2. Domain-Grenzen, Entitlements, Migrationen, Rechte und Ereignisverträge definieren; technische Schulden dokumentieren.
3. HR/Anstellung und Lieferanten/Verträge getrennt implementieren.
4. Zeit-/Leistungsfreigabe, interne/externe Ressourcen und Kundenverrechnung integrieren.
5. Eingangsrechnungen und Spesenverknüpfung integrieren.
6. Payroll-Vorbereitung, Fachvalidierung, Abrechnungen und kontrollierte Auszahlung implementieren; produktive Sperre bis Freigabe.
7. Analysen, Exporte, Abonnements/Entitlements und UX-Verknüpfungen fertigstellen.
8. E2E-Tests für interne Mitarbeiter, Stundenlohn, Jahreslohn, Kinderzulagen, externe Firmen, Monatsrechnung, Kundenweiterverrechnung, Korrekturen, Teilzahlungen, Austritt, gesperrte Rechte und Fehlerfälle.
9. Abnahmematrix pro P0/P1/P2-Anforderung mit Codepfad, Test, Screenshot, Datenmigration, offener Abhängigkeit und Status. Keine unbewiesenen Erfolgsmeldungen.

**Freigabe:** V26 darf auf einem separaten Feature-Branch umgesetzt werden, ohne laufende V25-Arbeiten zu überschreiben. Produktivdeployment, neue kostenpflichtige Dienste und produktive Payroll unterliegen den bestehenden gesonderten Freigabegrenzen.

## 17. Einheitliche Produktarchitektur: Website, Identity, Kunden-App, Partnerzugang und Admin
Die öffentliche Landingpage informiert wahrheitsgemäss über Funktionen, Tarife, Add-ons, Testphase, Datenschutz und Support. Sie verwendet dieselben zentralen Produkt- und Tarifdefinitionen wie Checkout, Kunden-App und Plattformadministration; keine manuell abweichenden Feature-Versprechen. Öffentliche Navigation, Footer, Consent und DE/FR/IT/EN aus V25 wiederverwenden. `one.binso.ch` als Kunden-App, `admin.one.binso.ch` als getrennt abgesichertes internes Adminportal und `go.binso.ch` für verifizierte Dokumentfreigaben sind Zieladressen, DNS und Betrieb vor Umsetzung prüfen. Keine parallelen Auth-Backends; gemeinsame Identity mit getrennten Sicherheitsrichtlinien, Rollenräumen und Session-Grenzen. Mobile/PWA und Desktop haben eigenständige Layouts auf gemeinsamen APIs und Fachregeln.

## 18. Firmenregistrierung und Erst-Onboarding (End-to-End)
Landingpage → Tarif/Test wählen → E-Mail → Passwort oder geeignete Identity-Methode → Firmenname → E-Mail verifizieren → Tenant und initialen Owner atomar anlegen → Kunden-App öffnen → kontextabhängige Einrichtungscheckliste. Keine obligatorische MFA, keine Kreditkarte für freigegebenen Gratis-Test, keine unnötigen Firmendaten vor Erstnutzung. Vorname/Nachname und weitere bereits erfasste Angaben dürfen beim Übergang nicht verloren gehen. Dubletten, unterbrochene Registrierung, wiederholte Requests, abgelaufene Verifizierung, bestehende E-Mail, Testablauf, abgelehnte Zahlung, fehlende Berechtigungen und Wiederaufnahme definieren und testen. Ein Benutzerkonto gehört im Startmodell zu genau einem Unternehmen. Unvollständige Pflichtdaten blockieren nur die betroffene verbindliche Aktion; Entwürfe bleiben möglich. Rollen-/Tarifrechte serverseitig prüfen.

## 19. Mitarbeiter-Onboarding, Einladungen und Identitätsbezug
Unternehmens-Owner bzw. berechtigter Unternehmens-Admin erstellt ein Mitarbeiterdossier (auch ohne App-Konto) oder lädt einen App-Benutzer mit E-Mail und zulässiger Rolle ein. Einladung 7 Tage gültig, einmalig, widerrufbar, tokenbasiert, bei erneutem Versand alten Token invalidieren; Öffnen durch Mail-Scanner verbraucht Einladung nicht. Neue Benutzer aktivieren Identität, bestehende melden sich an; eingeladene E-Mail/Identität muss nachgewiesen werden. Danach nur die vorgesehene Unternehmensmitgliedschaft aktivieren, kein zweiter Tenant. Bei Ablauf neue Einladung anfordern (mit Berechtigungs-/Missbrauchsschutz), bei falschem Konto wechseln, bei Passwortverlust Recovery, bei Sperre nicht aktivieren. Rollenänderung, Deaktivierung, Austritt, Wiedereintritt, Aufgabenübergabe, offene Spesen/Zeiten/Lohn und Sitzungswiderruf abdecken. Mitarbeiter-Self-Service nur für eigene berechtigte Daten; HR-Akte und Identity-Profil fachlich getrennt und konsistent referenziert.

## 20. Rollenmatrix, Mandantenrechte und Payroll-Schutz
Drei strikt getrennte Rollenräume: (a) Unternehmensrollen Owner, Company Admin, Finance, Member, optional Viewer; (b) fachliche Zusatzberechtigungen HR/Payroll, Genehmiger, Projektleitung, Partnerzugang; (c) interne Plattformrollen Platform Owner, Platform Admin, Support Operations, Billing Operations, Security Auditor. Rollen sind keine globalen Superuser. Ein Unternehmens-Owner erhält nie automatisch Plattformadmin-Rechte; interne Mitarbeiter erhalten keinen pauschalen Zugriff auf Mandantendaten. Least Privilege, RBAC/ABAC, Objekt- und Mandantenprüfung auf jeder API, Datenexport- und Feldberechtigungen, zeitlich begrenzte Supportfreigaben mit Begründung und Audit, Vieraugenprinzip bei sensiblen Freigaben. HR/Payroll/Kinderdaten besonders restriktiv. Admin-Identity mit phishingresistenter starker Authentifizierung, getrennten Richtlinien und kontrollierter Recovery. Normale Benutzer können Passkeys/Authenticator freiwillig nachträglich aktivieren; risikoreiche Aktionen erfordern Step-up.

## 21. Kunden-App, Admin-App und Partnerportal: klare Zuständigkeiten
Kunden-App: Self-Service für Kunden-/Auftrags-/Finanz-/Personal-/Lieferantenprozesse nach Rolle und Abo, mit verständlichen Aufgaben statt technischen Modulen. Desktop: einklappbare Sidebar, globaler Such-/Benachrichtigungs-/Avatar-Header, präzises Raster, kontextuelle Popovers und Editorseiten. Mobile/PWA: bestehende Bottom-Navigation und Floating-Plus unverändert, Touch-Flows und Bottom Sheets. Admin-App: Governance, Tenants, Tarif-/Entitlement-Konfiguration, Plattformnutzer, Audit/Sicherheit, Supportfreigaben, Billing-Überwachung, Feature Flags, Betrieb; keine routinemässige HR-/Kunden-Datenbearbeitung. Partnerportal: eng begrenzter Zugriff auf eigene Einsätze, Zeitrapporte, Belege und Rückfragen; kein Zugang zu fremden Kunden, internen Löhnen oder Margen. Kundenfreigabeportal: Angebote ansehen, annehmen/ablehnen, Fragen stellen, ohne volles Konto, mit sicherem verifizierten Link. Einheitliche Fehler-, Lade-, Offline-, Recovery- und Spracheinstellungen in allen Oberflächen.

## 22. Abo-Entitlements und Onboarding ohne Unterbruch
Eine versionierte serverseitige Tarif-/Feature-Quelle versorgt Landingpage, Preisvergleich, Checkout, Kunden-App, Adminportal und Rechnungsstellung des SaaS-Anbieters. Start/Business/Pro und Add-ons aus Kapitel 13 sind Vorschläge; tatsächliche Preise, Testdauer, Freigaben und bestehende Kundenrechte nicht stillschweigend ändern. Rechte unterscheiden (1) Benutzerrolle, (2) gekauftes Modul, (3) konkretes Objekt/Datensatz, (4) Prozesszustand; alle vier serverseitig prüfen. Modulaktivierung führt zu einer kleinen kontextuellen Einrichtung und kehrt zur ursprünglichen Aktion zurück. Upgrade/Downgrade, Kontingente, Zahlungsverzug, Kündigung, Wiederaktivierung, Export und Historienzugriff ohne Datenverlust definieren. Keine doppelte Monetarisierung bereits im Paket enthaltener Features; Kosten für Dokumentenerkennung, E-Mail, Payroll und Partnerzugänge messen und transparent kalkulieren.

## 23. Plattformweite End-to-End-Abnahme und Schnittstellenverträge
Für jede Oberfläche und Rolle: Landingpage → Registrierung → Verifizierung → Tenant/Owner → Einrichtung → Einladung → Mitarbeiteranmeldung → HR-Dossier → Zeit/Spesen → Freigabe → Payroll/Kundenverrechnung → PDF/CSV/E-Mail → Zahlung → Reporting; ebenso externer Partner → Zeitnachweis → Eingangsrechnung → Freigabe → Zahlung und Kundenweiterverrechnung. Jede Übergabe hat Datenhoheit, API-Vertrag, Status, Idempotenz, Audit, Fehler-/Recovery-Flow und Berechtigungsprüfung. Tests mit mehreren Mandanten und Rollen, grossen/kleinen Displays, DE/FR/IT/EN, unterbrochenen Flows und abgelaufenen Tokens. Bestehende V25-UX/Identity-Foundation als Quelle wiederverwenden, keine Duplikate. V26 erst nach tatsächlicher Repository-Inventur implementieren; produktive Payroll-Freigabe bleibt an fachlich validierte Engine/Parameter gebunden.

## 24. Verbindlicher V26-Implementierungsauftrag: Seiten, Menüs und Inhalte (P1)
**Dies ist ein Umsetzungsauftrag, nicht bloss ein Konzept.** Inventarisiere zuerst alle realen Routen, Unterseiten, Tabs, Dialoge und Menüs aus dem aktuellen Repository. Erstelle eine zentrale Route-/Navigationsregistrierung (bestehende Lösung bevorzugen) mit fachlichem Modul, eindeutigem Titel, Hauptaufgabe, Rollen, Entitlements, Breadcrumbs, Deep Links und Fehlerzuständen. Entferne doppelte Navigation und verwaiste Routen migrationssicher. Jede Seite zeigt nur Inhalte, die zu ihrem Menüpunkt passen. Fachliche Bearbeitung bleibt beim zuständigen Modul; verknüpfte Informationen dürfen anderswo als Kurzansicht und Link erscheinen.

### Öffentliche Landingpage und Unterseiten
- **Produkt:** Nutzen, echte Produktansichten, reale Funktionen und durchgängige Geschäftsprozesse.
- **Funktionen:** Kunden, Angebote, Rechnungen/Schweizer QR, Projekte/Zeiten, Mitarbeiter/Lohn, Spesen, Lieferanten/Partner, Berichte; jede Unterseite erklärt konkret ihren Nutzen, Voraussetzungen und zugehörigen Tarif.
- **Preise:** Start/Business/Pro und Add-ons, monatlich/jährlich, zwei Monate gratis nur wenn kommerziell bestätigt, klare Funktionsmatrix, einheitlich ausgerichtete Preis-Cards und CTA, Testphase.
- **Hilfe:** FAQ, Kontakt, Support.
- **Rechtliches:** Impressum, Datenschutz, AGB, gegebenenfalls AVV, Cookie-Einstellungen; keine erfundenen rechtlichen Zusagen.
- **Identity:** Registrierung, Anmeldung, E-Mail-Verifizierung, Passwort-Reset, Einladungsannahme; ohne überflüssige Schritte.
Landingpage, Registrierung, Checkout, Kunden-App und Adminportal verwenden dieselbe zentrale Produkt-/Tarifquelle. Keine Bewerbung nicht verfügbarer Funktionen als bereits nutzbar.

### Kunden-App: verbindliche fachliche Menüzuständigkeit
| Menü | Inhalt / Unterseiten | Abgrenzung |
|---|---|---|
| Übersicht | Offene Aufgaben, Einrichtungsstatus, wenige nützliche KPIs | Keine zweite Stammdatenverwaltung |
| Kunden | Kundenliste, Detail, Kontakte, verknüpfte Vorgänge | Rechnungen nur verlinken, nicht separat berechnen |
| Verkauf | Angebote, Aufträge, Ausgangsrechnungen, Gutschriften | Keine Eingangsrechnungen |
| Projekte | Projekte, Ressourcen, Budgets, Fortschritt | Keine individuellen Lohngeheimnisse |
| Zeiterfassung | Timer, manuelle Zeiten, Freigaben, Rapporte | Lohnzeit und Kundenverrechnung getrennt |
| Mitarbeiter | Personalakten, Verträge, Pensum, Ferien, Absenzen | Kein Ersatz für Benutzer-/Login-Verwaltung |
| Lohn | Lohnläufe, Zulagen, Abzüge, Abrechnungen, Auszahlungen | Nur Payroll-berechtigte Personen |
| Lieferanten | Externe Firmen, Personen, Verträge, Eingangsrechnungen | Nicht mit internen Mitarbeitern vermischen |
| Spesen | Belege, Einreichen, Freigeben, Erstatten, Analysen | Keine Vermischung mit Lieferantenrechnungen |
| Finanzen | Forderungen, Verbindlichkeiten, Zahlungen, Kosten, Analysen | Keine parallele Dokumentenengine |
| Berichte | Zeit-, Finanz-, Projekt-, Personal-, Spesenberichte, PDF/CSV/Teilen | Eine zentrale Berichtsgrundlage |
| Support | Ticket erstellen, Ticketverlauf, optionaler Live-Chat | Ticket startet keinen automatischen Chat |
| Einstellungen | Profil, Sicherheit, Sprache, Unternehmen, Benutzer/Rollen, Abo/Module, Geschäftsstandards | Keine doppelten Fachseiten |

Rollen- und abonnementabhängige Navigation; nicht verfügbare Module nicht als aktiv nutzbar darstellen. Mobile Bottom-Navigation und blauer Floating-Plus-Button bleiben **unverändert**. Mobile Zusatzfunktionen über bestehende Menüs/Unterseiten. Desktop erhält einklappbare Sidebar (Icon-only mit Tooltips), Suche, Glocke und Avatar im Header, ohne redundanten «Arbeitsbereich»-Text. Desktop darf andere Seitenstruktur als Mobile verwenden, bei identischen Daten und Berechtigungen.

### Mitarbeiter-Self-Service, Partnerportal und Adminportal
Mitarbeiter: «Meine Zeit», «Meine Spesen», «Meine Ferien», «Meine Lohnabrechnungen», «Mein Profil», nur eigene berechtigte Daten. Partnerportal: eigene Einsätze, Rapporte, Belege, Rückfragen und Rechnungsstatus, keine fremden Kunden oder internen Margen. Kundenfreigabeportal: konkrete Angebote/Dokumente sicher ansehen, entscheiden und Rückfragen stellen, ohne Vollkonto.

**Internes Adminportal** erhält eigene Navigation: Plattformübersicht; Unternehmen/Mandanten; Abonnements/Entitlements; interne Plattformbenutzer; Supportbetrieb; Sicherheit/Audit; Betrieb/Feature Flags/Integrationen. Interne Admins betreiben die Plattform, bearbeiten aber nicht routinemässig Personalakten oder Kundenfinanzen. Plattform- und Unternehmensrollen bleiben strikt getrennt.

## 25. Globaler Seitenvertrag, Texte und Design (P1)
Für **jede** existierende oder neu implementierte Route dokumentieren und umsetzen: Zweck, fachlicher Owner, Menüposition, Titel, Hauptaktion, relevante Informationen, Kontextaktionen, Eingabefelder, Berechtigungen, Tarif, Status, Kennzahlenquelle, Übersetzung, Empty/Loading/Error/Offline, Desktop/Tablet/Mobile/PWA, Rückkehrziel und Test. Kein Menüpunkt ohne passende Seite, keine Seite ohne nachvollziehbaren Einstieg oder bewusstes Deep-Link-Konzept. Alle Bezeichnungen in Navigation, Formularen, E-Mails, PDFs und Benachrichtigungen konsistent in DE-CH, FR, IT, EN. Sprachwahl rahmenlos `DE ˅` ohne Buttonfläche. Verbindliche V25-UX-Foundation wiederverwenden: Inter, 12px-Feldradien, semantische Farben, Toggles für binäre Einstellungen, zentrale Footer/Dialog/Popover/BottomSheet-Komponenten. Karten, Preise, Buttons, Trennlinien und Überschriften innerhalb vergleichbarer Reihen bündig ausrichten; responsive für Notebook bis 4K, Zoom und längere Übersetzungen. Keine Logo-Splashscreens bei normaler Navigation.

## 26. Ununterbrochene modulübergreifende Abläufe (P0/P1)
Für jeden Geschäftsfall: Einstieg → minimale Eingabe → sichere Vorbelegung → Voraussetzungen prüfen → Entwurf speichern → kontrollierte Freigabe → Abschluss/Versand → Status/Audit → nächste sinnvolle Aktion. Bei fehlenden Pflichtangaben direkt zum Feld führen und **zur ursprünglichen Aufgabe zurückkehren**. Kein doppeltes Erfassen. Eingaben bei Sitzungsablauf, Verbindungsfehler und Navigation sichern. Serverstatus vor Retry kritischer Aktionen prüfen; idempotente Verarbeitung. Module besitzen eigene Datenhoheit; keine direkten Schreibzugriffe in fremde Fachaggregate.

Mindestens durchgehend implementieren und testen: (a) Landingpage → Tarif → Registrierung → E-Mail-Verifizierung → Owner/Tenant → Dashboard/Readiness; (b) Mitarbeiter einladen → Konto aktivieren → Rolle → eigene Zeit/Spesen/Ferien; (c) Arbeitsvertrag → Zeiterfassung → getrennte Payroll- und Kundenverrechnungsfreigabe; (d) externe Partnerfirma → Einsatz/Zeiten → Monatsrapport → Eingangsrechnung/OCR → Vertragsabgleich → Zahlung und getrennte Kundenweiterverrechnung; (e) Angebot → Kundenfreigabe → Auftrag → Zeiten → Rechnung/QR → Zahlung; (f) Spesenfoto/PDF → Erkennung/Korrektur → Genehmigung → Erstattung; (g) Vertrags-/Lohnänderung mit Stichtag, Austritt, Gutschrift, Teilzahlung, Abo-Wechsel, gesperrte Berechtigung. HR-, Payroll- und Kinderdaten streng schützen; kein unvalidierter produktiver Lohnlauf.

## 27. Tarifintegration und wirtschaftlich sinnvolle Modularität (P1/P2)
Eine zentrale versionierte Quelle für Start/Business/Pro, Add-ons, Limits, Testphase und Entitlements speist Website, Registrierung, Checkout, App, Admin und SaaS-Abrechnung. Start = einfache CRM/Angebote/Rechnungen/Zeit; Business = Team/Projekte/Spesen/Genehmigungen; Pro = Lieferanten/Verträge/externe Ressourcen/AP/Kostenanalysen; Payroll als gesondertes kostenabhängiges Add-on nach aktiven Abrechnungen, sofern freigegeben. Überschneidungen (Pro und Partner/AP Add-on) bereinigen, keine Doppelberechnung. **Preise und bestehende Kundenverträge nicht eigenmächtig ändern**; externe OCR-/Payroll-/Payment-Kosten nur mit Freigabe aktivieren. Upgrade kehrt zum unterbrochenen Prozess zurück. Downgrade löscht keine historischen Daten. Rechte stets aus Rolle + Entitlement + Objekt + Prozesszustand serverseitig prüfen.

## 28. Umsetzung, Abnahme und Freigabe (P0–P2)
V25-Stand und offene PRs zuerst prüfen; bestehende Funktionen und freigegebene UX erhalten, keine konkurrierenden Foundations. Implementiere V26 in Feature-Branch mit nachvollziehbaren Modulpaketen: Inventur/Route-Registry → HR/Verträge → Lieferanten/Ressourcen → Zeit/Billing/AP → Payroll-Vorbereitung und fachlich validierte Engine → Seiten/Navigation aller Oberflächen → Analytics/Abos → E2E. Gezielt während der Arbeit testen, gebündelte Lint/Typecheck/Build/CI/E2E/visuelle Prüfungen am Ende; Fehlerursachen korrigieren, keine blinden Wiederholungen. Pro Seite und P0–P2-Anforderung eine Abnahmematrix mit Codepfad, API, Berechtigung, Test, Screenshot, Datenmigration, Status und offenen Blockern erstellen. **Zuerst implementieren; danach ist ein separater Analyse-/Korrekturauftrag vorgesehen.** Die nachgelagerte Analyse ersetzt keine Implementierungsabnahme. Keine produktiven Lohnberechnungen/Behördenmeldungen ohne geprüfte Schweizer Payroll-Engine und Fachfreigabe; keine Banktransfers, neuen kostenpflichtigen Dienste oder rechtlich ungeprüften Texte ohne ausdrückliche Freigabe. Merge/Deployment nur nach erfolgreichen Prüfungen innerhalb vorhandener Genehmigungen. Keine unbelegten Fertigmeldungen.
