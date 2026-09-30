"use client";
import {storageKeys} from "@/config/storage-keys";

import {addDays,addHours,domainConfig} from "@/config/domain";
import {plans} from "@/lib/plans";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
import {readJsonStorage,removeStorage,writeJsonStorage} from "@/lib/client/browser-storage";
export type {BillingCycle,PlanId} from "@/config/domain";
import type {BillingCycle,PlanId} from "@/config/domain";
export {plans};

export type SaasUser = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  password: string; // local demo only
  role: "Owner" | "Admin" | "Member";
};

export type SaasOrg = {
  id: string;
  name: string;
  uid?: string;
  address?: string;
  zipCity?: string;
  phone?: string;
  industry?: string;
  employees?: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  subscriptionStatus: "trial" | "active" | "past_due" | "cancelled";
  trialEndsAt?: string;
  onboardingComplete: boolean;
  createdAt: string;
};

export type SaasSession = {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  role: SaasUser["role"];
};

const ORGS_KEY = storageKeys.saasOrganizations;
const USERS_KEY = storageKeys.saasUsers;
const SESSION_KEY = storageKeys.saasSession;

function read<T>(key:string,fallback:T):T{return readJsonStorage(key,fallback)}
function write<T>(key:string,value:T){writeJsonStorage(key,value);emitAppEvent(appEvents.saasChanged)}

export function getOrganizations(){ return read<SaasOrg[]>(ORGS_KEY, []); }
export function getUsers(){ return read<SaasUser[]>(USERS_KEY, []); }
export function getSession(){ return read<SaasSession | null>(SESSION_KEY, null); }
export function setSession(v:SaasSession|null){
  if(v) write(SESSION_KEY,v);
  else { removeStorage(SESSION_KEY); emitAppEvent(appEvents.saasChanged); }
}
export function getOrganization(id:string){ return getOrganizations().find(o=>o.id===id); }

export function createAccount(input:{
  name:string; email:string; password:string; company:string; plan:PlanId;
  billingCycle:BillingCycle; trial:boolean;
}){
  const email=input.email.trim().toLowerCase();
  if(getUsers().some(u=>u.email.toLowerCase()===email)) throw new Error("Für diese E-Mail besteht bereits ein lokales Testkonto.");
  const now=new Date();
  const org:SaasOrg={
    id:`org-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name:input.company.trim(),
    plan:input.plan,
    billingCycle:input.billingCycle,
    subscriptionStatus:input.trial?"trial":"active",
    trialEndsAt:input.trial?addDays(now,domainConfig.trialDays).toISOString():undefined,
    onboardingComplete:false,
    createdAt:now.toISOString()
  };
  const user:SaasUser={
    id:`usr-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    orgId:org.id,name:input.name.trim(),email,password:input.password,role:"Owner"
  };
  write(ORGS_KEY,[...getOrganizations(),org]);
  write(USERS_KEY,[...getUsers(),user]);
  const session:SaasSession={userId:user.id,orgId:org.id,email:user.email,name:user.name,role:user.role};
  setSession(session);
  return {org,user,session};
}

export function createDemoAccount(){
  const existing=getUsers().find(u=>u.email==="demo@binso.local");
  if(existing){
    const org=getOrganization(existing.orgId);
    if(org){
      const updated=updateOrganization(org.id,{onboardingComplete:true,trialEndsAt:addHours(new Date(),domainConfig.demoSessionHours).toISOString()})||org;
      const session:SaasSession={userId:existing.id,orgId:updated.id,email:existing.email,name:existing.name,role:existing.role};
      setSession(session); return {org:updated,user:existing,session};
    }
  }
  const created=createAccount({
    name:"Demo Benutzer",email:"demo@binso.local",password:"demo1234",
    company:"Binso Demo AG",plan:"business",billingCycle:"monthly",trial:true
  });
  const org=updateOrganization(created.org.id,{onboardingComplete:true,trialEndsAt:addHours(new Date(),domainConfig.demoSessionHours).toISOString()})||created.org;
  return {...created,org};
}

export function login(email:string,password:string){
  const user=getUsers().find(u=>u.email.toLowerCase()===email.trim().toLowerCase() && u.password===password);
  if(!user) throw new Error("E-Mail oder Passwort ist im lokalen Demo-Speicher nicht bekannt.");
  const org=getOrganization(user.orgId);
  if(!org) throw new Error("Organisation nicht gefunden.");
  const session:SaasSession={userId:user.id,orgId:user.orgId,email:user.email,name:user.name,role:user.role};
  setSession(session); return {user,org,session};
}

export function updateOrganization(orgId:string, patch:Partial<SaasOrg>){
  const orgs=getOrganizations();
  const i=orgs.findIndex(o=>o.id===orgId);
  if(i<0) return;
  orgs[i]={...orgs[i],...patch};
  write(ORGS_KEY,orgs);
  return orgs[i];
}

export function logout(){ setSession(null); }
