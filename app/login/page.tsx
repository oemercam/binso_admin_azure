"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Logo } from "@/components/ui";
import { clearDemoClientSession } from "@/lib/client/backend";

export default function Login() {
  const router=useRouter();
  const [show,setShow]=useState(false);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password}),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof payload?.message==="string"?payload.message:"Anmeldung nicht möglich.");
      clearDemoClientSession();
      const next=new URLSearchParams(window.location.search).get("next");
      router.push(next&&next.startsWith("/")?next:"/dashboard");
      router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Anmeldung nicht möglich.");
      setLoading(false);
    }
  };

  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Willkommen zurück</h1>
      <p>Melde dich in deinem Binso One Konto an.</p>
      <form onSubmit={submit}>
        <label>E-Mail<input required value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
        <label>Passwort
          <div className="password-field">
            <input required value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} autoComplete="current-password" placeholder="••••••••"/>
            <button type="button" onClick={()=>setShow(!show)}>{show?"Ausblenden":"Anzeigen"}</button>
          </div>
        </label>
        <div className="form-link"><Link href="/passwort-vergessen">Passwort vergessen?</Link></div>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        <Button type="submit">{loading?"Anmeldung läuft…":"Anmelden"}</Button>
      </form>
      <div className="auth-divider"><span>oder</span></div>
      <Button href="/demo" variant="secondary">Demo starten</Button>
      <p className="auth-bottom">Noch kein Konto? <Link href="/registrieren">Account erstellen</Link></p>
    </section>
  </main>;
}
