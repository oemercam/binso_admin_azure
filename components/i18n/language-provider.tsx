'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_STORAGE_KEY, detectBrowserLocale, localeMeta, normalizeLocale, type Locale } from '@/lib/i18n/config'
import { translateSourceText } from '@/lib/i18n/messages'

type LanguageContextValue = {
  locale: Locale
  automatic: boolean
  setLocale: (locale: Locale) => void
  resetToBrowserLocale: () => void
  t: (source: string) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${LOCALE_COOKIE}=`))
  return normalizeLocale(match?.slice(LOCALE_COOKIE.length + 1))
}

function readManualLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try { return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)) } catch { return null }
}

function browserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  return detectBrowserLocale(window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language])
}

function resolveInitialLocale(): { locale: Locale; automatic: boolean } {
  const saved = readManualLocale()
  if (saved) return { locale: saved, automatic: false }
  const cookie = readCookieLocale()
  return { locale: cookie ?? browserLocale(), automatic: true }
}

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(DEFAULT_LOCALE)
  const [automatic, setAutomatic] = useState(true)

  useEffect(() => {
    const initial = resolveInitialLocale()
    updateLocale(initial.locale)
    setAutomatic(initial.automatic)
    writeLocaleCookie(initial.locale)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    updateLocale(next)
    setAutomatic(false)
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, next) } catch {}
    writeLocaleCookie(next)
  }, [])

  const resetToBrowserLocale = useCallback(() => {
    const next = browserLocale()
    updateLocale(next)
    setAutomatic(true)
    try { window.localStorage.removeItem(LOCALE_STORAGE_KEY) } catch {}
    writeLocaleCookie(next)
  }, [])

  useEffect(() => {
    const meta = localeMeta[locale]
    document.documentElement.lang = meta.htmlLang
    document.documentElement.dataset.locale = locale
    document.documentElement.dir = 'ltr'
  }, [locale])

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    automatic,
    setLocale,
    resetToBrowserLocale,
    t: (source) => translateSourceText(source, locale),
    formatNumber: (number, options) => new Intl.NumberFormat(localeMeta[locale].intl, options).format(number),
    formatDate: (input, options) => new Intl.DateTimeFormat(localeMeta[locale].intl, options).format(new Date(input)),
  }), [automatic, locale, resetToBrowserLocale, setLocale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}
