# V70 – Public Entry, Authentication and Trust Pages

V70 turns the former dashboard redirect at `/` into the public Binso One product entry and keeps the protected application separated from the public website.

## Public entry

- `/` – product landing page with workflow, modules, pricing preview, FAQ and CTA.
- `/features` – functional overview.
- `/how-it-works` – end-to-end business flow.
- `/pricing` – Starter, Business, Professional and Enterprise plans.
- `/faq`, `/support`, `/contact`, `/security`, `/status` – trust and service pages.
- `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/imprint` – legal foundation.

## Authentication

`/sign-in` uses one implementation with three presentation modes:

- Desktop: split product/login layout.
- Mobile browser: focused single-column login.
- Installed PWA: app-like standalone login with safe-area handling and no marketing panel.

The Web App Manifest starts at `/post-login`. That route routes authenticated users into their organization and unauthenticated users to `/sign-in`.

## Registration

`/register` remains connected to the existing Azure/External-ID authentication and database-backed registration flow. The unauthenticated state now explains the three-step entry clearly. No payment is collected at account creation.

## Cookies and privacy

The public website includes a local consent control for necessary storage and a reserved optional statistics category. No analytics integration is activated by V70. The legal pages describe the current architecture (Azure, Microsoft-based identity, Stripe capability, Microsoft Graph capability) and must be legally reviewed before public commercial launch.

## SEO boundary

The root site is indexable. The protected `(app)` route group explicitly remains `noindex, nofollow`.
