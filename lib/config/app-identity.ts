import packageJson from '@/package.json'

export const appIdentity = {
  name: 'Binso One',
  shortName: 'Binso One',
  company: 'Binso GmbH',
  description: 'Die zentrale Business-Plattform für Kunden, Angebote, Aufträge, Zeiterfassung, Rechnungen und Zusammenarbeit.',
  tagline: 'Dein Unternehmen. Eine Plattform.',
  supportEmail: 'oemer.cam@binso.ch',
  phoneDisplay: '+41 58 510 77 58',
  phoneHref: 'tel:+41585107758',
  website: 'https://www.binso.ch',
  websiteDisplay: 'www.binso.ch',
  address: {
    street: 'Weissbadstrasse 8b',
    postalCode: '9050',
    city: 'Appenzell',
    country: 'Schweiz',
  },
  version: packageJson.version,
  build: process.env.NEXT_PUBLIC_BUILD_ID?.trim() || 'local',
  buildDate: process.env.NEXT_PUBLIC_BUILD_DATE?.trim() || '',
  environment: process.env.NEXT_PUBLIC_APP_ENV?.trim() || process.env.NODE_ENV || 'development',
} as const
