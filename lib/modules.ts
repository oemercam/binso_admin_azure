export type ModuleKey =
  | "kunden" | "offerten" | "auftraege" | "projekte" | "zeiterfassung"
  | "spesen" | "rechnungen" | "zahlungen" | "mwst" | "personal"
  | "lohn" | "berichte" | "einstellungen" | "lieferanten" | "eingangsrechnungen"
  | "produkte" | "buchhaltung" | "bank" | "aufgaben" | "abwesenheiten" | "dokumente" | "vertraege";

export type ModuleConfig = {
  key: ModuleKey;
  label: string;
  href: string;
  description: string;
  primaryAction?: string;
  columns?: string[];
};

export const modules: ModuleConfig[] = [
  {
    key: "kunden", label: "Kunden", href: "/kunden",
    description: "Kunden, Kontakte und Beziehungen zentral verwalten.", primaryAction: "Kunde erfassen",
    columns: ["Kunde", "Kontakt", "E-Mail", "Umsatz", "Status"],
  },
  {
    key: "offerten", label: "Offerten", href: "/offerten",
    description: "Offerten schnell erstellen, versenden und in Aufträge überführen.", primaryAction: "Offerte erstellen",
    columns: ["Nr.", "Kunde", "Datum", "Betrag", "Status"],
  },
  {
    key: "auftraege", label: "Aufträge", href: "/auftraege",
    description: "Aufträge, Leistungen, Budgets und Fortschritt steuern.", primaryAction: "Auftrag erfassen",
    columns: ["Auftrag", "Kunde", "Projekt", "Volumen", "Status"],
  },
  {
    key: "projekte", label: "Projekte", href: "/projekte",
    description: "Projektfortschritt, Budget, Aufgaben und Leistungen im Blick behalten.", primaryAction: "Projekt erstellen",
    columns: ["Projekt", "Kunde", "Fortschritt", "Budget", "Status"],
  },
  {
    key: "zeiterfassung", label: "Zeiterfassung", href: "/zeiterfassung",
    description: "Arbeitszeiten, Projektzeiten und interne Zeiten erfassen und zuordnen.", primaryAction: "Zeit erfassen",
    columns: ["Datum", "Projekt", "Leistung", "Dauer", "Status"],
  },
  {
    key: "spesen", label: "Spesen", href: "/spesen",
    description: "Spesen und Belege mobil erfassen, prüfen und weiterverrechnen.", primaryAction: "Spese erfassen",
    columns: ["Datum", "Beschreibung", "Projekt", "Betrag", "Status"],
  },
  {
    key: "rechnungen", label: "Rechnungen", href: "/rechnungen",
    description: "Rechnungen erstellen, QR-Zahlteil ausgeben und Zahlungseingänge verfolgen.", primaryAction: "Rechnung erstellen",
    columns: ["Nr.", "Kunde", "Fällig", "Betrag", "Status"],
  },
  {
    key: "zahlungen", label: "Zahlungen", href: "/zahlungen",
    description: "Zahlungseingänge, offene Posten und Zuordnungen kontrollieren.", primaryAction: "Zahlung erfassen",
    columns: ["Datum", "Zahler", "Referenz", "Betrag", "Zuordnung"],
  },
  {
    key: "mwst", label: "MWST", href: "/mwst",
    description: "MWST-Perioden vorbereiten, prüfen und abschliessen.", primaryAction: "Abrechnung vorbereiten",
    columns: ["Periode", "Umsatzsteuer", "Vorsteuer", "Zahllast", "Status"],
  },
  {
    key: "personal", label: "Personal", href: "/personal",
    description: "Mitarbeitende, Beschäftigungsdaten, Abwesenheiten und Lohndaten verwalten.", primaryAction: "Mitarbeiter erfassen",
    columns: ["Mitarbeiter", "Funktion", "Pensum", "Eintritt", "Status"],
  },
  {
    key: "lohn", label: "Lohn", href: "/lohn",
    description: "Monatliche Lohnläufe vorbereiten, kontrollieren und freigeben.", primaryAction: "Lohnlauf starten",
    columns: ["Mitarbeiter", "Brutto", "Abzüge", "Netto", "Status"],
  },
  {
    key: "berichte", label: "Berichte", href: "/berichte",
    description: "Finanzen, Projekte, Auslastung und operative Kennzahlen auswerten.", primaryAction: "Bericht erstellen",
    columns: ["Bericht", "Zeitraum", "Bereich", "Aktualisiert", "Status"],
  },
  {
    key: "einstellungen", label: "Einstellungen", href: "/einstellungen",
    description: "Firma, Benutzer, Rollen, Vorlagen und Integrationen konfigurieren.", primaryAction: "Einstellungen speichern",
    columns: ["Bereich", "Beschreibung", "Status", "Letzte Änderung", "Zugriff"],
  },
  {
    key:"lieferanten", label:"Lieferanten", href:"/lieferanten",
    description:"Lieferanten, Kontakte und Konditionen zentral verwalten.", primaryAction:"Lieferant erfassen",
    columns:["Lieferant","Kontakt","E-Mail","Offen","Status"],
  },
  {
    key:"eingangsrechnungen", label:"Eingangsrechnungen", href:"/eingangsrechnungen",
    description:"Lieferantenrechnungen erfassen, prüfen, freigeben und bezahlen.", primaryAction:"Eingangsrechnung erfassen",
    columns:["Nr.","Lieferant","Fällig","Betrag","Status"],
  },
  {
    key:"produkte", label:"Produkte und Leistungen", href:"/produkte",
    description:"Leistungen, Artikel, Preise, Einheiten und MWST-Sätze als Stammdaten pflegen.", primaryAction:"Leistung erfassen",
    columns:["Bezeichnung","Typ","Einheit","Preis","Status"],
  },
  {
    key:"buchhaltung", label:"Buchhaltung", href:"/buchhaltung",
    description:"Buchungsjournal, Debitoren, Kreditoren und Abschlussvorbereitung im Überblick.", primaryAction:"Buchung erfassen",
    columns:["Datum","Beleg","Konto","Betrag","Status"],
  },
  {
    key:"bank", label:"Bank", href:"/bank",
    description:"Konten, Kontostände, Transaktionen und Zuordnungen kontrollieren.", primaryAction:"Bankimport simulieren",
    columns:["Datum","Konto","Text","Betrag","Status"],
  },
  {
    key:"aufgaben", label:"Aufgaben", href:"/aufgaben",
    description:"Offene Arbeiten über Kunden, Projekte und interne Themen zentral priorisieren.", primaryAction:"Aufgabe erstellen",
    columns:["Aufgabe","Bezug","Fällig","Verantwortlich","Status"],
  },
  {
    key:"abwesenheiten", label:"Abwesenheiten", href:"/abwesenheiten",
    description:"Ferien, Krankheit und andere Abwesenheiten beantragen und freigeben.", primaryAction:"Abwesenheit erfassen",
    columns:["Mitarbeiter","Art","Zeitraum","Tage","Status"],
  },
  {
    key:"dokumente", label:"Dokumente", href:"/dokumente",
    description:"Unternehmensdokumente zentral ablegen, zuordnen und wiederfinden.", primaryAction:"Dokument hinzufügen",
    columns:["Dokument","Typ","Zuordnung","Aktualisiert","Status"],
  },
  {
    key:"vertraege", label:"Verträge", href:"/vertraege",
    description:"Kunden-, Lieferanten- und wiederkehrende Verträge mit Laufzeiten verwalten.", primaryAction:"Vertrag erfassen",
    columns:["Vertrag","Partner","Laufzeit","Wert","Status"],
  }
];


export function getModule(key: ModuleKey) {
  return modules.find((module) => module.key === key)!;
}
