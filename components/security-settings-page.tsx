"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import ConfirmDialog from "./confirm-dialog";
import {AppShell} from "./app-shell";
import {Button, Field, SectionTitle, Status, Toast, Input, ErrorState, LoadingState} from "./ui";
import {apiDelete,apiGet,apiPatch,apiPost} from "@/lib/client/backend";

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
    <section className="surface security-card">
      <SectionTitle title="Passwort ändern"/>
      <div className="form-grid">
        <Field label="Aktuelles Passwort"><Input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password" autoComplete="current-password"/></Field>
        <Field label="Neues Passwort"><Input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" autoComplete="new-password"/></Field>
        <Field label="Neues Passwort bestätigen"><Input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" autoComplete="new-password"/></Field>
      </div>
      <Button variant="secondary" disabled={busy} onClick={()=>void changePassword()}>Passwort speichern</Button>
    </section>
    <section className="surface security-card">
      <SectionTitle title="Zwei-Faktor-Authentifizierung"/>
      {!mfa?mfaError?<ErrorState onRetry={()=>{setMfaError("");void loadMfa()}} retryLabel="Erneut versuchen">{mfaError}</ErrorState>:<LoadingState>Sicherheitsstatus wird geladen…</LoadingState>:mfa.demo?<div className="context-block"><Status tone="info">Demo</Status><b>Keine Authenticator-Einrichtung für die Demo nötig</b><span>Produktive Konten verwenden E-Mail-Codes oder einen Authenticator. Die Demo benötigt keinen Login.</span></div>:mfa.enabled?<div className="context-block"><Status tone="success">Aktiv</Status><b>Authenticator-App ist eingerichtet</b><span>Bei der Anmeldung wird nach E-Mail und Passwort zusätzlich ein zeitbasierter Authenticator-Code verlangt.</span></div>:<>
        <div className="context-block"><Status tone={mfa.required?"warning":"info"}>{mfa.required?"Erforderlich":"Empfohlen"}</Status><b>{mfa.required?"Authenticator für diese Rolle erforderlich":"Authenticator-App aktivieren"}</b><span>{mfa.required?"Owner, Admin und Finance müssen den stärkeren zweiten Faktor einrichten. Bis dahin bleiben geschützte Produktfunktionen gesperrt.":"Ohne Authenticator wird bei jeder Anmeldung ein zusätzlicher Code per E-Mail verlangt."}</span></div>
        {!setup&&<Button onClick={()=>void startSetup()}>Authenticator einrichten</Button>}
      </>}
      {setup&&<div className="form-grid">
        <Field label="Einrichtungsschlüssel"><Input readOnly value={setup.secret}/></Field>
        <p className="settings-note">Öffne deine Authenticator-App, füge ein neues Konto hinzu und gib den Schlüssel manuell ein. Alternativ kannst du auf einem unterstützten Gerät den folgenden Link öffnen.</p>
        <a className="text-action" href={setup.otpAuthUri}>In Authenticator-App öffnen</a>
        <Field label="6-stelliger Authenticator-Code"><Input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000"/></Field>
        <Button onClick={()=>void confirmSetup()} disabled={code.length!==6}>Authenticator bestätigen</Button>
      </div>}
      {recovery.length>0&&<div className="context-block"><Status tone="warning">Einmal anzeigen</Status><b>Recovery Codes sicher speichern</b><span>Jeder Code kann nur einmal verwendet werden. Bewahre sie getrennt von deinem Passwort auf.</span><pre>{recovery.join("\n")}</pre></div>}
      {mfa?.enabled&&next&&<Button onClick={()=>router.push(next.startsWith("/")?next:"/dashboard")}>Weiter zu Binso One</Button>}
    </section>

    <section className="surface security-card">
      <SectionTitle title="Anmeldeschutz"/>
      <p>{mfa?mfa.enabled?"E-Mail + Passwort + Authenticator-Code.":"E-Mail + Passwort + einmaliger E-Mail-Code bei jeder Anmeldung.":mfaError?"Anmeldeschutzstatus nicht verfügbar.":"Anmeldeschutz wird geladen…"}</p>
    </section>

    <section className="surface security-card">
      <SectionTitle title="Aktive Sitzungen" action={sessions.some(item=>!item.current)?<Button variant="secondary" disabled={busy} onClick={()=>setRevokeTarget("all")}>Alle anderen abmelden</Button>:undefined}/>
      {sessionsLoading?<p>Sitzungen werden geladen…</p>:sessionsError?<ErrorState onRetry={()=>{setSessionsLoading(true);setSessionsError("");void loadSessions()}} retryLabel="Erneut versuchen">{sessionsError}</ErrorState>:sessions.length===0?<p>Keine aktive Sitzung gefunden.</p>:<div className="session-list">
        {sessions.map(item=><div key={item.id}>
          <div>
            <b>{sessionLabel(item.userAgent)}</b>
            <small>{item.current?"Dieses Gerät":"Zuletzt aktiv: "+sessionDate(item.lastSeenAt)} · Ablauf: {sessionDate(item.expiresAt)}</small>
          </div>
          {item.current?<Status tone="success">Aktuell</Status>:<Button variant="secondary" disabled={busy} onClick={()=>setRevokeTarget(item.id)}>Abmelden</Button>}
        </div>)}
      </div>}
      <p className="settings-note">Es werden nur serverseitig tatsächlich aktive Sitzungen angezeigt. Geräteorte werden nicht geschätzt oder erfunden.</p>
    </section>

    <ConfirmDialog open={revokeTarget!==null} busy={busy} title={revokeTarget==="all"?"Andere Sitzungen abmelden?":"Sitzung abmelden?"} message="Die ausgewählten Geräte müssen sich danach erneut anmelden. Dieses Gerät bleibt angemeldet." confirmLabel="Abmelden" onCancel={()=>setRevokeTarget(null)} onConfirm={()=>void (revokeTarget==="all"?revokeOtherSessions():revokeTarget?revokeSession(revokeTarget):Promise.resolve())}/>
    {toast&&<Toast title={toast} tone={toastTone}/>}
  </AppShell>;
}
