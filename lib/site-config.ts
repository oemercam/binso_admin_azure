export const siteConfig={
  name:"Binso One",
  company:"Binso GmbH",
  uid:"CHE-173.401.068",
  url:process.env.NEXT_PUBLIC_SITE_URL||"https://binso-admin-prod-asctesfvhnd5b6ay.switzerlandnorth-01.azurewebsites.net",
  address:{street:"Weissbadstrasse 8b",postalCode:"9050",city:"Appenzell",country:"Schweiz",countryCode:"CH"},
  phoneDisplay:"+41 58 510 88 58",
  phoneHref:"+41585108858",
  email:"kontakt@binso.ch",
  supportEmail:"support@binso.ch",
  privacyEmail:"privacy@binso.ch",
  legalEmail:"legal@binso.ch",
  description:"Binso One verbindet Verkauf, Projekte, Zeiterfassung, Rechnungen, Finanzen, Personal und Administration für Schweizer KMU in einer zentralen Plattform.",
  locale:"de_CH",
  language:"de-CH",
  version:"1.3.1",
} as const;

export function absoluteUrl(path="/"){
  const base=siteConfig.url.replace(/\/$/,"");
  return `${base}${path.startsWith("/")?path:`/${path}`}`;
}
