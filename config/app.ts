import {siteConfig} from "@/lib/site-config";
import {uiConfig} from "@/config/ui";

export const appConfig = {
  name: siteConfig.name,
  company: siteConfig.company,
  defaultLocale: "de" as const,
  locales: ["de", "fr", "it", "en", "tr"] as const,
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || siteConfig.version,
  supportEmail: siteConfig.supportEmail,
  publicBasePath: "/",
  portalBasePath: "/portal",
  operatorBasePath: "/operator",
  mobileBreakpoint: uiConfig.breakpoints.mobile,
  searchDebounceMs: 300,
  pagination: [25, 50, 100] as const,
  pwa: {
    siteManifest: "/manifest-site.webmanifest",
    portalManifest: "/manifest-portal.webmanifest",
    operatorManifest: "/manifest-operator.webmanifest",
  },
} as const;

export type AppLocale = (typeof appConfig.locales)[number];
