import type {ModuleKey} from "@/lib/modules";

export type PlanId="start"|"business"|"pro";

const startModules=new Set<ModuleKey>([
  "kunden","offerten","auftraege","projekte","zeiterfassung","spesen",
  "rechnungen","zahlungen","berichte","aufgaben","einstellungen"
]);
const businessModules=new Set<ModuleKey>([
  ...startModules,
  "lieferanten","eingangsrechnungen","buchhaltung","bank","mwst",
  "personal","abwesenheiten","produkte"
]);
const proModules=new Set<ModuleKey>([
  ...businessModules,
  "lohn","dokumente","vertraege"
]);

const moduleSets:Record<PlanId,Set<ModuleKey>>={start:startModules,business:businessModules,pro:proModules};

export const planLimits:Record<PlanId,{users:number;projects:number}>={
  start:{users:3,projects:100},
  business:{users:15,projects:1000},
  pro:{users:Number.MAX_SAFE_INTEGER,projects:Number.MAX_SAFE_INTEGER},
};

export function isPlanId(value:unknown):value is PlanId{return value==="start"||value==="business"||value==="pro"}
export function planAllowsModule(plan:PlanId,moduleKey:string){return moduleSets[plan].has(moduleKey as ModuleKey)}

const routeToModule:[string,ModuleKey][]=[
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
