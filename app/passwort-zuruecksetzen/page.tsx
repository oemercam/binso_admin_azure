"use client";

import {AuthWorkspace} from "@/components/auth-workspace";

import {clearClientSession} from "@/lib/client/backend";
import {LocalizedText} from "@/lib/client/locale";
import { FormEvent, useEffect, useRef, useState } from "react";
import {Button, Field, ErrorState,LoadingState} from "@/components/ui";
import {PasswordInput} from '@/components/password-input';
import {authRequest} from '@/lib/client/auth-request';

import ConfirmDialog from "@/components/confirm-dialog";
import {useBrowserBackGuard} from "@/components/use-browser-back-guard";

export default function Page(){
  const pending=useRef(false);
  const [ready,setReady]=useState(false);
  const [invalid,setInvalid]=useState(false);
  const [password,setPassword]=useState("");
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
      const response=await authRequest("/api/auth/password",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,token:new URLSearchParams(window.location.search).get("token")})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Passwort konnte nicht geändert werden.");
      clearClientSession();const url=new URL(window.location.href);url.searchParams.delete("token");window.history.replaceState(window.history.state,"",url);setPassword("");setConfirm("");setDone(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");
    }finally{pending.current=false;setLoading(false);}
  };

  return <><AuthWorkspace><section className="auth-card">

    {!ready?<><LoadingState/></>:invalid?<><h1><LocalizedText>{"Link nicht gültig"}</LocalizedText></h1><p><LocalizedText>{"Der Link ist abgelaufen oder ungültig. Fordere einen neuen Link an."}</LocalizedText></p><Button href="/passwort-vergessen"><LocalizedText>{"Neuen Link anfordern"}</LocalizedText></Button></>:done?<><h1><LocalizedText>{"Passwort geändert"}</LocalizedText></h1><p><LocalizedText>{"Du kannst dich jetzt mit deinem neuen Passwort anmelden."}</LocalizedText></p><Button href="/login"><LocalizedText>{"Zur Anmeldung"}</LocalizedText></Button></>:<>
      <h1><LocalizedText>{"Neues Passwort"}</LocalizedText></h1><p><LocalizedText>{"Lege ein neues Passwort für dein Binso One Konto fest."}</LocalizedText></p>
      <form onSubmit={submit}>
        <Field label="Neues Passwort" hint="Mindestens 12 Zeichen."><PasswordInput required minLength={12} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/></Field>
        <Field label="Passwort bestätigen"><PasswordInput required minLength={12} maxLength={256} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/></Field>
        {error&&<ErrorState className="auth-error"><LocalizedText>{error}</LocalizedText></ErrorState>}
        <Button type="submit" disabled={loading}><LocalizedText>{loading?"Wird gespeichert…":"Passwort speichern"}</LocalizedText></Button>
      </form>
    </>}
  </section></AuthWorkspace><ConfirmDialog open={discard} busy={loading} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setDiscard(false)} onConfirm={()=>{setDiscard(false);leaveBack()}}/></>;
}
