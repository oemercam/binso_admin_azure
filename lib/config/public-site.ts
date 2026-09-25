import { appIdentity } from './app-identity'

export const publicSite = {
  primaryNavigation: [
    { href: '/features', label: 'Funktionen' },
    { href: '/how-it-works', label: 'Ablauf' },
    { href: '/pricing', label: 'Preise' },
    { href: '/security', label: 'Sicherheit' },
  ],
  productNavigation: [
    { href: '/features', label: 'Funktionen' },
    { href: '/how-it-works', label: 'So funktioniert es' },
    { href: '/pricing', label: 'Preise' },
    { href: '/security', label: 'Sicherheit' },
  ],
  helpNavigation: [
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Kontakt' },
    { href: '/support', label: 'Support' },
    { href: '/status', label: 'Systemstatus' },
  ],
  accessNavigation: [
    { href: '/sign-in', label: 'Kunden-Login' },
    { href: '/register', label: 'Konto erstellen' },
    { href: '/admin-access', label: 'Admin-Zugang' },
  ],
  legalNavigation: [
    { href: '/legal/terms', label: 'AGB' },
    { href: '/legal/privacy', label: 'Datenschutz' },
    { href: '/legal/cookies', label: 'Cookies' },
    { href: '/legal/imprint', label: 'Impressum' },
  ],
  footerDescription: appIdentity.description,
} as const
