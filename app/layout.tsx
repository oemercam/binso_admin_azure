import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Binso Admin', template: '%s · Binso Admin' },
  description: 'Interne Administration für Binso GmbH',
  applicationName: 'Binso Admin',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Binso Admin' },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0c0e' },
  ],
}

const themeBoot = `(()=>{try{const t=localStorage.getItem('binso-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch{}})()`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBoot }} /></head>
      <body>{children}<ServiceWorkerRegister /></body>
    </html>
  )
}
