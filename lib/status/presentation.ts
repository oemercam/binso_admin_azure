export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

export type StatusPresentation = {
  label: string
  tone: StatusTone
}

const STATUS_PRESENTATIONS: Record<string, StatusPresentation> = {
  trial: { label: 'Testphase', tone: 'info' },
  invited: { label: 'Eingeladen', tone: 'info' },
  new: { label: 'Neu', tone: 'info' },
  contacted: { label: 'Kontaktiert', tone: 'info' },
  qualified: { label: 'Qualifiziert', tone: 'success' },
  pilot: { label: 'Pilot', tone: 'info' },
  converted: { label: 'Konvertiert', tone: 'success' },
  active_pilot: { label: 'Aktiver Pilot', tone: 'info' },
  pilot_review: { label: 'Pilot in Prüfung', tone: 'warning' },
  extended: { label: 'Verlängert', tone: 'warning' },
  pilot_completed: { label: 'Pilot abgeschlossen', tone: 'success' },
  not_converted: { label: 'Nicht konvertiert', tone: 'neutral' },
  investigating: { label: 'Untersuchung', tone: 'warning' },
  identified: { label: 'Ursache erkannt', tone: 'warning' },
  monitoring: { label: 'Beobachtung', tone: 'info' },
  queued: { label: 'Eingeplant', tone: 'info' },
  published: { label: 'Publiziert', tone: 'success' },
  ended: { label: 'Beendet', tone: 'neutral' },
  revised: { label: 'Ersetzt', tone: 'neutral' },
  approved: { label: 'Freigegeben', tone: 'success' },
  running: { label: 'Läuft', tone: 'info' },
  sending: { label: 'In Verarbeitung', tone: 'info' },
  pending: { label: 'Ausstehend', tone: 'warning' },
  started: { label: 'Gestartet', tone: 'info' },
  account_created: { label: 'Konto erstellt', tone: 'info' },
  uncertain: { label: 'Prüfung erforderlich', tone: 'warning' },
  paid: { label: 'Bezahlt', tone: 'success' },
  accepted: { label: 'Angenommen', tone: 'success' },
  verified: { label: 'Geprüft', tone: 'success' },
  completed: { label: 'Abgeschlossen', tone: 'success' },
  resolved: { label: 'Gelöst', tone: 'success' },
  ready: { label: 'Bereit', tone: 'success' },
  active: { label: 'Aktiv', tone: 'info' },
  open: { label: 'Offen', tone: 'info' },
  sent: { label: 'Versendet', tone: 'info' },
  in_progress: { label: 'In Bearbeitung', tone: 'info' },
  processing: { label: 'In Verarbeitung', tone: 'info' },
  requested: { label: 'Angefragt', tone: 'info' },
  uploaded: { label: 'Hochgeladen', tone: 'info' },
  partial: { label: 'Teilbezahlt', tone: 'warning' },
  review: { label: 'In Prüfung', tone: 'warning' },
  waiting_for_customer: { label: 'Wartet auf Kunde', tone: 'warning' },
  paused: { label: 'Pausiert', tone: 'warning' },
  expiring: { label: 'Läuft ab', tone: 'warning' },
  past_due: { label: 'Zahlung fällig', tone: 'warning' },
  grace_period: { label: 'Kulanzfrist', tone: 'warning' },
  missing: { label: 'Fehlt', tone: 'warning' },
  overdue: { label: 'Überfällig', tone: 'danger' },
  declined: { label: 'Abgelehnt', tone: 'danger' },
  rejected: { label: 'Abgelehnt', tone: 'danger' },
  failed: { label: 'Fehlgeschlagen', tone: 'danger' },
  blocked: { label: 'Blockiert', tone: 'danger' },
  suspended: { label: 'Gesperrt', tone: 'danger' },
  draft: { label: 'Entwurf', tone: 'neutral' },
  prospect: { label: 'Interessent', tone: 'neutral' },
  inactive: { label: 'Inaktiv', tone: 'neutral' },
  cancelled: { label: 'Storniert', tone: 'neutral' },
  closed: { label: 'Geschlossen', tone: 'neutral' },
  expired: { label: 'Abgelaufen', tone: 'neutral' },
  archived: { label: 'Archiviert', tone: 'neutral' },
  read_only: { label: 'Nur lesen', tone: 'neutral' },
  not_required: { label: 'Nicht erforderlich', tone: 'neutral' },
}

export function statusPresentation(status: string): StatusPresentation {
  return STATUS_PRESENTATIONS[status] ?? { label: status, tone: 'neutral' }
}

export function statusLabel(status: string) {
  return statusPresentation(status).label
}
