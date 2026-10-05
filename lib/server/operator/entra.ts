import "server-only";
import {headers} from "next/headers";
import type {OperatorRole} from "@/lib/permissions";
import {env} from "@/lib/server/env";

type EasyAuthClaim={typ?:string;val?:string};
type EasyAuthPrincipal={auth_typ?:string;name_typ?:string;role_typ?:string;claims?:EasyAuthClaim[]};

const roleMap:Record<string,OperatorRole>={
  "Binso.Platform.Owner":"platform_owner",
  "Binso.Platform.Admin":"platform_admin",
  "Binso.Platform.Support":"platform_support",
  "Binso.Platform.Billing":"platform_billing",
  "Binso.Platform.Auditor":"platform_auditor",
};

function claimValues(principal:EasyAuthPrincipal,types:string[]){
  const wanted=new Set(types.map(x=>x.toLowerCase()));
  return (principal.claims??[]).filter(c=>wanted.has(String(c.typ??"").toLowerCase())).map(c=>String(c.val??"")).filter(Boolean);
}
function firstClaim(principal:EasyAuthPrincipal,types:string[]){
  return claimValues(principal,types)[0]||"";
}
function decodePrincipal(raw:string){
  try{return JSON.parse(Buffer.from(raw,"base64").toString("utf8")) as EasyAuthPrincipal}catch{return null}
}

export type EntraOperatorIdentity={
  objectId:string;
  tenantId:string;
  email:string;
  name:string;
  role:OperatorRole;
  appRole:string;
};

export async function getEntraOperatorIdentity():Promise<EntraOperatorIdentity|null>{
  const h=await headers();
  const raw=h.get("x-ms-client-principal");
  if(!raw)return null;
  const principal=decodePrincipal(raw);
  if(!principal||String(principal.auth_typ??"").toLowerCase()!=="aad")return null;

  const objectId=firstClaim(principal,["http://schemas.microsoft.com/identity/claims/objectidentifier","oid"]);
  const tenantId=firstClaim(principal,["http://schemas.microsoft.com/identity/claims/tenantid","tid"]);
  const email=firstClaim(principal,[
    "preferred_username",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "email","upn"
  ]).toLowerCase();
  const name=firstClaim(principal,["name","http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"])||email;
  const roles=new Set(claimValues(principal,["roles","http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]));
  const appRole=Object.keys(roleMap).find(r=>roles.has(r))||"";
  if(!objectId||!tenantId||!email||!appRole)return null;

  if(env.operatorEntraTenantId&&tenantId.toLowerCase()!==env.operatorEntraTenantId.toLowerCase())return null;
  if(env.operatorAllowedDomain&&!email.endsWith(`@${env.operatorAllowedDomain.toLowerCase()}`))return null;

  return {objectId,tenantId,email,name,role:roleMap[appRole],appRole};
}

export function microsoftLogoutUrl(){
  return "/.auth/logout?post_logout_redirect_uri=%2Foperator%2Flogin";
}
