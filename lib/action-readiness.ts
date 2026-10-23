import {safeAppPath} from './navigation';
/** Public metadata only: no bank/account/address values are exposed by readiness. */
export type SetupTask={id:string;title:string;importance:'required'|'recommended'|'optional';complete:boolean;href:string};
export type SetupGuide={dismissed:boolean;editable:boolean;requiredComplete:number;requiredTotal:number;tasks:SetupTask[]};
export type InvoiceReadiness={ready:boolean;number:string;message?:string;recovery?:{href:string;label:string}};
export const setupFieldIds={name:'setup-company-name',legalName:'setup-legal-name',street:'setup-street',postalCode:'setup-postal-code',city:'setup-city',countryCode:'setup-country',iban:'setup-iban',qrIban:'setup-qr-iban',paymentTerms:'setup-payment-terms',logo:'company-logo-upload',documentTexts:'setup-invoice-intro'} as const;
export type SetupField=keyof typeof setupFieldIds;
export function setupDestination(field:SetupField,returnTo='/dashboard'){
 const page=['iban','qrIban','paymentTerms','documentTexts'].includes(field)?'/einstellungen/dokumente':'/einstellungen/firma';
 // Destinations are fixed. Callers supply an app-owned record path, never an origin.
 const safeReturn=safeAppPath(returnTo,'/dashboard');
 return page+'?'+new URLSearchParams({setupField:field,returnTo:safeReturn}).toString();
}
export function setupField(value:string|null):SetupField|null{return value&&Object.hasOwn(setupFieldIds,value)?value as SetupField:null;}
