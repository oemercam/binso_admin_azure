import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import './documents.css'
import { AppProviders } from '@/components/providers/app-providers'
import { AppLogo } from '@/components/ui/binso-logo'
import './app-ui.css'
import './standardized-ui.css'
import './styles/product-simplicity.css'
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
  themeColor: '#ffffff',
}

const themeBoot = `(()=>{try{const appLike=matchMedia('(display-mode:standalone)').matches||innerWidth<=820;const t=localStorage.getItem('binso-theme')||'system';const d=!appLike&&(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches));document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=appLike?'light':(d?'dark':'light')}catch{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}})()`

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
        <div className="app-cold-start" aria-hidden="true">
          <AppLogo />
        </div>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
