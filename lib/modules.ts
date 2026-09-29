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
  rows?: string[][];
  stats?: { label: string; value: string; meta?: string }[];
};

export const modules: ModuleConfig[] = [
  {
    key: "kunden", label: "Kunden", href: "/kunden",
    description: "Kunden, Kontakte und Beziehungen zentral verwalten.", primaryAction: "Kunde erfassen",
    stats: [
      { label: "Aktive Kunden", value: "42", meta: "+3 diesen Monat" },
      { label: "Offene Chancen", value: "8", meta: "CHF 84’200" },
      { label: "Überfällige Aufgaben", value: "3", meta: "Heute prüfen" },
    ],
    columns: ["Kunde", "Kontakt", "E-Mail", "Umsatz", "Status"],
    rows: [
      ["Müller Bau AG", "Anna Müller", "anna@muellerbau.ch", "CHF 48’400", "Aktiv"],
      ["Steiner Consulting", "Luca Steiner", "luca@steiner.ch", "CHF 31’200", "Aktiv"],
      ["Huber & Partner", "Nina Huber", "nina@huberpartner.ch", "CHF 18’900", "Aktiv"],
      ["Limmat Immobilien", "Marc Frei", "marc@limmat.ch", "CHF 66’100", "Aktiv"],
    ]
  },
  {
    key: "offerten", label: "Offerten", href: "/offerten",
    description: "Offerten schnell erstellen, versenden und in Aufträge überführen.", primaryAction: "Offerte erstellen",
    stats: [
      { label: "Offen", value: "7", meta: "CHF 76’450" },
      { label: "Angenommen", value: "12", meta: "letzte 30 Tage" },
      { label: "Quote", value: "63 %", meta: "Annahmequote" },
    ],
    columns: ["Nr.", "Kunde", "Datum", "Betrag", "Status"],
    rows: [
      ["O-2026-0081", "Müller Bau AG", "28.09.2026", "CHF 12’800", "Offen"],
      ["O-2026-0080", "Keller AG", "27.09.2026", "CHF 6’400", "Entwurf"],
      ["O-2026-0079", "Steiner Consulting", "25.09.2026", "CHF 18’200", "Angenommen"],
    ]
  },
  {
    key: "auftraege", label: "Aufträge", href: "/auftraege",
    description: "Angenommene Leistungen, Budgets und Lieferstatus steuern.", primaryAction: "Auftrag erfassen",
    stats: [
      { label: "Aktiv", value: "14", meta: "6 mit Projekt" },
      { label: "Auftragsvolumen", value: "CHF 214’900", meta: "laufend" },
      { label: "Abschluss fällig", value: "4", meta: "nächste 14 Tage" },
    ],
    columns: ["Auftrag", "Kunde", "Projekt", "Volumen", "Status"],
    rows: [
      ["A-2026-041", "Müller Bau AG", "Website Relaunch", "CHF 32’000", "In Arbeit"],
      ["A-2026-039", "Steiner Consulting", "ERP Beratung", "CHF 24’000", "In Arbeit"],
      ["A-2026-036", "Keller AG", "IT-Support", "CHF 18’000", "Bereit"],
    ]
  },
  {
    key: "projekte", label: "Projekte", href: "/projekte",
    description: "Projektfortschritt, Budget, Aufgaben und Leistungen im Blick behalten.", primaryAction: "Projekt erstellen",
    stats: [
      { label: "Laufende Projekte", value: "9", meta: "3 kritisch" },
      { label: "Budget", value: "CHF 188’000", meta: "gesamt" },
      { label: "Auslastung", value: "78 %", meta: "Team" },
    ],
    columns: ["Projekt", "Kunde", "Fortschritt", "Budget", "Status"],
    rows: [
      ["Website Relaunch", "Müller Bau AG", "80 %", "CHF 32’000", "In Arbeit"],
      ["ERP Beratung", "Steiner Consulting", "60 %", "CHF 24’000", "In Arbeit"],
      ["Büroumbau", "Limmat Immobilien", "35 %", "CHF 42’000", "In Arbeit"],
      ["IT-Support", "Keller AG", "90 %", "CHF 18’000", "Laufend"],
    ]
  },
  {
    key: "zeiterfassung", label: "Zeiterfassung", href: "/zeiterfassung",
    description: "Arbeitszeiten, Projektzeiten und interne Zeiten einfach erfassen.", primaryAction: "Zeit erfassen",
    stats: [
      { label: "Diese Woche", value: "28 h", meta: "von 40 h" },
      { label: "Verrechenbar", value: "22 h", meta: "79 %" },
      { label: "Noch offen", value: "12 h", meta: "Sollzeit" },
    ],
    columns: ["Datum", "Projekt", "Leistung", "Dauer", "Status"],
    rows: [
      ["28.09.2026", "Website Relaunch", "Konzeption", "6:30 h", "Freigegeben"],
      ["27.09.2026", "ERP Beratung", "Workshop", "7:45 h", "Freigegeben"],
      ["26.09.2026", "Intern", "Administration", "2:00 h", "Entwurf"],
    ]
  },
  {
    key: "spesen", label: "Spesen", href: "/spesen",
    description: "Spesen und Belege mobil erfassen, prüfen und weiterverrechnen.", primaryAction: "Spese erfassen",
    stats: [
      { label: "Offen", value: "5", meta: "CHF 842.30" },
      { label: "Freigegeben", value: "18", meta: "diesen Monat" },
      { label: "Weiterverrechenbar", value: "CHF 396.00", meta: "an Kunden" },
    ],
    columns: ["Datum", "Beschreibung", "Projekt", "Betrag", "Status"],
    rows: [
      ["28.09.2026", "SBB Bern–Zürich", "ERP Beratung", "CHF 96.00", "Offen"],
      ["27.09.2026", "Kundenlunch", "Website Relaunch", "CHF 148.50", "Freigegeben"],
      ["25.09.2026", "Parkgebühr", "IT-Support", "CHF 18.00", "Verbucht"],
    ]
  },
  {
    key: "rechnungen", label: "Rechnungen", href: "/rechnungen",
    description: "Rechnungen erstellen, QR-Zahlteil ausgeben und Zahlungseingänge verfolgen.", primaryAction: "Rechnung erstellen",
    stats: [
      { label: "Offen", value: "CHF 24’300", meta: "5 Rechnungen" },
      { label: "Überfällig", value: "CHF 6’200", meta: "1 Rechnung" },
      { label: "Bezahlt", value: "CHF 81’400", meta: "diesen Monat" },
    ],
    columns: ["Nr.", "Kunde", "Fällig", "Betrag", "Status"],
    rows: [
      ["R-2026-0184", "Müller Bau AG", "15.10.2026", "CHF 4’850", "Offen"],
      ["R-2026-0183", "Steiner Consulting", "08.10.2026", "CHF 2’400", "Bezahlt"],
      ["R-2026-0182", "Limmat Immobilien", "22.09.2026", "CHF 6’200", "Überfällig"],
    ]
  },
  {
    key: "zahlungen", label: "Zahlungen", href: "/zahlungen",
    description: "Zahlungseingänge, offene Posten und Zuordnungen kontrollieren.", primaryAction: "Zahlung erfassen",
    stats: [
      { label: "Heute eingegangen", value: "CHF 8’740", meta: "4 Zahlungen" },
      { label: "Nicht zugeordnet", value: "2", meta: "prüfen" },
      { label: "Offene Posten", value: "CHF 24’300", meta: "Debitoren" },
    ],
    columns: ["Datum", "Zahler", "Referenz", "Betrag", "Zuordnung"],
    rows: [
      ["28.09.2026", "Steiner Consulting", "QRR 0183", "CHF 2’400", "Zugeordnet"],
      ["28.09.2026", "Keller AG", "QRR 0178", "CHF 1’980", "Zugeordnet"],
      ["27.09.2026", "Unbekannt", "NONREF", "CHF 360", "Offen"],
    ]
  },
  {
    key: "mwst", label: "MWST", href: "/mwst",
    description: "MWST-Perioden vorbereiten, plausibilisieren und für die Einreichung abschliessen.", primaryAction: "Abrechnung vorbereiten",
    stats: [
      { label: "Aktuelle Periode", value: "Q3 2026", meta: "01.07.–30.09." },
      { label: "Zahllast", value: "CHF 7’820", meta: "vorläufig" },
      { label: "Belege offen", value: "3", meta: "prüfen" },
    ],
    columns: ["Periode", "Umsatzsteuer", "Vorsteuer", "Zahllast", "Status"],
    rows: [
      ["Q3 2026", "CHF 18’940", "CHF 11’120", "CHF 7’820", "In Vorbereitung"],
      ["Q2 2026", "CHF 17’300", "CHF 10’820", "CHF 6’480", "Abgeschlossen"],
      ["Q1 2026", "CHF 16’100", "CHF 9’920", "CHF 6’180", "Abgeschlossen"],
    ]
  },
  {
    key: "personal", label: "Personal", href: "/personal",
    description: "Mitarbeitende, Beschäftigung, Ferien und Lohndaten verwalten.", primaryAction: "Mitarbeiter erfassen",
    stats: [
      { label: "Mitarbeitende", value: "8", meta: "7 aktiv" },
      { label: "Ferien offen", value: "84 Tage", meta: "gesamt" },
      { label: "Abwesend heute", value: "1", meta: "Ferien" },
    ],
    columns: ["Mitarbeiter", "Funktion", "Pensum", "Eintritt", "Status"],
    rows: [
      ["Marc Beispiel", "Projektleitung", "100 %", "01.01.2024", "Aktiv"],
      ["Anna Muster", "Consulting", "80 %", "01.03.2025", "Aktiv"],
      ["Luca Meier", "Administration", "60 %", "01.08.2025", "Aktiv"],
    ]
  },
  {
    key: "lohn", label: "Lohn", href: "/lohn",
    description: "Monatliche Lohnläufe vorbereiten, kontrollieren und freigeben.", primaryAction: "Lohnlauf starten",
    stats: [
      { label: "Lohnsumme", value: "CHF 72’840", meta: "September 2026" },
      { label: "Bereit", value: "8", meta: "Mitarbeitende" },
      { label: "Auszahlung", value: "30.09.2026", meta: "geplant" },
    ],
    columns: ["Mitarbeiter", "Brutto", "Abzüge", "Netto", "Status"],
    rows: [
      ["Marc Beispiel", "CHF 12’500", "CHF 2’842", "CHF 9’658", "Bereit"],
      ["Anna Muster", "CHF 8’400", "CHF 1’862", "CHF 6’538", "Bereit"],
      ["Luca Meier", "CHF 5’800", "CHF 1’228", "CHF 4’572", "Bereit"],
    ]
  },
  {
    key: "berichte", label: "Berichte", href: "/berichte",
    description: "Finanzen, Projekte, Auslastung und operative Kennzahlen auswerten.", primaryAction: "Bericht erstellen",
    stats: [
      { label: "Umsatz YTD", value: "CHF 1.12 Mio.", meta: "+9.4 %" },
      { label: "Deckungsbeitrag", value: "38 %", meta: "+2.1 pp" },
      { label: "Liquidität", value: "CHF 186’400", meta: "verfügbar" },
    ],
    columns: ["Bericht", "Zeitraum", "Bereich", "Aktualisiert", "Status"],
    rows: [
      ["Monatsreport", "September 2026", "Gesamt", "28.09.2026", "Aktuell"],
      ["Projektprofitabilität", "Q3 2026", "Projekte", "28.09.2026", "Aktuell"],
      ["Debitorenliste", "Heute", "Finanzen", "28.09.2026", "Aktuell"],
    ]
  },
  {
    key: "einstellungen", label: "Einstellungen", href: "/einstellungen",
    description: "Firma, Benutzer, Rollen, Vorlagen und Integrationen konfigurieren.", primaryAction: "Einstellungen speichern",
    stats: [
      { label: "Benutzer", value: "11", meta: "3 Administratoren" },
      { label: "Integrationen", value: "4", meta: "2 aktiv" },
      { label: "Audit-Ereignisse", value: "128", meta: "letzte 30 Tage" },
    ],
    columns: ["Bereich", "Beschreibung", "Status", "Letzte Änderung", "Zugriff"],
    rows: [
      ["Firmendaten", "Adresse, UID, Bankverbindung", "Konfiguriert", "28.09.2026", "Admin"],
      ["Benutzer & Rollen", "Zugriffe und Berechtigungen", "Konfiguriert", "27.09.2026", "Admin"],
      ["Nummernkreise", "Offerten, Rechnungen, Aufträge", "Konfiguriert", "25.09.2026", "Admin"],
    ]
  },
  {
    key:"lieferanten", label:"Lieferanten", href:"/lieferanten",
    description:"Lieferanten, Kontakte und Konditionen zentral verwalten.", primaryAction:"Lieferant erfassen",
    stats:[{label:"Aktive Lieferanten",value:"18",meta:"3 strategisch"},{label:"Offene Rechnungen",value:"CHF 14’820",meta:"Kreditoren"},{label:"Fällig 7 Tage",value:"4",meta:"prüfen"}],
    columns:["Lieferant","Kontakt","E-Mail","Offen","Status"],
    rows:[["Office Partner AG","Nina Graf","nina@officepartner.ch","CHF 2’460","Aktiv"],["Cloud Services Schweiz","Support","billing@cloud.example","CHF 1’280","Aktiv"]]
  },
  {
    key:"eingangsrechnungen", label:"Eingangsrechnungen", href:"/eingangsrechnungen",
    description:"Lieferantenrechnungen erfassen, prüfen, freigeben und bezahlen.", primaryAction:"Eingangsrechnung erfassen",
    stats:[{label:"Offen",value:"CHF 14’820",meta:"9 Belege"},{label:"Zur Freigabe",value:"4",meta:"CHF 6’120"},{label:"Überfällig",value:"CHF 1’280",meta:"1 Rechnung"}],
    columns:["Nr.","Lieferant","Fällig","Betrag","Status"],
    rows:[["ER-2026-0081","Office Partner AG","05.10.2026","CHF 2’460","Zur Freigabe"],["ER-2026-0080","Cloud Services Schweiz","25.09.2026","CHF 1’280","Überfällig"]]
  },
  {
    key:"produkte", label:"Produkte und Leistungen", href:"/produkte",
    description:"Leistungen, Artikel, Preise, Einheiten und MWST-Sätze als Stammdaten pflegen.", primaryAction:"Leistung erfassen",
    stats:[{label:"Leistungen",value:"24",meta:"18 aktiv"},{label:"Artikel",value:"12",meta:"4 Lagerartikel"},{label:"Preise aktualisiert",value:"92 %",meta:"dieses Jahr"}],
    columns:["Bezeichnung","Typ","Einheit","Preis","Status"],
    rows:[["IT-Beratung","Leistung","Stunde","CHF 180","Aktiv"],["Projektleitung","Leistung","Stunde","CHF 200","Aktiv"],["Support-Pauschale","Leistung","Monat","CHF 490","Aktiv"]]
  },
  {
    key:"buchhaltung", label:"Buchhaltung", href:"/buchhaltung",
    description:"Buchungsjournal, Debitoren, Kreditoren und Abschlussvorbereitung im Überblick.", primaryAction:"Buchung erfassen",
    stats:[{label:"Ertrag YTD",value:"CHF 1.12 Mio.",meta:"+9.4 %"},{label:"Aufwand YTD",value:"CHF 694’000",meta:"laufend"},{label:"Ergebnis",value:"CHF 426’000",meta:"vor Abschluss"}],
    columns:["Datum","Beleg","Konto","Betrag","Status"],
    rows:[["28.09.2026","R-2026-0184","3200 Dienstleistungsertrag","CHF 4’850","Verbucht"],["28.09.2026","ER-2026-0081","6500 Büroaufwand","CHF 2’460","Entwurf"]]
  },
  {
    key:"bank", label:"Bank", href:"/bank",
    description:"Konten, Kontostände, Transaktionen und Zuordnungen kontrollieren.", primaryAction:"Bankimport simulieren",
    stats:[{label:"Bankbestand",value:"CHF 186’400",meta:"2 Konten"},{label:"Nicht zugeordnet",value:"3",meta:"Transaktionen"},{label:"Heute",value:"+ CHF 8’740",meta:"Netto"}],
    columns:["Datum","Konto","Text","Betrag","Status"],
    rows:[["28.09.2026","Geschäftskonto","Steiner Consulting","+ CHF 2’400","Zugeordnet"],["28.09.2026","Geschäftskonto","Cloud Services Schweiz","- CHF 1’280","Offen"]]
  },
  {
    key:"aufgaben", label:"Aufgaben", href:"/aufgaben",
    description:"Offene Arbeiten über Kunden, Projekte und interne Themen zentral priorisieren.", primaryAction:"Aufgabe erstellen",
    stats:[{label:"Heute",value:"7",meta:"2 überfällig"},{label:"Diese Woche",value:"18",meta:"Team"},{label:"Erledigt",value:"34",meta:"letzte 30 Tage"}],
    columns:["Aufgabe","Bezug","Fällig","Verantwortlich","Status"],
    rows:[["Offerte prüfen","Müller Bau AG","29.09.2026","Oemer Cam","Offen"],["Projektstatus aktualisieren","Website Relaunch","30.09.2026","Anna Muster","In Arbeit"]]
  },
  {
    key:"abwesenheiten", label:"Abwesenheiten", href:"/abwesenheiten",
    description:"Ferien, Krankheit und andere Abwesenheiten beantragen und freigeben.", primaryAction:"Abwesenheit erfassen",
    stats:[{label:"Heute abwesend",value:"1",meta:"Ferien"},{label:"Offene Anträge",value:"3",meta:"prüfen"},{label:"Ferien offen",value:"84 Tage",meta:"gesamt"}],
    columns:["Mitarbeiter","Art","Zeitraum","Tage","Status"],
    rows:[["Anna Muster","Ferien","05.10.–09.10.2026","5","Genehmigt"],["Luca Meier","Ferien","19.10.–23.10.2026","5","Offen"]]
  },
  {
    key:"dokumente", label:"Dokumente", href:"/dokumente",
    description:"Unternehmensdokumente zentral ablegen, zuordnen und wiederfinden.", primaryAction:"Dokument hinzufügen",
    stats:[{label:"Dokumente",value:"146",meta:"gesamt"},{label:"Neu",value:"12",meta:"30 Tage"},{label:"Ohne Zuordnung",value:"4",meta:"prüfen"}],
    columns:["Dokument","Typ","Zuordnung","Aktualisiert","Status"],
    rows:[["Rahmenvertrag Müller Bau","Vertrag","Müller Bau AG","28.09.2026","Aktuell"],["Spesenreglement","Richtlinie","Firma","12.09.2026","Aktuell"]]
  },
  {
    key:"vertraege", label:"Verträge", href:"/vertraege",
    description:"Kunden-, Lieferanten- und wiederkehrende Verträge mit Laufzeiten verwalten.", primaryAction:"Vertrag erfassen",
    stats:[{label:"Aktive Verträge",value:"19",meta:"gesamt"},{label:"Verlängerung 60 Tage",value:"4",meta:"prüfen"},{label:"MRR",value:"CHF 18’600",meta:"wiederkehrend"}],
    columns:["Vertrag","Partner","Laufzeit","Wert","Status"],
    rows:[["Supportvertrag 2026","Keller AG","01.01.–31.12.2026","CHF 18’000","Aktiv"],["Cloud Hosting","Cloud Services Schweiz","monatlich","CHF 1’280","Aktiv"]]
  }
];

export function getModule(key: ModuleKey) {
  return modules.find((module) => module.key === key)!;
}
