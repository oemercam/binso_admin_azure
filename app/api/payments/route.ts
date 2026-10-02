import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList } from "@/lib/server/database";

type PaymentBody={invoiceId?:unknown;customerId?:unknown;paidOn?:unknown;amount?:unknown;method?:unknown;note?:unknown};

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
    const rows=await tenantInsert("payments",{
      invoice_id:cleanText(body.invoiceId,80)||null,
      customer_id:cleanText(body.customerId,80)||null,
      paid_on:cleanText(body.paidOn,20)||new Date().toISOString().slice(0,10),
      amount,
      method:cleanText(body.method,40)||"bank",
      note:cleanText(body.note,1000)||null,
      status:"booked",
    });
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
