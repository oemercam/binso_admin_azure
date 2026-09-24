import { appIdentity } from './app-identity'

export const publicSite = {
  primaryNavigation: [
    { href: '/features', label: 'Funktionen' },
    { href: '/how-it-works', label: 'Ablauf' },
    { href: '/pricing', label: 'Preise' },
    { href: '/security', label: 'Sicherheit' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Kontakt' },
  ],
  productNavigation: [
    { href: '/features', label: 'Funktionen' },
    { href: '/how-it-works', label: 'So funktioniert es' },
    { href: '/pricing', label: 'Preise' },
    { href: '/security', label: 'Sicherheit' },
    { href: '/status', label: 'Systemstatus' },
  ],
  helpNavigation: [
    { href: '/faq', label: 'FAQ' },
    { href: '/support', label: 'Support' },
    { href: '/contact', label: 'Kontakt' },
    { href: '/sign-in', label: 'Anmelden' },
    { href: '/register', label: 'Registrieren' },
  ],
  legalNavigation: [
    { href: '/legal/terms', label: 'AGB' },
    { href: '/legal/privacy', label: 'Datenschutz' },
    { href: '/legal/cookies', label: 'Cookies' },
    { href: '/legal/imprint', label: 'Impressum' },
  ],
  sitemapRoutes: [
    '/',
    '/features',
    '/how-it-works',
    '/pricing',
    '/security',
    '/faq',
    '/contact',
    '/status',
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
    '/legal/imprint',
  ],
  seo: {
    defaultTitle: 'Business-Software für Schweizer KMU',
    description: 'Binso One verbindet Kunden, Angebote, Aufträge, Zeiterfassung, Rechnungen, Mitarbeitende und Finanzen in einer klaren Business-Plattform für Schweizer Dienstleistungsunternehmen.',
    keywords: [
      'Business Software Schweiz',
      'KMU Software Schweiz',
      'Auftragsverwaltung',
      'Zeiterfassung',
      'Rechnungssoftware',
      'CRM Dienstleistungsunternehmen',
    ],
  },
  footerDescription: appIdentity.description,
} as const
