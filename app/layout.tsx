import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import './documents.css'
import { AppProviders } from '@/components/providers/app-providers'
import './app-ui.css'
import { appIdentity } from '@/lib/config/app-identity'
import { publicSite } from '@/lib/config/public-site'
import { publicBaseUrl } from '@/lib/config/seo'

export const metadata: Metadata = {
  metadataBase: new URL(publicBaseUrl),
  title: {
    default: `${publicSite.seo.defaultTitle} · ${appIdentity.name}`,
    template: `%s · ${appIdentity.name}`,
  },
  description: publicSite.seo.description,
  keywords: publicSite.seo.keywords,
  applicationName: appIdentity.name,
  category: 'business',
  creator: appIdentity.company,
  publisher: appIdentity.company,
  authors: [{ name: appIdentity.company, url: appIdentity.website }],
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: `${publicSite.seo.defaultTitle} · ${appIdentity.name}`,
    description: publicSite.seo.description,
    siteName: appIdentity.name,
    locale: 'de_CH',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${publicSite.seo.defaultTitle} · ${appIdentity.name}`,
    description: publicSite.seo.description,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appIdentity.name,
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
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
