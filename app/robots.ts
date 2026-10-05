import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/produkt", "/preise", "/impressum", "/datenschutz", "/agb", "/auftragsbearbeitung", "/unterauftragsbearbeiter"],
      disallow: [
        "/dashboard",
        "/kunden",
        "/angebote",
        "/rechnungen",
        "/zahlungen",
        "/produkte",
        "/mitarbeiter",
        "/spesen",
        "/zeit",
        "/support",
        "/einstellungen",
        "/belege",
        "/benachrichtigungen",
        "/operator",
        "/login",
        "/registrieren",
        "/passwort-vergessen",
        "/willkommen",
        "/demo",
        "/offline",
      ],
    },
    sitemap: `${siteConfig.marketingUrl}/sitemap.xml`,
  };
}
