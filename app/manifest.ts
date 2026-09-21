import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Binso Admin',
    short_name: 'Binso',
    description: 'Administration, Zeiterfassung, Aufträge und Finanzen für Binso GmbH.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f5f5f7',
    theme_color: '#f5f5f7',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
    ]
  }
}
