# Binso Admin v18.8.2 — Mobile Header

- Mobile header uses the same background as the page (`var(--bg)`).
- No shadow, blur, translucency or border is used.
- Header hides when scrolling down and reappears when scrolling up or near the top.
- Binso logo is rendered at 28 px height on mobile.
- The global topbar create icon does not exist.
- Mobile/PWA uses exactly one create affordance: the centre `+` in the floating pill.
- On Customers, Orders, Quotes, Invoices, Employees, Time and Accounting that `+` opens the page-specific create flow directly using `?new=1`.
- On other routes the `+` opens the global quick-create menu.
- Desktop keeps labelled page-specific create actions.
