'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Icon,
  type IconName,
} from '@/components/ui/icon'

type ThemePreference =
  | 'system'
  | 'light'
  | 'dark'

function applyTheme(
  preference: ThemePreference,
) {
  const isDark =
    preference === 'dark' ||
    (
      preference === 'system' &&
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
    )

  document.documentElement.dataset.theme =
    isDark ? 'dark' : 'light'

  document.documentElement.style.colorScheme =
    isDark ? 'dark' : 'light'
}

export default function SettingsPage() {
  const [theme, setTheme] =
    useState<ThemePreference>('system')

  const [pushEnabled, setPushEnabled] =
    useState(false)

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem(
        'binso-theme',
      ) as ThemePreference | null) ??
      'system'

    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  function changeTheme(
    preference: ThemePreference,
  ) {
    setTheme(preference)

    localStorage.setItem(
      'binso-theme',
      preference,
    )

    applyTheme(preference)
  }

  const settingItems: Array<{
    icon: IconName
    title: string
    text: string
  }> = [
    {
      icon: 'user',
      title: 'Profil',
      text: 'Persönliche Angaben und Benutzerinformationen.',
    },
    {
      icon: 'settings',
      title: 'Darstellung',
      text: 'Systemdarstellung sowie Hell- und Dunkelmodus.',
    },
    {
      icon: 'warning',
      title: 'Benachrichtigungen',
      text: 'Push-Benachrichtigungen für Fälligkeiten und Monatsabschluss.',
    },
    {
      icon: 'building',
      title: 'Unternehmen',
      text: 'Firmenangaben, Rechnungsinformationen und Stammdaten.',
    },
  ]

  return (
    <section className="page">
      <PageHeader
        eyebrow="KONTO"
        title="Einstellungen"
        description="Profil, Darstellung und Benachrichtigungen verwalten."
      />

      <div className="settings-grid">
        <article className="panel setting-card">
          <span className="setting-icon">
            <Icon
              name="user"
              size={17}
            />
          </span>

          <div>
            <h2>Profil</h2>

            <p>
              Dein angemeldetes Microsoft-Konto und
              persönliche Einstellungen.
            </p>

            <dl className="summary compact profile-summary">
              <div>
                <dt>Name</dt>
                <dd>Ömer Cam</dd>
              </div>

              <div>
                <dt>Rolle</dt>
                <dd>Admin</dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>
                  <span className="status status-good">
                    Aktiv
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="panel setting-card">
          <span className="setting-icon">
            <Icon
              name="settings"
              size={17}
            />
          </span>

          <div>
            <h2>Darstellung</h2>

            <p>
              Die App kann automatisch die
              Systemeinstellung von iOS, Android oder
              Windows übernehmen.
            </p>

            <div
              className="segmented"
              aria-label="Darstellung auswählen"
            >
              <button
                type="button"
                aria-pressed={theme === 'system'}
                onClick={() =>
                  changeTheme('system')
                }
              >
                System
              </button>

              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() =>
                  changeTheme('light')
                }
              >
                Hell
              </button>

              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() =>
                  changeTheme('dark')
                }
              >
                Dunkel
              </button>
            </div>
          </div>
        </article>

        <article className="panel setting-card">
          <span className="setting-icon">
            <Icon
              name="warning"
              size={17}
            />
          </span>

          <div>
            <h2>Push-Benachrichtigungen</h2>

            <p>
              Erinnerungen zu Monatsabschluss,
              Stundenbudgets und fälligen Rechnungen.
            </p>

            <button
              type="button"
              className={
                pushEnabled
                  ? 'button secondary'
                  : 'button primary'
              }
              onClick={() =>
                setPushEnabled(
                  (current) => !current,
                )
              }
            >
              {pushEnabled
                ? 'Push deaktivieren'
                : 'Push aktivieren'}
            </button>
          </div>
        </article>

        <article className="panel setting-card">
          <span className="setting-icon">
            <Icon
              name="building"
              size={17}
            />
          </span>

          <div>
            <h2>Unternehmen</h2>

            <p>
              Grunddaten für Binso GmbH und spätere
              Rechnungsdokumente.
            </p>

            <dl className="summary compact">
              <div>
                <dt>Firma</dt>
                <dd>Binso GmbH</dd>
              </div>

              <div>
                <dt>Ort</dt>
                <dd>9050 Appenzell</dd>
              </div>

              <div>
                <dt>Währung</dt>
                <dd>CHF</dd>
              </div>
            </dl>
          </div>
        </article>
      </div>

      <div
        className="settings-grid"
        style={{ marginTop: 10 }}
      >
        {settingItems.map((item) => (
          <article
            key={item.title}
            className="panel"
          >
            <div className="entity">
              <span className="entity-avatar">
                <Icon
                  name={item.icon}
                  size={16}
                />
              </span>

              <span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
