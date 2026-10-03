import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./completion.css";
import "./completion-v04.css";
import "./completion-v06.css";
import "./mockup-v10.css";
import "./ux-v1.css";
import { PwaRegister } from "@/components/pwa-register";
import { siteConfig } from "@/lib/config";

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
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Binso One",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/brand/icon-black.svg",
    apple: "/brand/icon-black.svg",
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
    <html lang="de-CH" suppressHydrationWarning>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}