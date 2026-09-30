import type {ModuleKey} from "@/lib/modules";
import {money} from "@/lib/local-store";
import {domainConfig,isoDate} from "@/config/domain";
import {accountingDefaults} from "@/config/accounting";

type RelationDef={module:ModuleKey;relationKey:string;createHref?:string};
export type Def={name:string;label:string;storageKey?:string;currency?:boolean;type?:string;placeholder?:string;options?:string[];required?:boolean;full?:boolean;defaultValue?:string;relation?:RelationDef};
type FormDef={module:ModuleKey;fields:Def[];row:(v:Record<string,string>)=>string[]};
export function getEntityFormDefinitions():Record<string,FormDef>{
 const today=()=>isoDate();
 const defaultPaymentDays=String(domainConfig.defaultPaymentDays);
 const defaultVat=String(domainConfig.defaultVatRate);
 return {
 Kunde:{module:"kunden",fields:[
  {name:"firma",label:"Firmenname",required:true},{name:"kontakt",label:"Kontaktperson",required:true},{name:"email",label:"E-Mail",type:"email",required:true},{name:"telefon",label:"Telefon"},
  {name:"adresse",label:"Strasse und Nr."},{name:"ort",label:"PLZ / Ort"},{name:"uid",label:"UID"},{name:"sprache",label:"Sprache",options:["Deutsch","Français","Italiano","English"],defaultValue:"Deutsch"},
  {name:"zahlungsfrist",label:"Zahlungsfrist",type:"number",defaultValue:defaultPaymentDays},{name:"rabatt",label:"Rabatt %",type:"number",defaultValue:"0"},{name:"notiz",label:"Notiz",full:true},{name:"status",label:"Status",options:["Aktiv","Interessent","Inaktiv"],defaultValue:"Aktiv"}
 ],row:v=>[v.firma,v.kontakt,v.email,money(0),v.status]},
 Auftrag:{module:"auftraege",fields:[
  {name:"bezeichnung",label:"Auftragsbezeichnung",required:true},{name:"kunde",label:"Kunde",required:true,relation:{module:"kunden",relationKey:"customerId",createHref:"/kunden/neu"}},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId",createHref:"/projekte/neu"}},
  {name:"volumen",label:"Auftragsvolumen",type:"number",defaultValue:"0"},{name:"start",label:"Start",type:"date",defaultValue:today()},{name:"ende",label:"Geplantes Ende",type:"date"},{name:"status",label:"Status",options:["Bereit","In Arbeit","Abgeschlossen","Storniert"],defaultValue:"Bereit"},{name:"notiz",label:"Notiz",full:true}
 ],row:v=>[v.bezeichnung,v.kunde,v.projekt||"–",money(Number(v.volumen||0)),v.status]},
 Projekt:{module:"projekte",fields:[
  {name:"bezeichnung",label:"Projektname",required:true},{name:"kunde",label:"Kunde",required:true,relation:{module:"kunden",relationKey:"customerId",createHref:"/kunden/neu"}},{name:"projektleitung",label:"Projektleitung",relation:{module:"personal",relationKey:"managerId",createHref:"/personal/neu"}},{name:"team",label:"Team / Ressourcen"},
  {name:"budget",label:"Budget",type:"number",defaultValue:"0"},{name:"stundenbudget",label:"Stundenbudget",type:"number",defaultValue:"0"},{name:"fortschritt",label:"Fortschritt %",type:"number",defaultValue:"0"},{name:"start",label:"Start",type:"date",defaultValue:today()},{name:"ende",label:"Ende",type:"date"},{name:"status",label:"Status",options:["Geplant","In Arbeit","Laufend","Blockiert","Abgeschlossen"],defaultValue:"Geplant"},{name:"notiz",label:"Projektbeschreibung",full:true}
 ],row:v=>[v.bezeichnung,v.kunde,`${v.fortschritt||0} %`,money(Number(v.budget||0)),v.status]},
 Zeiteintrag:{module:"zeiterfassung",fields:[
  {name:"datum",label:"Datum",type:"date",required:true,defaultValue:today()},{name:"mitarbeiter",label:"Mitarbeiter",required:true,relation:{module:"personal",relationKey:"employeeId",createHref:"/personal/neu"}},{name:"projekt",label:"Projekt",required:true,relation:{module:"projekte",relationKey:"projectId",createHref:"/projekte/neu"}},{name:"leistung",label:"Leistung",required:true,relation:{module:"produkte",relationKey:"productId",createHref:"/produkte/neu"}},
  {name:"von",label:"Von",type:"time",defaultValue:domainConfig.standardWorkdayStart},{name:"bis",label:"Bis",type:"time",defaultValue:domainConfig.standardWorkdayEnd},{name:"pause",label:"Pause Minuten",type:"number",defaultValue:String(domainConfig.standardBreakMinutes)},{name:"dauer",label:"Dauer in Stunden",type:"number",required:true,defaultValue:String(domainConfig.standardWorkdayHours)},{name:"verrechenbar",label:"Verrechenbar",options:["Ja","Nein"],defaultValue:"Ja"},{name:"status",label:"Status",options:["Entwurf","Freigegeben"],defaultValue:"Entwurf"},{name:"notiz",label:"Notiz",full:true}
 ],row:v=>[v.datum,v.projekt,v.leistung,`${v.dauer} h`,v.status]},
 Spese:{module:"spesen",fields:[
  {name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"mitarbeiter",label:"Mitarbeiter",required:true,relation:{module:"personal",relationKey:"employeeId",createHref:"/personal/neu"}},{name:"beschreibung",label:"Beschreibung",required:true},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId",createHref:"/projekte/neu"}},{name:"betrag",label:"Betrag",storageKey:"Betrag CHF",currency:true,type:"number",required:true},
  {name:"kategorie",label:"Kategorie",options:["Reise","Verpflegung","Material","Software","Fahrzeug","Sonstiges"]},{name:"weiterverrechenbar",label:"Weiterverrechenbar",options:["Ja","Nein"],defaultValue:"Nein"},{name:"status",label:"Status",options:["Offen","Freigegeben","Verbucht","Abgelehnt"],defaultValue:"Offen"},{name:"beleg",label:"Beleg",type:"file",full:true}
 ],row:v=>[v.datum,v.beschreibung,v.projekt||"–",money(Number(v.betrag||0)),v.status]},
 Zahlung:{module:"zahlungen",fields:[
  {name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"zahler",label:"Zahler",required:true,relation:{module:"kunden",relationKey:"customerId"}},{name:"referenz",label:"Referenz",required:true},{name:"betrag",label:"Betrag",storageKey:"Betrag CHF",currency:true,type:"number",required:true},{name:"rechnung",label:"Rechnung",relation:{module:"rechnungen",relationKey:"invoiceId"}},
  {name:"art",label:"Zahlungsart",options:["Bank","Bar","Karte","TWINT","Sonstiges"],defaultValue:"Bank"},{name:"status",label:"Zuordnung",options:["Zugeordnet","Teilzugeordnet","Offen"],defaultValue:"Zugeordnet"}
 ],row:v=>[v.datum,v.zahler,v.referenz,money(Number(v.betrag||0)),v.status]},
 Lieferant:{module:"lieferanten",fields:[
  {name:"firma",label:"Firmenname",required:true},{name:"kontakt",label:"Kontaktperson"},{name:"email",label:"E-Mail",type:"email"},{name:"telefon",label:"Telefon"},{name:"adresse",label:"Adresse"},{name:"iban",label:"IBAN"},{name:"zahlungsfrist",label:"Zahlungsfrist",type:"number",defaultValue:defaultPaymentDays},{name:"status",label:"Status",options:["Aktiv","Inaktiv"],defaultValue:"Aktiv"}
 ],row:v=>[v.firma,v.kontakt||"–",v.email||"–",money(0),v.status]},
 Eingangsrechnung:{module:"eingangsrechnungen",fields:[
  {name:"nummer",label:"Rechnungsnummer",required:true},{name:"lieferant",label:"Lieferant",required:true,relation:{module:"lieferanten",relationKey:"supplierId",createHref:"/lieferanten/neu"}},{name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"faellig",label:"Fällig",type:"date"},{name:"betrag",label:"Betrag",storageKey:"Betrag CHF",currency:true,type:"number",required:true},{name:"konto",label:"Aufwandskonto",defaultValue:accountingDefaults.officeExpense},{name:"status",label:"Status",options:["Entwurf","Zur Freigabe","Freigegeben","Bezahlt","Überfällig"],defaultValue:"Entwurf"},{name:"beleg",label:"Beleg",type:"file",full:true}
 ],row:v=>[v.nummer,v.lieferant,v.faellig||v.datum,money(Number(v.betrag||0)),v.status]},
 Leistung:{module:"produkte",fields:[
  {name:"bezeichnung",label:"Bezeichnung",required:true},{name:"typ",label:"Typ",options:["Leistung","Artikel"],defaultValue:"Leistung"},{name:"einheit",label:"Einheit",options:["Stunde","Pauschale","Stück","Tag","Monat"],defaultValue:"Stunde"},{name:"preis",label:"Preis",storageKey:"Preis CHF",currency:true,type:"number",required:true},{name:"mwst",label:"MWST %",type:"number",defaultValue:defaultVat},{name:"status",label:"Status",options:["Aktiv","Inaktiv"],defaultValue:"Aktiv"}
 ],row:v=>[v.bezeichnung,v.typ,v.einheit,money(Number(v.preis||0)),v.status]},
 Buchung:{module:"buchhaltung",fields:[
  {name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"beleg",label:"Beleg",required:true},{name:"konto",label:"Konto",required:true},{name:"gegenkonto",label:"Gegenkonto",defaultValue:accountingDefaults.bankAccount},{name:"betrag",label:"Betrag",storageKey:"Betrag CHF",currency:true,type:"number",required:true},{name:"status",label:"Status",options:["Entwurf","Verbucht"],defaultValue:"Entwurf"}
 ],row:v=>[v.datum,v.beleg,v.konto,money(Number(v.betrag||0)),v.status]},
 Aufgabe:{module:"aufgaben",fields:[
  {name:"aufgabe",label:"Aufgabe",required:true},{name:"kunde",label:"Kunde",relation:{module:"kunden",relationKey:"customerId"}},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId"}},{name:"rechnung",label:"Rechnung",relation:{module:"rechnungen",relationKey:"invoiceId"}},{name:"faellig",label:"Fällig",type:"date"},{name:"verantwortlich",label:"Verantwortlich",relation:{module:"personal",relationKey:"employeeId"}},{name:"prioritaet",label:"Priorität",options:["Normal","Hoch","Kritisch"],defaultValue:"Normal"},{name:"status",label:"Status",options:["Offen","In Arbeit","Erledigt"],defaultValue:"Offen"}
 ],row:v=>[v.aufgabe,v.projekt||v.kunde||v.rechnung||"Intern",v.faellig||"–",v.verantwortlich||"–",v.status]},
 Abwesenheit:{module:"abwesenheiten",fields:[
  {name:"mitarbeiter",label:"Mitarbeiter",required:true,relation:{module:"personal",relationKey:"employeeId",createHref:"/personal/neu"}},{name:"art",label:"Art",options:["Ferien","Krankheit","Unbezahlt","Militär/Zivildienst","Andere"],defaultValue:"Ferien"},{name:"von",label:"Von",type:"date",required:true},{name:"bis",label:"Bis",type:"date",required:true},{name:"tage",label:"Tage",type:"number",defaultValue:"1"},{name:"status",label:"Status",options:["Offen","Genehmigt","Abgelehnt"],defaultValue:"Offen"}
 ],row:v=>[v.mitarbeiter,v.art,`${v.von}–${v.bis}`,v.tage,v.status]},
 Dokument:{module:"dokumente",fields:[
  {name:"name",label:"Dokumentname",required:true},{name:"typ",label:"Typ",options:["Vertrag","Rechnung","Richtlinie","Personal","Projekt","Andere"],defaultValue:"Andere"},{name:"kunde",label:"Kunde",relation:{module:"kunden",relationKey:"customerId"}},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId"}},{name:"mitarbeiter",label:"Mitarbeiter",relation:{module:"personal",relationKey:"employeeId"}},{name:"lieferant",label:"Lieferant",relation:{module:"lieferanten",relationKey:"supplierId"}},{name:"datum",label:"Aktualisiert",type:"date",defaultValue:today()},{name:"status",label:"Status",options:["Aktuell","Archiviert"],defaultValue:"Aktuell"},{name:"beleg",label:"Datei",type:"file",full:true}
 ],row:v=>[v.name,v.typ,v.projekt||v.kunde||v.mitarbeiter||v.lieferant||"Firma",v.datum,v.status]},
 Vertrag:{module:"vertraege",fields:[
  {name:"vertrag",label:"Vertrag",required:true},{name:"kunde",label:"Kunde",relation:{module:"kunden",relationKey:"customerId"}},{name:"lieferant",label:"Lieferant",relation:{module:"lieferanten",relationKey:"supplierId"}},{name:"start",label:"Start",type:"date"},{name:"ende",label:"Ende",type:"date"},{name:"wert",label:"Wert",storageKey:"Wert CHF",currency:true,type:"number"},{name:"intervall",label:"Intervall",options:["Einmalig","Monatlich","Jährlich"],defaultValue:"Jährlich"},{name:"wiederkehrend",label:"Rechnung automatisch vorbereiten",options:["Nein","Ja"],defaultValue:"Nein"},{name:"status",label:"Status",options:["Entwurf","Aktiv","Gekündigt","Abgelaufen"],defaultValue:"Aktiv"}
 ],row:v=>[v.vertrag,v.kunde||v.lieferant||"–",v.ende?`${v.start}–${v.ende}`:v.intervall,money(Number(v.wert||0)),v.status]},
 Mitarbeiter:{module:"personal",fields:[
  {name:"name",label:"Name",required:true},{name:"funktion",label:"Funktion",required:true},{name:"email",label:"E-Mail",type:"email"},{name:"telefon",label:"Telefon"},{name:"adresse",label:"Adresse"},{name:"ahv",label:"AHV-Nr."},{name:"iban",label:"IBAN"},{name:"pensum",label:"Pensum %",type:"number",defaultValue:"100"},{name:"wochenstunden",label:"Wochenstunden",type:"number",defaultValue:String(domainConfig.standardWeeklyHours)},{name:"ferien",label:"Ferientage / Jahr",type:"number",defaultValue:String(domainConfig.standardVacationDays)},{name:"eintritt",label:"Eintritt",type:"date",defaultValue:today()},{name:"brutto",label:"Monatslohn brutto",storageKey:"Monatslohn brutto CHF",currency:true,type:"number"},{name:"kinderzulage",label:"Kinderzulage",storageKey:"Kinderzulage CHF",currency:true,type:"number",defaultValue:"0"},{name:"quellensteuer",label:"Quellensteuer %",type:"number",defaultValue:"0"},{name:"bvg",label:"BVG Abzug",storageKey:"BVG Abzug CHF",currency:true,type:"number"},{name:"status",label:"Status",options:["Aktiv","Inaktiv","Ausgetreten"],defaultValue:"Aktiv"}
 ],row:v=>[v.name,v.funktion,`${v.pensum}%`,v.eintritt,v.status]}
};
}
