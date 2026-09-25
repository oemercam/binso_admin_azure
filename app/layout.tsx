import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import './documents.css'
import { AppProviders } from '@/components/providers/app-providers'
import './app-ui.css'
import './standardized-ui.css'
import { appIdentity } from '@/lib/config/app-identity'
import { publicBaseUrl } from '@/lib/config/seo'

export const metadata: Metadata = {
  metadataBase: publicBaseUrl,
  title: {
    default: `${appIdentity.name} – ${appIdentity.tagline}`,
    template: `%s · ${appIdentity.name}`,
  },
  description: appIdentity.description,
  applicationName: appIdentity.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appIdentity.name,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    siteName: appIdentity.name,
    title: `${appIdentity.name} – ${appIdentity.tagline}`,
    description: appIdentity.description,
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${appIdentity.name} – ${appIdentity.tagline}` }],
  },
  twitter: { card: 'summary_large_image', title: `${appIdentity.name} – ${appIdentity.tagline}`, description: appIdentity.description, images: ['/opengraph-image'] },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#ffffff',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#0b0c0e',
    },
  ],
}

const themeBoot = `(()=>{try{const t=localStorage.getItem('binso-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch{}})()`

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>

      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
