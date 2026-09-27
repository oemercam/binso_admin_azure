# Contact Architecture
Status: TECHNICALLY PREPARED / EXTERNAL SETUP REQUIRED

Public communication uses role mailboxes, never a personal owner address. Target mailboxes: info, support, privacy, security, sales, billing, legal and no-reply at binso.ch. Runtime publication is controlled by `NEXT_PUBLIC_ROLE_CONTACTS_ENABLED`; keep it false until provisioned and verified.

Reply-To: system -> support, billing -> billing, security -> security. `no-reply` is never the only contact path.

EXTERNAL SETUP REQUIRED: Microsoft 365 mailbox creation, permissions, audit/retention and mail-flow verification.
