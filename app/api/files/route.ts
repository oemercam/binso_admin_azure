import { NextRequest } from "next/server";
import { apiError, cleanText, json } from "@/lib/server/http";
import { currentTenant, tenantInsert, tenantList } from "@/lib/server/database";
import { deleteStorageObject, uploadStorageObject } from "@/lib/server/storage";

const allowed:Record<string,{bucket:string;max:number;types:Set<string>}>={
  company_logo:{bucket:"company-assets",max:5*1024*1024,types:new Set(["image/png","image/jpeg","image/webp","image/svg+xml"])},
  expense_receipt:{bucket:"expense-receipts",max:10*1024*1024,types:new Set(["image/png","image/jpeg","image/webp","application/pdf"])},
  support_attachment:{bucket:"support-files",max:10*1024*1024,types:new Set(["image/png","image/jpeg","image/webp","application/pdf","text/plain"])},
};

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

    const safeOriginal=file.name.replace(/[^\p{L}\p{N}._ -]/gu,"_").slice(0,180)||"datei";
    const extension=safeOriginal.includes(".")?"."+safeOriginal.split(".").pop()!.toLowerCase():"";
    const objectId=crypto.randomUUID();
    const path=tenant.tenantId+"/"+purpose+"/"+(entityId??"general")+"/"+objectId+extension;
    const bytes=await file.arrayBuffer();
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
