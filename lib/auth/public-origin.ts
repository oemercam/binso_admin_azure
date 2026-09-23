import type { NextRequest } from 'next/server'

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || ''
}

function normalizeHost(value: string) {
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function isPublicHost(value: string) {
  const hostname = value.split(':')[0]?.toLowerCase() || ''
  return Boolean(hostname && hostname !== 'localhost' && hostname.includes('.'))
}

export function publicRequestOrigin(request: NextRequest) {
  const forwardedHost = normalizeHost(firstHeaderValue(request.headers.get('x-forwarded-host')))
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'))
  const azureHost = normalizeHost(process.env.WEBSITE_HOSTNAME?.trim() || '')
  const requestHost = normalizeHost(request.nextUrl.host)

  // Azure may expose the internal container host (for example <container>:8080)
  // through request.url. Only use a forwarded host when it looks externally routable.
  const host = isPublicHost(forwardedHost)
    ? forwardedHost
    : isPublicHost(azureHost)
      ? azureHost
      : requestHost

  const protocol = forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : isPublicHost(host)
      ? 'https'
      : request.nextUrl.protocol.replace(':', '')

  return `${protocol}://${host}`
}
