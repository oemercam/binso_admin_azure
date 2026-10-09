# V21.5 gemessene Pipeline-Zeiten

Quelle: GitHub Jobs-/Step-Zeitstempel in `v21-5-github-baseline.json`. Runs: main Quality 37961392051, main Azure 37962814471 und V21.3 Quality 37989005761. Alle drei erfolgreich. Zeitauflösung eine Sekunde; 0 s bedeutet unter der Zeitstempelauflösung. Setup enthält Installation und Cache; eine separate Installationszeit wird nicht erfunden.

Kein kontrollierter Vorher-/Nachher-Performanceversuch: main und V21.3 haben unterschiedliche Testabdeckung und Cachezustände. Diese Messungen belegen Laufzeiten, keinen durch V21.5 verursachten Geschwindigkeitsgewinn. V21.5-CI und Kandidaten-Deployment fehlen noch.

| Stand | Job | Schritt | Gemessen |
| --- | --- | --- | --- |
| main / Quality | checks | Run ./.github/actions/setup-node | 9 s |
| main / Quality | checks | Run pnpm test | 13 s |
| main / Quality | checks | Run pnpm lint | 11 s |
| main / Quality | checks | Run pnpm typecheck | 6 s |
| main / Quality | checks | Post Run ./.github/actions/setup-node | 4 s |
| main / Quality | plan | Run actions/setup-node@v4 | 1 s |
| main / Quality | plan | Post Run actions/setup-node@v4 | 0 s |
| main / Quality | build | Run ./.github/actions/setup-node | 9 s |
| main / Quality | build | Run pnpm build | 51 s |
| main / Quality | build | Post Run ./.github/actions/setup-node | 2 s |
| main / Quality | browser (chromium) | Run ./.github/actions/setup-node | 7 s |
| main / Quality | browser (chromium) | Install one browser engine | 15 s |
| main / Quality | browser (chromium) | Scoped responsive UX and process regression | 506 s |
| main / Quality | browser (chromium) | FULL PWA restart and offline regression | 2 s |
| main / Quality | browser (chromium) | Startup, session and persistent navigation regression | 26 s |
| main / Quality | browser (chromium) | Post Run ./.github/actions/setup-node | 0 s |
| main / Quality | browser (webkit) | Run ./.github/actions/setup-node | 8 s |
| main / Quality | browser (webkit) | Install one browser engine | 28 s |
| main / Quality | browser (webkit) | Scoped responsive UX and process regression | 333 s |
| main / Quality | browser (webkit) | Startup, session and persistent navigation regression | 28 s |
| main / Quality | browser (webkit) | Post Run ./.github/actions/setup-node | 0 s |
| main / Azure | deploy | Run actions/setup-node@v4 | 3 s |
| main / Azure | deploy | Deploy to Azure App Service | 262 s |
| main / Azure | deploy | Wait for deployed worker | 98 s |
| main / Azure | deploy | Verify current production build and routes | 52 s |
| main / Azure | deploy | Post Run actions/setup-node@v4 | 0 s |
| V21.3 / Quality | checks | Run ./.github/actions/setup-node | 7 s |
| V21.3 / Quality | checks | Run pnpm test | 22 s |
| V21.3 / Quality | checks | Real isolated PostgreSQL parallel process gate | 1 s |
| V21.3 / Quality | checks | Run pnpm lint | 15 s |
| V21.3 / Quality | checks | Run pnpm typecheck | 7 s |
| V21.3 / Quality | checks | Post Run ./.github/actions/setup-node | 0 s |
| V21.3 / Quality | plan | Run actions/setup-node@v4 | 1 s |
| V21.3 / Quality | plan | Post Run actions/setup-node@v4 | 0 s |
| V21.3 / Quality | build | Run ./.github/actions/setup-node | 7 s |
| V21.3 / Quality | build | Run pnpm build | 40 s |
| V21.3 / Quality | build | Authenticated tenant, role and session HTTP gate | 5 s |
| V21.3 / Quality | build | Post Run ./.github/actions/setup-node | 0 s |
| V21.3 / Quality | browser (webkit) | Run ./.github/actions/setup-node | 10 s |
| V21.3 / Quality | browser (webkit) | Install one browser engine | 38 s |
| V21.3 / Quality | browser (webkit) | Scoped responsive UX and process regression | 404 s |
| V21.3 / Quality | browser (webkit) | Startup, session and persistent navigation regression | 29 s |
| V21.3 / Quality | browser (webkit) | Post Run ./.github/actions/setup-node | 0 s |
| V21.3 / Quality | browser (chromium) | Run ./.github/actions/setup-node | 7 s |
| V21.3 / Quality | browser (chromium) | Install one browser engine | 14 s |
| V21.3 / Quality | browser (chromium) | Scoped responsive UX and process regression | 396 s |
| V21.3 / Quality | browser (chromium) | FULL PWA restart and offline regression | 3 s |
| V21.3 / Quality | browser (chromium) | Startup, session and persistent navigation regression | 26 s |
| V21.3 / Quality | browser (chromium) | Post Run ./.github/actions/setup-node | 0 s |

Bereits verwendete Mechanismen: eingefrorener pnpm-Lockfile, pnpm-Store/Compiler-/Browser-Cache, konservative Änderungsplanung, parallele Checks/Build, ein Produktionsartefakt für beide Browser und Azure, blockierendes aggregiertes Quality-Gate. FAST bleibt auf betroffene Dateien/gezielte Suiten begrenzt; gemeinsame/Auth/Schema/CI-Änderungen erzwingen breitere RELEASE-Abdeckung. Kein Release-Gate wurde entfernt. Build-/Browserzeit ist nicht mit Wartezeit auf Runner gleichzusetzen.
