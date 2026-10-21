import {localizeMetadata} from "@/lib/server/locale";
import {cookies} from "next/headers";
import {LocaleProvider} from "@/lib/client/locale";
import {asLocale,localeCookie,localeTags} from "@/lib/locales/config";
import type { Metadata, Viewport } from "next";
import "./binso-ui.css";
import {AppShellLayout} from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import {initializeTheme} from "@/lib/theme";
import {ThemeRuntime} from "@/components/theme-runtime";
import { siteConfig } from "@/lib/config";
import { PrivacyConsent } from "@/components/privacy-consent";
import {FreshAuthenticationDialog} from '@/components/fresh-authentication-dialog';

const metadataBase = new URL(siteConfig.marketingUrl);

const baseMetadata: Metadata = {
  metadataBase,
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: ["Business-Software Schweiz","KMU Software","Rechnungssoftware Schweiz","Zeiterfassung KMU","Angebotssoftware","Binso One"],
  applicationName: siteConfig.name,
  category: "business",
  authors: [{ name: "Binso GmbH", url: "https://www.binso.ch" }],
  creator: "Binso GmbH",
  publisher: "Binso GmbH",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_CH",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Binso One – Business-Software für Schweizer KMU" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  appleWebApp: {
    capable: true,
    title: "Binso One",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/brand/pwa-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/pwa-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};
export async function generateMetadata():Promise<Metadata>{return localizeMetadata(baseMetadata,"/");}


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale=asLocale((await cookies()).get(localeCookie)?.value);
  return (
    <html lang={localeTags[locale]} suppressHydrationWarning data-scroll-behavior="smooth">
      <head><script id="binso-theme-init" dangerouslySetInnerHTML={{__html:`(${initializeTheme.toString()})();`}} /></head>
      <body>
        <LocaleProvider initialLocale={locale}>
        <ThemeRuntime />
        <div id="binso-page-content"><AppShellLayout>{children}</AppShellLayout></div>
        <PrivacyConsent />
        <FreshAuthenticationDialog />
        <PwaRegister />
        <WebVitalsReporter />
        </LocaleProvider>
      </body>
    </html>
  );
}
