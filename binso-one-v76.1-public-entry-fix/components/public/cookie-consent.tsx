'use client'

import { useState, useSyncExternalStore } from 'react'
import { Checkbox } from '@/components/ui/form-controls'
import { CloseButton } from '@/components/ui/close-button'

const STORAGE_KEY = 'binso-cookie-preferences-v1'
const SETTINGS_EVENT = 'binso:cookie-settings'
const CONSENT_EVENT = 'binso:cookie-consent-changed'
const SERVER_SNAPSHOT = '__server__'
const OPTIONAL_ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_OPTIONAL_ANALYTICS === 'true'

type Preferences = { necessary: true; statistics: boolean }

function readPreferences(raw: string | null): Preferences | null {
  if (!raw || raw === SERVER_SNAPSHOT) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return { necessary: true, statistics: Boolean(parsed.statistics) }
  } catch {
    return null
  }
}

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(CONSENT_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(CONSENT_EVENT, onStoreChange)
  }
}

function getConsentSnapshot() { return window.localStorage.getItem(STORAGE_KEY) }
function getConsentServerSnapshot() { return SERVER_SNAPSHOT }

export function CookieConsent() {
  const storedPreferences = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getConsentServerSnapshot)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statistics, setStatistics] = useState(false)
  const clientReady = storedPreferences !== SERVER_SNAPSHOT
  const preferences = readPreferences(storedPreferences)
  const showBanner = OPTIONAL_ANALYTICS_ENABLED && clientReady && !preferences && !settingsOpen

  function openSettings() {
    const saved = readPreferences(window.localStorage.getItem(STORAGE_KEY))
    setStatistics(saved?.statistics ?? false)
    setSettingsOpen(true)
  }

  function save(nextStatistics: boolean) {
    const next: Preferences = { necessary: true, statistics: OPTIONAL_ANALYTICS_ENABLED && nextStatistics }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(CONSENT_EVENT))
    setStatistics(next.statistics)
    setSettingsOpen(false)
  }

  return (
    <>
      <CookieSettingsEventBridge onOpen={openSettings} />

      {showBanner ? (
        <aside className="cookie-banner" aria-labelledby="cookie-banner-title">
          <div className="cookie-banner-copy">
            <span>Datenschutz</span>
            <h2 id="cookie-banner-title">Optionale Statistik nur mit Zustimmung.</h2>
            <p>Notwendige Funktionen sind für Anmeldung und sicheren Betrieb erforderlich. Statistik aktivieren wir nur, wenn du zustimmst.</p>
            <a href="/legal/cookies">Mehr erfahren</a>
          </div>
          <div className="cookie-banner-actions">
            <button className="button primary" type="button" onClick={() => save(true)}>Alle akzeptieren</button>
            <button className="button secondary" type="button" onClick={() => save(false)}>Nur notwendige</button>
            <button className="cookie-text-action" type="button" onClick={openSettings}>Einstellungen</button>
          </div>
        </aside>
      ) : null}

      {settingsOpen ? (
        <div className="cookie-settings-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
          <section className="cookie-settings-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
            <header className="cookie-settings-head">
              <div>
                <span>Datenschutz</span>
                <h2 id="cookie-settings-title">Cookie-Einstellungen</h2>
                <p>{OPTIONAL_ANALYTICS_ENABLED ? 'Du entscheidest, ob optionale Statistik verwendet werden darf.' : 'Aktuell verwendet Binso One auf der öffentlichen Website keine optionalen Statistik-Cookies.'}</p>
              </div>
              <CloseButton className="cookie-close" variant="compact" ariaLabel="Cookie-Einstellungen schliessen" onClick={() => setSettingsOpen(false)} />
            </header>

            <div className="cookie-settings-list">
              <div className="cookie-preference-row">
                <div><strong>Notwendig</strong><small>Anmeldung, Sicherheit, Session und grundlegende Website- und App-Funktionen.</small></div>
                <span className="cookie-always-on">Immer aktiv</span>
              </div>
              {OPTIONAL_ANALYTICS_ENABLED ? (
                <label className="cookie-preference-row">
                  <div><strong>Statistik</strong><small>Hilft uns zu verstehen, welche öffentlichen Seiten genutzt werden. Erst nach deiner Zustimmung aktiv.</small></div>
                  <Checkbox checked={statistics} onChange={(event) => setStatistics(event.target.checked)} aria-label="Optionale Statistik zulassen" />
                </label>
              ) : null}
            </div>

            <footer className="cookie-settings-footer">
              <a href="/legal/cookies">Cookie-Informationen</a>
              <div>
                {OPTIONAL_ANALYTICS_ENABLED ? <button className="button secondary" type="button" onClick={() => save(false)}>Nur notwendige</button> : null}
                <button className="button primary" type="button" onClick={() => OPTIONAL_ANALYTICS_ENABLED ? save(statistics) : setSettingsOpen(false)}>{OPTIONAL_ANALYTICS_ENABLED ? 'Auswahl speichern' : 'Schliessen'}</button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  )
}

function CookieSettingsEventBridge({ onOpen }: { onOpen: () => void }) {
  useSyncExternalStore(
    (onStoreChange) => {
      const handler = () => { onOpen(); onStoreChange() }
      window.addEventListener(SETTINGS_EVENT, handler)
      return () => window.removeEventListener(SETTINGS_EVENT, handler)
    },
    () => 'client',
    () => 'server',
  )
  return null
}

export function CookieSettingsButton() {
  return <button className="public-footer-link-button" type="button" onClick={() => window.dispatchEvent(new Event(SETTINGS_EVENT))}>Cookie-Einstellungen</button>
}
