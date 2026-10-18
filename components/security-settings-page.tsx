"use client";

import {LocalizedText} from "@/lib/client/locale";
import {useCallback,useEffect,useRef,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import ConfirmDialog from "./confirm-dialog";
import {AppShell} from "./app-shell";
import {ActionRow,FormSheet,SettingsGroup} from "./binso-ux";
import {Button, Field, SectionTitle, Status, Toast, Input, ErrorState, LoadingState} from "./ui";
import {apiDelete,apiGet,apiPatch,apiPost} from "@/lib/client/backend";
import {safeAppPath} from "@/lib/navigation";

type MfaState={enabled:boolean;required:boolean;role:string;demo?:boolean};
type SessionItem={id:string;userAgent:string|null;lastSeenAt:string|null;expiresAt:string;current:boolean};

function sessionLabel(userAgent:string|null){
  const ua=userAgent??"";
  const browser=/Edg\//.test(ua)?"Edge":/Firefox\//.test(ua)?"Firefox":/CriOS\//.test(ua)?"Chrome":/Chrome\//.test(ua)?"Chrome":/Safari\//.test(ua)?"Safari":"Browser";
  const device=/iPhone/.test(ua)?"iPhone":/iPad/.test(ua)?"iPad":/Android/.test(ua)?"Android":/Macintosh/.test(ua)?"Mac":/Windows/.test(ua)?"Windows":"Gerät";
  return browser+" · "+device;
}
function sessionDate(value:string|null){
  if(!value)return "Noch keine Aktivität";
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"Unbekannt":date.toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"});
}

export function SecuritySettingsPage(){
  const router=useRouter();
  const search=useSearchParams();
  const next=search.get("next");
  const [panel,setPanel]=useState<"password"|"mfa"|null>(null);
  const [mfa,setMfa]=useState<MfaState|null>(null);
  const [mfaError,setMfaError]=useState("");
  const [sessionsError,setSessionsError]=useState("");
  const [setup,setSetup]=useState<{secret:string;otpAuthUri:string}|null>(null);
  const [code,setCode]=useState("");
  const [recovery,setRecovery]=useState<string[]>([]);
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [toastTone,setToastTone]=useState<"success"|"danger">("danger");
  const [sessions,setSessions]=useState<SessionItem[]>([]);
  const [sessionsLoading,setSessionsLoading]=useState(true);
  const [revokeTarget,setRevokeTarget]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);const mutation=useRef(false);

  const loadMfa=useCallback(()=>{
    return apiGet<MfaState>("/api/auth/mfa").then(setMfa).catch(error=>setMfaError(error instanceof Error?error.message:"Sicherheitsstatus konnte nicht geladen werden."));
  },[]);
  const loadSessions=useCallback(()=>{
    return apiGet<{items:SessionItem[]}>("/api/auth/sessions")
      .then(payload=>setSessions(payload.items))
      .catch(error=>setSessionsError(error instanceof Error?error.message:"Sitzungen konnten nicht geladen werden."))
      .finally(()=>setSessionsLoading(false));
  },[]);
  useEffect(()=>{void loadMfa();void loadSessions()},[loadMfa,loadSessions]);

  useEffect(()=>{if(next&&mfa?.required&&!mfa.enabled&&!mfa.demo)queueMicrotask(()=>setPanel("mfa"))},[next,mfa]);

  const startSetup=async()=>{setToastTone("danger");
    try{
      const payload=await apiPost<{secret:string;otpAuthUri:string}>("/api/auth/mfa/setup",{});
      setSetup(payload);setCode("");setRecovery([]);
    }catch(error){setToast(error instanceof Error?error.message:"Authenticator-Einrichtung konnte nicht gestartet werden.");}
  };

  const confirmSetup=async()=>{setToastTone("danger");
    try{
      const payload=await apiPost<{ok:boolean;recoveryCodes:string[]}>("/api/auth/mfa/confirm",{code});
      setRecovery(payload.recoveryCodes);setSetup(null);setMfa(current=>current?{...current,enabled:true}:current);setCode("");
      setToastTone("success");setToast("Authenticator-App erfolgreich aktiviert.");
    }catch(error){setToast(error instanceof Error?error.message:"Code konnte nicht bestätigt werden.");}
  };

  const changePassword=async()=>{setToastTone("danger");
    if(mutation.current)return;
    if(newPassword.length<12){setToast("Das Passwort muss mindestens 12 Zeichen haben.");return;}
    if(newPassword!==confirmPassword){setToast("Die Passwörter stimmen nicht überein.");return;}
    mutation.current=true;setBusy(true);
    try{
      await apiPatch("/api/auth/password",{password:newPassword,currentPassword});
      setCurrentPassword("");setNewPassword("");setConfirmPassword("");setToastTone("success");setToast("Passwort geändert.");
    }catch(error){setToast(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");}finally{mutation.current=false;setBusy(false)}
  };

  const revokeSession=async(id:string)=>{setToastTone("danger");
    if(mutation.current)return;mutation.current=true;setBusy(true);
    try{
      await apiDelete<{ok:boolean}>("/api/auth/sessions/"+encodeURIComponent(id));
      setSessions(current=>current.filter(item=>item.id!==id));
      setToastTone("success");setToast("Sitzung abgemeldet.");
    }catch(error){setToast(error instanceof Error?error.message:"Sitzung konnte nicht abgemeldet werden.");}finally{mutation.current=false;setBusy(false);setRevokeTarget(null)}
  };

  const revokeOtherSessions=async()=>{setToastTone("danger");
    if(mutation.current)return;mutation.current=true;setBusy(true);
    try{
      const result=await apiDelete<{ok:boolean;revoked:number}>("/api/auth/sessions");
      setSessions(current=>current.filter(item=>item.current));
      setToastTone("success");setToast(result.revoked===1?"Eine weitere Sitzung wurde abgemeldet.":result.revoked>1?String(result.revoked)+" weitere Sitzungen wurden abgemeldet.":"Keine weiteren aktiven Sitzungen.");
    }catch(error){setToast(error instanceof Error?error.message:"Andere Sitzungen konnten nicht abgemeldet werden.");}finally{mutation.current=false;setBusy(false);setRevokeTarget(null)}
  };

  return <AppShell title="Sicherheit" subtitle="Mehrstufiger Schutz für dein Binso One Konto." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" unsavedChanges={!!(currentPassword||newPassword||confirmPassword||code||setup||recovery.length)}>
    {mfaError&&panel!=="mfa"&&<ErrorState onRetry={()=>{setMfaError("");void loadMfa()}} retryLabel="Erneut versuchen"><LocalizedText>{mfaError}</LocalizedText></ErrorState>}
    <SettingsGroup title="Anmeldeschutz"><div className="action-list"><ActionRow icon="lock" title="Passwort ändern" onClick={()=>setPanel("password")}/><ActionRow icon="lock" title="Zwei-Faktor-Authentifizierung" description={!mfa?(mfaError?"Anmeldeschutzstatus nicht verfügbar.":undefined):mfa.demo?"Demo":mfa.enabled?"Aktiv":mfa.required?"Erforderlich":"Empfohlen"} endAdornment={!mfa&&!mfaError?<LoadingState/>:undefined} onClick={()=>setPanel("mfa")}/></div></SettingsGroup>
    <FormSheet open={panel==="password"} label="Passwort ändern" onClose={()=>setPanel(null)} busy={busy} dirty={!!(currentPassword||newPassword||confirmPassword)}><section className="settings-form">
      <div className="form-grid">
        <Field label="Aktuelles Passwort"><Input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password" autoComplete="current-password"/></Field>
        <Field label="Neues Passwort"><Input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" autoComplete="new-password"/></Field>
        <Field label="Neues Passwort bestätigen"><Input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" autoComplete="new-password"/></Field>
      </div>
      <Button variant="secondary" disabled={busy} onClick={()=>void changePassword()}><LocalizedText>{"Passwort speichern"}</LocalizedText></Button>
    </section></FormSheet>
    <FormSheet open={panel==="mfa"} label="Zwei-Faktor-Authentifizierung" onClose={()=>setPanel(null)} dirty={!!(setup||code||recovery.length)}><section className="settings-form">
      {!mfa?mfaError?<ErrorState onRetry={()=>{setMfaError("");void loadMfa()}} retryLabel="Erneut versuchen"><LocalizedText>{mfaError}</LocalizedText></ErrorState>:<LoadingState><LocalizedText>{"Sicherheitsstatus wird geladen…"}</LocalizedText></LoadingState>:mfa.demo?<div className="context-block"><Status tone="info"><LocalizedText>{"Demo"}</LocalizedText></Status><b><LocalizedText>{"Keine Authenticator-Einrichtung für die Demo nötig"}</LocalizedText></b><span><LocalizedText>{"Produktive Konten verwenden E-Mail-Codes oder einen Authenticator. Die Demo benötigt keinen Login."}</LocalizedText></span></div>:mfa.enabled?<div className="context-block"><Status tone="success"><LocalizedText>{"Aktiv"}</LocalizedText></Status><b><LocalizedText>{"Authenticator-App ist eingerichtet"}</LocalizedText></b><span><LocalizedText>{"Bei der Anmeldung wird nach E-Mail und Passwort zusätzlich ein zeitbasierter Authenticator-Code verlangt."}</LocalizedText></span></div>:<>
        <div className="context-block"><Status tone={mfa.required?"warning":"info"}><LocalizedText>{mfa.required?"Erforderlich":"Empfohlen"}</LocalizedText></Status><b><LocalizedText>{mfa.required?"Authenticator für diese Rolle erforderlich":"Authenticator-App aktivieren"}</LocalizedText></b><span><LocalizedText>{mfa.required?"Owner, Admin und Finance müssen den stärkeren zweiten Faktor einrichten. Bis dahin bleiben geschützte Produktfunktionen gesperrt.":"Ohne Authenticator wird bei jeder Anmeldung ein zusätzlicher Code per E-Mail verlangt."}</LocalizedText></span></div>
        {!setup&&<Button onClick={()=>void startSetup()}><LocalizedText>{"Authenticator einrichten"}</LocalizedText></Button>}
      </>}
      {setup&&<div className="form-grid">
        <Field label="Einrichtungsschlüssel"><Input readOnly value={setup.secret}/></Field>
        <p className="settings-note"><LocalizedText>{"Öffne deine Authenticator-App, füge ein neues Konto hinzu und gib den Schlüssel manuell ein. Alternativ kannst du auf einem unterstützten Gerät den folgenden Link öffnen."}</LocalizedText></p>
        <a className="text-action" href={setup.otpAuthUri}><LocalizedText>{"In Authenticator-App öffnen"}</LocalizedText></a>
        <Field label="6-stelliger Authenticator-Code"><Input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000"/></Field>
        <Button onClick={()=>void confirmSetup()} disabled={code.length!==6}><LocalizedText>{"Authenticator bestätigen"}</LocalizedText></Button>
      </div>}
      {recovery.length>0&&<div className="context-block"><Status tone="warning"><LocalizedText>{"Einmal anzeigen"}</LocalizedText></Status><b><LocalizedText>{"Recovery Codes sicher speichern"}</LocalizedText></b><span><LocalizedText>{"Jeder Code kann nur einmal verwendet werden. Bewahre sie getrennt von deinem Passwort auf."}</LocalizedText></span><pre>{recovery.join("\n")}</pre></div>}
      {mfa?.enabled&&next&&<Button onClick={()=>router.push(safeAppPath(next))}><LocalizedText>{"Weiter zu Binso One"}</LocalizedText></Button>}
    </section></FormSheet>

    <section className="surface security-card">
      <SectionTitle title="Anmeldeschutz"/>
      {mfa||mfaError?<p><LocalizedText>{mfa?mfa.enabled?"E-Mail + Passwort + Authenticator-Code.":"E-Mail + Passwort + einmaliger E-Mail-Code bei jeder Anmeldung.":"Anmeldeschutzstatus nicht verfügbar."}</LocalizedText></p>:<LoadingState/>}
    </section>

    <section className="surface security-card">
      <SectionTitle title="Aktive Sitzungen" action={sessions.some(item=>!item.current)?<Button variant="secondary" disabled={busy} onClick={()=>setRevokeTarget("all")}><LocalizedText>{"Alle anderen abmelden"}</LocalizedText></Button>:undefined}/>
      {sessionsLoading?<LoadingState/>:sessionsError?<ErrorState onRetry={()=>{setSessionsLoading(true);setSessionsError("");void loadSessions()}} retryLabel="Erneut versuchen"><LocalizedText>{sessionsError}</LocalizedText></ErrorState>:sessions.length===0?<p><LocalizedText>{"Keine aktive Sitzung gefunden."}</LocalizedText></p>:<div className="session-list">
        {sessions.map(item=><div key={item.id}>
          <div>
            <b>{sessionLabel(item.userAgent)}</b>
            <small><LocalizedText>{item.current?"Dieses Gerät":"Zuletzt aktiv: "+sessionDate(item.lastSeenAt)}</LocalizedText><LocalizedText>{" · Ablauf: "}</LocalizedText>{sessionDate(item.expiresAt)}</small>
          </div>
          {item.current?<Status tone="success"><LocalizedText>{"Aktuell"}</LocalizedText></Status>:<Button variant="secondary" disabled={busy} onClick={()=>setRevokeTarget(item.id)}><LocalizedText>{"Abmelden"}</LocalizedText></Button>}
        </div>)}
      </div>}
      <p className="settings-note"><LocalizedText>{"Es werden nur serverseitig tatsächlich aktive Sitzungen angezeigt. Geräteorte werden nicht geschätzt oder erfunden."}</LocalizedText></p>
    </section>

    <ConfirmDialog open={revokeTarget!==null} busy={busy} title={revokeTarget==="all"?"Andere Sitzungen abmelden?":"Sitzung abmelden?"} message="Die ausgewählten Geräte müssen sich danach erneut anmelden. Dieses Gerät bleibt angemeldet." confirmLabel="Abmelden" onCancel={()=>setRevokeTarget(null)} onConfirm={()=>void (revokeTarget==="all"?revokeOtherSessions():revokeTarget?revokeSession(revokeTarget):Promise.resolve())}/>
    {toast&&<Toast title={toast} tone={toastTone}/>}
  </AppShell>;
}
