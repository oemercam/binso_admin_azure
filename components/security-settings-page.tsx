"use client";

import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {AppShell} from "./app-shell";
import {Button,Field,SectionTitle,Status,Toast} from "./ui";
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
  const [setup,setSetup]=useState<{secret:string;otpAuthUri:string}|null>(null);
  const [code,setCode]=useState("");
  const [recovery,setRecovery]=useState<string[]>([]);
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [sessions,setSessions]=useState<SessionItem[]>([]);
  const [sessionsLoading,setSessionsLoading]=useState(true);

  useEffect(()=>{
    apiGet<MfaState>("/api/auth/mfa").then(setMfa).catch(error=>setToast(error instanceof Error?error.message:"Sicherheitsstatus konnte nicht geladen werden."));
    apiGet<{items:SessionItem[]}>("/api/auth/sessions")
      .then(payload=>setSessions(payload.items))
      .catch(error=>setToast(error instanceof Error?error.message:"Sitzungen konnten nicht geladen werden."))
      .finally(()=>setSessionsLoading(false));
  },[]);

  const startSetup=async()=>{
    try{
      const payload=await apiPost<{secret:string;otpAuthUri:string}>("/api/auth/mfa/setup",{});
      setSetup(payload);setCode("");setRecovery([]);
    }catch(error){setToast(error instanceof Error?error.message:"Authenticator-Einrichtung konnte nicht gestartet werden.");}
  };

  const confirmSetup=async()=>{
    try{
      const payload=await apiPost<{ok:boolean;recoveryCodes:string[]}>("/api/auth/mfa/confirm",{code});
      setRecovery(payload.recoveryCodes);setSetup(null);setMfa(current=>current?{...current,enabled:true}:current);setCode("");
      setToast("Authenticator-App erfolgreich aktiviert.");
    }catch(error){setToast(error instanceof Error?error.message:"Code konnte nicht bestätigt werden.");}
  };

  const changePassword=async()=>{
    if(newPassword.length<12){setToast("Das Passwort muss mindestens 12 Zeichen haben.");return;}
    if(newPassword!==confirmPassword){setToast("Die Passwörter stimmen nicht überein.");return;}
    try{
      await apiPatch("/api/auth/password",{password:newPassword,currentPassword});
      setCurrentPassword("");setNewPassword("");setConfirmPassword("");setToast("Passwort geändert.");
    }catch(error){setToast(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");}
  };

  const revokeSession=async(id:string)=>{
    try{
      await apiDelete<{ok:boolean}>("/api/auth/sessions/"+encodeURIComponent(id));
      setSessions(current=>current.filter(item=>item.id!==id));
      setToast("Sitzung abgemeldet.");
    }catch(error){setToast(error instanceof Error?error.message:"Sitzung konnte nicht abgemeldet werden.");}
  };

  const revokeOtherSessions=async()=>{
    try{
      const result=await apiDelete<{ok:boolean;revoked:number}>("/api/auth/sessions");
      setSessions(current=>current.filter(item=>item.current));
      setToast(result.revoked===1?"Eine weitere Sitzung wurde abgemeldet.":result.revoked>1?String(result.revoked)+" weitere Sitzungen wurden abgemeldet.":"Keine weiteren aktiven Sitzungen.");
    }catch(error){setToast(error instanceof Error?error.message:"Andere Sitzungen konnten nicht abgemeldet werden.");}
  };

  return <AppShell title="Sicherheit" subtitle="Mehrstufiger Schutz für dein Binso One Konto." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="surface security-card">
      <SectionTitle title="Zwei-Faktor-Authentifizierung"/>
      {!mfa?<p>Sicherheitsstatus wird geladen…</p>:mfa.demo?<div className="context-block"><Status tone="info">Demo</Status><b>Keine Authenticator-Einrichtung für die Demo nötig</b><span>Produktive Konten verwenden E-Mail-Codes oder einen Authenticator. Die Demo benötigt keinen Login.</span></div>:mfa.enabled?<div className="context-block"><Status tone="success">Aktiv</Status><b>Authenticator-App ist eingerichtet</b><span>Bei der Anmeldung wird nach E-Mail und Passwort zusätzlich ein zeitbasierter Authenticator-Code verlangt.</span></div>:<>
        <div className="context-block"><Status tone={mfa.required?"warning":"info"}>{mfa.required?"Erforderlich":"Empfohlen"}</Status><b>{mfa.required?"Authenticator für diese Rolle erforderlich":"Authenticator-App aktivieren"}</b><span>{mfa.required?"Owner, Admin und Finance müssen den stärkeren zweiten Faktor einrichten. Bis dahin bleiben geschützte Produktfunktionen gesperrt.":"Ohne Authenticator wird bei jeder Anmeldung ein zusätzlicher Code per E-Mail verlangt."}</span></div>
        {!setup&&<Button onClick={()=>void startSetup()}>Authenticator einrichten</Button>}
      </>}
      {setup&&<div className="form-grid">
        <Field label="Einrichtungsschlüssel"><input readOnly value={setup.secret}/></Field>
        <p className="settings-note">Öffne deine Authenticator-App, füge ein neues Konto hinzu und gib den Schlüssel manuell ein. Alternativ kannst du auf einem unterstützten Gerät den folgenden Link öffnen.</p>
        <a className="text-action" href={setup.otpAuthUri}>In Authenticator-App öffnen</a>
        <Field label="6-stelliger Authenticator-Code"><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000"/></Field>
        <Button onClick={()=>void confirmSetup()} disabled={code.length!==6}>Authenticator bestätigen</Button>
      </div>}
      {recovery.length>0&&<div className="context-block"><Status tone="warning">Einmal anzeigen</Status><b>Recovery Codes sicher speichern</b><span>Jeder Code kann nur einmal verwendet werden. Bewahre sie getrennt von deinem Passwort auf.</span><pre>{recovery.join("\n")}</pre></div>}
      {mfa?.enabled&&next&&<Button onClick={()=>router.push(next.startsWith("/")?next:"/dashboard")}>Weiter zu Binso One</Button>}
    </section>

    <section className="surface security-card">
      <SectionTitle title="Anmeldeschutz"/>
      <p>{mfa?.enabled?"E-Mail + Passwort + Authenticator-Code.":"E-Mail + Passwort + einmaliger E-Mail-Code bei jeder Anmeldung."}</p>
    </section>

    <section className="surface security-card">
      <SectionTitle title="Aktive Sitzungen" action={sessions.some(item=>!item.current)?<Button variant="secondary" onClick={()=>void revokeOtherSessions()}>Alle anderen abmelden</Button>:undefined}/>
      {sessionsLoading?<p>Sitzungen werden geladen…</p>:sessions.length===0?<p>Keine aktive Sitzung gefunden.</p>:<div className="session-list">
        {sessions.map(item=><div key={item.id}>
          <div>
            <b>{sessionLabel(item.userAgent)}</b>
            <small>{item.current?"Dieses Gerät":"Zuletzt aktiv: "+sessionDate(item.lastSeenAt)} · Ablauf: {sessionDate(item.expiresAt)}</small>
          </div>
          {item.current?<Status tone="success">Aktuell</Status>:<Button variant="secondary" onClick={()=>void revokeSession(item.id)}>Abmelden</Button>}
        </div>)}
      </div>}
      <p className="settings-note">Es werden nur serverseitig tatsächlich aktive Sitzungen angezeigt. Geräteorte werden nicht geschätzt oder erfunden.</p>
    </section>

    <section className="surface security-card">
      <SectionTitle title="Passwort ändern"/>
      <div className="form-grid">
        <Field label="Aktuelles Passwort"><input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password" autoComplete="current-password"/></Field>
        <Field label="Neues Passwort"><input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" autoComplete="new-password"/></Field>
        <Field label="Neues Passwort bestätigen"><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" autoComplete="new-password"/></Field>
      </div>
      <Button variant="secondary" onClick={()=>void changePassword()}>Passwort speichern</Button>
    </section>
    {toast&&<Toast title={toast} tone={toast.includes("nicht")||toast.includes("ungültig")||toast.includes("abgelaufen")?"danger":"success"}/>}
  </AppShell>;
}
