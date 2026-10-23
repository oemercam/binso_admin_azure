# V26 — bestätigter AP-Freigabevertrag

Nutzerentscheidung23.10.2026 zu F07. Verwendet die vorhandenen Lieferantenrechnungen, Rollen, Transaktionen, Fresh-Auth, Audit und Idempotenz. Kein neuer universeller Workflow und keine Zahlung durch Freigabe. Tatsächlichen Implementierungsstand im [Ausführungsregister](v26-execution.md) prüfen.

## Regeln

- Finanzprüfung durch aktuell berechtigte Owner/Admin/Finance im eigenen Mandanten, mit aktuellem Fachmodul und Schreibstatus. Eine Auswahl in der Oberfläche erteilt keine Berechtigung.
- Ein berechtigter Solo-Owner darf selbst freigeben. Die bestehende unabhängige Prüfung externer Zeitnachweise wird dadurch nicht geändert.
- Bei mehreren Benutzern kann eine unabhängige Vier-Augen-Prüfung aktiviert werden. Der Ersteller und der Ersteller des zur Freigabe verwendeten Abgleichs dürfen dann nicht der freigebende Benutzer sein. Die AP-Ausnahme für einen tatsächlich einzigen aktiven Benutzer gilt nur für den Owner; keine globale Lockerung anderer Freigaben.
- Rollenbezogene Betragsobergrenzen sind je Dokumentwährung konfigurierbar; keine automatische CHF/EUR-Umrechnung. Nicht konfigurierte Grenzen bedeuten keine zusätzliche Betragsobergrenze, ersetzen aber keine Rollenberechtigung. Änderungen benötigen Owner/Admin, frische Authentisierung, erwartete Policyrevision und Audit. Wirksame Policy wird im Review festgehalten.
- Standard ist null automatische Abweichungstoleranz. Mengen-, Preis-, Währungs- und Steuerabweichungen sowie ungeklärte Netto-/Totaldifferenzen blockieren. Behebung durch tatsächliche Rechnungs-/Quellkorrektur und neuen Abgleich; kein stilles Wegklicken einer Differenz.
- Freigabe bezieht sich auf die geprüfte Rechnungsrevision, unveränderte bestätigte Einkaufsquellen und saubere Belegmanifest-Revision. Änderungen an Quelle/Rechnung/Beleg/Policy verlangen erneute Prüfung.
- Explizite Freigabe mit sitzungsgebundener Fresh-Auth, erwarteten Revisionen, Server-/DB-Autorisierung, nachvollziehbarem Actor und atomarem Audit. Fehlgeschlagenes Audit darf weder Freigabe noch Reservierung hinterlassen. Gleicher Wiederholungsschlüssel erzeugt kein zweites Review.
- Dieselbe Einkaufsleistung darf nicht mehreren freigegebenen AP-Rechnungen zugeteilt werden. Kontrollierte Korrekturen und Teilmengen folgen P26; historische Nachweise werden nicht überschrieben. AR-Reservierungen und AP-Kosten bleiben getrennte Fachseiten derselben Leistung.
- Eine Rückfrage hält die Rechnung ungeklärt und speichert den begründeten Nachweis. Keine echte Nachricht ohne freigegebenen Empfänger-/Outboxprozess; Wiederholung erzeugt keinen Doppelversand.
- Keine Bankauslösung, kein Status bezahlt, keine tatsächliche Zahlung durch diese Freigabe. P25 besitzt gesonderte Zahlungsbelege und Teilzahlungen. Deren fachliche Regeln sind durch F07 noch nicht vollständig bestätigt.

## Abgrenzung und Pakete

P23 dokumentiert ausschliesslich den Abgleich und seine Abweichungen. Die erste Scheibe verarbeitet explizit ausgewählte vollständige Minutenquellen mit einheitlichem Vertrag/Preis/Steuer/Währung; abweichende Konditionsgruppen bleiben gesperrt bis P26. Manuelle Rechnungswerte funktionieren ohne OCR. Das bestehende zentrale Finanzmodul berechnet die Sollbeträge; keine zweite Preisengine.

P24 ergänzt den eigentlichen Freigabe-/Rückfrageübergang und die kleine AP-spezifische Konfiguration am bestehenden Owner. Keine zusätzliche Modulverwaltung, generische Workflow-Engine oder automatische Toleranz. Notwendige Gegenfälle: Solo-Owner, Mehrbenutzer mit/ohne Vier-Augen, Grenzen exakt/überschritten und CHF/EUR, fremder Tenant/Rolle, veraltete Policy/Rechnung/Quelle/Beleg, fehlende Fresh-Auth, Auditfehler, Replay und gleichzeitige Doppelzuordnung.

Historische offene/bezahlte Eingangsrechnungen erhalten keine fingierte V26-Freigabe. Bestandsdaten und bestehende Rechte/Preise bleiben erhalten. Produktive Migration und Deployment benötigen die gesonderte Freigabe des konkreten Release-SHAs.

P24-Umsetzung23.10.2026: Regelkonfiguration und expliziter Review-/Rückfragekern lokal implementiert/gezielt geprüft. Grenzen beziehen sich auf den Bruttogesamtbetrag. Solo bedeutet genau eine aktive Mitgliedschaft; inaktive globale Identität allein entfernt eine aktive Mitgliedschaft nicht aus der Vier-Augen-Zählung. Offene Rückfrage verlangt überarbeitete Entwurfsrevision und neuen Abgleich. Bestehende externe Time-Unabhängigkeit unverändert. Externe Benachrichtigung, Teilzahlungen und Korrekturen bleiben gesondert; siehe Ausführungsregister.
