import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantRpc } from "@/lib/server/database";

type Line={unit?:unknown;description?:unknown;quantity?:unknown;unitPrice?:unknown;vatRate?:unknown;expenseIds?:unknown;timeEntryIds?:unknown};
type DocumentBody={
  sourceOffer?:unknown;kind?:unknown;customerName?:unknown;customerId?:unknown;number?:unknown;issueDate?:unknown;dueDate?:unknown;validUntil?:unknown;
  vatRate?:unknown;note?:unknown;currency?:unknown;items?:unknown;
};

export async function GET(request:NextRequest){
  try{
    const kind=request.nextUrl.searchParams.get("kind");
    const filters=new URLSearchParams({order:"created_at.desc"});
    if(kind==="offer"||kind==="invoice")filters.set("kind","eq."+kind);
    for(const key of ["q","limit","order","offset"]){const value=request.nextUrl.searchParams.get(key);if(value)filters.set(key,value)}
    const rows=await tenantList("documents","id,customer_id,kind,number,status,issue_date,due_date,valid_until,vat_rate,note,currency,subtotal,vat_amount,total,created_at,customer:customers(name)",filters.toString());
    return json({items:rows});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<DocumentBody>(request,65536);
    const kind=body.kind==="offer"?"offer":body.kind==="invoice"?"invoice":"";
    const customerName=cleanText(body.customerName,200);
    const requestKey=request.headers.get("idempotency-key")?.trim()??"";
    if(requestKey.length<8||requestKey.length>128)return json({error:"idempotency_required",message:"Idempotency-Key fehlt oder ist ungültig."},400);
    const issueDate=cleanText(body.issueDate,20);
    const rawItems=Array.isArray(body.items)?body.items as Line[]:[];
    if(!kind||(!customerName&&!body.customerId)||!issueDate||rawItems.length===0||rawItems.length>100) return json({error:"invalid_document",message:"Dokumentangaben sind unvollständig."},400);

    const customers=await tenantList<{id:string}>("customers","id",(body.customerId?"id=eq."+encodeURIComponent(cleanText(body.customerId,80)):"name=eq."+encodeURIComponent(customerName))+"&limit=2");
    const customer=customers[0];
    if(customers.length!==1) return json({error:"customer_not_found",message:"Kunde wurde nicht gefunden."},400);

    const items=rawItems.map(item=>({
      description:cleanText(item.description,500),
      unit:cleanText(item.unit,40)||"Stück",
      quantity:Number(item.quantity),
      unit_price:Number(item.unitPrice),
      vat_rate:item.vatRate===undefined?Number(body.vatRate):Number(item.vatRate),
      expense_ids:Array.isArray(item.expenseIds)?item.expenseIds.map(String).slice(0,100):[],
      time_entry_ids:Array.isArray(item.timeEntryIds)?item.timeEntryIds.map(String).slice(0,100):[],
    }));
    if(items.some(item=>!Number.isFinite(item.vat_rate)||item.vat_rate<0||item.vat_rate>100||!item.description||!Number.isFinite(item.quantity)||item.quantity<0||!Number.isFinite(item.unit_price)||item.unit_price<0)){
      return json({error:"invalid_line_items",message:"Mindestens eine Position ist ungültig."},400);
    }

    const result=await tenantRpc("create_document_atomic",{
      p_source_offer:cleanText(body.sourceOffer,80)||null,
      p_customer_id:customer.id,
      p_kind:kind,
      p_idempotency_key:requestKey,
      p_issue_date:issueDate,
      p_due_date:kind==="invoice"?(cleanText(body.dueDate,20)||null):null,
      p_valid_until:kind==="offer"?(cleanText(body.validUntil,20)||null):null,
      p_vat_rate:Number(body.vatRate)||0,
      p_note:cleanText(body.note,4000)||null,
      p_currency:cleanText(body.currency,3)||"CHF",
      p_items:items,
    });
    return json({item:result},201);
  }catch(error){return apiError(error);}
}
