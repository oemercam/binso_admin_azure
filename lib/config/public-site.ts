import { appIdentity } from './app-identity'

export const publicSite = {
  primaryNavigation: [
    { href: '/', label: 'Startseite' },
    { href: '/features', label: 'Funktionen' },
    { href: '/how-it-works', label: 'So funktioniert es' },
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
  footerDescription: appIdentity.description,
} as const
