import { NextRequest } from "next/server";
import { apiError, cleanText, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";

export async function GET(request:NextRequest){
  try{
    const q=cleanText(request.nextUrl.searchParams.get("q"),120);
    if(q.length<2) return json({items:[]});
    const encoded=encodeURIComponent("*"+q+"*");
    const [customers,documents,products,employees,tickets]=await Promise.all([
      tenantList<Record<string,unknown>>("customers","id,name,city,status","name=ilike."+encoded+"&limit=6"),
      tenantList<Record<string,unknown>>("documents","id,kind,number,status,total,customer:customers(name)","number=ilike."+encoded+"&limit=6"),
      tenantList<Record<string,unknown>>("products","id,name,kind,unit_price,status","name=ilike."+encoded+"&limit=6"),
      tenantList<Record<string,unknown>>("employees","id,first_name,last_name,job_title,status","or=(first_name.ilike."+encoded+",last_name.ilike."+encoded+")&limit=6"),
      tenantList<Record<string,unknown>>("support_tickets","id,subject,status,updated_at","subject=ilike."+encoded+"&limit=6"),
    ]);
    const items=[
      ...customers.map(item=>({type:"Kunde",title:item.name,meta:[item.city,item.status].filter(Boolean).join(" · "),href:"/kunden/"+item.id,icon:"users"})),
      ...documents.map(item=>{const customer=item.customer as {name?:string}|undefined;return {type:item.kind==="offer"?"Angebot":"Rechnung",title:item.number,meta:[customer?.name,item.total?("CHF "+Number(item.total).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})):null].filter(Boolean).join(" · "),href:(item.kind==="offer"?"/angebote/":"/rechnungen/")+item.number,icon:item.kind==="offer"?"file":"receipt"}}),
      ...products.map(item=>({type:"Produkt",title:item.name,meta:item.kind==="product"?"Produkt":"Dienstleistung",href:"/produkte/"+item.id,icon:"box"})),
      ...employees.map(item=>({type:"Mitarbeiter",title:[item.first_name,item.last_name].filter(Boolean).join(" "),meta:item.job_title??"",href:"/mitarbeiter/"+item.id,icon:"users"})),
      ...tickets.map(item=>({type:"Ticket",title:"#"+String(item.id).slice(0,8)+" · "+item.subject,meta:item.status??"",href:"/support/"+item.id,icon:"support"})),
    ].slice(0,20);
    return json({items});
  }catch(error){return apiError(error);}
}
