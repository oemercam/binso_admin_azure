import type { MetadataRoute } from 'next'
import { publicSite } from '@/lib/config/public-site'
import { publicUrl } from '@/lib/config/seo'

const priorities: Record<string, number> = {
  '/': 1,
  '/features': 0.9,
  '/pricing': 0.9,
  '/how-it-works': 0.8,
  '/security': 0.8,
  '/faq': 0.7,
  '/contact': 0.7,
  '/status': 0.5,
  '/legal/privacy': 0.3,
  '/legal/terms': 0.3,
  '/legal/cookies': 0.2,
  '/legal/imprint': 0.2,
}

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date()

  return publicSite.sitemapRoutes.map((path) => ({
    url: publicUrl(path),
    lastModified: generatedAt,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: priorities[path] ?? 0.5,
  }))
}
