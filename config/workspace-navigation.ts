/** Phase 1 navigation V2. Destinations retain the existing server-matched access check. */
export const mainNavigation = [
 {href:'/dashboard',label:'Übersicht',icon:'house',section:'dashboard'},
 {href:'/kunden',label:'Kunden',icon:'navigation-users',section:'kunden'},
 {href:'/projekte',label:'Aufträge',icon:'briefcase-business',section:'projekte'},
 {href:'/zeit',label:'Zeit',icon:'clock3',section:'zeit'},
] as const;

export const moreNavigation = [
 {title:'Geschäft',items:[
  {href:'/angebote',label:'Angebote',icon:'file'},
  {href:'/rechnungen',label:'Rechnungen',icon:'receipt'},
  {href:'/zahlungen',label:'Zahlungen',icon:'wallet'},
  {href:'/spesen',label:'Ausgaben & Spesen',icon:'card'},
  {href:'/finanzen',label:'Finanzübersicht',icon:'chart'},
  {href:'/produkte',label:'Produkte',icon:'box'},
  {href:'/lieferanten',label:'Lieferanten',icon:'building'},
  {href:'/vertraege',label:'Verträge',icon:'file'},
 ]},
 {title:'Auswertung',items:[{href:'/berichte',label:'Berichte',icon:'chart'}]},
 {title:'Verwaltung',items:[
  {href:'/einstellungen/firma',label:'Unternehmen',icon:'building'},
  {href:'/einstellungen/team',label:'Mitarbeiter & Berechtigungen',icon:'users'},
  {href:'/mitarbeiter',label:'Mitarbeiter',icon:'users'},
  {href:'/abwesenheiten',label:'Abwesenheiten',icon:'calendar'},
  {href:'/einstellungen',label:'Unternehmenseinstellungen',icon:'settings'},
 ]},
 {title:'Hilfe',items:[
  {href:'/support',label:'Support',icon:'support'},
  {href:'/hilfe',label:'Hilfe & Informationen',icon:'help'},
 ]},
] as const;

/** Nested routes keep their owning primary destination; every other route belongs to More. */
export function primaryNavigationSection(pathname:string){
 return mainNavigation.find(item=>pathname===item.href||pathname.startsWith(item.href+'/'))?.section??'more';
}
