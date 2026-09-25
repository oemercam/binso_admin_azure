import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  manifest: '/customer-manifest.webmanifest',
  title: 'Registrieren',
  description: 'Binso One 30 Tage kostenlos testen und das Unternehmen in wenigen Schritten einrichten.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children
}
