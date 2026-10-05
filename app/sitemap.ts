import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/produkt", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/preise", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/impressum", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/datenschutz", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/agb", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/auftragsbearbeitung", priority: 0.3, changeFrequency: "monthly" as const },
    { path: "/unterauftragsbearbeiter", priority: 0.3, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${siteConfig.marketingUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
