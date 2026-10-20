import type {ModuleKey} from '@/lib/modules';
import {planCatalog} from './plans';
import type {PlanId} from './domain';
export type {PlanId} from './domain';
const moduleSets:Record<PlanId,ReadonlySet<string>>={start:new Set(planCatalog.start.modules),business:new Set(planCatalog.business.modules),pro:new Set(planCatalog.pro.modules)};
export const planLimits:Record<PlanId,{users:number|null;projects:number|null}>={start:planCatalog.start.limits,business:planCatalog.business.limits,pro:planCatalog.pro.limits};

export function isPlanId(value:unknown):value is PlanId{return value==="start"||value==="business"||value==="pro"}
export function planAllowsModule(plan:PlanId,moduleKey:string){return moduleSets[plan].has(moduleKey as ModuleKey)}

const routeToModule:[string,ModuleKey][]=[
  ["/angebote","offerten"],["/zeit","zeiterfassung"],["/mitarbeiter","personal"],
  ["/kunden","kunden"],["/offerten","offerten"],["/auftraege","auftraege"],["/projekte","projekte"],
  ["/zeiterfassung","zeiterfassung"],["/spesen","spesen"],["/rechnungen","rechnungen"],["/zahlungen","zahlungen"],
  ["/mwst","mwst"],["/personal","personal"],["/lohn","lohn"],["/berichte","berichte"],
  ["/einstellungen","einstellungen"],["/lieferanten","lieferanten"],["/eingangsrechnungen","eingangsrechnungen"],
  ["/produkte","produkte"],["/buchhaltung","buchhaltung"],["/bank","bank"],["/aufgaben","aufgaben"],
  ["/abwesenheiten","abwesenheiten"],["/dokumente","dokumente"],["/vertraege","vertraege"],
];

export function moduleForPath(pathname:string):ModuleKey|null{
  return routeToModule.find(([prefix])=>pathname===prefix||pathname.startsWith(prefix+"/"))?.[1]??null;
}
export function planAllowsPath(plan:PlanId,pathname:string){const moduleKey=moduleForPath(pathname);return !moduleKey||planAllowsModule(plan,moduleKey)}

export function planLabel(plan:PlanId){return plan==="start"?"Start":plan==="business"?"Business":"Pro"}
