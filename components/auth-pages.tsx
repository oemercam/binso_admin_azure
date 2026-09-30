"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {legalConfig} from "@/lib/legal";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {ArrowRight,Check,Eye,EyeOff} from "lucide-react";
import {createAccount,createDemoAccount,login,plans,type BillingCycle,type PlanId} from "@/lib/saas-store";
import {notify} from "@/lib/notify";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {LanguageSwitcher,useLocale} from "@/components/locale-provider";
import BrandLogo from "@/components/ui/brand-logo";

function AuthFrame({title,text,children,variant="default"}:{title:string;text:string;children:React.ReactNode;variant?:"default"|"login"|"register"|"demo"}){
 const {t}=useLocale();
 return <div className={`auth-shell auth-shell-${variant}`}>
  <Link href="/" className="auth-logo auth-logo-image" aria-label="Binso One"><BrandLogo/></Link>
  <div className="auth-language"><LanguageSwitcher compact/></div>
  <div className="auth-card"><div className="auth-intro"><h1>{t(title)}</h1><p>{t(text)}</p></div>{children}</div>
  <p className="auth-foot">{t(isProductionMode()?"Sichere Anmeldung · Binso One":"Lokale Entwicklungsumgebung · keine echten Zahlungen")}</p>
 </div>
}

function safeNext(value:string|null){return value&&value.startsWith("/")&&!value.startsWith("//")&&!value.startsWith("/operator")?value:null}

export function LoginPage(){
 const router=useRouter();
 const params=useSearchParams();
 const {t}=useLocale();
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [mfaCode,setMfaCode]=useState("");
 const [mfaRequired,setMfaRequired]=useState(false);
 const [show,setShow]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  setError("");
  if(!email.trim()||!password){
   const message=t("Bitte prüfen Sie die markierten Pflichtfelder.");
   setError(message);notify(message,"danger");return;
  }
  setBusy(true);
  try{
   if(isProductionMode()){
    const result=await apiFetch<{onboardingComplete?:boolean;mfaRequired?:boolean}>("/api/auth/login",{method:"POST",body:JSON.stringify({email,password,mfaCode:mfaRequired?mfaCode:undefined})});
    if(result.mfaRequired){setMfaRequired(true);setBusy(false);return}
    router.push(result.onboardingComplete?(safeNext(params.get("next"))||"/dashboard"):"/onboarding");
   }else{
    const {org}=login(email,password);
    router.push(org.onboardingComplete?"/dashboard":"/onboarding");
   }
  }catch(e){setError(e instanceof Error?e.message:t("Anmeldung fehlgeschlagen."));setBusy(false)}
 }

 return <AuthFrame variant="login" title="Willkommen zurück" text="Melde dich bei deiner Firma an.">
  <form onSubmit={submit} className="auth-form" aria-busy={busy}>
   <label><span>{t("E-Mail")} *</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label><span>{t("Passwort")} *</span><div className="password-input"><input type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?t("Passwort ausblenden"):t("Passwort anzeigen")}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
   {mfaRequired&&<label><span>{t("MFA-Code")} *</span><input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={e=>setMfaCode(e.target.value)} placeholder={t("6-stelliger Code oder Recovery-Code")} required/></label>}
   {error&&<div className="auth-error" role="alert">{error}</div>}
   <button className="marketing-primary auth-submit" disabled={busy}>{busy?t("Bitte warten …"):mfaRequired?t("MFA bestätigen"):t("Anmelden")} <ArrowRight size={16}/></button>
   <div className="auth-links"><Link href="/passwort-vergessen">{t("Passwort vergessen?")}</Link><span>{t("Noch kein Konto?")}</span><Link href="/portal/registrieren">{t("Registrieren")}</Link></div>
  </form>
  {!isProductionMode()&&<div className="demo-login-note"><strong>{t("Lokale Demo")}</strong><span>{t("Demo über die Landingpage öffnen oder mit demo@binso.local / demo1234 anmelden.")}</span></div>}
 </AuthFrame>
}

