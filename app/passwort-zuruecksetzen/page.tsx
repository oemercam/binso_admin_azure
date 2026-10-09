"use client";

import { FormEvent, useEffect, useState } from "react";
import {Button, Logo, Input, Field, ErrorState} from "@/components/ui";

import ConfirmDialog from "@/components/confirm-dialog";
import {useBrowserBackGuard} from "@/components/use-browser-back-guard";

export default function Page(){
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
    event.preventDefault();
    setError("");
    if(password.length<12){setError("Das Passwort muss mindestens 12 Zeichen haben.");return;}
    if(password!==confirm){setError("Die Passwörter stimmen nicht überein.");return;}
    setLoading(true);
    try{
      const response=await fetch("/api/auth/password",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,token:new URLSearchParams(window.location.search).get("token")})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Passwort konnte nicht geändert werden.");
      setDone(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");
    }finally{setLoading(false);}
  };

  return <><main className="auth-page"><section className="auth-card">
    <Logo/>
    {!ready?<><h1>Link wird geprüft</h1><p>Einen Moment bitte.</p></>:invalid?<><h1>Link nicht gültig</h1><p>Der Link ist abgelaufen oder ungültig. Fordere einen neuen Link an.</p><Button href="/passwort-vergessen">Neuen Link anfordern</Button></>:done?<><h1>Passwort geändert</h1><p>Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p><Button href="/login">Zur Anmeldung</Button></>:<>
      <h1>Neues Passwort</h1><p>Lege ein neues Passwort für dein Binso One Konto fest.</p>
      <form onSubmit={submit}>
        <Field label="Neues Passwort"><div className="password-field"><Input required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Ausblenden":"Anzeigen"}</button></div><small className="password-hint">Mindestens 12 Zeichen.</small></Field>
        <Field label="Passwort bestätigen"><Input required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password"/></Field>
        {error&&<ErrorState className="auth-error">{error}</ErrorState>}
        <Button type="submit">{loading?"Wird gespeichert…":"Passwort speichern"}</Button>
      </form>
    </>}
  </section></main><ConfirmDialog open={discard} busy={loading} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setDiscard(false)} onConfirm={()=>{setDiscard(false);leaveBack()}}/></>;
}