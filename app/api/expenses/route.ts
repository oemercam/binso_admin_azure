import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList, requireTenantFeature } from "@/lib/server/database";

type ExpenseBody={employeeId?:unknown;employeeName?:unknown;merchant?:unknown;expenseDate?:unknown;category?:unknown;amount?:unknown;currency?:unknown;vatRate?:unknown;description?:unknown;status?:unknown;customerId?:unknown;billable?:unknown};

export async function GET(request:NextRequest){
  try{
    await requireTenantFeature("expenses");return json({items:await tenantList("expenses","id,employee_id,merchant,expense_date,category,amount,currency,vat_rate,description,status,created_at,employee:employees(first_name,last_name)","order=expense_date.desc"+(request.nextUrl.searchParams.get("employeeId")?"&employee_id=eq."+encodeURIComponent(request.nextUrl.searchParams.get("employeeId")!):""))});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    const tenant=await requireTenantFeature("expenses");
    assertSameOrigin(request);
    const body=await readJson<ExpenseBody>(request,16384);
    if(["approved","rejected"].includes(String(body.status))&&!["owner","admin","project_manager","manager"].includes(tenant.role))throw new ApiError(403,"approval_forbidden","Nur berechtigte Personen können Spesen genehmigen oder ablehnen.");
    if(["approved","rejected"].includes(String(body.status)))throw new ApiError(409,"submission_required","Die Spese muss zuerst eingereicht und anschließend geprüft werden.");
    const merchant=cleanText(body.merchant,200);
    const amount=Number(body.amount),vatRate=body.vatRate===undefined?8.1:Number(body.vatRate);
    if(!Number.isFinite(vatRate)||vatRate<0||vatRate>100)return json({error:"vat_invalid",message:"Ungültiger MwSt.-Satz."},400);
    if(!merchant) return json({error:"merchant_required",message:"Bitte Händler oder Zweck eingeben."},400);
    if(!Number.isFinite(amount)||amount<=0) return json({error:"amount_invalid",message:"Ungültiger Betrag."},400);
    let employeeId=cleanText(body.employeeId,80)||null;
    const employeeName=cleanText(body.employeeName,240);
    if(!employeeId&&employeeName){
      const [firstName,...rest]=employeeName.split(" ");
      const lastName=rest.join(" ");
      const matches=await tenantList<{id:string}>("employees","id","first_name=eq."+encodeURIComponent(firstName)+"&last_name=eq."+encodeURIComponent(lastName)+"&limit=1");
      employeeId=matches[0]?.id??null;
    }
    const rows=await tenantInsert("expenses",{customer_id:cleanText(body.customerId,80)||null,billable:body.billable===true,employee_id:employeeId,merchant,expense_date:cleanText(body.expenseDate,20)||new Date().toISOString().slice(0,10),category:cleanText(body.category,120)||null,amount,currency:cleanText(body.currency,3)||"CHF",vat_rate:Number.isFinite(vatRate)?vatRate:8.1,description:cleanText(body.description,2000)||null,status:["draft","submitted","approved","rejected"].includes(String(body.status))?String(body.status):"draft"},request.headers?.get("Idempotency-Key")?.slice(0,128)||undefined);
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
