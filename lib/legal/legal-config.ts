export const LEGAL_VERSION = '2026-09-28'
export const TERMS_VERSION = LEGAL_VERSION
export const DPA_VERSION = LEGAL_VERSION

export const legalCompany = {
  legalName: 'Binso GmbH',
  alternateNames: ['Binso Sàrl', 'Binso Sagl', 'Binso LLC'],
  uid: 'CHE-173.401.068',
  registry: 'Handelsregister des Kantons Appenzell Innerrhoden',
  address: 'Weissbadstrasse 8b, 9050 Appenzell, Schweiz',
  email: 'info@binso.ch',
  phoneDisplay: '+41 58 510 88 58',
  phoneHref: 'tel:+41585108858',
  website: 'https://www.binso.ch',
  websiteDisplay: 'www.binso.ch',
  management: ['Simon Noah Steiner', 'Oemer Cam'],
} as const

export const legalProviders = [
  {
    name: 'Microsoft',
    services: 'Azure Hosting und Datenbank-Infrastruktur, Microsoft Entra ID / App Service Authentication sowie – sofern aktiviert – Microsoft Graph für E-Mail-Versand.',
    purpose: 'Hosting, Authentisierung, Betrieb, Sicherheit und optionaler E-Mail-Versand.',
    countries: 'Schweiz und/oder Europäischer Wirtschaftsraum; bei globalen Betriebs-, Support- und Sicherheitsleistungen können weitere Standorte, insbesondere die USA, einbezogen werden.',
    safeguard: 'Vertragliche Datenschutzregelungen von Microsoft und, soweit für ein Empfängerland erforderlich, anerkannte Standarddatenschutzklauseln bzw. andere zulässige Garantien.',
  },
  {
    name: 'Stripe',
    services: 'Stripe Checkout, Billing, Kundenportal und Zahlungsabwicklung, sofern ein kostenpflichtiges Self-Service-Abonnement über Stripe abgeschlossen oder verwaltet wird.',
    purpose: 'Zahlungsabwicklung, Abonnementverwaltung, Rechnungs- und Zahlungsstatus sowie Betrugsprävention.',
    countries: 'Europäischer Wirtschaftsraum und weitere für die Zahlungsabwicklung erforderliche Standorte; dabei können insbesondere die USA einbezogen werden.',
    safeguard: 'Vertragliche Datenschutzregelungen von Stripe und, soweit erforderlich, anerkannte Standarddatenschutzklauseln bzw. andere zulässige Garantien.',
  },
] as const
