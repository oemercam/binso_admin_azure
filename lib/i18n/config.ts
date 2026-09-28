export const SUPPORTED_LOCALES = ['de', 'fr', 'it', 'en', 'tr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'de'
export const LOCALE_COOKIE = 'binso_locale'
export const LOCALE_STORAGE_KEY = 'binso.locale'

export const localeMeta: Record<Locale, { short: string; label: string; htmlLang: string; intl: string }> = {
  de: { short: 'DE', label: 'Deutsch', htmlLang: 'de-CH', intl: 'de-CH' },
  fr: { short: 'FR', label: 'Français', htmlLang: 'fr-CH', intl: 'fr-CH' },
  it: { short: 'IT', label: 'Italiano', htmlLang: 'it-CH', intl: 'it-CH' },
  en: { short: 'EN', label: 'English', htmlLang: 'en-CH', intl: 'en-CH' },
  tr: { short: 'TR', label: 'Türkçe', htmlLang: 'tr-CH', intl: 'tr-CH' },
}

export function normalizeLocale(input?: string | null): Locale | null {
  if (!input) return null
  const value = input.toLowerCase().replace('_', '-')
  const base = value.split('-')[0]
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as Locale) : null
}

export function detectBrowserLocale(languages?: readonly string[] | null): Locale {
  for (const language of languages ?? []) {
    const locale = normalizeLocale(language)
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}
