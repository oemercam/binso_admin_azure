import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Binso One",
    short_name: "Binso One",
    description: "Business-Plattform für Schweizer KMU",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/brand/icon-black.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
