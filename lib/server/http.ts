import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { log } from "@/lib/server/logger";

export function json(data:unknown,status=200,headers:HeadersInit={}){
  return NextResponse.json(data,{status,headers:{"cache-control":"no-store",...headers}});
}
export function apiError(error:unknown,request?:NextRequest){
  if(error instanceof Response)return error;
  const message=error instanceof Error?error.message:"Unexpected error.";
  const status=/required|invalid|must|length/i.test(message)?400:500;
  log(status>=500?"error":"warn","api_error",{status,path:request?.nextUrl.pathname,message});
  return json({error:status>=500?"Ein interner Fehler ist aufgetreten.":message},status);
}
export function assertSameOrigin(request:NextRequest){
  const origin=request.headers.get("origin");
  if(!origin)return;
  const configured=new URL(env.appUrl).origin;
  const requestOrigin=request.nextUrl.origin;
  const forwardedProto=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()||request.headers.get("host")?.trim();
  const forwardedOrigin=forwardedHost?`${forwardedProto||"https"}://${forwardedHost}`:null;
  const allowed=new Set([configured,requestOrigin,forwardedOrigin].filter(Boolean));
  if(!allowed.has(origin))throw new Response("Forbidden",{status:403});
}
export async function readJson(request:NextRequest,maxBytes=64_000){
  const length=Number(request.headers.get("content-length")||0);
  if(length>maxBytes)throw new Response("Payload too large",{status:413});
  return request.json();
}
