import "server-only";
import {env} from "@/lib/server/env";

function hasSas(){return Boolean(env.azureStorageAccount&&env.azureStorageSas)}
function hasManagedIdentity(){return Boolean(env.azureStorageAccount&&process.env.IDENTITY_ENDPOINT&&process.env.IDENTITY_HEADER)}
function configured(){return hasSas()||hasManagedIdentity()}
function cleanSas(){return (env.azureStorageSas||"").replace(/^\?/,"")}
let cachedToken:{value:string;expiresAt:number}|null=null;
async function managedIdentityToken(){
 if(!hasManagedIdentity())return null;
 if(cachedToken&&cachedToken.expiresAt>Date.now()+60_000)return cachedToken.value;
 const endpoint=process.env.IDENTITY_ENDPOINT!;const header=process.env.IDENTITY_HEADER!;
 const url=new URL(endpoint);url.searchParams.set("resource","https://storage.azure.com/");url.searchParams.set("api-version","2019-08-01");
 const r=await fetch(url,{headers:{"X-IDENTITY-HEADER":header},cache:"no-store"});if(!r.ok)throw new Error("Managed Identity Token fÃ¼r Storage konnte nicht bezogen werden.");
 const data=await r.json() as {access_token:string;expires_on?:string};const expires=Number(data.expires_on||0)*1000||Date.now()+45*60_000;cachedToken={value:data.access_token,expiresAt:expires};return data.access_token;
}
async function storageAuth():Promise<Record<string,string>>{
 const token=await managedIdentityToken();if(token)return {authorization:`Bearer ${token}`,"x-ms-version":"2023-11-03"};return {"x-ms-version":"2023-11-03"};
}
function blobUrl(path:string){const safePath=path.split("/").map(encodeURIComponent).join("/");return `https://${env.azureStorageAccount}.blob.core.windows.net/${env.azureStorageContainer}/${safePath}`}
export async function putBlob(input:{path:string;contentType:string;body:Buffer}){
 if(!configured())return null;const base=blobUrl(input.path);const url=hasSas()?`${base}?${cleanSas()}`:base;const auth=await storageAuth();
 const r=await fetch(url,{method:"PUT",headers:{...auth,"x-ms-blob-type":"BlockBlob","content-type":input.contentType,"content-length":String(input.body.length)},body:new Uint8Array(input.body)});if(!r.ok)throw new Error("Datei konnte nicht gespeichert werden.");return base;
}
export function dataUrlToBuffer(dataUrl:string){const match=dataUrl.match(/^data:([^;]+);base64,(.+)$/);if(!match)throw new Error("UngÃ¼ltige Datei.");return {mimeType:match[1],buffer:Buffer.from(match[2],"base64")}}
export async function getBlobByUrl(url:string){
 if(!configured())throw new Error("Azure Blob Storage ist nicht konfiguriert.");const expected=`https://${env.azureStorageAccount}.blob.core.windows.net/${env.azureStorageContainer}/`;if(!url.startsWith(expected))throw new Error("UngÃ¼ltiger Speicherpfad.");const target=hasSas()?`${url}?${cleanSas()}`:url;const auth=await storageAuth();const r=await fetch(target,{headers:auth,cache:"no-store"});if(!r.ok)throw new Error("Datei konnte nicht gelesen werden.");return {contentType:r.headers.get("content-type")||"application/octet-stream",body:await r.arrayBuffer()};
}

