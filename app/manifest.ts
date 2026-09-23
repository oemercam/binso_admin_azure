import type { MetadataRoute } from 'next'
import { appIdentity } from '@/lib/config/app-identity'

function versioned(path: string) {
  const build = encodeURIComponent(appIdentity.build)
  return `${path}?v=${build}`
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: appIdentity.name,
    short_name: appIdentity.shortName,
    description: appIdentity.description,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      { src: versioned('/icons/app-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: versioned('/icons/app-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: versioned('/icons/app-1024.png'), sizes: '1024x1024', type: 'image/png', purpose: 'any' },
      { src: versioned('/icons/app-maskable-192.png'), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: versioned('/icons/app-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
