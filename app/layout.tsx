import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AppProviders } from '@/components/providers/app-providers'
import './app-ui.css'
import { appIdentity } from '@/lib/config/app-identity'

export const metadata: Metadata = {
  title: {
    default: appIdentity.name,
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
  robots: {
    index: false,
    follow: false,
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
