import packageJson from '@/package.json'

export const appIdentity = {
  name: 'Binso Admin',
  shortName: 'Binso',
  company: 'Binso GmbH',
  description: 'Administration, Verkauf, Zeiterfassung und Finanzen für Binso GmbH.',
  supportEmail: 'oemer.cam@binso.ch',
  website: 'https://www.binso.ch',
  version: packageJson.version,
  build: process.env.NEXT_PUBLIC_BUILD_ID?.trim() || 'local',
  buildDate: process.env.NEXT_PUBLIC_BUILD_DATE?.trim() || '',
  environment: process.env.NEXT_PUBLIC_APP_ENV?.trim() || process.env.NODE_ENV || 'development',
} as const
