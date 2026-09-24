'use client'

import { useState, useSyncExternalStore } from 'react'
import { Checkbox } from '@/components/ui/form-controls'

const STORAGE_KEY = 'binso-cookie-preferences-v1'
const SETTINGS_EVENT = 'binso:cookie-settings'
const CONSENT_EVENT = 'binso:cookie-consent-changed'
const SERVER_SNAPSHOT = '__server__'

type Preferences = {
  necessary: true
  statistics: boolean
}

function readPreferences(raw: string | null): Preferences | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      necessary: true,
      statistics: Boolean(parsed.statistics),
    }
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

function getConsentSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY)
}

function getConsentServerSnapshot() {
  return SERVER_SNAPSHOT
}

export function CookieConsent() {
  const storedPreferences = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statistics, setStatistics] = useState(false)

  const hasSavedPreferences = storedPreferences !== null && storedPreferences !== SERVER_SNAPSHOT
  const open = settingsOpen || storedPreferences === null

  function openSettings() {
    const preferences = readPreferences(window.localStorage.getItem(STORAGE_KEY))
    setStatistics(preferences?.statistics ?? false)
    setSettingsOpen(true)
  }

  function save(nextStatistics: boolean) {
    const preferences: Preferences = { necessary: true, statistics: nextStatistics }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    window.dispatchEvent(new Event(CONSENT_EVENT))
    setStatistics(nextStatistics)
    setSettingsOpen(false)
  }

  const showPanel = open && (settingsOpen || hasSavedPreferences || storedPreferences !== SERVER_SNAPSHOT)

  return (
    <>
      <CookieSettingsEventBridge onOpen={openSettings} />
      {showPanel ? <div className="cookie-layer" role="presentation">
        <section className="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
          <div className="cookie-copy">
            <span>Datenschutz</span>
            <h2 id="cookie-title">Cookie-Einstellungen</h2>
            <p>Binso One verwendet technisch notwendige Speicher- und Anmeldefunktionen. Optionale Statistikfunktionen werden nur nach deiner Auswahl verwendet.</p>
          </div>
          {settingsOpen ? (
            <div className="cookie-settings">
              <div className="cookie-setting-row">
                <div><strong>Notwendig</strong><small>Für Anmeldung, Sicherheit, Session und grundlegende App-Funktionen.</small></div>
                <span>Immer aktiv</span>
              </div>
              <label className="cookie-setting-row">
                <div><strong>Statistik</strong><small>Reserviert für datenschutzfreundliche Nutzungsstatistiken. Derzeit ist keine Statistikfunktion aktiv.</small></div>
                <Checkbox checked={statistics} onChange={(event) => setStatistics(event.target.checked)} aria-label="Optionale Statistik zulassen" />
              </label>
            </div>
          ) : null}
          <div className="cookie-actions">
            {!settingsOpen ? <button className="button secondary" type="button" onClick={openSettings}>Einstellungen</button> : null}
            <button className="button secondary" type="button" onClick={() => save(false)}>Nur notwendige</button>
            {settingsOpen ? <button className="button primary" type="button" onClick={() => save(statistics)}>Auswahl speichern</button> : null}
          </div>
          <a className="cookie-more" href="/legal/cookies">Mehr zu Cookies und Datenschutz</a>
        </section>
      </div> : null}
    </>
  )
}

function CookieSettingsEventBridge({ onOpen }: { onOpen: () => void }) {
  useSyncExternalStore(
    (onStoreChange) => {
      const handler = () => {
        onOpen()
        onStoreChange()
      }
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
