"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button, Logo } from "@/components/ui";

export default function Page(){
  const [ready,setReady]=useState(false);
  const [invalid,setInvalid]=useState(false);
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
    const accessToken=hash.get("access_token");
    const refreshToken=hash.get("refresh_token");
    const expiresIn=Number(hash.get("expires_in")??"3600");
    if(!accessToken||!refreshToken){
      queueMicrotask(()=>{setInvalid(true);setReady(true);});
      return;
    }
    fetch("/api/auth/recovery-session",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({accessToken,refreshToken,expiresIn}),
    }).then(async response=>{
      if(!response.ok) throw new Error("Link ist ungültig oder abgelaufen.");
      window.history.replaceState(null,"",window.location.pathname);
      queueMicrotask(()=>setReady(true));
    }).catch(()=>{
      queueMicrotask(()=>{setInvalid(true);setReady(true);});
    });
  },[]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setError("");
    if(password.length<8){setError("Das Passwort muss mindestens 8 Zeichen haben.");return;}
    if(password!==confirm){setError("Die Passwörter stimmen nicht überein.");return;}
    setLoading(true);
    try{
      const response=await fetch("/api/auth/password",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Passwort konnte nicht geändert werden.");
      setDone(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");
    }finally{setLoading(false);}
  };

  return <main className="auth-page"><section className="auth-card">
    <Logo/>
    {!ready?<><h1>Link wird geprüft</h1><p>Einen Moment bitte.</p></>:invalid?<><h1>Link nicht gültig</h1><p>Der Link ist abgelaufen oder ungültig. Fordere einen neuen Link an.</p><Button href="/passwort-vergessen">Neuen Link anfordern</Button></>:done?<><h1>Passwort geändert</h1><p>Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p><Button href="/login">Zur Anmeldung</Button></>:<>
      <h1>Neues Passwort</h1><p>Lege ein neues Passwort für dein Binso One Konto fest.</p>
      <form onSubmit={submit}>
        <label>Neues Passwort<div className="password-field"><input required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Ausblenden":"Anzeigen"}</button></div><small className="password-hint">Mindestens 8 Zeichen.</small></label>
        <label>Passwort bestätigen<input required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password"/></label>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        <Button type="submit">{loading?"Wird gespeichert…":"Passwort speichern"}</Button>
      </form>
    </>}
  </section></main>;
}