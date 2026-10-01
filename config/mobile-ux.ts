import type {ModuleKey} from "@/lib/modules";

/**
 * Mobile/PWA information hierarchy.
 * Keep this domain-aware: the first viewport only contains information that
 * helps identify a record or decide the next action. Master data belongs in
 * the detail expansion, not in list rows.
 */
export const mobileListSecondaryIndexes:Record<ModuleKey,number[]>={
  kunden:[1],
  offerten:[1,3],
  auftraege:[1,3],
  projekte:[1,2],
  zeiterfassung:[1,3],
  spesen:[1,3],
  rechnungen:[1,3],
  zahlungen:[1,3],
  mwst:[0,3],
  personal:[1,2],
  lohn:[1,3],
  berichte:[1,2],
  einstellungen:[1],
  lieferanten:[1],
  eingangsrechnungen:[1,3],
  produkte:[1,3],
  buchhaltung:[1,3],
  bank:[1,3],
  aufgaben:[1,2],
  abwesenheiten:[1,2],
  dokumente:[1,2],
  vertraege:[1,2],
};

const detailPrimary:Partial<Record<ModuleKey,string[]>>={
  kunden:["Status","Kontaktperson","Kontakt","Telefon","E-Mail"],
  lieferanten:["Status","Kontaktperson","Kontakt","Telefon","E-Mail"],
  offerten:["Kunde","Status","Datum","Betrag","Total","Gültig bis"],
  rechnungen:["Kunde","Status","Fällig","Betrag","Total","Offen"],
  auftraege:["Kunde","Projekt","Auftragsvolumen","Volumen","Status"],
  projekte:["Kunde","Fortschritt","Budget","Status","Projektleitung"],
  zeiterfassung:["Datum","Projekt","Leistung","Dauer in Stunden","Dauer","Status"],
  spesen:["Datum","Beschreibung","Projekt","Betrag CHF","Betrag","Status"],
  zahlungen:["Datum","Zahler","Referenz","Betrag CHF","Betrag","Zuordnung","Status"],
  personal:["Funktion","Pensum","Status","E-Mail","Eintritt"],
  abwesenheiten:["Mitarbeiter","Art","Von","Bis","Tage","Status"],
  produkte:["Typ","Einheit","Preis CHF","Preis","MWST %","Status"],
  eingangsrechnungen:["Lieferant","Fällig","Betrag CHF","Betrag","Status"],
  buchhaltung:["Datum","Beleg","Konto","Betrag CHF","Betrag","Status"],
  bank:["Datum","Konto","Betrag","Status"],
  aufgaben:["Bezug","Fällig","Verantwortlich","Priorität","Status"],
  dokumente:["Typ","Zuordnung","Aktualisiert","Status"],
  vertraege:["Partner","Laufzeit","Wert","Status"],
  mwst:["Periode","Zahllast","Status"],
  lohn:["Mitarbeiter","Netto","Status"],
  berichte:["Zeitraum","Bereich","Aktualisiert","Status"],
  einstellungen:["Bereich","Status","Zugriff"],
};

export function mobileDetailEntries(module:ModuleKey,entries:Array<[string,string]>) {
  const priority=detailPrimary[module]??[];
  const rank=new Map(priority.map((key,index)=>[key,index]));
  const primary=entries
    .filter(([key])=>rank.has(key))
    .sort((a,b)=>(rank.get(a[0])??999)-(rank.get(b[0])??999))
    .slice(0,6);
  const used=new Set(primary.map(([key])=>key));
  const additional=entries.filter(([key])=>!used.has(key));
  return {primary:primary.length?primary:entries.slice(0,4),additional:primary.length?additional:entries.slice(4)};
}
