# Rollen, Seitenziele und Geschäftsabläufe

Stand: 20.10.2026. Umsetzung auf `ux/role-business-flow-consistency`, aufbauend
auf dem unveränderten PR #295 (`c4a55a134453d8b66555917408db4c59f6f21769`).
Kein Merge und kein Deployment freigegeben. Navigation, vorhandener blauer
Plus-Button, Originalreferenzen und Pflichtprüfungen bleiben erhalten.

## Verbindlicher Umfang

Die Freigabe umfasst Rollenfokus, durchgehende Geschäftsabläufe, zentrale
Daten-/Statusdefinitionen und serverseitige Durchsetzung. Stammdaten bleiben
vollständig erreichbar. Vorhandene Diagramme werden nicht entfernt; ihre Daten
müssen zur jeweiligen Kennzahl passen. Bestehende Aktionsowner bleiben massgebend.

## Rollenfokus

| Rolle | Einstieg und Rechte |
| --- | --- |
| Inhaber / Admin | Monatliche Finanzkennzahlen, Forderungen, unabhängige Freigaben, sichtbarer Kunden-/Auftragsbestand und tarifabhängiger Mitarbeiterbestand. Eigene Arbeit erscheint zusätzlich bei tatsächlichen eigenen Vorgängen. |
| Finanzen | Finanzkennzahlen, Forderungen, Rechnungen und Abrechnung. Keine Zeit-/Spesenfreigabe allein aufgrund der Finanzrolle. |
| Auftragsleitung | Eigene Arbeit, berechtigte Aufträge und unabhängige Freigaben im durch RLS begrenzten Zuordnungsbereich. Teilansicht der Finanzen ohne Accounting-Daten. |
| Mitarbeiter | Eigene Arbeitszeit, eingereichte Spesen und freigegebene Kunden/Aufträge. Kein Finanzarbeitsplatz, keine fremden Freigaben. |
| Personal | Berechtigter Mitarbeiterbestand und persönliche Einstellungen. Kein leerer Finanzarbeitsplatz und keine Rechnungsdaten. |
| Lesen | Berechtigte Geschäftsvorgänge und Bestände ohne Schreibaktionen. Finanz-Teilansicht nur aus bereits bestehenden Dokumentrechten. |

`finance-overview:read` ist eine abgeleitete Lesefähigkeit aus bestehenden
Dokument- und Finanz-/Angebots-/Rechnungsrechten, keine neue gespeicherte Rolle.
Der API-Arbeitsplatz und seine Route verwenden dieselbe Voraussetzung. Persönliche
Finanzzusammenfassungen ausserhalb dieses Arbeitsplatzes bleiben rollenbegrenzt.
Team und Abonnement folgen den Leserechten ihrer APIs; Schreiben bleibt separat.

## Seiten und Unteransichten

