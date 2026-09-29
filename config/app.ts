export const appConfig = {
  name: "Binso One",
  company: "Binso GmbH",
  defaultLocale: "de" as const,
  locales: ["de", "fr", "it", "en", "tr"] as const,
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.3.1",
  supportEmail: "support@binso.ch",
  publicBasePath: "/",
  portalBasePath: "/portal",
  operatorBasePath: "/operator",
  mobileBreakpoint: 760,
  searchDebounceMs: 300,
  pagination: [25, 50, 100] as const,
  pwa: {
    siteManifest: "/manifest-site.webmanifest",
    portalManifest: "/manifest-portal.webmanifest",
    operatorManifest: "/manifest-operator.webmanifest",
  },
} as const;

export type AppLocale = (typeof appConfig.locales)[number];
