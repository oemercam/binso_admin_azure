import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList } from "@/lib/server/database";

type ExpenseBody={employeeId?:unknown;merchant?:unknown;expenseDate?:unknown;category?:unknown;amount?:unknown;currency?:unknown;vatRate?:unknown;description?:unknown;status?:unknown};

export async function GET(){
  try{return json({items:await tenantList("expenses","id,employee_id,merchant,expense_date,category,amount,currency,vat_rate,description,status,created_at,employee:employees(first_name,last_name)","order=expense_date.desc")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<ExpenseBody>(request,16384);
    const merchant=cleanText(body.merchant,200);
    const amount=Number(body.amount),vatRate=Number(body.vatRate);
    if(!merchant) return json({error:"merchant_required",message:"Bitte Händler oder Zweck eingeben."},400);
    if(!Number.isFinite(amount)||amount<0) return json({error:"amount_invalid",message:"Ungültiger Betrag."},400);
    const rows=await tenantInsert("expenses",{employee_id:cleanText(body.employeeId,80)||null,merchant,expense_date:cleanText(body.expenseDate,20)||new Date().toISOString().slice(0,10),category:cleanText(body.category,120)||null,amount,currency:cleanText(body.currency,3)||"CHF",vat_rate:Number.isFinite(vatRate)?vatRate:8.1,description:cleanText(body.description,2000)||null,status:["draft","submitted","approved","rejected"].includes(String(body.status))?String(body.status):"draft"});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
