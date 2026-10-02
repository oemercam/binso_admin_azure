import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./completion.css";
import "./completion-v04.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: { default: "Binso One", template: "%s | Binso One" },
  description: "Die moderne Business-Plattform für Schweizer KMU.",
  applicationName: "Binso One",
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