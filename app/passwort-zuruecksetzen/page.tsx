"use client";

import {clearDemoClientSession} from "@/lib/client/backend";
import {LocalizedText} from "@/lib/client/locale";
import { FormEvent, useEffect, useRef, useState } from "react";
import {Button, Logo, Input, Field, ErrorState} from "@/components/ui";

import ConfirmDialog from "@/components/confirm-dialog";
import {useBrowserBackGuard} from "@/components/use-browser-back-guard";

export default function Page(){
  const pending=useRef(false);
  const [ready,setReady]=useState(false);
  const [invalid,setInvalid]=useState(false);
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState("");

  const [discard,setDiscard]=useState(false);
  const leaveBack=useBrowserBackGuard(!done&&!!(password||confirm),()=>setDiscard(true));

  useEffect(()=>{
    const token=new URLSearchParams(window.location.search).get("token");
    queueMicrotask(()=>{setInvalid(!token);setReady(true);});
  },[]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(pending.current)return;
    setError("");
    if(password.length<12){setError("Das Passwort muss mindestens 12 Zeichen haben.");return;}
    if(password!==confirm){setError("Die Passwörter stimmen nicht überein.");return;}
    pending.current=true;setLoading(true);
    try{
      const response=await fetch("/api/auth/password",{method:"PATCH",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},body:JSON.stringify({password,token:new URLSearchParams(window.location.search).get("token")})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Passwort konnte nicht geändert werden.");
      clearDemoClientSession();const url=new URL(window.location.href);url.searchParams.delete("token");window.history.replaceState(window.history.state,"",url);setPassword("");setConfirm("");setDone(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");
    }finally{pending.current=false;setLoading(false);}
  };

  return <><main className="auth-page"><section className="auth-card">
    <Logo/>
    {!ready?<><h1><LocalizedText>{"Link wird geprüft"}</LocalizedText></h1><p><LocalizedText>{"Einen Moment bitte."}</LocalizedText></p></>:invalid?<><h1><LocalizedText>{"Link nicht gültig"}</LocalizedText></h1><p><LocalizedText>{"Der Link ist abgelaufen oder ungültig. Fordere einen neuen Link an."}</LocalizedText></p><Button href="/passwort-vergessen"><LocalizedText>{"Neuen Link anfordern"}</LocalizedText></Button></>:done?<><h1><LocalizedText>{"Passwort geändert"}</LocalizedText></h1><p><LocalizedText>{"Du kannst dich jetzt mit deinem neuen Passwort anmelden."}</LocalizedText></p><Button href="/login"><LocalizedText>{"Zur Anmeldung"}</LocalizedText></Button></>:<>
      <h1><LocalizedText>{"Neues Passwort"}</LocalizedText></h1><p><LocalizedText>{"Lege ein neues Passwort für dein Binso One Konto fest."}</LocalizedText></p>
      <form onSubmit={submit}>
        <Field label="Neues Passwort"><div className="password-field"><Input required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword(!showPassword)}><LocalizedText>{showPassword?"Ausblenden":"Anzeigen"}</LocalizedText></button></div><small className="password-hint"><LocalizedText>{"Mindestens 12 Zeichen."}</LocalizedText></small></Field>
        <Field label="Passwort bestätigen"><Input required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password"/></Field>
        {error&&<ErrorState className="auth-error"><LocalizedText>{error}</LocalizedText></ErrorState>}
        <Button type="submit" disabled={loading}><LocalizedText>{loading?"Wird gespeichert…":"Passwort speichern"}</LocalizedText></Button>
      </form>
    </>}
  </section></main><ConfirmDialog open={discard} busy={loading} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setDiscard(false)} onConfirm={()=>{setDiscard(false);leaveBack()}}/></>;
}