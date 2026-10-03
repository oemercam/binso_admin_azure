import type { Metadata, Viewport } from "next";
import "./binso-ui.css";
import { PwaRegister } from "@/components/pwa-register";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { siteConfig } from "@/lib/config";
import { I18nProvider } from "@/lib/i18n/provider";

const metadataBase = new URL(siteConfig.marketingUrl);

export const metadata: Metadata = {
  metadataBase,
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
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
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
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
    icon: [{ url: "/brand/icon-black.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icon-black.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de-CH" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <I18nProvider>{children}</I18nProvider>
        <PwaRegister />
        <WebVitalsReporter />
      </body>
    </html>
  );
}