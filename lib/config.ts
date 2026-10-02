export const siteConfig = {
  name: "Binso One",
  description: "Die moderne Business-Plattform für Schweizer KMU.",
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://www.binso.ch",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
