# Binso One internationalisation (V82.1.1)

## Supported languages

- German (`de`, `de-CH`) — source and fallback language
- French (`fr`, `fr-CH`)
- Italian (`it`, `it-CH`)
- English (`en`, `en-CH`)
- Turkish (`tr`, `tr-CH`)

## Selection behaviour

On the first visit Binso One resolves the language from `navigator.languages` / `navigator.language` and falls back to German when no supported language is present. A manual selection in the language selector takes precedence and is stored in local storage and a SameSite=Lax cookie. The **Automatic** option removes the manual override and immediately returns to the current browser language.

The root document `lang` attribute is kept in sync (`de-CH`, `fr-CH`, `it-CH`, `en-CH`, `tr-CH`) and the same locale is used for `Intl.NumberFormat` and `Intl.DateTimeFormat` helpers.

## UI coverage

The translation layer is global and shared by the public website, authentication and registration flows, the authenticated product, mobile/PWA surfaces, footer/navigation and common accessibility attributes. New UI copy should be added to the central catalogs in `lib/i18n/` instead of duplicating language-specific components.

Long-form legal texts remain authored in German as the authoritative source. Translated legal headings/navigation and a visible language notice are provided, but legal translations should be reviewed before they are represented as legally equivalent versions.

## Quality gates

- `pnpm run i18n:check`
- `pnpm exec playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium`
- normal lint/typecheck/build/full E2E remain mandatory before deployment.