| Bereich | Umsetzung / bestehender Owner | Nachweis |
| --- | --- | --- |
| Übersicht | Rollenbegrenzte Finanz-/Arbeits-/Freigabedaten; echte Kunden-/Auftrags-/Mitarbeiterzahlen statt unbenutzter Props; keine doppelten Erstellungslinks; vollständige Dokumentidentität in kompakten Zeilen | Tatsächlicher Renderer sowie tatsächliche API-/Repository-Abfragen in Workspace-/Migrationstests |
| Handlungsbedarf | Zentrale Dokumentprojektion berücksichtigt Gutschriften/Rückerstattungen vor Filter und Limit; kein N+1-Nachladen einzelner Rechnungen | Fünf vollständig gutgeschriebene alte Rechnungen dürfen eine sechste tatsächlich überfällige Rechnung nicht verdecken |
| Kundenliste / Erfassung | Gemeinsame Liste inklusive Status; strukturierte Pflichtkontaktperson, Duplikatprüfung, zentraler Erfassungsfluss und Dossierziel bleiben erhalten | Bestehende Kontakt-, Duplikat-, Tenant-, Replay- und Erfassungsregressionen |
| Kundendossier / Kontakte | Vollständiger Stammdatenbereich, kompakte Kontaktidentität mit Kontaktaktionen; keine Rechnungs-Leermeldung für fehlende Rechnungsrechte | Rollenbegrenzte Workspace-Antwort und bestehende Kontaktzustände |
| Kundendossier / Vorgänge | Aufträge und Zahlungen mit direkten Detailverknüpfungen; gefilterte Gesamtliste über Alle anzeigen; Rückziel zum Kunden; Dokumenttab mit serverseitiger Suche/Pagination | Öffentliche Filter-Normalisierung plus tatsächliche SQL-Scope-/ID-Gegenfälle |
| Kundenentwicklung | Fakturiertes Volumen aus derselben gutschriftbereinigten Quelle wie die Finanzzusammenfassung; Rückerstattungen reduzieren Zahlungseingänge; zukünftige Ereignisse ausgeschlossen | Statistik-/Finanzqueries und zusätzlicher Abgleich nach Gutschrift/Rückerstattung |
| Angebote / Rechnungen / Editor | Bestehende Zustandsmaschine, Snapshots, Revisionen, PDF/QR und Zahlungsverknüpfungen erhalten; Angebotsübernahme nutzt Kunden-/Firmenfrist statt fester 30 Tage; verhandelte Positionen/Texte erhalten | Positive Fristen 0/10/45, unverändertes Ursprungsangebot sowie bestehende vollständige Dokumentprozesse |
| Finanzübersicht / Analyse | Teilansichten für bestehende Angebots-/Rechnungsrechte; Accounting-Zahlen separat geschützt; überfällige Auswahl zentral; keine doppelte Fremdwährungsanzeige | Rollenmatrix mit positiven und negativen API-Fällen |
| Finanzbegriffe / Diagramme | Fakturiertes Bruttovolumen nach Gutschriften ist als solches benannt. Zahlungseingänge, nachgewiesene Auszahlungen, Saldo und aktueller Forderungsbestand bleiben getrennt. Unvollständigkeit wird auch auf der Übersicht angezeigt | Bestehende Dezimal-, Datums-, Währungs-, Gutschrift-, Teilzahlungs- und Diagrammtests |
| Zahlungen | Suchbare, paginierte Rechnungsauswahl; exakter ID-/Nummernkontext, Restbetrag, Replay und Überzahlungsverbot erhalten; Rückziel aus Kundendossier | Auswahlnachweise und tatsächliche Zahlungsverarbeitung |
| Aufträge | Kundenscope/ID-Filter, sicherer Rückweg aus dem Dossier und transaktionsgebundene Tarifgrenze; Wiederholung einer bereits erfolgreichen Erstellung bleibt möglich | Such-/Versions-/Rollen-/Tenanttests; zusätzlich PostgreSQL-Parallelgegenfall für den letzten freien Tarifplatz |
| Zeiterfassung / Freigaben | Eigene Arbeit und serverseitige unabhängige Freigabewarteschlange getrennt; Suchauswahl für Kunde/Auftrag; keine veraltete Verzeichnisantwort nach Kontextwechsel; Timer verwendet die tatsächliche Auftrags-ID | Bestehende Timer-/Zuordnungs-/RLS-Tests und Gleichheit zwischen Übersichtszähler und Freigabewarteschlange |
| Monatsrapport | 198-Stunden- und Nachweisprozess erhalten; ein explizit ungültiger/leerer Monat darf nicht als normaler Zeiteintrag gespeichert werden | Positive Rapport-/Datei-/Scan-/Rückweisungs-/Freigabefälle und negative Monatswerte |
| Spesen | Suchbare Kundenauswahl; serverseitige Warteschlange anderer Mitarbeiter; unabhängige Genehmigung, Erstattungsnachweis und Abrechnung erhalten | Rollen-/Eigenfreigabe-/Erstattungs-/Verrechnungsgegenfälle |
| Mitarbeiter / Zuordnungen | Zeit-/Spesen-Tabs folgen Leserechten und laden erst beim Öffnen; letzte 50 Einträge mit vollständigem Listenweg und Rückziel. Personalansichten und Zuordnungsgrenzen erhalten; Zuordnungsformular verwendet native Formularvalidierung, Dirty-Guard und genau einen Fehlerowner; keine zweite schwebende Erstellung | Workforce-Regression unter eingeschränkter Datenbankrolle und zentrale Form-/Dialogtests |
| Produkte / Leistungen | Bestehende Detail-/FormSheet- und Preis-/Einheiten-/Steuerlogik erhalten; Produktkontext wird tatsächlich in Dokumentpositionen übernommen | Bestehende Produkt-/Dokument- und Listenregressionen; keine neue parallele Implementierung |
| Dateien / Vorschau | Bestehende gemeinsame Datei-, Scan-, Berechtigungs- und PDF-Owner erhalten; Dateien bleiben dem richtigen Objekt zugeordnet | Tatsächliche Upload-/Download-/Signatur-/Tenant-Gegenfälle; keine produktiven Dateien verwendet |
| Benachrichtigungen / Einstellungen | Persönliche Präferenzen bleiben persönlich; Push ohne Subscription-/Senderpfad wird nicht als funktionierend angeboten oder aktivierbar bestätigt | API lehnt Aktivierung des nicht implementierten Kanals ab; vorhandene Zustellpräferenzen werden nicht gelöscht |
| Support / Chat | Explizites Wiederöffnen abgeschlossener Tickets; keine stille Statusänderung beim Antworten; Reply-Replay verhindert doppelte Nachrichten; neue Antworten liefern ihre tatsächliche Autorenart | Tatsächliche Create/Reopen/Reply-Endpunkte mit geschlossenem Ticket, Replay, unzulässiger Aktion und fremdem Tenant |
| Einstellungen / Sicherheit / Abo | Persönliche und organisatorische Zuständigkeit erhalten; Einstiegssichtbarkeit folgt API-Leserechten; Rollenbeschreibungen versprechen keine unzulässige Verwaltung | Berechtigungsmatrix, bestehende Sicherheits-/Sitzungs-/Billingregressionen |
| Login / Registrierung / Einladung | Bestehende Auth-/OTP-/MFA-/Einladungsabläufe und zentrale Darstellung erhalten; keine neue Authentifizierungslösung | Auth-/Registrierungsregressionen und tatsächliche anonyme HTTP-Abweisung privater Methoden |
| Portal / öffentliche Seiten / Operator / Offline | Bestehende jeweiligen Seitenziele und separaten Sicherheitsgrenzen bleiben erhalten. Keine bestätigte neue fachliche Korrektur erzwungen | Vorhandene Route-/Operator-/PWA-/Auth-Verträge; neue vollständige Sichtabnahme nicht aus unverändertem Code abgeleitet |

