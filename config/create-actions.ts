/** One catalog for desktop quick creation and the mobile/PWA dock. */
export const createActions=[
 {section:"kunden",title:"Kunde",href:"/kunden/neu",icon:"users",permissionPath:"/kunden/neu"},
 {section:"angebote",title:"Angebot",href:"/angebote/neu",icon:"file",permissionPath:"/angebote/neu"},
 {section:"rechnungen",title:"Rechnung",href:"/rechnungen/neu",icon:"receipt",permissionPath:"/rechnungen/neu"},
 {section:"zeit",title:"Zeit erfassen",href:"/zeit?manual=1",icon:"clock",permissionPath:"/zeit/neu"},
 {section:"projekte",title:"Projekt",href:"/projekte/neu",icon:"box",permissionPath:"/projekte/neu"},
 {section:"zahlungen",title:"Zahlung",href:"/zahlungen/neu",icon:"wallet",permissionPath:"/zahlungen/neu"},
 {section:"spesen",title:"Spese",href:"/spesen/neu",icon:"card",permissionPath:"/spesen/neu"},
 {section:"produkte",title:"Produkt",href:"/produkte/neu",icon:"box",permissionPath:"/produkte/neu"},
 {section:"mitarbeiter",title:"Mitarbeiter",href:"/mitarbeiter/neu",icon:"users",permissionPath:"/mitarbeiter/neu"},
 {section:"support",title:"Support-Anfrage",href:"/support/neu",icon:"support",permissionPath:"/support/neu"},
] as const;

export function permittedCreateActions(section:string,canOpen:(href:string)=>boolean){
 return createActions.filter(action=>canOpen(action.permissionPath)).sort((a,b)=>Number(b.section===section)-Number(a.section===section));
}

export function createReturnHref(href:string,returnTo:string){
 const target=new URL(href,"https://binso.invalid");
 target.searchParams.set("returnTo",returnTo);
 return target.pathname+target.search;
}
