# V8 Release Readiness & Device Acceptance

Stand: 28. Oktober 2026. **Release BLOCKIERT.** Keine Produktionsfreigabe.

## Gesicherter Kandidat und technische Abnahme

Basis-Commit: `afaf2a91688a5714cf3c35df4050fdbbfcb481c2`.
Der Kandidat enthält weiterhin unveröffentlichte, nicht eingecheckte Änderungen.
Die lokale Sicherung liegt ausserhalb des Checkouts unter
`v8-readiness-20261028/working-state.zip`; `snapshot-manifest.json` dokumentiert
Dateien, Einzelprüfsummen, Archivprüfsumme, Git-Status und Ausschlüsse.
Sie ist ein Arbeitsstandsarchiv, kein neuer Commit und kein Produktionsartefakt.

Der geprüfte Quellfingerabdruck bleibt
`c8788bed2c67c0f33f1e1327795c6919c194d37a8c9e5795a3313a0ec4e1d09f`.
Die [technische Abnahme](quality-rsc-20261028.md) enthält die konkreten Nachweise:
94 Pflichtprogramme, Lint, Typprüfung, Build, Sicherheitsprüfungen,
PostgreSQL-Fach-/Konkurrenzprüfungen und vollständige Chromium-/WebKit-
Lokalisierung jeweils erfolgreich. Windows-WebKit ist keine Safari-Geräteabnahme.
Diese dokumentarische Fortsetzung ändert keinen Anwendungscode und wiederholt
keine bereits erfolgreichen unveränderten Prüfungen.

## Reihenfolge der weiteren Abnahme

1. Archivintegrität prüfen und Kandidat vor späterer Veröffentlichung als lokalen
   Commit eindeutig identifizieren. Bei Codeänderungen betroffene Nachweise erneuern.
2. Geräteabnahme auf einer ausdrücklich bereitgestellten, zum Kandidaten passenden
   Umgebung. Ein Test der bisherigen Live-Version qualifiziert nicht automatisch V8.
3. Echte Mail-, Identitäts- und Betriebsnachweise mit genehmigten Testkonten erheben.
   Produktive Schreibaktionen, Infrastrukturänderungen und Kosten zuerst freigeben.
4. Offene Fachgrenzen und externe Freigaben beurteilen; danach separate Entscheidung
   über Veröffentlichung und produktive Migrationen. Keine automatische Freigabe.

## Verbindliches Nachweisprotokoll

Für jeden Fall erfassen: Fall-ID, Datum/Uhrzeit, prüfende Person, Umgebung/URL,
bereitgestellter Commit und Artefaktkennung, Gerät/OS/Browser-Version, Schritte,
erwartetes und tatsächliches Ergebnis, Belegpfad und SHA-256, Fehlerkennung und
Nachprüfung. Keine Passwörter, Codes, Tokens oder personenbezogene Mailinhalte in
Screenshots/Logs übernehmen. Ergebnis: OFFEN / BESTANDEN / FEHLER / BLOCKIERT.
Nur tatsächlich ausgeführte Fälle dürfen BESTANDEN erhalten.

| Fall | Durchführung und Erfolgskriterium | Aktueller Status |
| --- | --- | --- |
| REG-01 | Echte Registrierung mit genehmigter Adresse; Bestätigungsmail tatsächlich empfangen; Link bestätigt genau das neue Konto; Login vor Bestätigung gemäss Vertrag gesperrt | OFFEN |
| REG-02 | Abgelaufener, wiederverwendeter und manipuliert veränderter Bestätigungslink abgelehnt; erneute Zustellung ohne zweites Konto | OFFEN |
| AUTH-01 | Kundenlogin mit E-Mail/Passwort und gespeichertem Passwort via Face ID; keine neue Authenticator-Pflicht; Abmelden sperrt private Ansichten/APIs | OFFEN |
| AUTH-02 | Passwort zurücksetzen mit echter Mail; alte/verbrauchte Links abgelehnt; Sitzungswiderruf und kritische Kontoänderungen nach bestehendem Sicherheitsvertrag | OFFEN |
| ADMIN-01 | Admin-/Operator-MFA serverseitig zwingend, auch direkte API; falsche Rolle und entzogener Zugriff abgelehnt; genehmigter Recovery-Weg | OFFEN |
| DEVICE-01 | Physisches iPhone: Safari und separat installierte PWA; Registrierung, Login, Formular, Sheet, Download, Zurück, Reload, Sprachwahl | OFFEN |
| DEVICE-02 | Physisches iPad: Safari und separat installierte PWA; Hoch-/Querformat, Bildschirm-/Hardwaretastatur, dieselben Kernpfade | OFFEN |
| DEVICE-03 | Je Gerät Light/Dark, Safe Areas, Tastaturöffnung/-schluss, Fokus und erreichbare Formularaktionen, 200%-Zoom, lange Übersetzungen ohne Überdeckung | OFFEN |
| DEVICE-04 | PWA schliessen/neustarten, Netzunterbruch und Wiederverbindung; Timer bleibt korrekt; keine doppelten Aktionen; nach Logout keine privaten Cache-Inhalte | OFFEN |
| DEVICE-05 | Weitere physische Android-/Tablet-/Accessibility-Nachweise gemäss bestehendem Produktionsregister; keine automatische Einschränkung auf Apple | OFFEN |
| FLOW-01 | Kundenanlage → Angebot → Auftrag → Zeit/Freigabe → Rechnung → Teil-/Vollzahlung sowie Direktrechnung; Testmandant, keine echten Finanzbuchungen | OFFEN |

