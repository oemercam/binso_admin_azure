import {siteConfig} from "@/lib/site-config";

export const legalConfig={
  company:siteConfig.company,
  address:siteConfig.address.street,
  zipCity:`${siteConfig.address.postalCode} ${siteConfig.address.city}`,
  country:siteConfig.address.country,
  uid:siteConfig.uid,
  phone:siteConfig.phoneDisplay,
  generalEmail:siteConfig.legalEmail,
  privacyEmail:siteConfig.privacyEmail,
  supportEmail:siteConfig.supportEmail,
  website:"www.binso.ch",
  legalVersion:"2026-09-29",
  termsVersion:"2026-09-29",
  privacyVersion:"2026-09-29",
  cookieVersion:"2026-09-29",
} as const;

export const subprocessors=[
  {name:"Microsoft Azure",purpose:"Hosting, Datenbank, Speicher und technische Infrastruktur",region:"Schweiz/EU gemäss gewählter Azure-Region und Vertrag"},
  {name:"Stripe",purpose:"Zahlungsabwicklung und Abonnementverwaltung",region:"Internationale Verarbeitung gemäss Stripe-Vertrags- und Datenschutzunterlagen"},
  {name:"Resend",purpose:"Transaktionaler E-Mail-Versand, sofern produktiv aktiviert",region:"Verarbeitung gemäss den vertraglichen und datenschutzrechtlichen Einstellungen des Dienstes"},
] as const;
