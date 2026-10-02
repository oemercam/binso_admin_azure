"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Logo } from "@/components/ui";

export default function Demo(){
  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const start=async()=>{
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/demo/session",{method:"POST",headers:{"Content-Type":"application/json"}});
      if(!response.ok) throw new Error("Demo konnte nicht gestartet werden.");
      router.push("/dashboard");
      router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Demo konnte nicht gestartet werden.");
      setLoading(false);
    }
  };
  return <main className="auth-page"><section className="auth-card demo-card"><Logo/><span className="demo-badge">DEMO</span><h1>Binso One ausprobieren</h1><p>Starte direkt mit realistischen Beispieldaten. Keine Registrierung notwendig.</p><div className="demo-company"><b>Musterwerk AG</b><span>Demo-Umgebung · Beispielinhalt</span></div>{error&&<p className="auth-error">{error}</p>}<Button onClick={start}>{loading?"Demo wird gestartet…":"Demo starten"}</Button><Link href="/">Zurück zur Website</Link></section></main>;
}