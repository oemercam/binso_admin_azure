# Seiten- und Prozessprüfung 06.10.2026

## Gemeinsamer Standard
Übersichten: Kopfzeile, Hauptaktion, Suche/Filter, Tabelle. Details: Hauptinhalt und kompakte Kontext-/Aktionsleiste. Dokumente: Übersicht oder Dokument; keine gleichzeitige doppelte Darstellung. Formulare: Pflichtangaben zuerst, konsistente Speicheraktion. Mobile bleibt einspaltig.

## Korrekturen dieser Änderung
- Angebot und Rechnung wechseln zwischen Übersicht und Dokument statt permanenter Doppelanzeige.
- Bearbeitung und Dokumentöffnung stehen in der Kopfzeile; keine zweite Aktion in der Desktopleiste.
- Zahlungsstand der Rechnung zeigt bezahlt/offen.
- Kunden-/Personal-/Zahlungsdetails nutzen zwei statt drei erzwungene Spalten; redundant vorhandene linke Kurzansicht entfällt.
- Spesen-API sperrt Genehmigung/Ablehnung für Mitarbeiter und andere nicht genehmigungsberechtigte Rollen.

## Nachkorrekturen aus der Browser-Abnahme
- Leere Aktionsspalte bei bezahlten Rechnungen entfällt; Kopfaktionen liegen nebeneinander.
- Seitenwechsel im Rechnungsdokument gilt auch außerhalb des breiten Desktop-Breakpoints.
- Doppelte Speicheraktionen bei Produkten, Personal und Spesen entfernt.
- Alte Zeilen-Spaltenregeln in der Zeiterfassung entfernt; Einträge nutzen die volle Breite.
- Verrechenbare Zeiten ohne Kunden zeigen eine fehlende Zuordnung statt „Intern“.
- Spesenformulare übernehmen Datum, Kategorien und zweistellige Beträge korrekt; Kopfzeile zeigt den Mitarbeiter statt einer UUID.
- Zahlungsdetail zeigt den Status einmal, öffnet den zugehörigen Kunden und meldet Ladefehler.
- Unimplementierter Operator-Supportzugriff ist deaktiviert statt lokal als aktiv dargestellt.

- Supportlisten zeigen kurze Referenzen und melden Ladefehler.
- Finanzansicht vermeidet dreifache Betragsdarstellung; freie Zeiträume schließen den letzten Monat ein und filtern Monatswerte innerhalb der tatsächlichen Datumsgrenzen. Lange Vergleiche werden explizit als letzte 24 Monate gekennzeichnet.

## Ergänzte Abläufe
- Dokumentbearbeitung zeigt das Formular allein. Die Vorschau wird bei Bedarf über die Kopfaktion geöffnet; die doppelte Live-Vorschau entfällt.
- Dokumente: PDF mit Positionen, Summen und QR-Zahlteil; Versand über den vorhandenen Graph-Maildienst. Ein Versandauftrag wird gespeichert; identische Wiederholung verschickt nicht erneut. Nicht bestätigte Zustellung wird als Fehler ausgewiesen. Ein hängender Versand sperrt Änderungen und muss anhand des Postausgangs geklärt werden.
- Angebote: Entwurf → übergeben → angenommen/abgelehnt. Kundenentscheid wird durch eine berechtigte Person erfasst. Nur angenommene Angebote desselben Kunden und derselben Währung können einmal in eine aktive Rechnung überführt werden. Es gibt keinen neuen öffentlichen Unterschriftenprozess.
- Rechnungen: ausgestellte Dokumente sind gesperrt; unbezahlt stornierbare Rechnungen geben zugeordnete Zeiten und Spesen wieder frei. Zahlungen werden weiterhin mit dem vorhandenen Zahlungsprozess erfasst.
- Spesen: Entwurf → eingereicht → genehmigt/abgelehnt. Projektleitung darf eigene Spesen nicht selbst freigeben. Genehmigte Belege sind gesperrt; Erstattung dokumentiert eine bereits erfolgte Zahlung mit Referenz und löst keine Banküberweisung aus. Verrechenbare Spesen werden nur einmal und für passenden Kunden/Währung zugeordnet. Wiederholte Erstellung mit derselben Anfragekennung erzeugt keinen zweiten Datensatz.
- Zeiten: freigegebene, kundengebundene Zeiten können neue oder bestehende Rechnungsentwürfe ergänzen. Die verbindliche Zuordnung erfolgt atomar beim Speichern. Stundensätze sind CHF; unbeabsichtigte Übernahme als EUR wird abgewiesen.
- Team: korrekte Benutzer-/Entitlement-Abfrage, Einladungsannahme für neue und bestehende Konten, Widerruf, Benutzerlimit und Rollenprüfung. Bestehende Konten behalten ihr Passwort. Abgelaufene, widerrufene und bereits verwendete Einladungen sind gesperrt.
- Navigation und Hauptaktionen berücksichtigen Rolle, Plan und Schreibschutz; eingeschränkte Dashboard-Rollen erhalten nur erlaubte Kennzahlen. Berechtigungen werden zusätzlich serverseitig geprüft.

