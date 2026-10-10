"use client";

import Link from "next/link";
import {FormEvent,useState} from "react";
import {Button, Icon, Logo, Input, Field, ErrorState} from "@/components/ui";
import {clearDemoClientSession} from "@/lib/client/backend";

type Stage="credentials"|"email"|"totp"|"verify";

export default function Login(){
  const [show,setShow]=useState(false);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");
  const [stage,setStage]=useState<Stage>("credentials");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const nextPath=()=>{const next=new URLSearchParams(window.location.search).get("next");return next&&next.startsWith("/")&&!next.startsWith("//")?next:"/dashboard"};

  const finish=(payload:Record<string,unknown>)=>{
    clearDemoClientSession();
    const explicitNext=new URLSearchParams(window.location.search).get("next");
    const next=explicitNext?nextPath():typeof payload.next==="string"&&payload.next.startsWith("/")&&!payload.next.startsWith("//")?payload.next:nextPath();
    window.location.replace(payload.mfaSetupRequired===true&&!next.startsWith("/einstellungen/sicherheit?setup=1")?`/einstellungen/sicherheit?setup=1&next=${encodeURIComponent(next)}`:next);
  };

  const loginRequest=async(extra:Record<string,string>={})=>{
    const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,...extra})});
    const payload=await response.json().catch(()=>({}));
    if(response.status===202){
      setCode("");
      if(payload.requiresEmailVerification)setStage("verify");
      else setStage(payload.mfaMethod==="totp"?"totp":"email");
      return;
    }
    if(!response.ok){
      throw new Error(typeof payload?.message==="string"?payload.message:"Anmeldung nicht möglich.");
    }
    finish(payload);
  };

  const submitCredentials=async(event:FormEvent)=>{
    event.preventDefault();setLoading(true);setError("");
    try{await loginRequest();}catch(error){setError(error instanceof Error?error.message:"Anmeldung nicht möglich.");}
    finally{setLoading(false);}
  };

  const submitCode=async(event:FormEvent)=>{
    event.preventDefault();setLoading(true);setError("");
    try{
      if(stage==="verify"){
        const response=await fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code})});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(typeof payload?.message==="string"?payload.message:"Code konnte nicht bestätigt werden.");
        finish(payload);return;
      }
      await loginRequest(stage==="totp"?{mfaCode:code}:{emailCode:code});
    }catch(error){setError(error instanceof Error?error.message:"Code konnte nicht bestätigt werden.");}
    finally{setLoading(false);}
  };

  const resend=async()=>{
    setLoading(true);setError("");
    try{
      if(stage==="verify")await fetch("/api/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      else if(stage==="email")await loginRequest();
    }catch(error){setError(error instanceof Error?error.message:"Code konnte nicht erneut gesendet werden.");}
    finally{setLoading(false);}
  };

  if(stage!=="credentials")return <main className="auth-page"><section className="auth-card">
    <Logo/><h1>{stage==="totp"?"Authenticator-Code":stage==="verify"?"E-Mail bestätigen":"Anmeldung bestätigen"}</h1>
    <p>{stage==="totp"?"Öffne deine Authenticator-App und gib den aktuellen Code oder einen Recovery Code ein.":`Wir haben einen 6-stelligen Code an ${email} gesendet.`}</p>
    <form onSubmit={submitCode}>
      <Field label={stage==="totp"?"Authenticator- oder Recovery-Code":"6-stelliger Code"}><Input required autoFocus value={code} onChange={e=>setCode(stage==="totp"?e.target.value:e.target.value.replace(/\D/g,"").slice(0,6))} inputMode={stage==="totp"?"text":"numeric"} autoComplete="one-time-code" placeholder={stage==="totp"?"000000 oder Recovery Code":"000000"}/></Field>
      {error&&<ErrorState className="auth-error">{error}</ErrorState>}
      <Button type="submit" disabled={loading||!code.trim()}>{loading?"Wird geprüft…":"Anmeldung abschliessen"}</Button>
    </form>
    {stage!=="totp"&&<button type="button" className="auth-inline-action" disabled={loading} onClick={()=>void resend()}>Code erneut senden</button>}
    <button type="button" className="auth-inline-action" onClick={()=>{setStage("credentials");setCode("");setError("");}}>Zurück</button>
  </section></main>;

  return <main className="auth-page"><section className="auth-card">
    <Logo/><h1>Willkommen zurück</h1><p>Melde dich sicher in deinem Binso One Konto an.</p>
    <form onSubmit={submitCredentials}>
      <Field label="E-Mail"><Input required value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></Field>
      <Field label="Passwort"><div className="password-field"><Input required value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} autoComplete="current-password" placeholder="••••••••"/><button className="password-visibility" type="button" onClick={()=>setShow(!show)} aria-label={show?"Passwort ausblenden":"Passwort anzeigen"} aria-pressed={show}><Icon name={show?"eye-off":"eye"} size={18}/></button></div></Field>
      <div className="form-link"><Link href="/passwort-vergessen">Passwort vergessen?</Link></div>
      {error&&<ErrorState className="auth-error">{error}</ErrorState>}
      <Button type="submit" disabled={loading}>{loading?"Anmeldung läuft…":"Weiter"}</Button>
    </form>
    <div className="auth-divider"><span>oder</span></div><Button href="/demo" variant="secondary">Demo starten</Button>
    <p className="auth-bottom">Noch kein Konto? <Link href="/registrieren">Konto erstellen</Link></p>
  </section></main>;
}