## Betriebliche Freigabeschranken

Das bestehende [Produktionsregister](../../operations/production-acceptance.json)
bleibt unverändert. Alle elf Gruppen haben aktuell keinen eingetragenen,
quellstandgebundenen Freigabenachweis. Historische Nachweise müssen vor Übernahme
auf Umfang und Kandidatenbezug geprüft werden; fehlender Eintrag bedeutet nicht,
dass ein Vorgang niemals früher durchgeführt wurde.

| Register-ID | Noch benötigter tatsächlicher Nachweis / Einschränkung |
| --- | --- |
| scanner-live | Live-Virenschutz einschliesslich Ausfall-/Ablehnungsfällen; ausdrücklich zurückgestellt, keine kostenpflichtige Einrichtung. Bleibt offen, Gate nicht entfernen |
| network-live | App-/CI-Netzgrenzen, frischer Worker, DB-Erreichbarkeit und Rückweg kontrolliert nachweisen |
| full-production-qa | Unveränderlicher Release-Commit und echtes Produktionsprofil inklusive bestehender Pflichtprüfungen; lokale Exit-0-Berichte allein reichen nicht |
| restore-live | Getrennte echte Wiederherstellung: Daten-/Schemaabgleich, gemessene RPO/RTO, danach Löschung und Kosten-/Cleanup-Beleg. Historische Freigabe höchstens 5 CHF nicht als neue Ausführung deklarieren |
| alarm-delivery | Kontrollierter Alarm tatsächlich empfangen, Eskalation bestätigt |
| retention-live | Aktueller geplanter Lauf, begrenzte Berechtigungen und Überwachung nachgewiesen |
| legal-approval | Fachliche Freigabe aktueller Verträge, Datenschutz, DPA, Übersetzungen und Fachgrenzen |
| physical-devices | Obige echte Gerätefälle mit benannten Geräten/Versionen und Belegen |
| identity-ingress | Echte Operator-Rollen/MFA/Offboarding und Zurückweisung gefälschter Ingress-Identitäten |
| mail-delivery | Reale Graph-Zustellung, Postfachberechtigung und SPF/DKIM/DMARC; REG-01/02 und Reset verknüpfen |
| commercial-domain | Finanz-/Vertragsgrenzen, zulässiger Stripe-Lebenszyklus und Payroll-Grenzen fachlich abnehmen |

Nachweise werden nach Festlegung eines unveränderlichen Release-Commits separat
quellstandgebunden hinterlegt. Kein selbstreferenzielles Umschreiben des
Quellcommits für nachträgliche Belege. Kostenpflichtige Dienste bleiben gesperrt.

## Fachliche Einschränkungen und Freigabeentscheidung

Die offenen Grenzen aus der [Abrechnungsabnahme](billing-completion-acceptance.md)
bleiben bestehen: gleicher Rechnungsempfänger/Währung, begrenzte Quellenzahl,
Rabatte je Vereinbarung statt zusätzlichem vereinbarungsübergreifendem Rabatt,
explizite Rabattaufteilung, keine erfundene historische Steuerzuordnung,
CHF-Cent-Rundung ohne automatische Bargeldrundung, keine automatische Freigabe
verbrauchter Leistungen durch Gutschrift/Storno und keine automatische Ausstellung.
Weitere dort dokumentierte V8-Modul- und Betriebsgrenzen bleiben offen.

**Freigabe erst nach tatsächlichen Nachweisen, fachlicher Entscheidung über alle
offenen Schranken und ausdrücklicher Veröffentlichungserlaubnis.** Dieser Stand
ändert weder Authentifizierung, Berechnungen, Budgets, Migrationen noch Navigation.
