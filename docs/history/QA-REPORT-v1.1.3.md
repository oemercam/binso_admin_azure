# QA v1.1.3

## Desktop search cleanup

- Redundante quadratische Lupe links vom globalen Suchfeld auf Desktop ausgeblendet.
- Änderung ist exakt auf `.mobile-search-trigger` begrenzt.
- Mobile/PWA bleibt unverändert:
  - unter 760 px wird der Button weiterhin über die vorhandene
    `.mobile-top-action { display: grid !important; }` Regel angezeigt.
- Keine Änderungen an Sidebar, Dashboard, Suchfeld, Account-Menü oder Navigation.
