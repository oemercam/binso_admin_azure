import { NextRequest, NextResponse } from "next/server";

export const jsonHeaders = {
  "Cache-Control":"private, no-store, max-age=0, must-revalidate",
  "X-Content-Type-Options":"nosniff",
};

export function json(data:unknown,status=200,headers?:HeadersInit){
  return NextResponse.json(data,{status,headers:{...jsonHeaders,...(headers??{})}});
}

export async function readJson<T>(request:NextRequest,maxBytes=32768):Promise<T>{
  const length=Number(request.headers.get("content-length") ?? "0");
  if(length && length>maxBytes) throw new ApiError(413,"request_too_large","Die Anfrage ist zu gross.");
  const raw=await request.text();
  if(raw.length>maxBytes) throw new ApiError(413,"request_too_large","Die Anfrage ist zu gross.");
  try { return JSON.parse(raw) as T; }
  catch { throw new ApiError(400,"invalid_json","Ungültige Anfrage."); }
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
  if(error instanceof Response) return json({error:error.status===403?"forbidden":"request_failed",message:error.status===403?"Keine Berechtigung.":"Die Anfrage konnte nicht verarbeitet werden."},error.status);
  if(error instanceof ApiError) return json({error:error.code,message:error.message},error.status,error.headers);
  console.error("Unhandled API error",error instanceof Error ? error.message : "unknown");
  return json({error:"internal_error",message:"Die Anfrage konnte nicht verarbeitet werden."},500);
}

export function cleanText(value:unknown,max=200){
  if(typeof value!=="string") return "";
  return value.trim().slice(0,max);
}

export function validEmail(value:string){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