## Zentrale technische Korrekturen

- `businessListQuery` normalisiert explizit erlaubte öffentliche Filter. Insbesondere
  ausgewählte IDs und Kundenscopes dürfen nicht vom HTTP-Wrapper verloren gehen.
  Routenfeste Einschränkungen haben Vorrang vor Benutzereingaben; SQL bleibt gebunden.
- `DirectorySelect` ist ein Datenadapter für den vorhandenen SelectControl-Owner:
  50er-Seiten, serverseitige Suche, ausgewählte ID separat nachladen, Retry und
  Sessiongrenze. Keine native Apple-Auswahl oder zweite Dropdown-Foundation.
- Der bestehende Dialog-Fokusowner registriert nur Popups von Controls innerhalb
  eines bestehenden Modals. Hintergrundsperren bleiben bestehen. Paging/Retry
  erhalten den Fokus, statt durch das Deaktivieren des fokussierten Buttons zu schliessen.
- SelectControl besitzt seine eigene Auswahlvalidierung. Field zeigt nicht zusätzlich
  die Browsermeldung des versteckten nativen Select an.
- Arbeits-/Auftrags-/Zuordnungsänderungen invalidieren die Übersicht unmittelbar.
  Unabhängige Chatänderungen laden nicht unnötig sämtliche Übersichtsdaten neu.
- Rollenabhängige Beschreibungen verändern keine Navigationsziele, Icons oder
  Gestaltung des genehmigten Plus-Buttons.

## Nachweisgrenzen

Die generierten 76-Routen-/Operator-Inventare bleiben statische Zuordnungen und
werden ausschliesslich mit den vorgesehenen Generatoren aktualisiert. Sie sind
keine pauschale Funktions- oder Sichtfreigabe.

Lokal ausgeführte Prüfungen und CI-Status werden im PR am tatsächlichen Commit
festgehalten. Der isolierte Kontrolltest verwendet echte React-Komponenten mit
synthetischem Datenadapter; die Rechte-/SQL-Prüfungen laufen separat mit echten
migrierten PostgreSQL-Abfragen beziehungsweise eingeschränkter Runtime-Rolle.

Die physische iPhone-/installierte-PWA-/OS-Tastaturabnahme, echte Mailzustellung,
Zahlungsprovider und produktive Konten werden nicht durch synthetische Prüfungen
ersetzt. Der lokale Windows-WebKit-Port meldet keine Unterstützung für die
geprüfte Overscroll-Eigenschaft; seine fehlgeschlagene Scroll-Assertion ist kein
erfolgreicher iPhone-Nachweis. Keine Schutzprüfung wurde deshalb abgeschwächt.

Die Zeithistorie verwendet 50er-Seiten mit serverseitigen Such-, Status-, Datums-
und Kontextfiltern. Zähler und Dauer werden über den gesamten berechtigten
Filterbestand berechnet. Ein synthetischer Bestand von 1101 Einträgen prüft die
letzte Seite jenseits der früheren Antwortgrenze. Der Timer zeigt nur die eigene
Tagesarbeit; Freigaben sind eine getrennte serverseitige Warteschlange.
Vor einer Integration sind alle Pflichtprüfungen und die vollständige gemeinsame
Browserabnahme erforderlich. Backend-/Berechtigungsänderungen benötigen die
vereinbarte gesonderte Prüfung. Kein automatischer Merge, kein Deployment,
keine produktive Migration und keine Änderungen an Azure/Monitoring oder PR #267.

## Lokaler Prüfstand

Erfolgreich: Typecheck, Lint, Produktionsbuild, Geschäftsprozess-/Migrationstests
(inklusive 1101 Zeiteinträgen), Workforce-RLS, Rollenmatrix, Finanz-/Statistiktests,
Workspace-Renderer, Formular-/Dialog-/Daten-/Navigations- und PDF-Regressionen,
Lokalisierung sowie sechs isolierte reale Control-Browserfälle in Chromium/Edge.
Die vollständige Browsermatrix und der echte PostgreSQL-Paralleltest bleiben
CI-Pflicht; eine physische iPhone-Abnahme bleibt separat offen.

Der bestehende Dateninventar-Generator verwendete Windows-Pfade als Schlüssel,
prüfte aber POSIX-Pfade. Er benutzt nun durchgehend POSIX-Quellpfade, wie die
anderen Inventargeneratoren. Ein temporärer Quellbaum prüft den echten Generator,
relative und Alias-Imports sowie API-/Komponenten-/Seitenzuordnung. Das aktuelle
Inventar enthält 104 APIs und 32 Client-Consumer, keine leere Ersatzinventur.