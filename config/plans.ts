import type {PlanId} from './domain';

/** V25.4 approved commercial source. null is explicitly unlimited, never a large quota. */
export const planCatalog={
 start:{name:'Start',monthly:29,yearly:290,description:'Für Selbstständige und kleine Teams, die Verkauf und Administration zentralisieren möchten.',
  modules:['kunden','offerten','auftraege','projekte','zeiterfassung','spesen','rechnungen','zahlungen','berichte','aufgaben','einstellungen'],
  features:['crm','quotes','orders','projects','time','invoices','expenses'],
  marketing:['Kunden und Kontakte','Offerten und Rechnungen','Zeiterfassung und Spesen','Aufträge','Basisberichte','1 Firma · bis 3 Benutzer'],
  limits:{users:3,projects:100,storageMb:1024,monthlyDocuments:100,monthlyApiRequests:10000}},
 business:{name:'Business',monthly:69,yearly:690,description:'Für KMU mit Team, Personal, Einkauf und erweiterten Finanzprozessen.',
  modules:['kunden','offerten','auftraege','projekte','zeiterfassung','spesen','rechnungen','zahlungen','berichte','aufgaben','einstellungen','lieferanten','eingangsrechnungen','buchhaltung','bank','mwst','personal','abwesenheiten','produkte'],
  features:['crm','quotes','orders','projects','time','invoices','expenses','finance','employees','accounting','suppliers'],
  marketing:['Alles aus Start','Produkte und Leistungen','Mitarbeiter','Finanzen','bis 15 Benutzer'],
  limits:{users:15,projects:1000,storageMb:5120,monthlyDocuments:1000,monthlyApiRequests:100000}},
 pro:{name:'Pro',monthly:129,yearly:1290,description:'Für wachsende Unternehmen mit mehreren Bereichen, Rollen und erweiterten Kontrollen.',
  modules:['kunden','offerten','auftraege','projekte','zeiterfassung','spesen','rechnungen','zahlungen','berichte','aufgaben','einstellungen','lieferanten','eingangsrechnungen','buchhaltung','bank','mwst','personal','abwesenheiten','produkte','lohn','dokumente','vertraege'],
  features:['crm','quotes','orders','projects','time','invoices','expenses','finance','employees','accounting','suppliers','documents','contracts','payroll','audit','exports','api','automations'],
  marketing:['Alles aus Business','Unbegrenzte Benutzer'],
  limits:{users:null,projects:null,storageMb:20480,monthlyDocuments:10000,monthlyApiRequests:1000000}},
} as const;

export function canonicalPlanId(value:unknown):PlanId|null{
 const id=value==='starter'?'start':value==='professional'||value==='enterprise'?'pro':value;
 return id==='start'||id==='business'||id==='pro'?id:null;
}
/** Preserve lower existing limits on capped plans; Pro has no regular user quota. */
export function effectiveUserLimit(plan:PlanId,stored:unknown=undefined):number|null{
 const approved=planCatalog[plan].limits.users;
 if(approved===null)return null;
 const value=Number(stored);
 return stored!=null&&Number.isSafeInteger(value)&&value>0?Math.min(approved,value):approved;
}
export function capacityReached(count:number,limit:number|null){return limit!==null&&count>=limit;}

/** Availability is separate from a licensed module; no prototype is a marketing promise. */
export const featureMaturity={
 crm:'implemented',quotes:'implemented',orders:'implemented',projects:'implemented',time:'implemented',invoices:'implemented',expenses:'implemented',finance:'implemented',employees:'implemented',
 accounting:'limited',suppliers:'limited',documents:'limited',contracts:'limited',payroll:'internal',audit:'internal',exports:'limited',api:'planned',automations:'planned',
} as const;
