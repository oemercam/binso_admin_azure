import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preise",
  description: "Preise und Abonnemente von Binso One für Schweizer KMU: Start, Business und Pro.",
  alternates: { canonical: "/preise" },
  openGraph: {
    type: "website",
    locale: "de_CH",
    title: "Binso One – Preise",
    description: "Klare monatliche Preise für Binso One.",
    url: "/preise",
  },
};

export default function PricesLayout({children}:{children:React.ReactNode}){ return children; }
