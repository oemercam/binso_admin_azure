import packageJson from '@/package.json'

export const appIdentity = {
  name: 'Binso One',
  shortName: 'Binso One',
  company: 'Binso GmbH',
  description: 'Die Business-Plattform von Binso GmbH für Kunden, Aufträge, Zeit, Abrechnung und Finanzen.',
  supportEmail: 'oemer.cam@binso.ch',
  website: 'https://www.binso.ch',
  version: packageJson.version,
  build: process.env.NEXT_PUBLIC_BUILD_ID?.trim() || 'local',
  buildDate: process.env.NEXT_PUBLIC_BUILD_DATE?.trim() || '',
  environment: process.env.NEXT_PUBLIC_APP_ENV?.trim() || process.env.NODE_ENV || 'development',
} as const
