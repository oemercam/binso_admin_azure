# QA v0.5.3

Behoben aus lokalem Next.js Production-Build:

- `/registrieren`: `useSearchParams()` wird nun innerhalb einer React `Suspense`-Boundary gerendert.
- `/checkout`: vorsorglich derselbe Fix, da auch diese Client-Komponente `useSearchParams()` verwendet.
- Beide Seiten bleiben als Server-Route bestehen und rendern die jeweilige Client-Komponente innerhalb von `Suspense`.

Erwartetes Ergebnis:
- kein `missing-suspense-with-csr-bailout` mehr für `/registrieren`
- kein entsprechender Folgefehler für `/checkout`
