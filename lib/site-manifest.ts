import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?pwa=binso-site",
    name: "Binso",
    short_name: "Binso",
    description: "Binso – Business-Software für Schweizer KMU",
    lang: "de-CH",
    dir: "ltr",
    start_url: "/?source=pwa-site",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/brand/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
