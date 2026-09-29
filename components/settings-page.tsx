"use client";
import { useEffect, useState } from "react";
import { Check, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { clearDemoData, defaultSettings, listLocalRecords, loadAppPreferences, loadSettings, saveAppPreferences, saveSettings, type AppUser, type DemoSettings, type UserRole } from "@/lib/local-store";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { usePermissions } from "@/lib/client/use-permissions";
import { isProductionMode } from "@/lib/client/runtime";
import TenantUserManagement from "@/components/tenant-user-management";
import ProductionProfileSettings from "@/components/production-profile-settings";
import AccountSecurity from "@/components/security/account-security";
import TenantAudit from "@/components/audit/tenant-audit";
import ToggleSwitch from "@/components/ui/toggle-switch";
import ProductionOrganizationSettings from "@/components/production-organization-settings";
import ProductionDocumentSettings from "@/components/production-document-settings";

type Tab='profil'|'sicherheit'|'firma'|'benutzer'|'nummern'|'vorlagen'|'integrationen';
type TextSettingKey='companyName'|'uid'|'address'|'zipCity'|'email'|'phone'|'iban'|'defaultVat'|'paymentDays'|'currency'|'vatMethod';
const roles:UserRole[]=['Inhaber','Admin','Finanzen','Personal','Projektleitung','Mitarbeiter','Lesen'];

export default function SettingsPage(){
 const params=useSearchParams();
 const {setLocale}=useLocale();
 const permissions=usePermissions();
 const [v,setV]=useState<DemoSettings>(defaultSettings);const [tab,setTab]=useState<Tab>('profil');const [recordCount,setRecordCount]=useState(0);const [activeUserId,setActiveUserId]=useState("u1");
 useEffect(()=>{const timer=window.setTimeout(()=>{const settings=loadSettings();const pref=loadAppPreferences();setV(settings);setRecordCount(listLocalRecords().length);setActiveUserId(pref.activeUserId);const requested=params.get("tab") as Tab|null;if(requested&&["profil","sicherheit","firma","benutzer","nummern","vorlagen","integrationen"].includes(requested))setTab(requested)},0);return()=>window.clearTimeout(timer)},[params]);
 const activeUser=v.users.find(u=>u.id===activeUserId)||v.users[0];
 function save(){saveSettings(v);notify('Einstellungen gespeichert.')}
 function saveProfile(){
   saveSettings(v);
   const user=v.users.find(u=>u.id===activeUserId);
   if(user?.language)setLocale(user.language);
   notify("Profil gespeichert.");
 }
 async function reset(){const ok=await confirmAction({title:"Demo-Daten zurücksetzen",message:"Alle lokal erfassten Demo-Daten löschen?",confirmLabel:"Löschen",cancelLabel:"Abbrechen",tone:"danger"});if(ok){clearDemoData();saveSettings(defaultSettings);setV(defaultSettings);setRecordCount(0);notify("Demo-Daten zurückgesetzt.","info")}}
 function addUser(){const u:AppUser={id:`u-${Date.now()}`,name:'Neuer Benutzer',email:'benutzer@beispiel.ch',role:'Mitarbeiter',active:true,language:'de'};setV(x=>({...x,users:[...x.users,u]}))}
 function updateUser(id:string,patch:Partial<AppUser>){const current=v.users.find(u=>u.id===id);if(!current)return;if(patch.role==='Inhaber'&&activeUser?.role!=='Inhaber'){notify('Nur der Inhaber darf die Inhaberrolle vergeben.','danger');return}if(current.role==='Inhaber'&&patch.role&&patch.role!=='Inhaber'&&v.users.filter(u=>u.role==='Inhaber'&&u.active).length<=1){notify('Der letzte aktive Inhaber kann nicht geändert werden.','danger');return}if(current.role==='Inhaber'&&patch.active===false&&v.users.filter(u=>u.role==='Inhaber'&&u.active).length<=1){notify('Der letzte aktive Inhaber kann nicht deaktiviert werden.','danger');return}setV(x=>({...x,users:x.users.map(u=>u.id===id?{...u,...patch}:u)}))}
 function removeUser(id:string){const current=v.users.find(u=>u.id===id);if(!current)return;if(current.role==='Inhaber'&&v.users.filter(u=>u.role==='Inhaber').length<=1){notify('Der letzte Inhaber kann nicht gelöscht werden.','danger');return}setV(x=>({...x,users:x.users.filter(u=>u.id!==id)}))}
 const canManageOrg=permissions.can('organization:write');const canManageUsers=permissions.can('users:manage');
 const tabs:[Tab,string][]=[['profil','Mein Profil'],['sicherheit','Sicherheit'],...(canManageOrg?([['firma','Firmendaten'],['nummern','Nummernkreise'],['vorlagen','Vorlagen & Benachrichtigungen'],['integrationen','Integrationen & Audit']] as [Tab,string][]):[]),...(canManageUsers?([['benutzer','Benutzer & Rollen']] as [Tab,string][]):[])];
 const tabAllowed=tab==='profil'||tab==='sicherheit'||(tab==='benutzer'?canManageUsers:canManageOrg);
 const visibleTab:Tab=tabAllowed?tab:'profil';
 return <div className="page"><section className="module-heading"><div><div className="eyebrow">System</div><h1>Einstellungen</h1><p>Persönliche Einstellungen, Firma, Benutzer, Rollen, Nummernkreise, Vorlagen und Integrationen konfigurieren.</p></div>{canManageOrg&&visibleTab!=='profil'&&<button className="primary-inline" onClick={save}><Save size={17}/>Speichern</button>}</section><div className="settings-tabs">{tabs.map(([k,l])=><button key={k} className={visibleTab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
 {visibleTab==='profil'&&(isProductionMode()?<ProductionProfileSettings/>:<div className="settings-grid profile-settings-grid">
  <section className="workspace-card profile-settings-card">
    <div className="settings-profile-head">
      <div className="settings-profile-avatar">{(activeUser?.name||"B").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div>
      <div><h2>{activeUser?.name||"Benutzer"}</h2><p>{activeUser?.email||""}</p><span>{activeUser?.role||"Benutzer"}</span></div>
    </div>
    {activeUser&&<div className="form-grid">
      <label><span>Name</span><input value={activeUser.name} onChange={e=>updateUser(activeUser.id,{name:e.target.value})}/></label>
      <label><span>E-Mail</span><input type="email" value={activeUser.email} onChange={e=>updateUser(activeUser.id,{email:e.target.value})}/></label>
      <label><span>Sprache</span><select value={activeUser.language||"de"} onChange={e=>updateUser(activeUser.id,{language:e.target.value as "de"|"en"|"fr"|"it"})}><option value="de">Deutsch</option><option value="en">English</option><option value="fr">Français</option><option value="it">Italiano</option></select><small className="field-help">Diese Sprache gilt nur für dein Benutzerprofil.</small></label>
    </div>}
    <button className="primary-button settings-save" onClick={saveProfile}><Check size={17}/>Profil speichern</button>
  </section>
  <aside className="workspace-card profile-settings-aside">
    <h2>Persönliche Einstellungen</h2>
    <p>Die Sprache wird nicht mehr global für die Firma gesetzt, sondern pro Benutzer gespeichert.</p>
    <div className="profile-setting-summary"><span>Firma</span><strong>{v.companyName}</strong></div>
    <div className="profile-setting-summary"><span>Rolle</span><strong>{activeUser?.role||"–"}</strong></div>
  </aside>
 </div>)}

 {visibleTab==='sicherheit'&&(isProductionMode()?<AccountSecurity/>:<section className="workspace-card"><h2>Sicherheit</h2><p className="field-help">MFA und Sitzungsverwaltung sind im Produktivmodus verfügbar.</p></section>)}
 {visibleTab==='firma'&&(isProductionMode()?<ProductionOrganizationSettings/>:<div className="settings-grid"><section className="workspace-card"><div className="section-title"><h2>Firmendaten</h2><span>für Dokumente</span></div><div className="form-grid">{([['companyName','Firmenname'],['uid','UID / MWST'],['address','Adresse'],['zipCity','PLZ / Ort'],['email','E-Mail'],['phone','Telefon'],['iban','IBAN'],['defaultVat','Standard MWST %'],['paymentDays','Zahlungsfrist Tage'],['currency','Währung'],['vatMethod','MWST-Methode']] as [TextSettingKey,string][]).map(([k,l])=><label key={String(k)}><span>{l}</span><input value={String(v[k])} onChange={e=>setV(x=>({...x,[k]:e.target.value}))}/></label>)}</div><button className="primary-button settings-save" onClick={save}><Check size={17}/>Änderungen speichern</button></section><aside className="workspace-card danger-zone"><h2>Lokaler Demo-Modus</h2><p>{recordCount} lokale Datensätze gespeichert.</p><p>Alle Testdaten liegen ausschliesslich in diesem Browser.</p><button onClick={reset}><RotateCcw size={17}/>Demo-Daten zurücksetzen</button></aside></div>)}
 {visibleTab==='benutzer'&&(isProductionMode()?<TenantUserManagement/>:<section className="workspace-card"><div className="section-title"><h2>Benutzer und Rollen</h2><button onClick={addUser}><Plus size={16}/>Benutzer</button></div><div className="settings-user-table"><div className="settings-user-row head"><span>Name</span><span>E-Mail</span><span>Rolle</span><span>Aktiv</span><span>Aktion</span></div>{v.users.map(u=><div className="settings-user-row" key={u.id}><input value={u.name} onChange={e=>updateUser(u.id,{name:e.target.value})}/><input value={u.email} onChange={e=>updateUser(u.id,{email:e.target.value})}/><select value={u.role} onChange={e=>updateUser(u.id,{role:e.target.value as UserRole})}>{roles.map(r=><option key={r}>{r}</option>)}</select><ToggleSwitch checked={u.active} onChange={active=>updateUser(u.id,{active})} label={`Benutzer ${u.name}`}/><div className="settings-user-actions"><button className="text-button" onClick={()=>{const pref=loadAppPreferences();saveAppPreferences({...pref,activeUserId:u.id});setActiveUserId(u.id);if(u.language)setLocale(u.language);notify(`Aktiver Testbenutzer: ${u.name}`)}}>Testen</button><button className="icon-button" onClick={()=>removeUser(u.id)}><Trash2 size={16}/></button></div></div>)}</div><div className="role-info"><p><strong>Inhaber:</strong> Vollzugriff inkl. Abo und Rollenverwaltung.</p><p><strong>Admin:</strong> Vollzugriff im Mandanten, ausser Inhaber-/Abo-Sonderrechte.</p><p><strong>Finanzen:</strong> Verkauf, Rechnungen, Zahlungen, Einkauf, Buchhaltung, Bank und MWST.</p><p><strong>Personal:</strong> Mitarbeitende, Abwesenheiten und Lohn.</p><p><strong>Projektleitung:</strong> Kunden, Offerten/Aufträge, Projekte, Zeit, Spesen und Aufgaben.</p><p><strong>Mitarbeiter:</strong> Projekte lesen sowie eigene Zeit, Spesen und Aufgaben.</p><p><strong>Lesen:</strong> Lesender Zugriff auf nicht sensible Geschäftsbereiche; kein Lohn.</p></div></section>)}
 {visibleTab==='nummern'&&(isProductionMode()?<ProductionDocumentSettings mode="numbers"/>:<section className="workspace-card"><div className="section-title"><h2>Nummernkreise</h2><span>lokale Vorschau</span></div><div className="form-grid">{Object.entries(v.sequences).map(([k,val])=><label key={k}><span>{k}</span><input value={val} onChange={e=>setV(x=>({...x,sequences:{...x.sequences,[k]:e.target.value}}))}/></label>)}</div><p className="legal-demo-note">Platzhalter: {'{YYYY}'} für Jahr und {'{####}'} für laufende Nummer.</p></section>)}
 {visibleTab==='vorlagen'&&(isProductionMode()?<ProductionDocumentSettings mode="templates"/>:<section className="workspace-card"><div className="section-title"><h2>Dokumentvorlagen</h2><span>Offerten und Rechnungen</span></div><div className="form-grid"><label className="full"><span>Einleitung Rechnung</span><textarea rows={4} value={v.invoiceIntro} onChange={e=>setV(x=>({...x,invoiceIntro:e.target.value}))}/></label><label className="full"><span>Einleitung Offerte</span><textarea rows={4} value={v.quoteIntro} onChange={e=>setV(x=>({...x,quoteIntro:e.target.value}))}/></label><label><span>Mahnung nach Tagen</span><input value={v.reminderDays} onChange={e=>setV(x=>({...x,reminderDays:e.target.value}))}/></label></div><div className="toggle-list"><label><input type="checkbox" checked={v.notificationsEmail} onChange={e=>setV(x=>({...x,notificationsEmail:e.target.checked}))}/>E-Mail-Benachrichtigungen</label><label><input type="checkbox" checked={v.notificationsPush} onChange={e=>setV(x=>({...x,notificationsPush:e.target.checked}))}/>Push-Benachrichtigungen</label></div></section>)}
 {visibleTab==='integrationen'&&<div className="settings-grid"><section className="workspace-card"><div className="section-title"><h2>Integrationen</h2><span>lokale Simulation</span></div><div className="integration-list">{[['bank','Bank / ISO 20022'],['email','E-Mail-Versand'],['estv','ESTV / MWST'],['storage','Dokumentenablage']].map(([k,l])=><div key={k}><div><strong>{l}</strong><span>{v.integrations[k]?'Aktiv':'Nicht verbunden'}</span></div><button onClick={()=>{setV(x=>({...x,integrations:{...x.integrations,[k]:!x.integrations[k]}}));notify(`${l}: ${v.integrations[k]?'getrennt':'Demo-Verbindung aktiviert'}.`)}}>{v.integrations[k]?'Trennen':'Verbinden'}</button></div>)}</div></section><aside className="workspace-card"><h2>Audit</h2>{isProductionMode()?<TenantAudit/>:<div className="audit-list"><p><strong>Heute</strong><span>Einstellungen geöffnet</span></p><p><strong>Heute</strong><span>{recordCount} lokale Geschäftsdatensätze vorhanden</span></p><p><strong>System</strong><span>Lokale Demo-Umgebung aktiv</span></p></div>}</aside></div>}
 </div>
}