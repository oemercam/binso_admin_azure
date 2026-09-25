export type ApiErrorPayload = {
  error?: string | { message?: string; code?: string }
}

export function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback
  const error = (payload as ApiErrorPayload).error
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object' && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}
