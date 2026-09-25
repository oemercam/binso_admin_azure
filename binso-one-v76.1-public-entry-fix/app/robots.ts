import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { appIdentity } from '@/lib/config/app-identity'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers()
  const host = (requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || '').split(':')[0].toLowerCase()
  const publicHost = (process.env.BINSO_PUBLIC_HOST || new URL(appIdentity.website).host).toLowerCase()
  if (host && host !== publicHost) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/platform/', '/post-login', '/onboarding', '/sign-in', '/register', '/subscription-required', '/support'] }],
    sitemap: `${appIdentity.website}/sitemap.xml`,
    host: appIdentity.website,
  }
}
