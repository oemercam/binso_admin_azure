import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json } from "@/lib/server/http";
import { currentTenant, tenantInsert, tenantList } from "@/lib/server/database";
import { deleteStorageObject, uploadStorageObject } from "@/lib/server/storage";

const allowed:Record<string,{bucket:string;max:number;types:Set<string>}>={
  company_logo:{bucket:"company-assets",max:5*1024*1024,types:new Set(["image/png","image/jpeg","image/webp"])},
  expense_receipt:{bucket:"expense-receipts",max:10*1024*1024,types:new Set(["image/png","image/jpeg","image/webp","application/pdf"])},
  support_attachment:{bucket:"support-files",max:10*1024*1024,types:new Set(["image/png","image/jpeg","image/webp","application/pdf","text/plain"])},
};


function matchesSignature(type:string,bytes:ArrayBuffer){
  const data=new Uint8Array(bytes);
  if(type==="image/png") return data.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value,index)=>data[index]===value);
  if(type==="image/jpeg") return data.length>=3&&data[0]===0xff&&data[1]===0xd8&&data[2]===0xff;
  if(type==="image/webp") return data.length>=12&&String.fromCharCode(...data.slice(0,4))==="RIFF"&&String.fromCharCode(...data.slice(8,12))==="WEBP";
  if(type==="application/pdf") return data.length>=5&&String.fromCharCode(...data.slice(0,5))==="%PDF-";
  if(type==="text/plain") return !data.slice(0,4096).some(value=>value===0);
  return false;
}

async function validateEntity(purpose:string,entityId:string|null){
  if(purpose==="company_logo") return true;
  if(!entityId) return false;
  if(purpose==="expense_receipt"){
    const rows=await tenantList<{id:string}>("expenses","id","id=eq."+encodeURIComponent(entityId)+"&limit=1");
    return Boolean(rows[0]);
  }
  if(purpose==="support_attachment"){
    const rows=await tenantList<{id:string}>("support_tickets","id","id=eq."+encodeURIComponent(entityId)+"&limit=1");
    return Boolean(rows[0]);
  }
  return false;
}

export async function GET(request:NextRequest){
  try{
    const purpose=cleanText(request.nextUrl.searchParams.get("purpose"),40);
    const entityId=cleanText(request.nextUrl.searchParams.get("entityId"),120);
    const filters=[purpose?"purpose=eq."+encodeURIComponent(purpose):"",entityId?"entity_id=eq."+encodeURIComponent(entityId):"","order=created_at.desc"].filter(Boolean).join("&");
    const items=await tenantList<Record<string,unknown>>("files","id,purpose,entity_id,bucket,original_name,content_type,size_bytes,created_at",filters);
    return json({items});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  let cleanup:{bucket:string;path:string;token:string}|null=null;
  try{
    assertSameOrigin(request);
    const tenant=await currentTenant();
    const form=await request.formData();
    const file=form.get("file");
    const purpose=cleanText(form.get("purpose"),40);
    const entityId=cleanText(form.get("entityId"),120)||null;
    if(!(file instanceof File)) return json({error:"file_required",message:"Bitte Datei auswählen."},400);
    const config=allowed[purpose];
    if(!config) return json({error:"purpose_invalid",message:"Ungültiger Dateityp."},400);
    if(file.size<=0||file.size>config.max) return json({error:"file_size_invalid",message:"Datei ist zu gross oder leer."},400);
    if(!config.types.has(file.type)) return json({error:"file_type_invalid",message:"Dateiformat wird nicht unterstützt."},400);
    if(!(await validateEntity(purpose,entityId))) return json({error:"entity_invalid",message:"Datei kann diesem Datensatz nicht zugeordnet werden."},400);

    const safeOriginal=file.name.replace(/[^\p{L}\p{N}._ -]/gu,"_").slice(0,180)||"datei";
    const extension=safeOriginal.includes(".")?"."+safeOriginal.split(".").pop()!.toLowerCase():"";
    const objectId=crypto.randomUUID();
    const path=tenant.tenantId+"/"+purpose+"/"+(entityId??"general")+"/"+objectId+extension;
    const bytes=await file.arrayBuffer();
    if(!matchesSignature(file.type,bytes)) return json({error:"file_signature_invalid",message:"Dateiinhalt passt nicht zum Dateiformat."},400);
    await uploadStorageObject(config.bucket,path,tenant.token,bytes,file.type);
    cleanup={bucket:config.bucket,path,token:tenant.token};

    const rows=await tenantInsert("files",{
      purpose,
      entity_id:entityId,
      bucket:config.bucket,
      storage_path:path,
      original_name:safeOriginal,
      content_type:file.type,
      size_bytes:file.size,
      created_by:tenant.user.id,
    });
    cleanup=null;
    return json({item:rows[0]},201);
  }catch(error){
    if(cleanup) await deleteStorageObject(cleanup.bucket,cleanup.path,cleanup.token).catch(()=>false);
    return apiError(error);
  }
}
