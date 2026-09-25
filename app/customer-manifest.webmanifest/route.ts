import { appIdentity } from '@/lib/config/app-identity'

export function GET() {
  return Response.json({
    id: '/customer-app',
    name: 'Binso One',
    short_name: 'Binso One',
    description: appIdentity.description,
    start_url: '/post-login',
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
  }, { headers: { 'Cache-Control': 'public, max-age=3600', 'Content-Type': 'application/manifest+json' } })
}
