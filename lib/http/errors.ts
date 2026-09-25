export type ApiErrorCode = 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'validation' | 'rate_limited' | 'timeout' | 'offline' | 'server' | 'unknown'

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number,
    public readonly correlationId?: string,
    public readonly serverCode?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function errorFromStatus(status: number, correlationId?: string) {
  if (status === 401) return new ApiError('unauthenticated', 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.', status, correlationId)
  if (status === 403) return new ApiError('forbidden', 'Du hast keine Berechtigung für diese Aktion.', status, correlationId)
  if (status === 404) return new ApiError('not_found', 'Der angeforderte Eintrag wurde nicht gefunden.', status, correlationId)
  if (status === 409) return new ApiError('conflict', 'Die Daten wurden zwischenzeitlich geändert. Bitte lade die Ansicht neu.', status, correlationId)
  if (status === 400 || status === 413 || status === 422) return new ApiError('validation', 'Bitte prüfe die eingegebenen Daten.', status, correlationId)
  if (status === 429) return new ApiError('rate_limited', 'Zu viele Anfragen. Bitte versuche es später erneut.', status, correlationId)
  if (status >= 500) return new ApiError('server', 'Der Dienst ist vorübergehend nicht verfügbar.', status, correlationId)
  return new ApiError('unknown', 'Die Anfrage konnte nicht abgeschlossen werden.', status, correlationId)
}
