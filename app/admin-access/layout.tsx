import type { Metadata } from 'next'
import type { ReactNode } from 'react'
export const metadata: Metadata = {
  manifest: '/admin-manifest.webmanifest', title: 'Admin-Zugang | Binso One', robots: { index: false, follow: false } }
export default function AdminAccessLayout({ children }: { children: ReactNode }) { return children }
