# Binso Admin v18.9 – UI Freeze verification

This release consolidates the mobile UI rules that must remain stable before backend/auth hardening.

Verified invariants:
- No global create button in the mobile topbar.
- Exactly one mobile create affordance: the centre + in MobilePillNav.
- The centre + maps contextually to customer/order/quote/invoice/employee/time/accounting creation.
- Page-level primary create actions stay on desktop but are hidden on mobile/PWA.
- Mobile topbar is flat, uses page background, has no blur/shadow/border, and hides on scroll down / returns on scroll up.
- Mobile logo is 28px high.
- Close/X uses the shared CloseButton.
- Long forms use the canonical full-screen task layout with safe areas and footer actions.
- Bottom sheets use the canonical sheet geometry and safe areas.
- Main entity lists use compact two-line rows; operational lists are bounded to compact task rows.
- Accounting supplier invoices and mandate costs use the shared CompactInfoRow.
