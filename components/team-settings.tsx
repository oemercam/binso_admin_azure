"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { Button, EmptyState, Field, Status, Toast } from "./ui";
import { apiGet, apiPost, isProductionBackendEnabled } from "@/lib/client/backend";

type Member={user_id:string;role:string;created_at:string};
type Invitation={id:string;email:string;role:string;status:string;expires_at:string;created_at:string};
type TeamPayload={members:Member[];invitations:Invitation[];userLimit:number;plan:string};

export function TeamSettingsPage(){
  const [data,setData]=useState<TeamPayload>({members:[],invitations:[],userLimit:1,plan:"trial"});
  const [email,setEmail]=useState("");
  const [role,setRole]=useState<"member"|"admin">("member");
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState<string|null>(null);

  const load=async()=>{
    if(!isProductionBackendEnabled()){setLoading(false);return;}
    try{setData(await apiGet<TeamPayload>("/api/settings/team/invitations"));}
    catch(error){setToast(error instanceof Error?error.message:"Team konnte nicht geladen werden.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{queueMicrotask(()=>void load());},[]);

  const invite=async()=>{
    if(!email.trim()) return;
    try{
      await apiPost("/api/settings/team/invitations",{email,role});
      setEmail("");
      setToast("Einladung wurde gesendet.");
      await load();
    }catch(error){setToast(error instanceof Error?error.message:"Einladung konnte nicht gesendet werden.");}
    window.setTimeout(()=>setToast(null),2600);
  };

  const occupied=data.members.length+data.invitations.filter(item=>item.status==="pending"&&new Date(item.expires_at)>new Date()).length;
  return <AppShell title="Team" subtitle="Benutzer und Einladungen deiner Firma." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="surface settings-form">
      <div className="form-grid two">
        <Field label="E-Mail"><input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@firma.ch"/></Field>
        <Field label="Rolle"><select value={role} onChange={event=>setRole(event.target.value==="admin"?"admin":"member")}><option value="member">Benutzer</option>{data.plan==="pro"&&<option value="admin">Administrator</option>}</select></Field>
      </div>
      <p>{occupied} von {data.userLimit} Plätzen belegt · Plan {data.plan}</p>
      <Button onClick={()=>void invite()} disabled={occupied>=data.userLimit}>Einladung senden</Button>
    </section>
    <section className="surface">
      <h2>Benutzer</h2>
      {loading?<p>Wird geladen…</p>:data.members.length?<div className="compact-list">{data.members.map(item=><div key={item.user_id}><b>{item.user_id}</b><span>{item.role==="owner"?"Inhaber":item.role==="admin"?"Administrator":"Benutzer"}</span><Status tone="success">Aktiv</Status></div>)}</div>:<EmptyState icon="users" title="Keine Benutzer" text="Es sind noch keine Benutzer vorhanden."/>}
    </section>
    {data.invitations.length>0&&<section className="surface"><h2>Einladungen</h2><div className="compact-list">{data.invitations.map(item=><div key={item.id}><b>{item.email}</b><span>{item.role==="admin"?"Administrator":"Benutzer"}</span><Status tone={item.status==="pending"?"warning":"neutral"}>{item.status==="pending"?"Ausstehend":item.status}</Status></div>)}</div></section>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}
