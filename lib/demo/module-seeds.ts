import type {ModuleKey} from "@/lib/modules";

export type DemoModuleSeed = {
  stats: {label:string;value:string;meta?:string}[];
  rows: string[][];
};

export const demoModuleSeeds: Record<ModuleKey,DemoModuleSeed> = {
  "kunden": {
    stats: [
      { label: "Aktive Kunden", value: "42", meta: "+3 diesen Monat" },
      { label: "Offene Chancen", value: "8", meta: "CHF 84’200" },
      { label: "Überfällige Aufgaben", value: "3", meta: "Heute prüfen" },
    ],
    rows: [
      ["Müller Bau AG", "Anna Müller", "anna@muellerbau.ch", "CHF 48’400", "Aktiv"],
      ["Steiner Consulting", "Luca Steiner", "luca@steiner.ch", "CHF 31’200", "Aktiv"],
      ["Huber & Partner", "Nina Huber", "nina@huberpartner.ch", "CHF 18’900", "Aktiv"],
      ["Limmat Immobilien", "Marc Frei", "marc@limmat.ch", "CHF 66’100", "Aktiv"],
    ]
  },
  "offerten": {
    stats: [
      { label: "Offen", value: "7", meta: "CHF 76’450" },
      { label: "Angenommen", value: "12", meta: "letzte 30 Tage" },
      { label: "Quote", value: "63 %", meta: "Annahmequote" },
    ],
    rows: [
      ["O-2026-0081", "Müller Bau AG", "28.09.2026", "CHF 12’800", "Offen"],
      ["O-2026-0080", "Keller AG", "27.09.2026", "CHF 6’400", "Entwurf"],
      ["O-2026-0079", "Steiner Consulting", "25.09.2026", "CHF 18’200", "Angenommen"],
    ]
  },
  "auftraege": {
    stats: [
      { label: "Aktiv", value: "14", meta: "6 mit Projekt" },
      { label: "Auftragsvolumen", value: "CHF 214’900", meta: "laufend" },
      { label: "Abschluss fällig", value: "4", meta: "nächste 14 Tage" },
    ],
    rows: [
      ["A-2026-041", "Müller Bau AG", "Website Relaunch", "CHF 32’000", "In Arbeit"],
      ["A-2026-039", "Steiner Consulting", "ERP Beratung", "CHF 24’000", "In Arbeit"],
      ["A-2026-036", "Keller AG", "IT-Support", "CHF 18’000", "Bereit"],
    ]
  },
  "projekte": {
    stats: [
      { label: "Laufende Projekte", value: "9", meta: "3 kritisch" },
      { label: "Budget", value: "CHF 188’000", meta: "gesamt" },
      { label: "Auslastung", value: "78 %", meta: "Team" },
    ],
    rows: [
      ["Website Relaunch", "Müller Bau AG", "80 %", "CHF 32’000", "In Arbeit"],
      ["ERP Beratung", "Steiner Consulting", "60 %", "CHF 24’000", "In Arbeit"],
      ["Büroumbau", "Limmat Immobilien", "35 %", "CHF 42’000", "In Arbeit"],
      ["IT-Support", "Keller AG", "90 %", "CHF 18’000", "Laufend"],
    ]
  },
  "zeiterfassung": {
    stats: [
      { label: "Diese Woche", value: "28 h", meta: "von 40 h" },
      { label: "Verrechenbar", value: "22 h", meta: "79 %" },
      { label: "Noch offen", value: "12 h", meta: "Sollzeit" },
    ],
    rows: [
      ["28.09.2026", "Website Relaunch", "Konzeption", "6:30 h", "Freigegeben"],
      ["27.09.2026", "ERP Beratung", "Workshop", "7:45 h", "Freigegeben"],
      ["26.09.2026", "Intern", "Administration", "2:00 h", "Entwurf"],
    ]
  },
  "spesen": {
    stats: [
      { label: "Offen", value: "5", meta: "CHF 842.30" },
      { label: "Freigegeben", value: "18", meta: "diesen Monat" },
      { label: "Weiterverrechenbar", value: "CHF 396.00", meta: "an Kunden" },
    ],
    rows: [
      ["28.09.2026", "SBB Bern–Zürich", "ERP Beratung", "CHF 96.00", "Offen"],
      ["27.09.2026", "Kundenlunch", "Website Relaunch", "CHF 148.50", "Freigegeben"],
      ["25.09.2026", "Parkgebühr", "IT-Support", "CHF 18.00", "Verbucht"],
    ]
  },
  "rechnungen": {
    stats: [
      { label: "Offen", value: "CHF 24’300", meta: "5 Rechnungen" },
      { label: "Überfällig", value: "CHF 6’200", meta: "1 Rechnung" },
      { label: "Bezahlt", value: "CHF 81’400", meta: "diesen Monat" },
    ],
    rows: [
      ["R-2026-0184", "Müller Bau AG", "15.10.2026", "CHF 4’850", "Offen"],
      ["R-2026-0183", "Steiner Consulting", "08.10.2026", "CHF 2’400", "Bezahlt"],
      ["R-2026-0182", "Limmat Immobilien", "22.09.2026", "CHF 6’200", "Überfällig"],
    ]
  },
  "zahlungen": {
    stats: [
      { label: "Heute eingegangen", value: "CHF 8’740", meta: "4 Zahlungen" },
      { label: "Nicht zugeordnet", value: "2", meta: "prüfen" },
      { label: "Offene Posten", value: "CHF 24’300", meta: "Debitoren" },
    ],
    rows: [
      ["28.09.2026", "Steiner Consulting", "QRR 0183", "CHF 2’400", "Zugeordnet"],
      ["28.09.2026", "Keller AG", "QRR 0178", "CHF 1’980", "Zugeordnet"],
      ["27.09.2026", "Unbekannt", "NONREF", "CHF 360", "Offen"],
    ]
  },
  "mwst": {
    stats: [
      { label: "Aktuelle Periode", value: "Q3 2026", meta: "01.07.–30.09." },
      { label: "Zahllast", value: "CHF 7’820", meta: "vorläufig" },
      { label: "Belege offen", value: "3", meta: "prüfen" },
    ],
    rows: [
      ["Q3 2026", "CHF 18’940", "CHF 11’120", "CHF 7’820", "In Vorbereitung"],
      ["Q2 2026", "CHF 17’300", "CHF 10’820", "CHF 6’480", "Abgeschlossen"],
      ["Q1 2026", "CHF 16’100", "CHF 9’920", "CHF 6’180", "Abgeschlossen"],
    ]
  },
  "personal": {
    stats: [
      { label: "Mitarbeitende", value: "8", meta: "7 aktiv" },
      { label: "Ferien offen", value: "84 Tage", meta: "gesamt" },
      { label: "Abwesend heute", value: "1", meta: "Ferien" },
    ],
    rows: [
      ["Marc Beispiel", "Projektleitung", "100 %", "01.01.2024", "Aktiv"],
      ["Anna Muster", "Consulting", "80 %", "01.03.2025", "Aktiv"],
      ["Luca Meier", "Administration", "60 %", "01.08.2025", "Aktiv"],
    ]
  },
  "lohn": {
    stats: [
      { label: "Lohnsumme", value: "CHF 72’840", meta: "September 2026" },
      { label: "Bereit", value: "8", meta: "Mitarbeitende" },
      { label: "Auszahlung", value: "30.09.2026", meta: "geplant" },
    ],
    rows: [
      ["Marc Beispiel", "CHF 12’500", "CHF 2’842", "CHF 9’658", "Bereit"],
      ["Anna Muster", "CHF 8’400", "CHF 1’862", "CHF 6’538", "Bereit"],
      ["Luca Meier", "CHF 5’800", "CHF 1’228", "CHF 4’572", "Bereit"],
    ]
  },
  "berichte": {
    stats: [
      { label: "Umsatz YTD", value: "CHF 1.12 Mio.", meta: "+9.4 %" },
      { label: "Deckungsbeitrag", value: "38 %", meta: "+2.1 pp" },
      { label: "Liquidität", value: "CHF 186’400", meta: "verfügbar" },
    ],
    rows: [
      ["Monatsreport", "September 2026", "Gesamt", "28.09.2026", "Aktuell"],
      ["Projektprofitabilität", "Q3 2026", "Projekte", "28.09.2026", "Aktuell"],
      ["Debitorenliste", "Heute", "Finanzen", "28.09.2026", "Aktuell"],
    ]
  },
  "einstellungen": {
    stats: [
      { label: "Benutzer", value: "11", meta: "3 Administratoren" },
      { label: "Integrationen", value: "4", meta: "2 aktiv" },
      { label: "Audit-Ereignisse", value: "128", meta: "letzte 30 Tage" },
    ],
    rows: [
      ["Firmendaten", "Adresse, UID, Bankverbindung", "Konfiguriert", "28.09.2026", "Admin"],
      ["Benutzer & Rollen", "Zugriffe und Berechtigungen", "Konfiguriert", "27.09.2026", "Admin"],
      ["Nummernkreise", "Offerten, Rechnungen, Aufträge", "Konfiguriert", "25.09.2026", "Admin"],
    ]
  },
  "lieferanten": {
    stats: [{label:"Aktive Lieferanten",value:"18",meta:"3 strategisch"},{label:"Offene Rechnungen",value:"CHF 14’820",meta:"Kreditoren"},{label:"Fällig 7 Tage",value:"4",meta:"prüfen"}],
    rows: [["Office Partner AG","Nina Graf","nina@officepartner.ch","CHF 2’460","Aktiv"],["Cloud Services Schweiz","Support","billing@cloud.example","CHF 1’280","Aktiv"]]
  },
  "eingangsrechnungen": {
    stats: [{label:"Offen",value:"CHF 14’820",meta:"9 Belege"},{label:"Zur Freigabe",value:"4",meta:"CHF 6’120"},{label:"Überfällig",value:"CHF 1’280",meta:"1 Rechnung"}],
    rows: [["ER-2026-0081","Office Partner AG","05.10.2026","CHF 2’460","Zur Freigabe"],["ER-2026-0080","Cloud Services Schweiz","25.09.2026","CHF 1’280","Überfällig"]]
  },
  "produkte": {
    stats: [{label:"Leistungen",value:"24",meta:"18 aktiv"},{label:"Artikel",value:"12",meta:"4 Lagerartikel"},{label:"Preise aktualisiert",value:"92 %",meta:"dieses Jahr"}],
    rows: [["IT-Beratung","Leistung","Stunde","CHF 180","Aktiv"],["Projektleitung","Leistung","Stunde","CHF 200","Aktiv"],["Support-Pauschale","Leistung","Monat","CHF 490","Aktiv"]]
  },
  "buchhaltung": {
    stats: [{label:"Ertrag YTD",value:"CHF 1.12 Mio.",meta:"+9.4 %"},{label:"Aufwand YTD",value:"CHF 694’000",meta:"laufend"},{label:"Ergebnis",value:"CHF 426’000",meta:"vor Abschluss"}],
    rows: [["28.09.2026","R-2026-0184","3200 Dienstleistungsertrag","CHF 4’850","Verbucht"],["28.09.2026","ER-2026-0081","6500 Büroaufwand","CHF 2’460","Entwurf"]]
  },
  "bank": {
    stats: [{label:"Bankbestand",value:"CHF 186’400",meta:"2 Konten"},{label:"Nicht zugeordnet",value:"3",meta:"Transaktionen"},{label:"Heute",value:"+ CHF 8’740",meta:"Netto"}],
    rows: [["28.09.2026","Geschäftskonto","Steiner Consulting","+ CHF 2’400","Zugeordnet"],["28.09.2026","Geschäftskonto","Cloud Services Schweiz","- CHF 1’280","Offen"]]
  },
  "aufgaben": {
    stats: [{label:"Heute",value:"7",meta:"2 überfällig"},{label:"Diese Woche",value:"18",meta:"Team"},{label:"Erledigt",value:"34",meta:"letzte 30 Tage"}],
    rows: [["Offerte prüfen","Müller Bau AG","29.09.2026","Oemer Cam","Offen"],["Projektstatus aktualisieren","Website Relaunch","30.09.2026","Anna Muster","In Arbeit"]]
  },
  "abwesenheiten": {
    stats: [{label:"Heute abwesend",value:"1",meta:"Ferien"},{label:"Offene Anträge",value:"3",meta:"prüfen"},{label:"Ferien offen",value:"84 Tage",meta:"gesamt"}],
    rows: [["Anna Muster","Ferien","05.10.–09.10.2026","5","Genehmigt"],["Luca Meier","Ferien","19.10.–23.10.2026","5","Offen"]]
  },
  "dokumente": {
    stats: [{label:"Dokumente",value:"146",meta:"gesamt"},{label:"Neu",value:"12",meta:"30 Tage"},{label:"Ohne Zuordnung",value:"4",meta:"prüfen"}],
    rows: [["Rahmenvertrag Müller Bau","Vertrag","Müller Bau AG","28.09.2026","Aktuell"],["Spesenreglement","Richtlinie","Firma","12.09.2026","Aktuell"]]
  },
  "vertraege": {
    stats: [{label:"Aktive Verträge",value:"19",meta:"gesamt"},{label:"Verlängerung 60 Tage",value:"4",meta:"prüfen"},{label:"MRR",value:"CHF 18’600",meta:"wiederkehrend"}],
    rows: [["Supportvertrag 2026","Keller AG","01.01.–31.12.2026","CHF 18’000","Aktiv"],["Cloud Hosting","Cloud Services Schweiz","monatlich","CHF 1’280","Aktiv"]]
  }
};

export function getDemoModuleSeed(key:ModuleKey):DemoModuleSeed {
  return demoModuleSeeds[key];
}
