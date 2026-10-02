import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantRpc } from "@/lib/server/database";

type PaymentBody={invoiceId?:unknown;invoiceNumber?:unknown;customerId?:unknown;customerName?:unknown;paidOn?:unknown;amount?:unknown;method?:unknown;note?:unknown};

export async function GET(){
  try{return json({items:await tenantList("payments","id,invoice_id,customer_id,paid_on,amount,method,note,status,created_at,customer:customers(name),invoice:documents(number)","order=paid_on.desc")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<PaymentBody>(request,16384);
    const idempotencyKey=request.headers.get("idempotency-key")?.trim()??"";
    if(idempotencyKey.length<8||idempotencyKey.length>128) return json({error:"idempotency_required",message:"Idempotency-Key fehlt oder ist ungültig."},400);
    const amount=Number(body.amount);
    if(!Number.isFinite(amount)||amount<=0) return json({error:"amount_invalid",message:"Bitte gültigen Betrag eingeben."},400);
    let invoiceId=cleanText(body.invoiceId,80)||null;
    let customerId=cleanText(body.customerId,80)||null;
    const invoiceNumber=cleanText(body.invoiceNumber,80);
    const customerName=cleanText(body.customerName,200);
    if(!invoiceId&&invoiceNumber){
      const invoices=await tenantList<{id:string}>("documents","id","kind=eq.invoice&number=eq."+encodeURIComponent(invoiceNumber)+"&limit=1");
      invoiceId=invoices[0]?.id??null;
    }
    if(!customerId&&customerName){
      const customers=await tenantList<{id:string}>("customers","id","name=eq."+encodeURIComponent(customerName)+"&limit=1");
      customerId=customers[0]?.id??null;
    }
    const item=await tenantRpc<Record<string,unknown>>("create_payment_idempotent",{
      p_invoice_id:invoiceId,
      p_customer_id:customerId,
      p_paid_on:cleanText(body.paidOn,20)||new Date().toISOString().slice(0,10),
      p_amount:amount,
      p_method:cleanText(body.method,40)||"bank",
      p_note:cleanText(body.note,1000)||null,
      p_idempotency_key:idempotencyKey,
    });
    return json({item},201);
  }catch(error){return apiError(error);}
}
