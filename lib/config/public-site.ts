import { appIdentity } from './app-identity'
import { ROUTES } from '@/lib/navigation/routes'

export const publicSite = {
  primaryNavigation: [
    { href: ROUTES.public.features, label: 'Funktionen' },
    { href: ROUTES.public.pricing, label: 'Preise' },
    { href: ROUTES.public.faq, label: 'FAQ' },
    { href: ROUTES.public.contact, label: 'Kontakt' },
  ],
  productNavigation: [
    { href: ROUTES.public.features, label: 'Funktionen' },
    { href: ROUTES.public.howItWorks, label: 'So funktioniert es' },
    { href: ROUTES.public.pricing, label: 'Preise' },
  ],
  helpNavigation: [
    { href: ROUTES.public.faq, label: 'FAQ' },
    { href: ROUTES.public.contact, label: 'Kontakt' },
    { href: ROUTES.public.security, label: 'Sicherheit' },
  ],
  accessNavigation: [
    { href: ROUTES.auth.signIn, label: 'Kunden-Login' },
    { href: ROUTES.auth.register, label: 'Konto erstellen' },
  ],
  adminNavigation: [
    { href: ROUTES.auth.adminAccess, label: 'Admin-Zugang' },
  ],
  legalNavigation: [
    { href: ROUTES.public.privacy, label: 'Datenschutz' },
    { href: ROUTES.public.terms, label: 'AGB' },
    { href: ROUTES.public.imprint, label: 'Impressum' },
  ],
  footerUtilityNavigation: [
    { href: ROUTES.public.status, label: 'Systemstatus' },
  ],
  sitemapRoutes: [
    ROUTES.public.home,
    ROUTES.public.features,
    ROUTES.public.howItWorks,
    ROUTES.public.pricing,
    ROUTES.public.security,
    ROUTES.public.faq,
    ROUTES.public.contact,
    ROUTES.public.terms,
    ROUTES.public.privacy,
    ROUTES.public.cookies,
    ROUTES.public.imprint,
  ],
  footerDescription: appIdentity.description,
} as const
