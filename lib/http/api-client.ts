import { ApiError, errorFromStatus } from '@/lib/http/errors'
import { apiErrorMessage, type ApiErrorPayload } from '@/lib/http/client-errors'

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number
  retry?: number
}

const DEFAULT_TIMEOUT = 15_000

function canRetry(method: string, attempt: number, maxRetries: number) {
  return method === 'GET' && attempt < maxRetries
}

function serverErrorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined
  const error = (payload as ApiErrorPayload).error
  return error && typeof error === 'object' && typeof error.code === 'string' ? error.code : undefined
}

async function responsePayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return undefined
  return response.json().catch(() => undefined)
}

export async function apiRequest<T>(input: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const maxRetries = Math.max(0, options.retry ?? (method === 'GET' ? 1 : 0))

  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT)

    try {
      const response = await fetch(input, {
        ...options,
        method,
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          ...(options.body ? { 'content-type': 'application/json' } : {}),
          ...options.headers,
        },
        cache: 'no-store',
      })

      const correlationId = response.headers.get('x-correlation-id') ?? undefined
      if (!response.ok) {
        const payload = await responsePayload(response)
        const mapped = errorFromStatus(response.status, correlationId)
        if (canRetry(method, attempt, maxRetries) && response.status >= 500) {
          await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)))
          continue
        }
        throw new ApiError(
          mapped.code,
          apiErrorMessage(payload, mapped.message),
          response.status,
          correlationId,
          serverErrorCode(payload),
        )
      }

      if (response.status === 204) return undefined as T
      return await response.json() as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError('timeout', 'Die Anfrage hat zu lange gedauert.')
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new ApiError('offline', 'Keine Netzwerkverbindung.')
      if (canRetry(method, attempt, maxRetries)) {
        await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)))
        continue
      }
      throw new ApiError('unknown', 'Die Anfrage konnte nicht abgeschlossen werden.')
    } finally {
      window.clearTimeout(timeout)
    }
  }
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value)
}
