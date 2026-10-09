"use client";
import {Avatar} from "./avatar";
import { FormSheet } from "./binso-ux";
import {useCallback,useEffect,useState,useRef} from "react";
import ConfirmDialog from "./confirm-dialog";
import {AppShell} from "./app-shell";
import {Button, EmptyState, Field, Icon, Status, Toast, Input, Select, LoadingState, ErrorState} from "./ui";
import {apiGet,apiPatch,apiPost,useBackendMode} from "@/lib/client/backend";
type Member={user_id:string;role:string;created_at:string;name?:string;email?:string};
type Invitation={id:string;email:string;role:string;status:string;expires_at:string;created_at:string};
type TeamPayload={members:Member[];invitations:Invitation[];userLimit:number;plan:string};
const demoMembers:Member[]=[
 {user_id:"demo-owner",name:"Thomas Müller",email:"thomas@musterwerk.ch",role:"owner",created_at:"2026-01-10"},
 {user_id:"demo-admin",name:"Sarah Meier",email:"sarah@musterwerk.ch",role:"admin",created_at:"2026-02-03"},
 {user_id:"demo-project",name:"Lukas Weber",email:"lukas@musterwerk.ch",role:"project_manager",created_at:"2026-03-14"},
 {user_id:"demo-finance",name:"Nina Schmid",email:"nina@musterwerk.ch",role:"finance",created_at:"2026-04-08"},
 {user_id:"demo-member",name:"Marco Keller",email:"marco@musterwerk.ch",role:"member",created_at:"2026-05-21"},
];
const roleLabel=(role:string)=>({owner:"Inhaber",admin:"Administrator",finance:"Finanzen",hr:"Personal",project_manager:"Projektleitung",manager:"Management",member:"Mitarbeitende",reader:"Lesen",employee:"Mitarbeitende"}[role]??role);
export function TeamSettingsPage(){
 const production=useBackendMode();
 const [loadError,setLoadError]=useState<string|null>(null);
 const [canManage,setCanManage]=useState(false);
 useEffect(()=>{apiGet<{demo?:boolean;tenant?:{role?:string;readOnly?:boolean}}>("/api/auth/session").then(s=>setCanManage(!s.demo&&!s.tenant?.readOnly&&["owner","admin"].includes(s.tenant?.role??""))).catch(()=>{});},[]);
 const [data,setData]=useState<TeamPayload>({members:production?[]:demoMembers,invitations:[],userLimit:production?1:10,plan:production?"trial":"pro"});
 const [email,setEmail]=useState(""),[role,setRole]=useState("member"),[loading,setLoading]=useState(production),[toast,setToast]=useState<string|null>(null),[inviteOpen,setInviteOpen]=useState(false),[selected,setSelected]=useState<Member|null>(null),[editRole,setEditRole]=useState("member");
 const load=useCallback(async()=>{if(!production){setData({members:demoMembers,invitations:[],userLimit:10,plan:"pro"});setLoading(false);return}try{setLoadError(null);setLoading(true);setData(await apiGet<TeamPayload>("/api/settings/team/invitations"))}catch(e){setLoadError(e instanceof Error?e.message:"Team konnte nicht geladen werden.")}finally{setLoading(false)}},[production]);
 useEffect(()=>{queueMicrotask(()=>void load())},[load]);
 const mutation=useRef(false);const [saving,setSaving]=useState(false);
 const invite=async()=>{if(mutation.current||!email.trim()||!canManage)return;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setToast("Bitte eine gültige E-Mail-Adresse eingeben.");return}mutation.current=true;setSaving(true);try{if(production)await apiPost("/api/settings/team/invitations",{email,role});setEmail("");setInviteOpen(false);setToast("Einladung wurde gesendet.");await load()}catch(e){setToast(e instanceof Error?e.message:"Einladung konnte nicht gesendet werden.")}mutation.current=false;setSaving(false);window.setTimeout(()=>setToast(null),2600)};
 const openMember=(m:Member)=>{setSelected(m);setEditRole(m.role)};
 const [confirmRole,setConfirmRole]=useState(false);
 const saveRole=async()=>{if(mutation.current||!selected||selected.role==="owner"||!canManage)return;mutation.current=true;setSaving(true);try{if(production)await apiPatch("/api/settings/team/members/"+encodeURIComponent(selected.user_id),{role:editRole});setData(d=>({...d,members:d.members.map(m=>m.user_id===selected.user_id?{...m,role:editRole}:m)}));setSelected(null);setConfirmRole(false);setToast("Rolle gespeichert.")}catch(e){setToast(e instanceof Error?e.message:"Rolle konnte nicht gespeichert werden.")}mutation.current=false;setSaving(false);window.setTimeout(()=>setToast(null),2200)};
 const revoke=async(id:string)=>{try{const response=await fetch('/api/settings/team/invitations/'+encodeURIComponent(id),{method:'DELETE'});const result=await response.json();if(!response.ok)throw new Error(result.message||'Einladung konnte nicht zurückgezogen werden.');await load()}catch(e){setToast(e instanceof Error?e.message:'Einladung konnte nicht zurückgezogen werden.')}};
 const occupied=data.members.length+data.invitations.filter(i=>i.status==="pending"&&new Date(i.expires_at)>new Date()).length;
 return <AppShell title="Benutzer & Rollen" subtitle="Zugänge, Rollen und Einladungen verwalten." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" actions={canManage?<Button icon="plus" onClick={()=>setInviteOpen(true)} className="page-add-button responsive-create-action" ariaLabel="Mitarbeiter einladen"><span className="create-action-label">Mitarbeiter einladen</span></Button>:undefined}>
  {!loading&&!loadError&&<p className="settings-note">{occupied} von {data.userLimit} Plätzen belegt · Plan {data.plan}</p>}
  <div className="settings-choice-list team-list">{loading?<LoadingState>Team wird geladen …</LoadingState>:loadError?<ErrorState onRetry={()=>void load()} retryLabel="Erneut laden">{loadError}</ErrorState>:data.members.length?data.members.map(m=><button type="button" key={m.user_id} disabled={!canManage} onClick={()=>openMember(m)}><Avatar name={m.name||m.email||""} identity={m.user_id}/><div><b>{m.name||m.email||"Mitarbeiter"}</b><small>{roleLabel(m.role)}</small><small>{m.email}</small></div><Status tone="success">Aktiv</Status><Icon name="arrow" size={17}/></button>):<EmptyState icon="users" title="Keine Mitarbeitenden" text="Lade die erste Person in dein Team ein."/>}</div>
  {data.invitations.length>0&&<section className="settings-section"><h2>Offene Einladungen</h2><div className="settings-choice-list">{data.invitations.filter(i=>i.status==="pending"&&new Date(i.expires_at)>new Date()).map(i=><div className="settings-static-row" key={i.id}><div><b>{i.email}</b><small>{roleLabel(i.role)}</small></div><Status tone="warning">Ausstehend</Status>{canManage&&<Button variant="secondary" onClick={()=>void revoke(i.id)}>Zurückziehen</Button>}</div>)}</div></section>}

  {inviteOpen&&<FormSheet label={"Mitarbeiter einladen"} description={"Zugang und Rolle können später geändert werden."} open={true} onClose={()=>setInviteOpen(false)} busy={saving} className={""} layerClassName={""} ariaLabel={"Einladung"}><div className="form-grid"><Field label="E-Mail"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@firma.ch"/></Field><Field label="Rolle"><Select value={role} onChange={e=>setRole(e.target.value)}><option value="member">Mitarbeitende</option><option value="reader">Lesen</option><option value="project_manager">Projektleitung</option><option value="manager">Management</option><option value="finance">Finanzen</option><option value="hr">Personal</option><option value="admin">Administrator</option></Select></Field></div><div className="filter-sheet-actions"><Button variant="secondary" disabled={saving} onClick={()=>setInviteOpen(false)}>Abbrechen</Button><Button onClick={()=>void invite()} disabled={saving||occupied>=data.userLimit}>Einladen</Button></div></FormSheet>}
  <ConfirmDialog open={confirmRole} busy={saving} title="Rolle ändern?" message={`${selected?.name||selected?.email||"Diese Person"} erhält die Rolle ${roleLabel(editRole)}. Dadurch ändern sich die Zugriffsrechte.`} confirmLabel="Rolle ändern" onCancel={()=>setConfirmRole(false)} onConfirm={()=>void saveRole()}/>
  {selected&&<FormSheet label={selected.name||selected.email||"Mitarbeiter"} description={selected.email||selected.user_id} open={true} onClose={()=>setSelected(null)} busy={saving} className={""} layerClassName={""} ariaLabel={"Teammitglied"}><Field label="Rolle"><Select value={editRole} disabled={selected.role==="owner"} onChange={e=>setEditRole(e.target.value)}><option value="member">Mitarbeitende</option><option value="reader">Lesen</option><option value="project_manager">Projektleitung</option><option value="manager">Management</option><option value="finance">Finanzen</option><option value="hr">Personal</option><option value="admin">Administrator</option>{selected.role==="owner"&&<option value="owner">Inhaber</option>}</Select></Field><div className="filter-sheet-actions"><Button variant="secondary" disabled={saving} onClick={()=>setSelected(null)}>Schliessen</Button>{canManage&&selected.role!=="owner"&&<Button disabled={saving||selected.role===editRole} onClick={()=>setConfirmRole(true)}>Rolle speichern</Button>}</div></FormSheet>}
  {toast&&<Toast title={toast} tone={toast.includes("konnte")?"danger":"success"}/>}
 </AppShell>
}
