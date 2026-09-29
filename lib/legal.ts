export const legalConfig={
  company:"Binso GmbH",
  address:"Weissbadstrasse 8b",
  zipCity:"9050 Appenzell",
  country:"Schweiz",
  uid:"CHE-173.401.068",
  phone:"+41 58 510 88 58",
  generalEmail:"info@binso.ch",
  privacyEmail:"privacy@binso.ch",
  supportEmail:"support@binso.ch",
  website:"www.binso.ch",
  legalVersion:"2026-09-29",
  termsVersion:"2026-09-29",
  privacyVersion:"2026-09-29",
  cookieVersion:"2026-09-29",
} as const;

export const subprocessors=[
  {name:"Microsoft Azure",purpose:"Hosting, Datenbank, Speicher und technische Infrastruktur",region:"Schweiz/EU gemäss gewählter Azure-Region und Vertrag"},
  {name:"Stripe",purpose:"Zahlungsabwicklung und Abonnementverwaltung",region:"Internationale Verarbeitung gemäss Stripe-Vertrags- und Datenschutzunterlagen"},
  {name:"Resend",purpose:"Transaktionaler E-Mail-Versand, sofern in der Produktionsumgebung aktiviert",region:"Verarbeitung gemäss Resend-Vertrags- und Datenschutzunterlagen"},
] as const;
