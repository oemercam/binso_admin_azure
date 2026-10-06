import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantUpdate, requireTenantFeature } from "@/lib/server/database";

type Body={employeeId?:unknown;merchant?:unknown;expenseDate?:unknown;category?:unknown;amount?:unknown;currency?:unknown;vatRate?:unknown;description?:unknown;status?:unknown};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireTenantFeature("expenses");
    const {id}=await params;
    const rows=await tenantList<Record<string,unknown>>("expenses","id,employee_id,merchant,expense_date,category,amount,currency,vat_rate,description,status,created_at,updated_at,employee:employees(first_name,last_name)","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Spese wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    const tenant=await requireTenantFeature("expenses");
    assertSameOrigin(request);
    const {id}=await params;
    const body=await readJson<Body>(request,16384);
    if(["approved","rejected"].includes(String(body.status))&&!["owner","admin","project_manager","manager"].includes(tenant.role))throw new ApiError(403,"approval_forbidden","Nur berechtigte Personen können Spesen genehmigen oder ablehnen.");
    const merchant=cleanText(body.merchant,200),amount=Number(body.amount),vat=Number(body.vatRate);
    const status=cleanText(body.status,40);
    if(!merchant||!Number.isFinite(amount)||amount<0||!Number.isFinite(vat)||vat<0) return json({error:"invalid_expense",message:"Spesenangaben sind ungültig."},400);
    if(status&&!["draft","submitted","approved","rejected"].includes(status)) return json({error:"status_invalid",message:"Ungültiger Status."},400);
    const rows=await tenantUpdate("expenses",id,{
      employee_id:cleanText(body.employeeId,80)||null,merchant,expense_date:cleanText(body.expenseDate,20)||new Date().toISOString().slice(0,10),category:cleanText(body.category,120)||null,
      amount,currency:cleanText(body.currency,3)||"CHF",vat_rate:vat,description:cleanText(body.description,2000)||null,status:status||"draft",
    });
    if(!rows[0]) return json({error:"not_found",message:"Spese wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
