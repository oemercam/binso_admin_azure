import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantRpc } from "@/lib/server/database";

type Line={description?:unknown;quantity?:unknown;unitPrice?:unknown};
type DocumentBody={
  kind?:unknown;customerName?:unknown;number?:unknown;issueDate?:unknown;dueDate?:unknown;validUntil?:unknown;
  vatRate?:unknown;note?:unknown;currency?:unknown;items?:unknown;
};

export async function GET(_request:NextRequest,{params}:{params:Promise<{number:string}>}){
  try{
    const {number}=await params;
    const rows=await tenantList<Record<string,unknown>>(
      "documents",
      "id,kind,number,status,issue_date,due_date,valid_until,vat_rate,note,currency,subtotal,vat_amount,total,customer:customers(name,sector,street,postal_code,city),items:document_items(id,position,description,quantity,unit_price,line_total)",
      "number=eq."+encodeURIComponent(number)+"&limit=1"
    );
    const item=rows[0];
    if(!item) return json({error:"not_found",message:"Dokument wurde nicht gefunden."},404);
    return json({item});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{number:string}>}){
  try{
    assertSameOrigin(request);
    const {number:currentNumber}=await params;
    const body=await readJson<DocumentBody>(request,65536);
    const kind=body.kind==="offer"?"offer":body.kind==="invoice"?"invoice":"";
    const customerName=cleanText(body.customerName,200);
    const number=cleanText(body.number,80);
    const issueDate=cleanText(body.issueDate,20);
    const rawItems=Array.isArray(body.items)?body.items as Line[]:[];
    if(!kind||!customerName||!number||!issueDate||rawItems.length===0) return json({error:"invalid_document",message:"Dokumentangaben sind unvollständig."},400);

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

    const result=await tenantRpc("update_document_atomic",{
      p_current_number:currentNumber,
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
    return json({item:result});
  }catch(error){return apiError(error);}
}
