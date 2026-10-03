import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produkt",
  description: "Kunden, Angebote, Rechnungen, Zahlungen, Zeiterfassung, Spesen und Mitarbeiter in Binso One für Schweizer KMU.",
  alternates: { canonical: "/produkt" },
  openGraph: {
    type: "website",
    locale: "de_CH",
    title: "Binso One – Produkt",
    description: "Die Business-Plattform für die wichtigsten Abläufe Schweizer KMU.",
    url: "/produkt",
  },
};

export default function ProductLayout({children}:{children:React.ReactNode}){ return children; }
