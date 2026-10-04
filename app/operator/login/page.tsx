"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Logo } from "@/components/ui";

export default function OperatorLogin(){
  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const startDemo=async()=>{
    if(loading)return;
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/operator/demo-session",{method:"POST",headers:{"Content-Type":"application/json"}});
      if(!response.ok)throw new Error();
      window.localStorage.setItem("binso.demo.session","1");
      router.push("/operator");
      router.refresh();
    }catch{
      setError("One Admin Demo konnte nicht gestartet werden.");
      setLoading(false);
    }
  };

  return <main className="auth-page">
    <section className="auth-card operator-login-card">
      <Link href="/"><Logo/></Link>
      <span className="eyebrow">ONE ADMIN</span>
      <h1>Admin Portal</h1>
      <p>Interne Betriebs- und Verwaltungsoberfläche von Binso One.</p>
      <Button onClick={()=>void startDemo()} disabled={loading}>{loading?"Demo wird geöffnet…":"Admin Demo öffnen"}</Button>
      {error&&<p className="auth-error">{error}</p>}
      <div className="auth-divider"><span>Operator-Zugang</span></div>
      <p className="operator-login-note">Der produktive Operator-Zugang bleibt geschützt. Die Demo verwendet ausschliesslich Beispieldaten und hat keinen Zugriff auf produktive Admin-APIs.</p>
      <p className="auth-bottom"><Link href="/">Zurück zu Binso One</Link></p>
    </section>
  </main>;
}