import type { Metadata } from 'next'
import { appIdentity } from './app-identity'

export const publicBaseUrl = new URL(appIdentity.website)

export function publicMetadata(input: { title: string; description: string; path: string }): Metadata {
  const url = new URL(input.path, publicBaseUrl)
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url.pathname },
    openGraph: {
      type: 'website',
      locale: 'de_CH',
      siteName: appIdentity.name,
      title: input.title,
      description: input.description,
      url,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${appIdentity.name} – ${appIdentity.tagline}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: ['/opengraph-image'],
    },
  }
}
