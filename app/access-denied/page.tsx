import Link from 'next/link'
import { ErrorState } from '@/components/ui/error-state'

export default function AccessDeniedPage() {
  return (
    <ErrorState
      title="Kein Zugriff"
      description="Du hast keine Berechtigung, diesen Inhalt anzuzeigen."
      actions={<Link className="button primary" href="/dashboard">Zum Dashboard</Link>}
    />
  )
}
