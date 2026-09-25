import type { MetadataRoute } from 'next'
import { appIdentity } from '@/lib/config/app-identity'

const paths = ['/', '/features', '/how-it-works', '/pricing', '/security', '/faq', '/contact', '/legal/terms', '/legal/privacy', '/legal/cookies', '/legal/imprint']

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: new URL(path, appIdentity.website).toString(),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/pricing' || path === '/features' ? 0.8 : 0.6,
  }))
}
