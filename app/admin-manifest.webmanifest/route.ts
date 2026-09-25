export function GET() {
  return Response.json({
    id: '/admin-app',
    name: 'Binso One Admin',
    short_name: 'Binso Admin',
    description: 'Interner Plattformzugang für berechtigte Binso-Mitarbeitende.',
    start_url: '/admin-access',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0b0c0e',
    theme_color: '#0b0c0e',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, { headers: { 'Cache-Control': 'public, max-age=3600', 'Content-Type': 'application/manifest+json' } })
}
