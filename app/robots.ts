import type { MetadataRoute } from 'next'
import { publicBaseUrl, publicUrl } from '@/lib/config/seo'

const privateRoutes = [
  '/api/',
  '/account',
  '/accounting',
  '/access-denied',
  '/contracts',
  '/customers',
  '/dashboard',
  '/data',
  '/employees',
  '/finance',
  '/invoices',
  '/offline',
  '/onboarding',
  '/orders',
  '/organization',
  '/platform',
  '/post-login',
  '/quotes',
  '/register',
  '/settings',
  '/sign-in',
  '/subscription-required',
  '/support',
  '/time',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: privateRoutes,
    },
    sitemap: publicUrl('/sitemap.xml'),
    host: new URL(publicBaseUrl).origin,
  }
}
