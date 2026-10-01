# Mobile/PWA Visual QA v1.8.0

## Referenz

Freigegebenes Binso-One-Mobile-App-Mockup mit den Bereichen Splash/Login/Onboarding, App Shell, Modulübersicht, Suche/Filter, Listen, Detailseiten, Quick Create, Zeiterfassung, Einstellungen, Design-System, Feedback sowie Light/Dark.

## Umgesetzte Parität

- App-first Bottom Navigation
- Dashboard mit Begrüssung/KPIs/Aktivitäten
- separate Modulübersicht
- kompakte Suche/Filter/Sortierung
- flache Listen mit 1–2 Informationszeilen
- Back-/Action-Topbar auf Details und Formularen
- progressive Quick-Create-Formulare
- Bottom Sheets
- prominenter Timer + globaler Timerindikator
- kompakte Einstellungen/Profile
- Top-Toasts und App-States
- exakte Schwarz/Weiss-Grundflächen in Light/Dark

## Viewports

Die CSS-/Layout-Verträge decken 375, 390, 393 und 430 px sowie Safe Areas und geringe Höhen ab.

## Ausführung

Statische Visual-/Contract-Selfchecks: PASS.
Echte Browser-/Screenshot-Regression in dieser Sandbox: NOT EXECUTED, da die Projekt-Abhängigkeiten hier nicht installiert werden können. Vor Release muss der lokale/CI-Build plus echte Mobile-PWA-Sichtprüfung durchgeführt werden.
