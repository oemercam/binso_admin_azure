import { ApiError } from "./http";
import { getBackendEnv } from "./env";

function storageHeaders(token:string,contentType?:string){
  const {supabaseAnonKey}=getBackendEnv();
  return {
    apikey:supabaseAnonKey,
    Authorization:"Bearer "+token,
    ...(contentType?{"Content-Type":contentType}:{}),
  };
}

export async function uploadStorageObject(bucket:string,path:string,token:string,bytes:ArrayBuffer,contentType:string){
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl+"/storage/v1/object/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/"),{
    method:"POST",
    headers:{...storageHeaders(token,contentType),"x-upsert":"false"},
    body:bytes,
    cache:"no-store",
  });
  if(!response.ok){
    const payload=await response.json().catch(()=>({}));
    console.error("Storage upload failed",response.status,typeof payload?.statusCode==="string"?payload.statusCode:"unknown");
    throw new ApiError(400,"storage_upload_failed","Datei konnte nicht gespeichert werden.");
  }
}

export async function deleteStorageObject(bucket:string,path:string,token:string){
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl+"/storage/v1/object/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/"),{
    method:"DELETE",
    headers:storageHeaders(token),
    cache:"no-store",
  });
  return response.ok;
}

export async function signStorageObject(bucket:string,path:string,token:string,expiresIn=300){
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl+"/storage/v1/object/sign/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/"),{
    method:"POST",
    headers:{...storageHeaders(token),"Content-Type":"application/json"},
    body:JSON.stringify({expiresIn}),
    cache:"no-store",
  });
  if(!response.ok) throw new ApiError(400,"storage_sign_failed","Datei konnte nicht geöffnet werden.");
  const payload=await response.json() as {signedURL?:string;signedUrl?:string};
  const relative=payload.signedURL??payload.signedUrl;
  if(!relative) throw new ApiError(500,"storage_sign_failed","Datei konnte nicht geöffnet werden.");
  return relative.startsWith("http")?relative:supabaseUrl+"/storage/v1"+relative;
}
