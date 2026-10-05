import type { Data } from "swissqrbill/types";
import { isQRReferenceValid, isIBANValid, isQRIBAN } from "swissqrbill/utils";

export function normalizeIban(value:unknown):string{return String(value??"").replace(/\s/g,"").toUpperCase();}
export function validSwissIban(value:unknown):boolean{
 const iban=normalizeIban(value);
 return /^(CH|LI)\d{2}[A-Z0-9]{17}$/.test(iban)&&isIBANValid(iban);
}
export function invoicePaymentIssue(company:Record<string,unknown>):string|null{
 const account=normalizeIban(company.qr_iban||company.iban);
 if(!account)return "Bitte zuerst die IBAN deiner Firma unter Einstellungen → Belege erfassen.";
 if(!validSwissIban(account))return "Bitte eine gültige Schweizer oder Liechtensteiner IBAN für die QR-Rechnung erfassen.";
 if(!String(company.legal_name||company.name||"").trim()||!company.street||!company.postal_code||!company.city)return "Bitte die vollständige Firmenadresse unter Einstellungen → Firma erfassen.";
 for(const [value,max] of [[company.legal_name||company.name,70],[company.street,70],[company.building_number,16],[company.postal_code,16],[company.city,35]] as Array<[unknown,number]>){
  if(String(value??"").length>max)return "Bitte die Firmenadresse für den QR-Zahlteil prüfen: Ein Adressfeld ist zu lang.";
 }
 if(!/^[A-Z]{2}$/.test(String(company.country_code||"CH")))return "Bitte einen gültigen Ländercode in der Firmenadresse erfassen.";
 return null;
}
export function createQrBillData(company:Record<string,unknown>,document:{reference?:string;number:string;total:number;currency?:string}):Data{
 const issue=invoicePaymentIssue(company);if(issue)throw new Error(issue);
 const account=normalizeIban(company.qr_iban||company.iban);
 let reference:string|undefined;
 if(isQRIBAN(account)){
  if(!document.reference||!isQRReferenceValid(document.reference))throw new Error("Die QR-Referenz ist erst nach dem Speichern der Rechnung verfügbar.");
  reference=document.reference;
 }
 if(!Number.isFinite(document.total)||document.total<=0||document.total>999999999.99)throw new Error("Für die QR-Rechnung ist ein gültiger positiver Betrag erforderlich.");
 if(document.currency&&!['CHF','EUR'].includes(document.currency))throw new Error("QR-Rechnungen unterstützen CHF und EUR.");
 return {creditor:{account,name:String(company.legal_name||company.name),address:String(company.street),buildingNumber:String(company.building_number||""),zip:String(company.postal_code),city:String(company.city),country:String(company.country_code||"CH")},amount:Math.round(document.total*100)/100,currency:document.currency==='EUR'?'EUR':'CHF',message:document.number,reference};
}

/** swissqrbill uses mm coordinates without a viewBox. Preserve the full
 * 210 × 105 mm slip when CSS scales it to a phone or a preview column. */
export function responsiveQrSvg(svg:string):string{
 return svg.replace(/<svg\b([^>]*)>/,(_match,attributes:string)=>{
  if(/\bviewBox=/.test(attributes))return `<svg${attributes}>`;
  return `<svg${attributes} viewBox="0 0 ${210*96/25.4} ${105*96/25.4}" preserveAspectRatio="xMidYMid meet">`;
 });
}
