import type { MetadataRoute } from 'next'
import { appIdentity } from '@/lib/config/app-identity'

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
      { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
