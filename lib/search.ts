export type SearchItem = { type:string; title:string; meta:string; href:string; icon:string };

/** Only expose modules with a rendered detail route, using their canonical API IDs. */
export const searchSources = [
  {module:"kunden",table:"customers",type:"Kunde",href:"/kunden",icon:"users"},
  {module:"offerten",table:"documents",kind:"offer",type:"Angebot",href:"/angebote",icon:"file"},
  {module:"rechnungen",table:"documents",kind:"invoice",type:"Rechnung",href:"/rechnungen",icon:"receipt"},
  {module:"zahlungen",table:"payments",type:"Zahlung",href:"/zahlungen",icon:"wallet"},
  {module:"produkte",table:"products",type:"Produkt",href:"/produkte",icon:"box"},
  {module:"personal",table:"employees",type:"Mitarbeiter",href:"/mitarbeiter",icon:"users"},
  {module:"spesen",table:"expenses",type:"Spese",href:"/spesen",icon:"card"},
] as const;

export function searchItem(source:typeof searchSources[number],row:Record<string,unknown>):SearchItem {
  const customer=row.customer&&typeof row.customer==="object" ? String((row.customer as Record<string,unknown>).name??"") : "";
  const name=[row.first_name,row.last_name].filter(Boolean).join(" ");
  const title=String(row.number||row.name||row.merchant||name||customer||source.type);
  const amount=row.total??row.amount??row.unit_price;
  const money=amount==null?"":new Intl.NumberFormat("de-CH",{style:"currency",currency:"CHF"}).format(Number(amount));
  return {
    type:source.type,title,icon:source.icon,
    meta:[customer&&customer!==title?customer:"",money].filter(Boolean).join(" · "),
    href:source.href+"/"+encodeURIComponent(String(source.table==="documents"?row.number||row.id:row.id)),
  };
}
