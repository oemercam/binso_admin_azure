export const navItems = [
  "Dashboard",
  "Kunden",
  "Offerten",
  "Rechnungen",
  "Zeiterfassung",
  "Projekte",
  "Lohn",
  "MWST",
  "Ausgaben",
  "Berichte",
  "Einstellungen"
] as const;

export const metrics = [
  { label: "Umsatz", value: "CHF 128’450", meta: "+12 % vs. Vormonat", tone: "positive" },
  { label: "Offene Rechnungen", value: "CHF 24’300", meta: "5 Rechnungen", tone: "neutral" },
  { label: "Arbeitsstunden", value: "612 h", meta: "+8 % vs. Vormonat", tone: "positive" },
  { label: "Fällige MWST", value: "CHF 7’820", meta: "in 12 Tagen", tone: "danger" }
] as const;

export const invoices = [
  { nr: "R-2025-0048", customer: "Müller Bau AG", date: "24.04.2025", amount: "CHF 4’850", status: "Offen" },
  { nr: "R-2025-0047", customer: "Steiner Consulting", date: "22.04.2025", amount: "CHF 2’400", status: "Bezahlt" },
  { nr: "R-2025-0046", customer: "Huber & Partner", date: "17.04.2025", amount: "CHF 1’980", status: "Offen" }
] as const;

export const tasks = [
  "Offene Rechnung von Müller Bau AG prüfen",
  "MWST Q1/2025 einreichen",
  "Löhne für April freigeben",
  "Spesen vom Team prüfen"
] as const;
