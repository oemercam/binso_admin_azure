import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Registrieren',
  description: 'Binso One 14 Tage kostenlos testen und das Unternehmen in wenigen Schritten einrichten.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children
}
