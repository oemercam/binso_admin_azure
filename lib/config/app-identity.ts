import packageJson from '@/package.json'
import { publicEnv } from '@/lib/config/public-env'

export const appIdentity = {
  name: 'Binso One',
  shortName: 'Binso One',
  company: 'Binso GmbH',
  description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  tagline: 'Ein klarer Ablauf für dein Unternehmen.',
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
  build: publicEnv.buildId || 'local',
  buildDate: publicEnv.buildDate,
  environment: publicEnv.appEnvironment,
} as const
