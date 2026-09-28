'use client'

import { useState } from 'react'
import { localeMeta, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/config'
import { useLanguage } from './language-provider'

export function LanguageSelector({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const { locale, automatic, setLocale, useBrowserLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <div className={`language-selector ${compact ? 'is-compact' : ''} ${className}`.trim()} data-i18n-skip="true">
      <button
        className="language-selector-trigger"
        type="button"
        aria-label={t('Sprache ändern')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{localeMeta[locale].short}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className="language-selector-menu" role="listbox" aria-label={t('Sprache')}>
          <button
            type="button"
            role="option"
            data-locale="auto"
            aria-selected={automatic}
            onClick={() => { useBrowserLocale(); setOpen(false) }}
          >
            <span>{t('Automatisch')}</span>
            <small>AUTO</small>
          </button>
          {SUPPORTED_LOCALES.map((item) => (
            <button
              type="button"
              role="option"
              data-locale={item}
              aria-selected={!automatic && item === locale}
              key={item}
              onClick={() => { setLocale(item as Locale); setOpen(false) }}
            >
              <span>{localeMeta[item].label}</span>
              <small>{localeMeta[item].short}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
