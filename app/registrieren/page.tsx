"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Logo } from "@/components/ui";
import { clearDemoClientSession } from "@/lib/client/backend";
import { billingCycles, domainConfig, planIds, type BillingCycle, type PlanId } from "@/config/domain";
import { plans } from "@/lib/plans";

export default function Register() {
  const router=useRouter();
  const searchParams=useSearchParams();
  const selectedPlan=useMemo<PlanId>(()=>{
    const value=searchParams.get("plan");
    return planIds.includes(value as PlanId)?value as PlanId:"start";
  },[searchParams]);
  const billingCycle=useMemo<BillingCycle>(()=>{
    const value=searchParams.get("billing");
    return billingCycles.includes(value as BillingCycle)?value as BillingCycle:"monthly";
  },[searchParams]);
  const plan=plans.find(item=>item.id===selectedPlan)??plans[0];
  const subscriptionHref=`/einstellungen/abonnement?plan=${selectedPlan}&billing=${billingCycle}&activate=1`;

  const [companyName,setCompanyName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [confirmation,setConfirmation]=useState(false);
  const [acceptedTerms,setAcceptedTerms]=useState(false);
  const [resendStatus,setResendStatus]=useState("");

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:companyName,company:companyName,email,password,plan:selectedPlan,billingCycle,acceptedTerms,termsVersion:"registration-v1",privacyVersion:"registration-v1",locale:"de",trial:true}),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof payload?.message==="string"?payload.message:"Registrierung nicht möglich.");
      clearDemoClientSession();
      if(payload.requiresEmailVerification&&payload.emailSent){
        setConfirmation(true);
        setLoading(false);
        return;
      }
      router.push(subscriptionHref);
      router.refresh();
    }catch(error){
      setError(error instanceof Error?error.message:"Registrierung nicht möglich.");
      setLoading(false);
    }
  };

  const resendVerification=async()=>{
    setResendStatus("Wird gesendet…");
    try{
      const response=await fetch("/api/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"}});
      if(!response.ok)throw new Error();
      setResendStatus("Bestätigungs-E-Mail wurde erneut gesendet.");
    }catch{setResendStatus("E-Mail konnte nicht erneut gesendet werden.");}
  };

  if(confirmation) return <main className="auth-page"><section className="auth-card">
    <Logo/>
    <h1>E-Mail bestätigen</h1>
    <p>Wir haben dir einen Bestätigungslink an <b>{email}</b> gesendet. Dein {plan.name}-Testkonto läuft {domainConfig.trialDays} Tage und kann bereits geöffnet werden.</p>
    <div className="auth-plan-summary"><b>{plan.name}</b><span>{billingCycle==="yearly"?`CHF ${plan.yearly} / Jahr`:`CHF ${plan.monthly} / Monat`} nach Aktivierung</span><small>Keine Kreditkarte für die Testphase. Ohne Abo danach Nur-Lesen.</small></div>
    <Button href={subscriptionHref}>Testkonto öffnen</Button>
    <button type="button" className="auth-inline-action" onClick={()=>void resendVerification()}>Bestätigungs-E-Mail erneut senden</button>
    {resendStatus&&<p className="auth-status" role="status">{resendStatus}</p>}
  </section></main>;

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-topbar"><Logo/><Link className="auth-cancel" href="/preise">Abbrechen</Link></div>
      <h1>Konto erstellen</h1>
      <p>{domainConfig.trialDays} Tage kostenlos testen. Keine Kreditkarte erforderlich.</p><div className="auth-plan-summary"><b>{plan.name}</b><span>{billingCycle==="yearly"?`CHF ${plan.yearly} / Jahr`:`CHF ${plan.monthly} / Monat`} nach Aktivierung</span><small>Ohne Abo nach der Testphase: Nur-Lesen, Daten bleiben erhalten.</small></div>
      <form onSubmit={submit}>
        <label>Firmenname<input required minLength={2} maxLength={120} autoFocus value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Meine Firma GmbH"/></label>
        <label>E-Mail<input required value={email} onChange={e=>setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
        <label>Passwort
          <div className="password-field">
            <input required minLength={12} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} autoComplete="new-password" placeholder="Mindestens 12 Zeichen"/>
            <button type="button" className="password-visibility" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Passwort ausblenden":"Passwort anzeigen"} aria-pressed={showPassword}>{showPassword?<EyeOff aria-hidden="true"/>:<Eye aria-hidden="true"/>}</button>
          </div>
          <small className="password-hint">Mindestens 12 Zeichen.</small>
        </label>
        <label><input type="checkbox" required checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)}/>Ich akzeptiere die AGB und habe die Datenschutzerklärung zur Kenntnis genommen.</label>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        <Button type="submit" disabled={loading||!acceptedTerms}>{loading?"Account wird erstellt…":"Account erstellen"}</Button>
      </form>
      <div className="auth-after-submit">
        <p className="auth-legal">Mit der Registrierung akzeptierst du die <Link href="/agb">AGB</Link> und bestätigst, die <Link href="/datenschutz">Datenschutzerklärung</Link> zur Kenntnis genommen zu haben.</p>
        <p className="auth-bottom">Bereits registriert? <Link href="/login">Anmelden</Link></p>
      </div>
    </section>
  </main>;
}
