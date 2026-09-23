# Action and function audit — V16

Visible actions must match their actual implementation and should not be duplicated within the same context.

## Angebote
- Draft: Bearbeiten, Als versendet markieren.
- Sent: Versand erneut erfassen, Als angenommen markieren, Als abgelehnt markieren, Neue Version erstellen.
- Accepted: Auftrag öffnen/erstellen and Rechnung öffnen/erstellen.
- Declined/expired: Neue Version erstellen.
- Revised: historical version; no business action.
- Existing order/invoice is opened instead of duplicated.
- Current implementation does not send e-mail. The UI now explicitly records dispatch state only.

## Rechnungen
- Draft: Bearbeiten, Als versendet markieren.
- Sent/partial/overdue: dispatch state may be recorded again; payment can be recorded.
- Overdue: Mahnung erfassen.
- Issued invoices: credit note where applicable.
- Open issued invoices: cancellation where applicable.
- Paid/cancelled states do not expose illogical payment/cancel actions.
- Current implementation does not send e-mail; the UI says what is really stored.

## Verträge
- Existing linked order: Auftrag öffnen.
- No linked order: Auftrag erstellen.
- Active recurring contract: Nächste Rechnung erstellen.
- Direct ?view= links open the correct contract.

## Kunden
- Contact creation appears once in the Contacts section, not duplicated in quick actions.
- Quick actions remain quote, order, contract, invoice, time and note.
- Linked contracts open directly.

## Aufträge
- Nachweise owns upload/verification.
- Dokumente no longer duplicates evidence upload.
- Dokumente lists only actually linked quote/invoices and opens them directly.
- Abrechnung owns expenses/material and invoice creation.

## Other pages reviewed
- Zeiten: invoice action depends on actual billing eligibility.
- Buchhaltung: supplier invoice workflow, release/paid and CSV export have concrete handlers.
- Mitarbeitende: create/edit submit the corresponding form.
- Einstellungen: save actions and toggles mutate their corresponding settings.

## Automated guard
`npm run actions:check` scans TSX/JSX files and fails when a plain button has neither click handling nor submit/form semantics.

This is a structural code check. Browser end-to-end testing is still required for full runtime verification.
