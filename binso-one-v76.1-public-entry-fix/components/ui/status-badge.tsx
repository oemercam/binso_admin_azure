import type { ReactNode } from 'react'

type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

type Presentation = { label: string; tone: StatusTone }

const presentations: Record<string, Presentation> = {
  paid: { label: 'Bezahlt', tone: 'success' },
  accepted: { label: 'Angenommen', tone: 'success' },
  verified: { label: 'Geprüft', tone: 'success' },
  completed: { label: 'Abgeschlossen', tone: 'success' },
  active: { label: 'Aktiv', tone: 'info' },
  open: { label: 'Offen', tone: 'info' },
  sent: { label: 'Versendet', tone: 'info' },
  in_progress: { label: 'In Bearbeitung', tone: 'info' },
  partial: { label: 'Teilbezahlt', tone: 'warning' },
  review: { label: 'In Prüfung', tone: 'warning' },
  paused: { label: 'Pausiert', tone: 'warning' },
  expiring: { label: 'Läuft ab', tone: 'warning' },
  overdue: { label: 'Überfällig', tone: 'danger' },
  declined: { label: 'Abgelehnt', tone: 'danger' },
  rejected: { label: 'Abgelehnt', tone: 'danger' },
  failed: { label: 'Fehlgeschlagen', tone: 'danger' },
  blocked: { label: 'Blockiert', tone: 'danger' },
  draft: { label: 'Entwurf', tone: 'neutral' },
  prospect: { label: 'Interessent', tone: 'neutral' },
  inactive: { label: 'Inaktiv', tone: 'neutral' },
  cancelled: { label: 'Storniert', tone: 'neutral' },
  expired: { label: 'Abgelaufen', tone: 'neutral' },
  uploaded: { label: 'Hochgeladen', tone: 'info' },
  missing: { label: 'Fehlt', tone: 'warning' },
  not_required: { label: 'Nicht erforderlich', tone: 'neutral' },
}

export function statusPresentation(status: string): Presentation {
  return presentations[status] ?? { label: status, tone: 'neutral' }
}

export function StatusBadge({ status, label, className = '', children }: { status: string; label?: string; className?: string; children?: ReactNode }) {
  const presentation = statusPresentation(status)
  return <span className={`status status-${presentation.tone} ${className}`.trim()}>{children ?? label ?? presentation.label}</span>
}
