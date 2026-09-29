"use client";

export type PlanId = "start" | "business" | "pro";
export type BillingCycle = "monthly" | "yearly";

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

const ORGS_KEY = "binso-one-saas-orgs-v1";
const USERS_KEY = "binso-one-saas-users-v1";
const SESSION_KEY = "binso-one-saas-session-v1";

function read<T>(key:string, fallback:T):T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as T; }
  catch { return fallback; }
}
function write<T>(key:string, value:T){
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("binso-saas-changed"));
}

export const plans = [
  {
    id:"start" as PlanId, name:"Start", monthly:29, yearly:290,
    description:"Für Selbstständige und kleine Teams, die Verkauf und Administration zentralisieren möchten.",
    features:["Kunden und Kontakte","Offerten und Rechnungen","Zeiterfassung und Spesen","Projekte","Basisberichte","1 Firma · bis 3 Benutzer"]
  },
  {
    id:"business" as PlanId, name:"Business", monthly:69, yearly:690, popular:true,
    description:"Für KMU mit Team, Personal, Einkauf und erweiterten Finanzprozessen.",
    features:["Alles aus Start","Lieferanten und Eingangsrechnungen","Personal und Abwesenheiten","MWST und Buchhaltungsübersicht","Produkte und Leistungen","bis 15 Benutzer"]
  },
  {
    id:"pro" as PlanId, name:"Pro", monthly:129, yearly:1290,
    description:"Für wachsende Unternehmen mit mehreren Bereichen, Rollen und erweiterten Kontrollen.",
    features:["Alles aus Business","Lohn-Demo und Freigaben","Verträge und Dokumente","Erweiterte Rollen und Audit","Priorisierter Support","unbegrenzte Benutzer"]
  }
];

export function getOrganizations(){ return read<SaasOrg[]>(ORGS_KEY, []); }
export function getUsers(){ return read<SaasUser[]>(USERS_KEY, []); }
export function getSession(){ return read<SaasSession | null>(SESSION_KEY, null); }
export function setSession(v:SaasSession|null){
  if(v) write(SESSION_KEY,v);
  else { localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new CustomEvent("binso-saas-changed")); }
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
    trialEndsAt:input.trial?new Date(now.getTime()+14*86400000).toISOString():undefined,
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
    const org=getOrganization(existing.orgId)!;
    const session:SaasSession={userId:existing.id,orgId:org.id,email:existing.email,name:existing.name,role:existing.role};
    setSession(session); return {org,user:existing,session};
  }
  return createAccount({
    name:"Demo Benutzer",email:"demo@binso.local",password:"demo1234",
    company:"Demo Unternehmen AG",plan:"business",billingCycle:"monthly",trial:true
  });
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