## Validierung und Prüfgrenzen
Die Route-Inventur und Quellcodeprüfung ist keine vollständige Live-Abnahme jeder Rolle. Automatisierte PostgreSQL-/RLS-Tests prüfen Statuswechsel, Schreibsperren, Konvertierung, Spesenfreigabe, Erstattung, Verrechnung, PDF/QR, Versand-Wiederholung/Fehler und Einladungsannahme. E-Mails werden in diesen Tests durch einen synthetischen Versand ersetzt; es werden keine Kunden angeschrieben und keine echten Zahlungen ausgelöst. Der Deployment-Check prüft zusätzlich Teamabfrage und tatsächliche PDF-Erzeugung im Produktionsruntime.

Separate Aufträge/Projekte/Lohn/MWST/Berichte-Module, vollständige Übersetzung und echter Operator-Supportzugriff sind weiterhin nicht als vollständig implementiert ausgewiesen. Graph-Konfiguration und reale Zustellung bleiben abhängig vom eingerichteten Mailkonto. Erstattung ist eine Buchungsbestätigung, keine Banking-Integration.

## Ergänzungen der Kontakt- und Ladeprüfung
- Kontakte: strukturierte Vor-/Nachnamen, Bearbeiten, Hauptkontaktwechsel und Entfernen aus der Liste. Die additive Migration erhält Kontakt-IDs; Entfernen archiviert statt Dokumentreferenzen zu löschen. Hauptkontaktwechsel ist je Kunde serialisiert.
- Zeiteinträge: Suche über Kunde/Mitarbeiter/Tätigkeit, inklusive Von-/Bis-Datumsfilter und gefilterte Gesamtdauer; manuelle Kundenzeit kann explizit nicht verrechenbar sein und einen CHF-Stundensatz erhalten. Timer und manuelles Speichern blockieren gleichzeitige Klicks.
- Konto/Firma/Dokumente: Laden und Fehler werden angezeigt; Bearbeiten und Speichern bleiben nach Ladefehlern gesperrt. Die schreibgeschützte Vorschau meldet keinen vorgetäuschten Speichererfolg. Bearbeitung aktiviert den vorhandenen Schutz beim Verlassen.
- Operator: zentrale Lade-/Fehlerdarstellung statt leeren Listen oder Nullwerten bei fehlgeschlagenen Abfragen; Planpreise stammen aus der gemeinsamen Konfiguration. Kundenkontozugriff bleibt bis zur tatsächlichen Implementierung deaktiviert.
- Bestätigungsdialoge: Fokusführung, Escape und Fokus-Rückgabe; während Kontaktentfernung ist erneutes Bestätigen gesperrt.
- Listen: Status-/Typfilter vergleichen vollständige Werte und machen die Auswahl für Hilfstechnologien sichtbar.

Validierung: PostgreSQL-Prozesstests prüfen Namenspersistenz, Hauptkontaktwechsel, Bearbeiten/Archivieren, Tenant-Isolation, Schreibrechte, Read-only sowie nicht verrechenbare Kundenzeit und Stundensätze. Produktions-Persistenzprüfung erweitert um Kontaktanlage/-bearbeitung/-archivierung in getrennten Demo-Sandboxes. Diese Tests sind keine vollständige echte Kundenreise mit E-Mail/MFA und ersetzen keine physische iPhone-PWA-Abnahme. Die bekannten fehlenden Moduloberflächen und unvollständigen Übersetzungen bleiben offen.

## Vollständiges Seiteninventar
- /agb
- /angebote
- /angebote/[id]
- /angebote/neu
- /auftragsbearbeitung
- /belege
- /benachrichtigungen
- /dashboard
- /datenschutz
- /demo
- /einstellungen
- /einstellungen/abonnement
- /einstellungen/benachrichtigungen
- /einstellungen/darstellung
- /einstellungen/datenschutz
- /einstellungen/dokumente
- /einstellungen/firma
- /einstellungen/konto
- /einstellungen/sicherheit
- /einstellungen/sprache
- /einstellungen/team
- /einladung
- /email-bestaetigen
- /finanzen
- /impressum
- /kunden
- /kunden/[id]
- /kunden/neu
- /login
- /mitarbeiter
- /mitarbeiter/[id]
- /mitarbeiter/neu
- /offline
- /operator
- /operator/[...section]
- /operator/login
- /page.tsx
- /passwort-vergessen
- /passwort-zuruecksetzen
- /portal
- /portal/login
- /portal/registrieren
- /preise
- /preview/dashboard
- /preview/rechnungen
- /preview/zeit
- /produkt
- /produkte
- /produkte/[id]
- /produkte/neu
- /rechnungen
- /rechnungen/[id]
- /rechnungen/neu
- /registrieren
- /spesen
- /spesen/[id]
- /spesen/neu
- /support
- /support/[id]
- /support/neu
- /unterauftragsbearbeiter
- /willkommen
- /zahlungen
- /zahlungen/[id]
- /zahlungen/neu
- /zeit
