import type {PlanId} from "@/config/domain";
export type {BillingCycle,PlanId} from "@/config/domain";

export type PricingPlan = {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  popular?: boolean;
  description: string;
  features: string[];
};

export const plans: PricingPlan[] = [
  {
    id: "start",
    name: "Start",
    monthly: 29,
    yearly: 290,
    description:
      "Für Selbstständige und kleine Teams, die Verkauf und Administration zentralisieren möchten.",
    features: [
      "Kunden und Kontakte",
      "Offerten und Rechnungen",
      "Zeiterfassung und Spesen",
      "Projekte",
      "Basisberichte",
      "1 Firma · bis 3 Benutzer"
    ]
  },
  {
    id: "business",
    name: "Business",
    monthly: 69,
    yearly: 690,
    popular: true,
    description:
      "Für KMU mit Team, Personal, Einkauf und erweiterten Finanzprozessen.",
    features: [
      "Alles aus Start",
      "Lieferanten und Eingangsrechnungen",
      "Personal und Abwesenheiten",
      "MWST und Buchhaltungsübersicht",
      "Produkte und Leistungen",
      "bis 15 Benutzer"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 129,
    yearly: 1290,
    description:
      "Für wachsende Unternehmen mit mehreren Bereichen, Rollen und erweiterten Kontrollen.",
    features: [
      "Alles aus Business",
      "Lohn-Demo und Freigaben",
      "Verträge und Dokumente",
      "Erweiterte Rollen und Audit",
      "Priorisierter Support",
      "unbegrenzte Benutzer"
    ]
  }
];
