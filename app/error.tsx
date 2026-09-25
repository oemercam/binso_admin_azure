'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/ui/error-state'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()

  useEffect(() => {
    void fetch('/api/monitoring/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ digest: error.digest, name: error.name, path: window.location.pathname }),
      keepalive: true,
    }).catch(() => undefined)
  }, [error])

  return (
    <ErrorState
      title="Seite konnte nicht geladen werden"
      description="Die Ansicht konnte nicht vollständig geladen werden. Du kannst sie erneut öffnen."
      referenceId={error.digest}
      actions={(
        <>
          <button className="button primary" type="button" onClick={reset}>Erneut versuchen</button>
          <button className="button secondary" type="button" onClick={() => router.push('/dashboard')}>Zum Dashboard</button>
        </>
      )}
    />
  )
}
