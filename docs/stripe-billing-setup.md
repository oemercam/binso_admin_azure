# Stripe Billing für Binso One

Diese Integration bezahlt das Binso-One-Abonnement. Sie erstellt keine Zahlungslinks für Rechnungen der Mandanten an deren Kunden. Dafür wäre eine getrennte Stripe-Connect-Integration mit je einem verifizierten Händlerkonto erforderlich.

## Azure App Service

Geheimnisse ausschliesslich in den App-Service-Einstellungen oder über Key Vault hinterlegen, niemals im Repository oder im Chat:

- `STRIPE_SECRET_KEY`: produktiver Live-Schlüssel des verifizierten Binso-Stripe-Kontos. Test-/Sandbox-Schlüssel werden im produktiven Binso One abgewiesen.
- `STRIPE_WEBHOOK_SECRET`: Signaturgeheimnis des unten beschriebenen Webhook-Endpunkts.
- `STRIPE_PRICE_START_MONTHLY`, `STRIPE_PRICE_START_YEARLY`
- `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_YEARLY`
- `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`
- `APP_URL`: kanonische HTTPS-Adresse der Anwendung.
- Optional `STRIPE_AUTOMATIC_TAX=true`, erst nachdem Stripe Tax und die steuerliche Konfiguration eingerichtet wurden.

Die sechs Prices müssen aktiv sein, CHF verwenden und jeweils monatlich oder jährlich mit Intervallzahl 1 wiederkehren. Angezeigte Preise und Vertragsbeträge kommen aus Stripe; produktive Beträge werden nicht erfunden. Bestehende alte Variablen ohne Monats-/Jahreszuordnung reichen nicht aus. Bestehende Vertrags-Price-IDs nicht ohne Migrationskonzept entfernen.

## Stripe Dashboard / Workbench

Webhook-URL: `<APP_URL>/api/billing/webhook`, wobei `APP_URL` bereits die vollständige HTTPS-Basisadresse enthält.
API-Version: `2026-08-26.dahlia`. Die technische Quelle der Wahrheit ist `stripeApiVersion` in `lib/server/stripe.ts`; Audit und Dokumentation müssen dazu passen.
Ereignisse:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- `customer.subscription.paused`, `customer.subscription.resumed`
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`

Customer Portal im selben Konto und Modus aktivieren. Rechnungsdownload, Zahlungsmittelverwaltung und Kündigung konfigurieren. Für Planwechsel nur die sechs zugeordneten Prices zulassen. Ein Stripe-Konto allein aktiviert weder diese Prices noch den Webhook noch das Portal. Für den produktiven Readiness-Check müssen Zahlungen und Auszahlungen im Konto freigeschaltet, die Kontodaten vollständig eingereicht, alle sechs Prices Live-Objekte, der HTTPS-Webhook aktiv und das Live-Customer-Portal als Standardkonfiguration mit Rechnungsverlauf, Zahlungsmittelverwaltung und Kündigung aktiviert sein.

## Daten und Sicherheit

Kartenangaben werden nur bei Stripe erfasst. Azure PostgreSQL speichert Checkout-Referenzen, Kunden-/Vertragszuordnung, Status, Leistungsgrenzen, tatsächliche Plattform-Zahlungseingänge und verarbeitete Ereignis-IDs. Mandanten werden über die vorher gespeicherte Customer-Zuordnung identifiziert, niemals allein über Webhook-Metadaten. Signierte Webhooks und aktuelle Stripe-Verträge sind massgebend; eine Checkout-Rückleitungs-URL aktiviert kein Konto. Wiederholungen werden dedupliziert und Änderungen transaktional verbucht. Administrative Sperren bleiben erhalten.

Selbstregistrierung erzeugt eine Testphase, keine bereits bezahlte Subscription. AGB, Datenschutzerklärung, Vereinbarung zur Auftragsbearbeitung und Unterauftragsbearbeiter-Liste sind in Binso One veröffentlicht und werden bei der Registrierung bzw. vor kostenpflichtigem Checkout versioniert bestätigt. Die finale juristische Freigabe bleibt ein organisatorischer Go-live-Punkt.

## Verifikation

`pnpm test` prüft Signaturen, NaN-/Zeitstempel-Angriffe, Checkout-Wiederholungen, Mandantenmapping, Rollback, doppelte/veraltete Ereignisse, Leistungsgrenzen und Plattform-Zahlungsverbuchung gegen PostgreSQL-Migrationen mit HTTP-Testfixtures.

Der GitHub-Workflow **Stripe Billing Configuration** liest die produktive App-Service-Konfiguration, prüft das Stripe-Konto, die sechs expliziten Monats-/Jahres-Price-IDs, den Live-Webhook und das Live-Customer-Portal. Ein erfolgreicher Audit-Job erzeugt keine Zahlung. Die sechs `STRIPE_PRICE_*_MONTHLY`/`YEARLY`-Variablen sind die produktive Quelle der Wahrheit.

Vor Änderungen an der produktiven Konfiguration werden Checkout, 3-D-Secure, Webhook-Zustellung, Wiederholung, fehlgeschlagene Zahlung, Kündigung und Customer Portal zuerst in Stripe Sandbox/Test geprüft. Der produktive Betrieb selbst verwendet ausschliesslich Live-Key, Live-Prices, Live-Webhook und Live-Customer-Portal. Der CI-Readiness-Check schlägt fehl, wenn ein Test-Key, nicht freigeschaltetes Konto, Test-Price, fehlender/fehlerhafter Webhook oder unvollständiges Portal erkannt wird. Rückerstattungen/Disputes sind nicht Teil des aktuellen Umsatzbuchungsmodells; deren kaufmännische Verbuchung benötigt eine eigene Erweiterung.
