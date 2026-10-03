"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {FormEvent,useState} from "react";
import {Eye,EyeOff} from "lucide-react";
import {Button,Logo} from "@/components/ui";
import {clearDemoClientSession} from "@/lib/client/backend";
import {useI18n} from "@/lib/i18n/provider";
export default function Register(){
 const router=useRouter();const {locale}=useI18n();
 const [name,setName]=useState(""),[company,setCompany]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [show,setShow]=useState(false),[accepted,setAccepted]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(""),[confirmation,setConfirmation]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);setError("");
  try{const response=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,company,email,password,plan:"business",billingCycle:"monthly",trial:true,locale,acceptedTerms:accepted,termsVersion:"2026-10-03",privacyVersion:"2026-10-03"})});
   const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(typeof payload?.message==="string"?payload.message:"Registrierung nicht möglich.");
   clearDemoClientSession();if(payload.requiresEmailVerification){setConfirmation(true);setLoading(false);return;}router.push("/willkommen");router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Registrierung nicht möglich.");setLoading(false);}
 };
 if(confirmation)return <main className="auth-page"><section className="auth-card"><Logo/><h1>E-Mail bestätigen</h1><p>Wir haben dir einen Bestätigungslink gesendet. Öffne den Link, um deine E-Mail-Adresse zu bestätigen.</p><Button href="/login">Zur Anmeldung</Button></section></main>;
 return <main className="auth-page"><section className="auth-card"><div className="auth-topbar"><Logo/><Link className="auth-cancel" href="/">Abbrechen</Link></div><h1>Konto erstellen</h1><p>30 Tage kostenlos testen. Keine Kreditkarte für die Testphase.</p>
 <form onSubmit={submit}>
 <label>Name<input required autoFocus value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Vorname Nachname"/></label>
 <label>Firmenname<input required value={company} onChange={e=>setCompany(e.target.value)} autoComplete="organization" placeholder="Meine Firma GmbH"/></label>
 <label>E-Mail<input required value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
 <label>Passwort<div className="password-field"><input required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} autoComplete="new-password" placeholder="Mindestens 12 Zeichen"/><button type="button" className="password-visibility" onClick={()=>setShow(!show)} aria-label={show?"Passwort ausblenden":"Passwort anzeigen"} aria-pressed={show}>{show?<EyeOff aria-hidden="true"/>:<Eye aria-hidden="true"/>}</button></div><small className="password-hint">Mindestens 12 Zeichen.</small></label>
 <label className="legal-consent"><input required type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span></label>
 {error&&<p className="auth-error" role="alert">{error}</p>}<Button type="submit">{loading?"Account wird erstellt…":"30 Tage kostenlos testen"}</Button></form>
 <div className="auth-after-submit"><p className="auth-bottom">Bereits registriert? <Link href="/login">Anmelden</Link></p></div></section></main>;
}