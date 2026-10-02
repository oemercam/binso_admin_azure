import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError } from "./http";
import { getBackendEnv } from "./env";

const accessCookie="binso_access_token";
const refreshCookie="binso_refresh_token";

type SupabaseUser = {
  id:string;
  email?:string;
  user_metadata?:Record<string,unknown>;
};

export type TokenResponse = {
  access_token:string;
  refresh_token:string;
  expires_in:number;
  user:SupabaseUser;
};

function authHeaders(token?:string){
  const {supabaseAnonKey}=getBackendEnv();
  return {
    apikey:supabaseAnonKey,
    Authorization:"Bearer " + (token ?? supabaseAnonKey),
    "Content-Type":"application/json",
  };
}

export async function passwordLogin(email:string,password:string):Promise<TokenResponse>{
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl + "/auth/v1/token?grant_type=password",{
    method:"POST",
    headers:authHeaders(),
    body:JSON.stringify({email,password}),
    cache:"no-store",
  });
  if(!response.ok) throw new ApiError(401,"invalid_credentials","E-Mail oder Passwort ist nicht korrekt.");
  return response.json() as Promise<TokenResponse>;
}

export async function signUp(email:string,password:string,companyName:string){
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl + "/auth/v1/signup",{
    method:"POST",
    headers:authHeaders(),
    body:JSON.stringify({email,password,data:{company_name:companyName}}),
    cache:"no-store",
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=typeof payload?.msg==="string" ? payload.msg : "Registrierung nicht möglich.";
    throw new ApiError(400,"signup_failed",message);
  }
  return payload as Partial<TokenResponse>&{user?:SupabaseUser};
}

export async function fetchUser(accessToken:string):Promise<SupabaseUser>{
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl + "/auth/v1/user",{
    headers:authHeaders(accessToken),
    cache:"no-store",
  });
  if(!response.ok) throw new ApiError(401,"unauthorized","Nicht angemeldet.");
  return response.json() as Promise<SupabaseUser>;
}

export async function refreshSession(refreshToken:string):Promise<TokenResponse>{
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl + "/auth/v1/token?grant_type=refresh_token",{
    method:"POST",
    headers:authHeaders(),
    body:JSON.stringify({refresh_token:refreshToken}),
    cache:"no-store",
  });
  if(!response.ok) throw new ApiError(401,"session_expired","Sitzung abgelaufen.");
  return response.json() as Promise<TokenResponse>;
}

export async function getAccessToken(){
  const store=await cookies();
  return store.get(accessCookie)?.value ?? null;
}

export async function requireUserNoRefresh(){
  const store=await cookies();
  const token=store.get(accessCookie)?.value;
  if(!token) throw new ApiError(401,"unauthorized","Nicht angemeldet.");
  const user=await fetchUser(token);
  return {user,token};
}

export async function requireUser(){
  const store=await cookies();
  const token=store.get(accessCookie)?.value;
  if(token){
    try{
      const user=await fetchUser(token);
      return {user,token};
    }catch(error){
      if(!(error instanceof ApiError) || error.status!==401) throw error;
    }
  }

  const refresh=store.get(refreshCookie)?.value;
  if(!refresh) throw new ApiError(401,"unauthorized","Nicht angemeldet.");
  const session=await refreshSession(refresh);
  const secure=process.env.NODE_ENV==="production";
  store.set(accessCookie,session.access_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:Math.max(60,session.expires_in)});
  store.set(refreshCookie,session.refresh_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return {user:session.user,token:session.access_token};
}

export function setAuthCookies(response:NextResponse,session:TokenResponse){
  const secure=process.env.NODE_ENV==="production";
  response.cookies.set(accessCookie,session.access_token,{
    httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:Math.max(60,session.expires_in),
  });
  response.cookies.set(refreshCookie,session.refresh_token,{
    httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:60*60*24*30,
  });
}

export function clearAuthCookies(response:NextResponse){
  response.cookies.set(accessCookie,"",{httpOnly:true,path:"/",maxAge:0});
  response.cookies.set(refreshCookie,"",{httpOnly:true,path:"/",maxAge:0});
}

export { accessCookie, refreshCookie };
