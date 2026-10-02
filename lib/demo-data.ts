export const customers: string[][] = [
  ["Acme AG","Bauunternehmen","Zürich","Aktiv"],
  ["Müller GmbH","Immobilien","Bern","Aktiv"],
  ["Berger Bau AG","Bauunternehmen","Luzern","Aktiv"],
  ["Huber & Söhne","Elektro","St. Gallen","Aktiv"],
  ["Schmid Consulting","Beratung","Zug","Inaktiv"],
  ["Meier Handel AG","Handel","Basel","Aktiv"],
];

export const invoices: string[][] = [
  ["RE-2026-019","Acme AG","12.09.2026","CHF 4’346.40","Bezahlt"],
  ["RE-2026-018","Müller GmbH","10.09.2026","CHF 1’200.00","Offen"],
  ["RE-2026-017","Berger Bau AG","08.09.2026","CHF 3’700.00","Überfällig"],
  ["RE-2026-016","Huber & Söhne","28.08.2026","CHF 950.00","Bezahlt"],
  ["RE-2026-015","Schmid Consulting","20.08.2026","CHF 1’745.00","Offen"],
];

export const offers: string[][] = [
  ["AN-2026-012","Acme AG","CHF 7’264.32","Gesendet"],
  ["AN-2026-011","Müller GmbH","CHF 3’200.00","Entwurf"],
  ["AN-2026-010","Berger Bau AG","CHF 9’480.00","Angenommen"],
  ["AN-2026-009","Huber & Söhne","CHF 2’190.00","Abgelaufen"],
];

export const products: string[][] = [
  ["Beratung","Dienstleistung","CHF 120.00","Aktiv"],
  ["Website Konzept","Dienstleistung","CHF 120.00","Aktiv"],
  ["Entwicklung","Dienstleistung","CHF 120.00","Aktiv"],
  ["Wartung","Dienstleistung","CHF 90.00","Aktiv"],
  ["Hosting Paket","Produkt","CHF 25.00","Aktiv"],
];

export const employees: string[][] = [
  ["Thomas Müller","Inhaber","100%","Aktiv"],
  ["Sarah Meier","Administration","80%","Aktiv"],
  ["Lukas Weber","Projektleitung","100%","Aktiv"],
  ["Nina Schmid","Buchhaltung","60%","Aktiv"],
];

export const expenses: string[][] = [
  ["Hotel Schweizerhof","Thomas Müller","CHF 280.00","Eingereicht"],
  ["SBB Zugticket","Sarah Meier","CHF 89.00","Genehmigt"],
  ["Geschäftsessen","Lukas Weber","CHF 120.00","Genehmigt"],
  ["Büromaterial","Nina Schmid","CHF 64.50","Entwurf"],
];

export const payments: string[][] = [
  ["1","02.10.2026","Acme AG","RE-2026-019 · Banküberweisung","CHF 4’346.40","Verbucht"],
  ["2","30.09.2026","Müller GmbH","RE-2026-018 · Karte","CHF 1’200.00","Verbucht"],
  ["3","28.09.2026","Schmid Consulting","RE-2026-015","CHF 1’745.00","Ausstehend"],
];

export const supportTickets: string[][] = [
  ["5832","Frage zur Rechnung","vor 12 Minuten","Offen"],
  ["5828","Zeiterfassung","vor 1 Stunde","In Bearbeitung"],
  ["5814","Datenexport","vor 1 Tag","Gelöst"],
];
