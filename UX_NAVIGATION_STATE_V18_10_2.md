# Binso Admin v18.10.2 – Navigation & Scroll State

Central navigation behaviour:

- New route/navigation: starts at the top of the destination page.
- Browser/app Back and Forward: restores the previous scroll position of that page.
- Scroll positions are session-scoped only (`sessionStorage`), never persisted as business data.
- Query-only UI state does not reset the page position because restoration is keyed to pathname changes.
- The mobile header is shown after a route change/restoration, then resumes the normal hide-on-scroll-down / show-on-scroll-up behaviour.
- Native browser automatic scroll restoration is disabled to avoid double restoration.
- Restoration waits for the destination route to paint before applying the saved position.
