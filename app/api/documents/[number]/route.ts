import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {minuteAllocations} from '@/lib/server/repositories/business-api';
import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantRpc } from "@/lib/server/database";

type Line={billingAgreementId?:unknown;billingSourcePosition?:unknown;billingPart?:unknown;timeAllocations?:unknown;priceBaseQuantity?:unknown;discount?:unknown;taxExempt?:unknown;unit?:unknown;description?:unknown;quantity?:unknown;unitPrice?:unknown;vatRate?:unknown;expenseIds?:unknown;timeEntryIds?:unknown};
type DocumentBody={
  billingAgreementId?:unknown;advanceApplications?:unknown;billingScopes?:unknown;billingTerms?:unknown;billingContext?:unknown;sourceProject?:unknown;
  expectedUpdatedAt?:unknown;discountOrigin?:unknown;discount?:unknown;calculationRevision?:unknown;sourceOffer?:unknown;kind?:unknown;customerName?:unknown;customerId?:unknown;number?:unknown;issueDate?:unknown;dueDate?:unknown;validUntil?:unknown;
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
    if(!kind||(!customerName&&!body.customerId)||!number||!issueDate||rawItems.length===0||rawItems.length>100) return json({error:"invalid_document",message:"Dokumentangaben sind unvollständig."},400);

    const session=await requireSession();authorize(session,kind==='invoice'?'invoices:write':'sales:write');
    const customers=await tenantList<{id:string}>("customers","id",(body.customerId?"id=eq."+encodeURIComponent(cleanText(body.customerId,80)):"name=eq."+encodeURIComponent(customerName))+"&limit=2");
    const customer=customers[0];
    if(customers.length!==1) return json({error:"customer_not_found",message:"Kunde wurde nicht gefunden."},400);

    const items=rawItems.map(item=>({
      billing_agreement_id:item.billingAgreementId,billing_source_position:item.billingSourcePosition,billing_part:item.billingPart,time_allocations:minuteAllocations(item.timeAllocations,true),price_base_quantity:item.priceBaseQuantity??1,
      discount:item.discount,
      tax_exempt:item.taxExempt,
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

    const result=await tenantRpc("update_document_atomic",{
      p_expected_updated_at:body.expectedUpdatedAt,
      p_current_number:currentNumber,
      p_idempotency_key:request.headers.get("idempotency-key")?.trim()??"",
      ...(body.billingAgreementId===undefined?{}:{p_billing_agreement_id:body.billingAgreementId}),...(body.advanceApplications===undefined?{}:{p_advance_applications:body.advanceApplications}),...(body.billingScopes===undefined?{}:{p_billing_scopes:body.billingScopes}),...(body.billingTerms===undefined?{}:{p_billing_terms:body.billingTerms}),...(body.billingContext===undefined?{}:{p_billing_context:body.billingContext}),...(body.sourceProject===undefined?{}:{p_source_project:body.sourceProject}),
      p_discount:body.discount,
      p_discount_origin:body.discountOrigin,
      p_calculation_revision:body.calculationRevision,
      p_source_offer:cleanText(body.sourceOffer,80)||null,
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

export async function DELETE(request:NextRequest,{params}:{params:Promise<{number:string}>}){
 try{assertSameOrigin(request);const {number}=await params,body=await readJson<{expectedUpdatedAt?:unknown}>(request,2048);
  return json({item:await tenantRpc('discard_invoice_draft',{p_kind:'invoice',p_number:number,p_expected_updated_at:body?.expectedUpdatedAt,p_idempotency_key:request.headers.get('idempotency-key')??''})});
 }catch(error){return apiError(error)}
}
