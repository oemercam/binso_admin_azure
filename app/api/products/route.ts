import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantListPage } from "@/lib/server/database";

type ProductBody={name?:unknown;kind?:unknown;sku?:unknown;unit?:unknown;unitPrice?:unknown;vatRate?:unknown;description?:unknown;status?:unknown};

export async function GET(request:NextRequest){
  try{return json(await tenantListPage("products",request.nextUrl.searchParams));}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<ProductBody>(request,16384);
    const name=cleanText(body.name,200);
    const kind=body.kind==="product"?"product":"service";
    const unitPrice=Number(body.unitPrice);
    const vatRate=Number(body.vatRate);
    if(!name) return json({error:"name_required",message:"Bitte Namen eingeben."},400);
    if(!Number.isFinite(unitPrice)||unitPrice<0) return json({error:"price_invalid",message:"Ungültiger Verkaufspreis."},400);
    const rows=await tenantInsert("products",{name,kind,sku:cleanText(body.sku,80)||null,unit:cleanText(body.unit,40)||"hour",unit_price:unitPrice,vat_rate:Number.isFinite(vatRate)?vatRate:8.1,description:cleanText(body.description,2000)||null,status:body.status==="inactive"?"inactive":"active"},request.headers?.get("idempotency-key")?.trim());
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
