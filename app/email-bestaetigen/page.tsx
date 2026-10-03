"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button,Logo} from "@/components/ui";
export default function VerifyEmail(){
 const [state,setState]=useState<"loading"|"ok"|"error">("loading");
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get("token")||"";if(!token){setState("error");return;}fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then(r=>{setState(r.ok?"ok":"error")}).catch(()=>setState("error"));},[]);
 return <main className="auth-page"><section className="auth-card"><Logo/>{state==="loading"?<><h1>E-Mail wird bestätigt…</h1><p>Einen Moment bitte.</p></>:state==="ok"?<><h1>E-Mail bestätigt</h1><p>Deine E-Mail-Adresse wurde erfolgreich bestätigt.</p><Button href="/dashboard">Binso One öffnen</Button></>:<><h1>Link ungültig oder abgelaufen</h1><p>Der Bestätigungslink konnte nicht verwendet werden.</p><Link href="/login">Zur Anmeldung</Link></>}</section></main>;
}