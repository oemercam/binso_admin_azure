"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Logo } from "@/components/ui";
import { clearDemoClientSession, startDemoClientSession } from "@/lib/client/backend";

export default function Register() {
  const router=useRouter();
  const [companyName,setCompanyName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [confirmation,setConfirmation]=useState(false);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({companyName,email,password}),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok){
        if(response.status===503&&payload?.error==="backend_not_configured"){
          await startDemoClientSession({
            name:email.split("@")[0]||"Demo",
            company:companyName,
            focus:"overview",
          });
          router.push("/willkommen");
          router.refresh();
          return;
        }
        throw new Error(typeof payload?.message==="string"?payload.message:"Registrierung nicht möglich.");
      }
      clearDemoClientSession();
      if(payload.requiresConfirmation){
        setConfirmation(true);
        setLoading(false);
        return;
      }
      router.push("/willkommen");
      router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Registrierung nicht möglich.");
      setLoading(false);
    }
  };

  if(confirmation) return <main className="auth-page"><section className="auth-card"><Logo/><h1>E-Mail bestätigen</h1><p>Wir haben dir einen Bestätigungslink gesendet. Öffne den Link und melde dich danach an.</p><Button href="/login">Zur Anmeldung</Button></section></main>;

  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Konto erstellen</h1>
      <p>Nur das Nötigste. Weitere Angaben kannst du später ergänzen.</p>
      <form onSubmit={submit}>
        <label>Firmenname<input required autoFocus value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Meine Firma GmbH"/></label>
        <label>E-Mail<input required value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
        <label>Passwort
          <div className="password-field">
            <input required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password" placeholder="Mindestens 8 Zeichen"/>
            <button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Ausblenden":"Anzeigen"}</button>
          </div>
          <small className="password-hint">Mindestens 8 Zeichen.</small>
        </label>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        <Button type="submit">{loading?"Account wird erstellt…":"Account erstellen"}</Button>
      </form>
      <small className="auth-legal">Mit der Registrierung bestätigst du, dass du die rechtlichen Hinweise gelesen hast.</small>
      <p className="auth-bottom">Bereits registriert? <Link href="/login">Anmelden</Link></p>
    </section>
  </main>;
}
