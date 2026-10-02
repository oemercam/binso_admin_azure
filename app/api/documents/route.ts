import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantRpc } from "@/lib/server/database";

type Line={description?:unknown;quantity?:unknown;unitPrice?:unknown};
type DocumentBody={
  kind?:unknown;customerName?:unknown;number?:unknown;issueDate?:unknown;dueDate?:unknown;validUntil?:unknown;
  vatRate?:unknown;note?:unknown;currency?:unknown;items?:unknown;
};

export async function GET(request:NextRequest){
  try{
    const kind=request.nextUrl.searchParams.get("kind");
    const extra=kind==="offer"||kind==="invoice" ? "kind=eq."+kind+"&order=created_at.desc" : "order=created_at.desc";
    const rows=await tenantList("documents","id,customer_id,kind,number,status,issue_date,due_date,valid_until,vat_rate,note,currency,subtotal,vat_amount,total,created_at,customer:customers(name)",extra);
    return json({items:rows});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<DocumentBody>(request,65536);
    const kind=body.kind==="offer"?"offer":body.kind==="invoice"?"invoice":"";
    const customerName=cleanText(body.customerName,200);
    const number=cleanText(body.number,80);
    const issueDate=cleanText(body.issueDate,20);
    const rawItems=Array.isArray(body.items)?body.items as Line[]:[];
    if(!kind||!customerName||!issueDate||rawItems.length===0) return json({error:"invalid_document",message:"Dokumentangaben sind unvollständig."},400);

    const customers=await tenantList<{id:string}>("customers","id","name=eq."+encodeURIComponent(customerName)+"&limit=1");
    const customer=customers[0];
    if(!customer) return json({error:"customer_not_found",message:"Kunde wurde nicht gefunden."},400);

    const items=rawItems.slice(0,100).map(item=>({
      description:cleanText(item.description,500),
      quantity:Number(item.quantity),
      unit_price:Number(item.unitPrice),
    }));
    if(items.some(item=>!item.description||!Number.isFinite(item.quantity)||item.quantity<0||!Number.isFinite(item.unit_price)||item.unit_price<0)){
      return json({error:"invalid_line_items",message:"Mindestens eine Position ist ungültig."},400);
    }

    const result=await tenantRpc<Record<string,unknown>|Array<Record<string,unknown>>>("create_document_atomic",{
      p_customer_id:customer.id,
      p_kind:kind,
      p_number:number,
      p_issue_date:issueDate,
      p_due_date:kind==="invoice"?(cleanText(body.dueDate,20)||null):null,
      p_valid_until:kind==="offer"?(cleanText(body.validUntil,20)||null):null,
      p_vat_rate:Number(body.vatRate)||0,
      p_note:cleanText(body.note,4000)||null,
      p_currency:cleanText(body.currency,3)||"CHF",
      p_items:items,
    });
    const item=Array.isArray(result)?result[0]:result;
    if(!item) return json({error:"document_create_failed",message:"Dokument konnte nicht erstellt werden."},500);
    return json({item},201);
  }catch(error){return apiError(error);}
}