export function RegisterPage(){
 const router=useRouter();
 const params=useSearchParams();
 const {t,formatCurrency,locale}=useLocale();
 const trial=params.get("trial")==="1";
 const initial=trial?"business":((params.get("plan") as PlanId)||"business");
 const [plan,setPlan]=useState<PlanId>(["start","business","pro"].includes(initial)?initial:"business");
 const [billing,setBilling]=useState<BillingCycle>("monthly");
 const [v,setV]=useState({name:"",company:"",email:"",password:""});
 const [accepted,setAccepted]=useState(false);
 const [registerStep,setRegisterStep]=useState(1);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const selected=useMemo(()=>plans.find(p=>p.id===plan)!,[plan]);
 const minPassword=isProductionMode()?12:8;

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  setError("");
  if(!v.name.trim()||!v.company.trim()||!v.email.trim()||v.password.length<minPassword||!accepted){
   const message=t("Bitte prüfen Sie die markierten Pflichtfelder.");setError(message);notify(message,"danger");return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)){
   const message=t("Ungültige E-Mail-Adresse.");setError(message);notify(message,"danger");return;
  }
  setBusy(true);
  try{
   if(isProductionMode()){
    const result=await apiFetch<{requiresEmailVerification?:boolean;emailSent?:boolean}>("/api/auth/register",{method:"POST",body:JSON.stringify({...v,plan,billingCycle:billing,trial,locale,acceptedTerms:true,termsVersion:legalConfig.termsVersion,privacyVersion:legalConfig.privacyVersion})});
    if(result.requiresEmailVerification){notify(result.emailSent?t("Testorganisation erstellt. Bestätigungs-E-Mail wurde versendet."):t("Testorganisation erstellt. E-Mail-Bestätigung kann später nachgeholt werden."),"info")}
   }else createAccount({...v,plan,billingCycle:billing,trial});
   router.replace(trial?"/onboarding":`/checkout?plan=${plan}&billing=${billing}`);
  }catch(e){setError(e instanceof Error?e.message:t("Registrierung fehlgeschlagen."));setBusy(false)}
 }

 return <AuthFrame variant="register" title={trial?"14 Tage kostenlos testen":"Konto erstellen"} text={trial?"Erstelle deine eigene Testorganisation. 14 Tage Business, ohne Kreditkarte.":"Plan wählen, Firma anlegen und direkt mit dem Onboarding starten."}>
  <form onSubmit={submit} className="auth-form register-flow" aria-busy={busy}>
   <div className="auth-step-progress" aria-label={`${t("Schritt")} ${registerStep} ${t("von")} 2`}><span className="active"/><span className={registerStep>=2?"active":""}/></div>
   <div className="auth-step-meta">{t("Schritt")} {registerStep}/2</div>
   {registerStep===1&&<>
    {trial?
     <div className="trial-summary-card"><div><strong>{t("Business")}</strong><span>{t("Alle Business-Funktionen für deine eigene Firma")}</span></div><em>{t("14 Tage kostenlos")}</em><small>{t("Keine Kreditkarte nötig. Nach 14 Tagen entscheidest du, ob du weitermachen möchtest.")}</small></div>
     :<>
      <div className="plan-picker">{plans.map(p=><button type="button" key={p.id} className={plan===p.id?"selected":""} onClick={()=>setPlan(p.id)} disabled={busy}><strong>{p.name}</strong><span>{formatCurrency(p.monthly)} / {t("Monat")}</span></button>)}</div>
      <div className="billing-toggle"><button type="button" className={billing==="monthly"?"active":""} onClick={()=>setBilling("monthly")} disabled={busy}>{t("Monatlich")}</button><button type="button" className={billing==="yearly"?"active":""} onClick={()=>setBilling("yearly")} disabled={busy}>{t("Jährlich · 2 Monate gratis")}</button></div>
      <div className="selected-plan-summary"><div><strong>{selected.name}</strong><span>{billing==="monthly"?`${formatCurrency(selected.monthly)} / ${t("Monat")}`:`${formatCurrency(selected.yearly)} / ${t("Jahr")}`}</span></div></div>
     </>}
    <button type="button" className="marketing-primary auth-submit" onClick={()=>setRegisterStep(2)}>{t("Weiter")} <ArrowRight size={16}/></button>
   </>}
   {registerStep===2&&<>
    <label><span>{t("Name")} *</span><input autoFocus autoComplete="name" value={v.name} onChange={e=>setV(x=>({...x,name:e.target.value}))} required/></label>
    <label><span>{t("Firma")} *</span><input autoComplete="organization" value={v.company} onChange={e=>setV(x=>({...x,company:e.target.value}))} required/></label>
    <label><span>{t("Geschäftliche E-Mail")} *</span><input type="email" autoComplete="email" value={v.email} onChange={e=>setV(x=>({...x,email:e.target.value}))} required/></label>
    <label><span>{t("Passwort")} *</span><input type="password" minLength={minPassword} autoComplete="new-password" value={v.password} onChange={e=>setV(x=>({...x,password:e.target.value}))} required/></label>
    <small className="field-help">{t(isProductionMode()?"Mindestens 12 Zeichen.":"Mindestens 8 Zeichen.")}</small>
    <label className="auth-legal-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required/><span>{t("Ich akzeptiere die")} <Link href="/agb" target="_blank">{t("AGB")}</Link> {t("und habe die")} <Link href="/datenschutz" target="_blank">{t("Datenschutzerklärung")}</Link> {t("gelesen.")}</span></label>
    {error&&<div className="auth-error" role="alert">{error}</div>}
    <div className="register-actions"><button type="button" className="marketing-secondary" onClick={()=>setRegisterStep(1)} disabled={busy}>{t("Zurück")}</button><button className="marketing-primary" disabled={busy}>{busy?t("Bitte warten …"):trial?t("14-Tage-Test starten"):t("Weiter zur Zahlung")} <ArrowRight size={16}/></button></div>
    <small className="auth-terms">{t("Die Zustimmung wird im Produktivbetrieb mit der jeweiligen Dokumentversion protokolliert.")}</small>
   </>}
  </form>
 </AuthFrame>
}

