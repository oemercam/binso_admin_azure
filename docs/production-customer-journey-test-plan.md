# Binso One – Produktiver Customer-Journey-Testplan

Stand: 5. Oktober 2026

## Umfang
Dieser Testplan prüft öffentliche Demo, echte 14-Tage-Testphase, Stripe-Aktivierung, Webhook-Verarbeitung, Berechtigungen, Customer Portal, Kündigung und Trial-Ablauf. Demo- und Produktionssitzungen dürfen dabei nicht vermischt werden.

## 1. Öffentliche Demo
1. Landingpage in einer neuen Browser-Sitzung öffnen.
2. **Demo starten** wählen.
3. Demo-Onboarding abschliessen und prüfen, dass Beispieldaten sichtbar sind.
4. **Einstellungen → Abonnement** öffnen.
5. Erwartet: Zahlungen sind in der Demo klar deaktiviert; ein Live-Stripe-Checkout kann nicht gestartet werden.
6. Demo verlassen und im selben Browser ein echtes Konto registrieren.
7. Erwartet: Demo-Session/Cookie wird entfernt und unmittelbar die echte Kontositzung verwendet.

## 2. Echte Registrierung und 14-Tage-Testphase
1. Auf der Preisseite nacheinander Start, Business und Pro auswählen.
2. Monats- und Jahresabrechnung testen.
3. Mit einer eindeutigen geschäftlichen E-Mail-Adresse registrieren.
4. Erwartet: gewählter Tarif und Abrechnungsintervall bleiben erhalten.
5. Erwartet: Für die Testphase ist keine Kreditkarte erforderlich.
6. Erwartet: Das Konto zeigt 14 Tage Testphase und CHF 0 während dieser Testphase.
7. Prüfen, dass die Bestätigungs-E-Mail über Microsoft Graph eintrifft und der darin enthaltene sechsstellige Bestätigungscode erfolgreich akzeptiert wird.
8. **Code erneut senden** prüfen; die erneute Zustellung muss funktionieren und rate-limitiert sein.

## 3. Stripe Checkout
1. Mit einem echten Testkonto **Einstellungen → Abonnement** öffnen.
2. Erwartet: Stripe wird als bereit angezeigt und alle sechs Live-Preise sind verfügbar.
3. Tarif und Intervall auswählen und zu Stripe wechseln.
4. Firmen-/Rechnungsadresse und Steuer-ID-Erfassung prüfen.
5. Genau eine kontrollierte Live-Zahlung nur mit ausdrücklicher geschäftlicher Freigabe durchführen.
6. Erwartet: Die Rückkehr von Stripe allein aktiviert das Abo nicht; massgebend ist erst der signierte Webhook.
7. Erwartet nach dem Webhook: Abo aktiv, Stripe-Kunden-/Subscription-IDs gespeichert, Tarifgrenzen aktualisiert und bezahlte Periode korrekt angezeigt.

## 4. Webhook und Idempotenz
Verarbeitung prüfen für:
- checkout.session.completed
- checkout.session.async_payment_succeeded
- checkout.session.async_payment_failed
- customer.subscription.created / updated / deleted / paused / resumed
- invoice.paid
- invoice.payment_failed
- invoice.payment_action_required

Dieselbe Event-ID erneut zustellen und prüfen, dass weder ein doppelter Billing-Eintrag noch eine doppelte Berechtigungsänderung entsteht.

## 5. Customer Portal
1. Customer Portal aus einem bezahlten Konto öffnen.
2. Rechnungsverlauf prüfen.
3. Aktualisierung des Zahlungsmittels prüfen.
4. Kündigungsmöglichkeit prüfen.
5. Prüfen, dass Tarifwechsel nicht angeboten werden, solange Binso One diese Funktion nicht ausdrücklich freigibt.
6. Kündigung auf Periodenende durchführen und prüfen, dass `cancel_at_period_end` übernommen wird, ohne den bezahlten Zugriff sofort zu entziehen.

## 6. Ablauf der Testphase
1. Testorganisation mit abgelaufenem `trial_until` und ohne Stripe-Subscription-ID erzeugen.
2. Authentifizierten Zugriff auslösen.
3. Erwartet: Subscription-Status wird `expired`, Organisation wird `read_only`.
4. Prüfen, dass Lesezugriffe weiterhin funktionieren.
5. Prüfen, dass normale Schreibzugriffe blockiert werden.
6. Prüfen, dass Billing-Aktionen weiterhin möglich sind, damit später ein Abo aktiviert werden kann.
7. Prüfen, dass keine Kundendaten gelöscht werden.

## 7. Fehlgeschlagene Zahlung
1. `invoice.payment_failed` in einer Nicht-Live-Umgebung simulieren.
2. Statusübergänge gemäss Billing-Lifecycle prüfen.
3. Sicherstellen, dass Kundendaten lesbar bleiben und keine destruktiven Aktionen erfolgen.
4. Prüfen, dass eine spätere erfolgreiche Zahlung den korrekten aktiven Abozustand wiederherstellt.

## 8. Mobile / PWA
Auf aktuellem Safari/iOS, Chrome/Android, Edge/Windows und als installierte PWA prüfen:
- Safe-Area-Abstände
- Sticky Mobile Header
- kompakt werdende Bottom-Navigation
- Tarifauswahl-Sheet
- Stripe-Weiterleitung und Rückkehr
- Tastatur- und Formularverhalten
- kein horizontaler Overflow
- Wechsel von Demo- zu Echt-Sitzung

## 9. Finale Produktions-Gates
Vor dem Go-live erforderlich:
- Quality auf `main` grün
- Azure-Deploy grün
- produktive Routenprüfung grün
- Stripe Billing Configuration grün mit `billingProductionReady=true`
- sechs gültige wiederkehrende CHF-Live-Preise
- Live-Webhook aktiv und API-Version `2026-08-26.dahlia`, entsprechend `lib/server/stripe.ts`
- standardmässiges Live-Customer-Portal aktiviert
- keine alten Preisangaben CHF 19/49/89 und keine alte 30-Tage-Testphase auf öffentlichen Seiten
