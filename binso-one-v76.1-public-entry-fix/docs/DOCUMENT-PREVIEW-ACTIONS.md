# Document preview action model — V15

## Principle
Every business action appears in one logical place per viewport. Zoom/view controls are kept separate from business actions.

## Invoice preview

### Header
- PDF / Print only.
- Close.

### View controls
- Zoom out.
- Current zoom percentage.
- Zoom in.
- `Einpassen`: fits the document to the available preview width. This is not an edit action.

### Mobile/PWA primary actions
Draft:
- Bearbeiten
- Senden

Sent / partial / overdue:
- Erneut senden
- Zahlung

Paid:
- Erneut senden

Cancelled:
- no business primary action

### Mobile/PWA More
Overdue:
- Mahnung senden
- Gutschrift erstellen
- Rechnung stornieren

Sent / partial:
- Gutschrift erstellen
- Rechnung stornieren

Paid:
- Gutschrift erstellen

Draft and cancelled:
- no `Mehr` menu when there are no additional useful actions.

## Rules
- Drafts are editable; issued invoices are not edited in place.
- Payments are only recorded for sent, partial or overdue invoices.
- Credit notes are only created against issued invoices.
- Cancellation is available only while an issued invoice is still open/partially paid/overdue.
- A cancelled invoice cannot be sent again.
