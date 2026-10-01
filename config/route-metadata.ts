export type MobileBottomArea="dashboard"|"kunden"|"zeiterfassung"|"more"|null;
export type RouteMetadata={
 prefix:string;
 parentArea:string;
 titleKey:string;
 navigationGroup:string;
 mobileBottomNav:MobileBottomArea;
 requiresAuth:boolean;
 quickCreateContext?:string;
};

/**
 * Canonical workspace route ownership used by the shell, mobile bottom navigation
 * and page hierarchy. Longest prefix wins; keep account/service routes out of
 * the More navigation so the avatar remains their primary entry point.
 */
export const workspaceRouteMetadata:RouteMetadata[]=[
 {prefix:"/dashboard",parentArea:"dashboard",titleKey:"Dashboard",navigationGroup:"Übersicht",mobileBottomNav:"dashboard",requiresAuth:true},
 {prefix:"/kunden",parentArea:"kunden",titleKey:"Kunden",navigationGroup:"Verkauf",mobileBottomNav:"kunden",requiresAuth:true,quickCreateContext:"kunde"},
 {prefix:"/zeiterfassung",parentArea:"zeiterfassung",titleKey:"Zeiterfassung",navigationGroup:"Arbeit",mobileBottomNav:"zeiterfassung",requiresAuth:true,quickCreateContext:"zeit"},
 {prefix:"/offerten",parentArea:"verkauf",titleKey:"Offerten",navigationGroup:"Verkauf",mobileBottomNav:"more",requiresAuth:true,quickCreateContext:"offerte"},
 {prefix:"/auftraege",parentArea:"verkauf",titleKey:"Aufträge",navigationGroup:"Verkauf",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/rechnungen",parentArea:"verkauf",titleKey:"Rechnungen",navigationGroup:"Verkauf",mobileBottomNav:"more",requiresAuth:true,quickCreateContext:"rechnung"},
 {prefix:"/zahlungen",parentArea:"verkauf",titleKey:"Zahlungen",navigationGroup:"Verkauf",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/projekte",parentArea:"arbeit",titleKey:"Projekte",navigationGroup:"Arbeit",mobileBottomNav:"more",requiresAuth:true,quickCreateContext:"projekt"},
 {prefix:"/aufgaben",parentArea:"arbeit",titleKey:"Aufgaben",navigationGroup:"Arbeit",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/spesen",parentArea:"arbeit",titleKey:"Spesen",navigationGroup:"Arbeit",mobileBottomNav:"more",requiresAuth:true,quickCreateContext:"spese"},
 {prefix:"/lieferanten",parentArea:"einkauf",titleKey:"Lieferanten",navigationGroup:"Einkauf",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/eingangsrechnungen",parentArea:"einkauf",titleKey:"Eingangsrechnungen",navigationGroup:"Einkauf",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/buchhaltung",parentArea:"finanzen",titleKey:"Buchhaltung",navigationGroup:"Finanzen",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/bank",parentArea:"finanzen",titleKey:"Bank",navigationGroup:"Finanzen",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/mwst",parentArea:"finanzen",titleKey:"MWST",navigationGroup:"Finanzen",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/berichte",parentArea:"finanzen",titleKey:"Berichte",navigationGroup:"Finanzen",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/personal",parentArea:"personal",titleKey:"Mitarbeitende",navigationGroup:"Personal",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/abwesenheiten",parentArea:"personal",titleKey:"Abwesenheiten",navigationGroup:"Personal",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/lohn",parentArea:"personal",titleKey:"Lohn",navigationGroup:"Personal",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/produkte",parentArea:"stammdaten",titleKey:"Produkte und Leistungen",navigationGroup:"Stammdaten",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/dokumente",parentArea:"stammdaten",titleKey:"Dokumente",navigationGroup:"Stammdaten",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/vertraege",parentArea:"stammdaten",titleKey:"Verträge",navigationGroup:"Stammdaten",mobileBottomNav:"more",requiresAuth:true},
 {prefix:"/einstellungen",parentArea:"account",titleKey:"Einstellungen",navigationGroup:"Konto",mobileBottomNav:null,requiresAuth:true},
 {prefix:"/abo",parentArea:"account",titleKey:"Plan und Abrechnung",navigationGroup:"Konto",mobileBottomNav:null,requiresAuth:true},
 {prefix:"/benachrichtigungen",parentArea:"account",titleKey:"Benachrichtigungen",navigationGroup:"Konto",mobileBottomNav:null,requiresAuth:true},
 {prefix:"/neuigkeiten",parentArea:"account",titleKey:"Neuigkeiten",navigationGroup:"Service",mobileBottomNav:null,requiresAuth:true},
 {prefix:"/support",parentArea:"account",titleKey:"Support",navigationGroup:"Service",mobileBottomNav:null,requiresAuth:true},
 {prefix:"/feedback",parentArea:"account",titleKey:"Feedback geben",navigationGroup:"Service",mobileBottomNav:null,requiresAuth:true},
];

export function getWorkspaceRouteMetadata(pathname:string){
 return [...workspaceRouteMetadata]
  .sort((a,b)=>b.prefix.length-a.prefix.length)
  .find(route=>pathname===route.prefix||pathname.startsWith(`${route.prefix}/`))??null;
}
