import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Binso One",
    short_name: "Binso One",
    description: "Business-Plattform für Schweizer KMU",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/brand/icon-black.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}