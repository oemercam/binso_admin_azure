# Detail page and empty-state standard — V27

## Customer detail
The customer detail page now follows a clear hierarchy:
1. page title and short description
2. quick actions
3. three primary business counters in one horizontal row
4. compact general customer overview
5. contacts
6. related business transactions
7. activity history

The three counters are always:
- Angebote
- Aufträge
- Verträge

They remain on one row on Mobile/PWA.

The general overview intentionally shows only useful summary data:
- status
- main contact
- email/phone
- address
- payment term
- open amount

## Empty states
List-level empty states across the application use one compact inline row.
They must not create tall cards or multi-line placeholder blocks.

Examples:
- Keine Kontakte erfasst
- Keine Geschäftsvorgänge vorhanden
- Keine Aktivitäten vorhanden
- Keine Treffer
- Keine offenen Hinweise

Full-page error/not-found states may still use the larger `empty-state` component because they represent a different page-level situation.
