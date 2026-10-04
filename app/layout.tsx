import type { Metadata, Viewport } from "next";
import "./binso-ui.css";
import { PwaRegister } from "@/components/pwa-register";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import {initializeTheme} from "@/lib/theme";
import {ThemeRuntime} from "@/components/theme-runtime";
import { siteConfig } from "@/lib/config";

const metadataBase = new URL(siteConfig.marketingUrl);

export const metadata: Metadata = {
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
      { url: "/brand/icon-black.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de-CH" suppressHydrationWarning data-scroll-behavior="smooth">
      <head><script id="binso-theme-init" dangerouslySetInnerHTML={{__html:`(${initializeTheme.toString()})();`}} /></head>
      <body>
        <ThemeRuntime />
        {children}
        <PwaRegister />
        <WebVitalsReporter />
      </body>
    </html>
  );
}