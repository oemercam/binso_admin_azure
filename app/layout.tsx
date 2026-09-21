import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import './globals.css'
import './mobile-polish.css'
import './enterprise-ux.css'
import './enterprise-polish-v8.css'
import './documents.css'
import './e2e-v10.css'
import './e2e-fixes.css'
import './responsive-v11.css'
import './responsive-v12.css'
import './ux-system-v13.css'
import './platform-hardening-v14.css'
import './ux-system-v16.css'
import './fullscreen-preview-v15.css'

export const metadata: Metadata = {
  title: {
    default: 'Binso Admin',
    template: '%s · Binso Admin',
  },
  description: 'Interne Administration für Binso GmbH',
  applicationName: 'Binso Admin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Binso Admin',
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
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
