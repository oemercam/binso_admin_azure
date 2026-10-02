import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantUpdate } from "@/lib/server/database";

type Body={name?:unknown;kind?:unknown;sku?:unknown;unit?:unknown;unitPrice?:unknown;vatRate?:unknown;description?:unknown;status?:unknown};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const rows=await tenantList<Record<string,unknown>>("products","id,name,kind,sku,unit,unit_price,vat_rate,description,status,created_at,updated_at","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Produkt wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const body=await readJson<Body>(request,16384);
    const name=cleanText(body.name,200);
    const price=Number(body.unitPrice),vat=Number(body.vatRate);
    if(!name||!Number.isFinite(price)||price<0||!Number.isFinite(vat)||vat<0) return json({error:"invalid_product",message:"Produktangaben sind ungültig."},400);
    const rows=await tenantUpdate("products",id,{
      name,
      kind:body.kind==="product"?"product":"service",
      sku:cleanText(body.sku,80)||null,
      unit:cleanText(body.unit,40)||"hour",
      unit_price:price,
      vat_rate:vat,
      description:cleanText(body.description,2000)||null,
      status:body.status==="inactive"?"inactive":"active",
    });
    if(!rows[0]) return json({error:"not_found",message:"Produkt wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
