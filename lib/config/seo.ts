import type { Metadata } from 'next'
import { appIdentity } from './app-identity'
import { publicSite } from './public-site'

const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

export const publicBaseUrl = (configuredBaseUrl || appIdentity.website).replace(/\/+$/, '')

export function publicUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, `${publicBaseUrl}/`).toString()
}

type PublicMetadataOptions = {
  title: string
  description: string
  path: string
  keywords?: string[]
}

export function createPublicMetadata({
  title,
  description,
  path,
  keywords = [],
}: PublicMetadataOptions): Metadata {
  const canonical = publicUrl(path)

  return {
    title,
    description,
    keywords: [...publicSite.seo.keywords, ...keywords],
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: appIdentity.name,
      locale: 'de_CH',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}
