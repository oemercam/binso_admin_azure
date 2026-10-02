import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { currentCompany, updateCompany } from "@/lib/server/database";

type CompanyBody={name?:unknown;uid?:unknown;street?:unknown;postalCode?:unknown;city?:unknown;email?:unknown;phone?:unknown;vatRate?:unknown;paymentTermsDays?:unknown};

export async function GET(){
  try{return json({item:await currentCompany()});}
  catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<CompanyBody>(request,16384);
    const name=cleanText(body.name,160);
    const vatRate=Number(body.vatRate);
    const paymentTermsDays=Number(body.paymentTermsDays);
    if(!name) return json({error:"name_required",message:"Firmenname ist erforderlich."},400);
    if(!Number.isFinite(vatRate)||vatRate<0) return json({error:"vat_invalid",message:"Ungültiger MwSt.-Satz."},400);
    if(!Number.isInteger(paymentTermsDays)||paymentTermsDays<0||paymentTermsDays>365) return json({error:"terms_invalid",message:"Ungültiges Zahlungsziel."},400);
    const rows=await updateCompany({
      name,
      uid:cleanText(body.uid,40)||null,
      street:cleanText(body.street,200)||null,
      postal_code:cleanText(body.postalCode,20)||null,
      city:cleanText(body.city,120)||null,
      email:cleanText(body.email,320)||null,
      phone:cleanText(body.phone,80)||null,
      vat_rate:vatRate,
      payment_terms_days:paymentTermsDays,
    });
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
