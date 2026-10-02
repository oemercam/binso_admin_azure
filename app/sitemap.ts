import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/produkt", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/preise", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${siteConfig.marketingUrl}${route.path}`,
    lastModified: new Date("2026-10-02"),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
