import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "One Admin", template: "%s | One Admin" },
  description: "Interne Betriebs- und Verwaltungsoberfläche für Binso One.",
  applicationName: "One Admin",
  robots: { index: false, follow: false, noarchive: true },
  manifest: "/manifest-admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "One Admin",
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

export default function OperatorLayout({children}:{children:React.ReactNode}){
  return children;
}
