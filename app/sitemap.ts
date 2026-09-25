import type { MetadataRoute } from 'next'
import { appIdentity } from '@/lib/config/app-identity'
import { publicSite } from '@/lib/config/public-site'

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSite.sitemapRoutes.map((path) => ({
    url: new URL(path, appIdentity.website).toString(),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/pricing' || path === '/features' ? 0.8 : 0.6,
  }))
}
