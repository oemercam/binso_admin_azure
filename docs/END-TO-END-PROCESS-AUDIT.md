# End-to-end business process audit — V17

## Canonical core flow

1. **Kunde erfassen**
   - A new customer can be created with only the company name and payment terms.
   - Contact and billing data can be completed later.
   - Quote/invoice readiness checks prevent issuing documents while required recipient data is missing.

2. **Angebot als Entwurf**
   - Customer, title, validity and at least one valid line are required.
   - Draft remains editable.
   - `Als versendet markieren` records recipient, timestamp and status; it does not claim to send an e-mail.

3. **Kundenentscheid**
   - Only a sent quote can be marked accepted/declined.
   - Accepted quote becomes the commercial basis for the next step.
   - Sent/declined/expired quotes can be revised; the previous version becomes historical.

4. **Auftrag**
   - Standard path after acceptance: create/open order.
   - Repeated clicks open the existing order instead of creating another one.
   - Direct order creation without a quote remains available for work where no quote is required.
   - A direct invoice from an accepted quote remains available as an explicitly labelled shortcut for one-off/fixed-price cases.

5. **Leistung**
   - Time is entered against an order.
   - Approval/evidence rules are evaluated before billing.
   - Billable expenses/material can be linked to the customer/order.
   - Invoiced time is locked according to workflow settings.

6. **Rechnungsentwurf**
   - Invoice can be created from eligible time, expenses/material and/or manual lines.
   - Store-level validation prevents mixing another customer/order into the invoice.
   - Selected source entries must all still be billable.
   - Source time/expenses are reserved by the draft to prevent double billing.
   - Removing a sourced line from the draft releases that source again.
   - An accepted quote invoice is linked back to the quote and, when available, its order.
   - Repeated direct-invoice action opens the existing invoice instead of duplicating it.

7. **Vertragsabrechnung**
   - Only active recurring contracts can create a recurring invoice.
   - The billing period is based on the contract's next invoice date.
   - The same contract/period cannot create a second non-cancelled invoice.
   - After creation the next billing date advances by the configured interval.

8. **Rechnung ausstellen**
   - Draft is editable.
   - `Als versendet markieren` records recipient/time/status; current code does not send an e-mail.
   - Issued invoice is no longer editable in place.

9. **Offene Forderung**
   - Effective status derives overdue state from due date.
   - Payment can only be recorded against sent/partial/overdue invoices.
   - Reminder can only be documented when the invoice is overdue.
   - Payment picker excludes drafts, paid and cancelled invoices.

10. **Bezahlung**
    - Partial payment sets the invoice to partial.
    - Full payment sets it to paid.
    - Overpayment is capped at the actual open amount.
    - Payment is recorded in the customer activity history.

11. **Korrekturen**
    - Open issued invoices can be cancelled and their time/expense sources are released.
    - Issued invoices can receive a credit note.
    - Draft/cancelled documents cannot receive credit notes through the store invariant.

## Alternative paths

- **Kunde → Auftrag**: supported for work without an offer.
- **Kunde → freie Rechnung**: supported for simple one-off billing.
- **Vertrag → Auftrag → Leistung → Rechnung**: supported.
- **Vertrag → wiederkehrende Rechnung**: supported.
- **Angenommenes Angebot → Direktrechnung**: supported as an explicit shortcut, but the standard UI path prioritises the order.

## Deliberate current limitations

These are not presented as completed functionality:
- Real e-mail delivery is not active yet; the UI records dispatch status only.
- Payment entry is manual; bank reconciliation/import is not implemented.
- Data is currently held in the local demo store rather than a production database.
- Automated reminder sending is configured in settings but explicitly marked as not server-side active.

## Guard commands

- `npm run typecheck`
- `npm run lint`
- `npm run architecture:check`
- `npm run actions:check`
- `npm run process:check`
- `npm run build`
