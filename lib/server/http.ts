import { NextRequest, NextResponse } from "next/server";

export const jsonHeaders = {
  "Cache-Control":"private, no-store, max-age=0, must-revalidate",
  "X-Content-Type-Options":"nosniff",
};

export function json(data:unknown,status=200,headers?:HeadersInit){
  return NextResponse.json(data,{status,headers:{...jsonHeaders,...(headers??{})}});
}

/** Enforce byte limits while reading, including chunked bodies without Content-Length. */
export async function readBoundedBody(request:Request,maxBytes:number):Promise<Buffer>{
  const length=Number(request.headers.get("content-length")??"0");
  if(length>maxBytes)throw new ApiError(413,"request_too_large","Die Anfrage ist zu gross.");
  if(!request.body)return Buffer.alloc(0);
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];
  let bytes=0;
  try{
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;
      if(bytes>maxBytes){await reader.cancel().catch(()=>{});throw new ApiError(413,"request_too_large","Die Anfrage ist zu gross.");}
      chunks.push(value);
    }
    return Buffer.concat(chunks,bytes);
  }finally{reader.releaseLock();}
}

export async function readJson<T>(request:NextRequest,maxBytes=32768):Promise<T>{
  const raw=(await readBoundedBody(request,maxBytes)).toString("utf8");
  try{return JSON.parse(raw) as T;}
  catch{throw new ApiError(400,"invalid_json","Ungültige Anfrage.");}
}

export function assertSameOrigin(request:NextRequest){
  const origin=request.headers.get("origin");
  if(!origin) return;

  const allowed=new Set<string>();
  const configured=process.env.NEXT_PUBLIC_APP_URL;
  if(configured){
    try{allowed.add(new URL(configured).origin);}catch{}
  }

  allowed.add(request.nextUrl.origin);

  const forwardedHost=request.headers.get("x-forwarded-host");
  const host=forwardedHost||request.headers.get("host");
  if(host){
    const forwardedProto=request.headers.get("x-forwarded-proto");
    const protocol=(forwardedProto?.split(",")[0]?.trim())||request.nextUrl.protocol.replace(":","");
    allowed.add(`${protocol}://${host.split(",")[0].trim()}`);
  }

  if(!allowed.has(origin)) throw new ApiError(403,"invalid_origin","Ungültige Herkunft.");
}

export class ApiError extends Error {
  constructor(public status:number,public code:string,message:string,public headers?:HeadersInit){
    super(message);
  }
}

export function apiError(error:unknown){
  if(error instanceof Response){
    const meaning:Record<number,{error:string;message:string}>={401:{error:"not_authenticated",message:"Bitte erneut anmelden."},403:{error:"forbidden",message:"Keine Berechtigung."},404:{error:"not_found",message:"Datensatz wurde nicht gefunden."},409:{error:"conflict",message:"Der Vorgang steht im Konflikt mit dem aktuellen Stand."},429:{error:"rate_limited",message:"Zu viele Anfragen. Bitte später erneut versuchen."},503:{error:"service_unavailable",message:"Der Dienst ist momentan nicht verfügbar."}};
    return json(meaning[error.status]??{error:"request_failed",message:"Die Anfrage konnte nicht verarbeitet werden."},error.status);
  }
  if(error instanceof ApiError) return json({error:error.code,message:error.message},error.status,error.headers);
  const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
  const databaseErrors:Record<string,{status:number;code:string;message:string}>={
    '23505':{status:409,code:'duplicate_record',message:'Dieser Datensatz besteht bereits.'},
    '23503':{status:409,code:'relation_conflict',message:'Die Verknüpfung ist nicht mehr verfügbar. Bitte die Daten aktualisieren.'},
    '23514':{status:400,code:'validation_failed',message:'Die Angaben sind fachlich ungültig.'},
    '22P02':{status:400,code:'invalid_value',message:'Eine Angabe ist ungültig.'},
    '22003':{status:400,code:'amount_out_of_range',message:'Ein Betrag überschreitet den zulässigen Bereich.'},
    '40001':{status:409,code:'concurrent_change',message:'Die Daten wurden gleichzeitig geändert. Bitte den aktuellen Stand prüfen und erneut versuchen.'},
    '40P01':{status:409,code:'concurrent_change',message:'Die Daten wurden gleichzeitig geändert. Bitte den aktuellen Stand prüfen und erneut versuchen.'},
    '57014':{status:503,code:'request_timeout',message:'Die Verarbeitung dauert zu lange. Bitte den gespeicherten Stand vor einer Wiederholung prüfen.'},
  };
  const mapped=databaseErrors[code];
  if(mapped)return json({error:mapped.code,message:mapped.message},mapped.status);
  console.error("Unhandled API error",{category:error instanceof Error?error.name:"unknown"});
  return json({error:"internal_error",message:"Die Anfrage konnte nicht verarbeitet werden."},500);
}

export function cleanText(value:unknown,max=200){
  if(typeof value!=="string") return "";
  return value.trim().slice(0,max);
}

export function validEmail(value:string){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
