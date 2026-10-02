import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList } from "@/lib/server/database";

type PaymentBody={invoiceId?:unknown;invoiceNumber?:unknown;customerId?:unknown;customerName?:unknown;paidOn?:unknown;amount?:unknown;method?:unknown;note?:unknown};

export async function GET(){
  try{return json({items:await tenantList("payments","id,invoice_id,customer_id,paid_on,amount,method,note,status,created_at,customer:customers(name),invoice:documents(number)","order=paid_on.desc")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<PaymentBody>(request,16384);
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
    const rows=await tenantInsert("payments",{
      invoice_id:invoiceId,
      customer_id:customerId,
      paid_on:cleanText(body.paidOn,20)||new Date().toISOString().slice(0,10),
      amount,
      method:cleanText(body.method,40)||"bank",
      note:cleanText(body.note,1000)||null,
      status:"booked",
    });
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
