"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {useState} from "react";
import {Button,Logo} from "@/components/ui";

export default function OperatorLogin(){
  const search=useSearchParams();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const denied=search.get("error")==="entra_access_denied";

  const startMicrosoft=()=>{
    const next=search.get("next");
    const target=next?.startsWith("/operator")?next:"/operator";
    const path=`/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/api/operator/sso/callback?next=${encodeURIComponent(target)}`)}`;
    window.location.assign(new URL(path,window.location.origin).toString());
  };

  const startDemo=async()=>{
    if(loading)return;
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/operator/demo-session",{method:"POST",headers:{"Content-Type":"application/json"}});
      if(!response.ok)throw new Error();
      window.location.replace("/operator");
    }catch{
      setError("One Admin Demo konnte nicht gestartet werden.");setLoading(false);
    }
  };

  return <main className="auth-page"><section className="auth-card operator-login-card">
    <Link href="/"><Logo/></Link>
    <span className="eyebrow">ONE ADMIN</span>
    <h1>Admin Portal</h1>
    <p>Interner Zugang für Binso-Mitarbeitende über Microsoft Entra ID.</p>
    <Button onClick={startMicrosoft}>Mit Microsoft anmelden</Button>
    <p className="operator-login-note">Microsoft verwaltet Anmeldung, Microsoft Authenticator/MFA und Kontosicherheit. Zugriff erhalten nur im Binso-Entra-Tenant autorisierte Personen mit einer zugewiesenen Binso-One-App-Rolle.</p>
    {(denied||error)&&<p className="auth-error" role="alert">{error||"Microsoft-Anmeldung erfolgreich, aber deinem Konto ist keine gültige Binso-One-Adminrolle zugewiesen."}</p>}
    <div className="auth-divider"><span>Demo</span></div>
    <Button onClick={()=>void startDemo()} disabled={loading} variant="secondary">{loading?"Demo wird geöffnet…":"Admin Demo öffnen"}</Button>
    <p className="auth-bottom"><Link href="/">Zurück zu Binso One</Link></p>
  </section></main>;
}