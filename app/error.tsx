'use client'

import { useEffect } from 'react'
import { Icon } from '@/components/ui/icon'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Binso Admin route error', error)
  }, [error])

  return (
    <main className="app-error-screen" role="alert">
      <div className="app-error-symbol"><Icon name="warning" size={24} /></div>
      <h1>Seite konnte nicht geladen werden</h1>
      <p>Die Ansicht konnte nicht vollständig geladen werden. Du kannst sie erneut öffnen.</p>
      <div className="app-error-actions">
        <button className="button primary" type="button" onClick={reset}>Erneut versuchen</button>
        <button className="button secondary" type="button" onClick={() => window.location.assign('/dashboard')}>Zum Dashboard</button>
      </div>
    </main>
  )
}
