import Link from 'next/link'
import { ErrorState } from '@/components/ui/error-state'

export default function NotFound() {
  return (
    <ErrorState
      title="Seite nicht gefunden"
      description="Die angeforderte Seite existiert nicht oder wurde verschoben."
      actions={<Link className="button primary" href="/dashboard">Zum Dashboard</Link>}
    />
  )
}