export function DemoPage(){
 const router=useRouter();
 const params=useSearchParams();
 const {t}=useLocale();
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const open=useCallback(async()=>{
  if(loading)return;
  setLoading(true);setError("");
  try{
   if(isProductionMode())await apiFetch("/api/auth/demo",{method:"POST",body:"{}"});
   else createDemoAccount();
   router.replace("/dashboard");
  }catch(e){setError(e instanceof Error?e.message:t("Demo konnte nicht gestartet werden."));setLoading(false)}
 },[loading,router,t]);
 const autoStart=params.get("start")==="1";
 const autoStartedRef=useRef(false);
 useEffect(()=>{
  if(!autoStart||autoStartedRef.current)return;
  autoStartedRef.current=true;
  const timer=window.setTimeout(()=>{void open()},0);
  return()=>window.clearTimeout(timer);
 },[autoStart,open]);
 return <AuthFrame variant="demo" title="Binso One Demo" text="Öffne eine vorbereitete Testfirma mit Beispieldaten. Keine Registrierung und keine Kreditkarte.">
  <div className="demo-benefits">{["Direkter Zugang ohne Konto","Vorkonfigurierte Beispieldaten","Keine echte Zahlung oder E-Mail","Demo-Sitzung läuft nach 24 Stunden ab"].map(x=><span key={x}><Check size={16}/>{t(x)}</span>)}</div>
  {error&&<div className="auth-error" role="alert">{error}</div>}
  <button className="marketing-primary auth-submit" onClick={open} disabled={loading}>{loading?t("Demo wird geöffnet …"):t("Demo öffnen")} <ArrowRight size={16}/></button>
  <Link className="marketing-secondary auth-submit" href="/portal/registrieren?trial=1">{t("Eigene Firma 14 Tage testen")}</Link>
 </AuthFrame>
}
