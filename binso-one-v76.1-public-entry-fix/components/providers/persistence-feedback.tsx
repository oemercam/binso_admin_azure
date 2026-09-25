'use client'

import { useEffect } from 'react'
import { useFeedback } from '@/components/ui/feedback'

export function PersistenceFeedback() {
  const feedback = useFeedback()
  useEffect(() => {
    const error = () => feedback.error('Änderungen konnten nicht sicher gespeichert werden. Bitte Verbindung prüfen und Seite neu laden.')
    const conflict = () => feedback.warning('Die Daten wurden gleichzeitig in einer anderen Sitzung geändert. Bitte Seite neu laden, bevor du weiterarbeitest.')
    window.addEventListener('binso:persistence-error', error)
    window.addEventListener('binso:persistence-conflict', conflict)
    return () => {
      window.removeEventListener('binso:persistence-error', error)
      window.removeEventListener('binso:persistence-conflict', conflict)
    }
  }, [feedback])
  return null
}
