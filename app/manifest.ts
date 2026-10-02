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
    shortcuts: [
      { name: "Kunden", short_name: "Kunden", url: "/kunden" },
      { name: "Neue Rechnung", short_name: "Rechnung", url: "/rechnungen/neu" },
      { name: "Zeiterfassung", short_name: "Zeit", url: "/zeit" },
    ],
    icons: [
      { src: "/brand/icon-black.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}