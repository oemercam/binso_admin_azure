import { NextResponse } from 'next/server'

export function requestId(request?: Request) {
  const supplied = request?.headers.get('x-correlation-id')?.trim()
  return supplied && /^[a-zA-Z0-9_-]{1,80}$/.test(supplied) ? supplied : crypto.randomUUID()
}

export function apiJson<T>(data: T, init?: ResponseInit, correlationId = crypto.randomUUID()) {
  const response = NextResponse.json(data, init)
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  response.headers.set('X-Correlation-Id', correlationId)
  return response
}

export function apiError(status: number, code: string, message: string, correlationId = crypto.randomUUID()) {
  return apiJson({ error: { code, message } }, { status }, correlationId)
}

export function requireSameOrigin(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new Error('invalid_origin')
  const origin = request.headers.get('origin')
  if (!origin) return
  const expected = new URL(process.env.APP_BASE_URL || request.url).origin
  if (origin !== expected) throw new Error('invalid_origin')
}

export async function readJsonBody<T>(request: Request, maxBytes = 32_768): Promise<T> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('payload_too_large')
  const text = await readTextBody(request, maxBytes)
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_json')
    return value as T
  } catch {
    throw new Error('invalid_json')
  }
}

export async function readTextBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new Error('payload_too_large') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks).toString('utf8')
}
