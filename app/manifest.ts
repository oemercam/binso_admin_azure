import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?pwa=binso-one",
    name: "Binso One",
    short_name: "Binso One",
    description: "Business-Plattform für Schweizer KMU",
    lang: "de-CH",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["business", "productivity", "finance"],
    shortcuts: [
      { name: "Kunden", short_name: "Kunden", url: "/kunden" },
      { name: "Neue Rechnung", short_name: "Rechnung", url: "/rechnungen/neu" },
      { name: "Zeiterfassung", short_name: "Zeit", url: "/zeit" },
    ],
    icons: [
      { src: "/brand/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
