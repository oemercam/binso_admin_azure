import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://www.binso.ch";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/produkt", "/preise"],
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
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
