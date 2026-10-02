import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Binso One",
    short_name: "Binso",
    description: "Business Software für Schweizer Unternehmen",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "de-CH",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [],
  };
}