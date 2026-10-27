"use client";

import {AuthWorkspace} from "@/components/auth-workspace";

import {LocalizedText} from "@/lib/client/locale";
import Link from "next/link";
import {FormEvent,useRef,useState} from "react";
import {Button, Input, Field, ErrorState} from "@/components/ui";
import {PasswordInput} from '@/components/password-input';
import {authRequest} from '@/lib/client/auth-request';
import {clearClientSession} from "@/lib/client/backend";
import {safeAppPath} from "@/lib/navigation";

type Stage="credentials"|"verify";

export default function Login(){
  const pending=useRef(false);
  const [rememberMe,setRememberMe]=useState(false);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");
  const [stage,setStage]=useState<Stage>("credentials");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const nextPath=()=>safeAppPath(new URLSearchParams(window.location.search).get("next"));

  const finish=(payload:Record<string,unknown>)=>{
    clearClientSession();
    const explicitNext=new URLSearchParams(window.location.search).get("next");
    const next=explicitNext?nextPath():safeAppPath(payload.next,nextPath());
    window.location.replace(next);
  };

  const loginRequest=async(extra:Record<string,string>={})=>{
    const response=await authRequest("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,rememberMe,...extra})});
    const payload=await response.json().catch(()=>({}));
    if(response.status===202){
      setCode("");
      if(payload.requiresEmailVerification)setStage("verify");
      else throw new Error("Die Anmeldung konnte nicht eindeutig bestätigt werden.");
      return;
    }
    if(!response.ok){
      throw new Error(typeof payload?.message==="string"?payload.message:"Anmeldung nicht möglich.");
    }
    finish(payload);
  };

  const submitCredentials=async(event:FormEvent)=>{
    event.preventDefault();if(pending.current)return;pending.current=true;setLoading(true);setError("");
    try{await loginRequest();}catch(error){setError(error instanceof Error?error.message:"Anmeldung nicht möglich.");}
    finally{pending.current=false;setLoading(false);}
  };

  const submitCode=async(event:FormEvent)=>{
    event.preventDefault();if(pending.current)return;pending.current=true;setLoading(true);setError("");
    try{
      if(stage==="verify"){
        const response=await fetch("/api/auth/verify-email",{method:"POST",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code,rememberMe})});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(typeof payload?.message==="string"?payload.message:"Code konnte nicht bestätigt werden.");
        finish(payload);return;
      }
      throw new Error("Anmeldung nicht möglich.");
    }catch(error){setError(error instanceof Error?error.message:"Code konnte nicht bestätigt werden.");}
    finally{pending.current=false;setLoading(false);}
  };

  const resend=async()=>{
    if(pending.current)return;pending.current=true;setLoading(true);setError("");
    try{
      if(stage==="verify"){const response=await fetch("/api/auth/resend-verification",{method:"POST",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});if(!response.ok)throw new Error("Code konnte nicht erneut gesendet werden.");}

    }catch(error){setError(error instanceof Error?error.message:"Code konnte nicht erneut gesendet werden.");}
    finally{pending.current=false;setLoading(false);}
  };

  if(stage!=="credentials")return <AuthWorkspace><section className="auth-card">
    <h1><LocalizedText>{"E-Mail bestätigen"}</LocalizedText></h1>
    <p><LocalizedText>{`Wir haben einen 6-stelligen Code an ${email} gesendet.`}</LocalizedText></p>
    <form onSubmit={submitCode}>
      <Field label={"6-stelliger Code"}><Input required autoFocus value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode={"numeric"} autoComplete="one-time-code" placeholder={"000000"}/></Field>
      {error&&<ErrorState className="auth-error"><LocalizedText>{error}</LocalizedText></ErrorState>}
      <Button type="submit" disabled={loading||!code.trim()}><LocalizedText>{loading?"Wird geprüft…":"Anmeldung abschliessen"}</LocalizedText></Button>
    </form>
    <button type="button" className="auth-inline-action" disabled={loading} onClick={()=>void resend()}><LocalizedText>{"Code erneut senden"}</LocalizedText></button>
    <button type="button" className="auth-inline-action" onClick={()=>{setStage("credentials");setCode("");setError("");}}><LocalizedText>{"Zurück"}</LocalizedText></button>
  </section></AuthWorkspace>;

  return <AuthWorkspace><section className="auth-card">
    <h1><LocalizedText>{"Willkommen zurück"}</LocalizedText>.</h1><p><LocalizedText>{"Melde dich sicher in deinem Binso One Konto an."}</LocalizedText></p>
    <form onSubmit={submitCredentials}>
      <Field label="E-Mail"><Input name="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="username" placeholder="name@firma.ch"/></Field>
      <Field label="Passwort"><PasswordInput name="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••"/></Field>
      <div className="auth-options"><label><Input type="checkbox" checked={rememberMe} onChange={event=>setRememberMe(event.target.checked)}/><LocalizedText>{"Angemeldet bleiben"}</LocalizedText></label><div className="form-link"><Link href="/passwort-vergessen"><LocalizedText>{"Passwort vergessen?"}</LocalizedText></Link></div></div>
      {error&&<ErrorState className="auth-error"><LocalizedText>{error}</LocalizedText></ErrorState>}
      <Button type="submit" disabled={loading}><LocalizedText>{loading?"Anmeldung läuft…":"Anmelden"}</LocalizedText></Button>
    </form>
    <p className="auth-bottom"><LocalizedText>{"Noch kein Konto? "}</LocalizedText><Link href="/registrieren"><LocalizedText>{"Konto erstellen"}</LocalizedText></Link></p>
  </section></AuthWorkspace>;
}
