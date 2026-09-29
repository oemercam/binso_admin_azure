"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft,ArrowRight,Building2,Check,Settings2,Users,X} from "lucide-react";
import {getOrganization,getSession,updateOrganization} from "@/lib/saas-store";
import {loadSettings,saveSettings} from "@/lib/local-store";
import {confirmAction} from "@/lib/confirm";
import {notify} from "@/lib/notify";
import {useUnsavedChanges} from "@/lib/use-unsaved-changes";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {LanguageSwitcher,useLocale} from "@/components/locale-provider";
import BrandLogo from "@/components/ui/brand-logo";

export default function OnboardingPage(){
 const router=useRouter();
 const {t}=useLocale();
 const [step,setStep]=useState(1);
 const [ready,setReady]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useUnsavedChanges(dirty);
 const [v,setV]=useState({company:"",uid:"",address:"",zipCity:"",phone:"",industry:"Dienstleistungen",employees:"1–5"});

 useEffect(()=>{
  const timer=window.setTimeout(async()=>{
   try{
    if(isProductionMode()){
     const data=await apiFetch<{organization:{name:string;uid?:string;address?:string;zipCity?:string;phone?:string;industry?:string;employees?:string}}>("/api/organization");
     const o=data.organization;
     setV(x=>({...x,company:o.name,uid:o.uid||"",address:o.address||"",zipCity:o.zipCity||"",phone:o.phone||"",industry:o.industry||"Dienstleistungen",employees:o.employees||"1–5"}));
     setReady(true);
     return;
    }
    const session=getSession();
    if(!session){router.replace("/portal/login");return}
    const o=getOrganization(session.orgId);
    if(!o)return;
    setV(x=>({...x,company:o.name,uid:o.uid||"",address:o.address||"",zipCity:o.zipCity||"",phone:o.phone||"",industry:o.industry||"Dienstleistungen",employees:o.employees||"1–5"}));
    setReady(true);
   }catch{router.replace("/portal/login")}
  },0);
  return()=>window.clearTimeout(timer);
 },[router]);

 function next(){
  setError("");
  if(step===1&&!v.company.trim()){
   const message=t("Firmenname ist erforderlich.");
   setError(message);notify(message,"danger");return;
  }
  setStep(s=>Math.min(3,s+1));
  window.scrollTo({top:0,behavior:"smooth"});
 }

 function back(){
  if(busy)return;
  setError("");
  setStep(s=>Math.max(1,s-1));
  window.scrollTo({top:0,behavior:"smooth"});
 }

 async function cancel(){
  if(busy)return;
  const ok=await confirmAction({
   title:t("Onboarding wirklich abbrechen?"),
   message:t("Nicht gespeicherte Änderungen gehen verloren. Du kannst die Einrichtung später fortsetzen."),
   confirmLabel:t("Onboarding abbrechen"),
   cancelLabel:t("Fortfahren"),
   tone:"danger"
  });
  if(ok){setDirty(false);router.push("/")}
 }

 async function finish(){
  if(busy)return;
  setError("");
  if(!v.company.trim()){
   const message=t("Firmenname ist erforderlich.");
   setError(message);notify(message,"danger");setStep(1);return;
  }
  setBusy(true);
  try{
   if(isProductionMode()){
    await apiFetch("/api/organization",{method:"PATCH",body:JSON.stringify({name:v.company,uid:v.uid,address:v.address,zipCity:v.zipCity,phone:v.phone,industry:v.industry,employees:v.employees,onboardingComplete:true})});
   }else{
    const session=getSession();if(!session)return;
    updateOrganization(session.orgId,{name:v.company,uid:v.uid,address:v.address,zipCity:v.zipCity,phone:v.phone,industry:v.industry,employees:v.employees,onboardingComplete:true});
   }
   const settings=loadSettings();
   saveSettings({...settings,companyName:v.company,uid:v.uid||settings.uid,address:v.address||settings.address,zipCity:v.zipCity||settings.zipCity,phone:v.phone||settings.phone});
   setDirty(false);
   notify(t("Einrichtung erfolgreich abgeschlossen."));
   router.push("/dashboard");
  }catch(e){
   const message=e instanceof Error?e.message:t("Einrichtung konnte nicht abgeschlossen werden.");
   setError(message);notify(message,"danger");setBusy(false);
  }
 }

 if(!ready)return <div className="auth-shell"><div className="auth-card">{t("Einrichtung wird geladen …")}</div></div>;

 return <div className="onboarding-shell">
  <div className="onboarding-top">
   <BrandLogo/>
   <div className="onboarding-top-actions">
    <button className="onboarding-cancel" onClick={cancel} disabled={busy}><X size={16}/><span>{t("Einrichtung abbrechen")}</span></button>
    <LanguageSwitcher compact/>
    <span className="onboarding-step-label">{t("Schritt")} {step}/3</span>
   </div>
  </div>

  <main className="onboarding-card" aria-busy={busy}>
   <div className="onboarding-progress" aria-label={`${t("Schritt")} ${step} ${t("von")} 3`}><span className={step>=1?"active":""}/><span className={step>=2?"active":""}/><span className={step>=3?"active":""}/></div>

   {step===1&&<>
    <div className="onboarding-icon"><Building2/></div>
    <h1>{t("Deine Firma")}</h1>
    <p>{t("Die wichtigsten Firmendaten für Dokumente und Rechnungen.")}</p>
    <div className="form-grid">
     <label><span>{t("Firmenname")} *</span><input autoFocus required value={v.company} onChange={e=>{setDirty(true);setV(x=>({...x,company:e.target.value}))}}/></label>
     <label><span>{t("UID / MWST")}</span><input value={v.uid} onChange={e=>{setDirty(true);setV(x=>({...x,uid:e.target.value}))}}/></label>
     <label><span>{t("Adresse")}</span><input value={v.address} onChange={e=>{setDirty(true);setV(x=>({...x,address:e.target.value}))}}/></label>
     <label><span>{t("PLZ / Ort")}</span><input value={v.zipCity} onChange={e=>{setDirty(true);setV(x=>({...x,zipCity:e.target.value}))}}/></label>
    </div>
    {error&&<div className="form-error-summary" role="alert">{error}</div>}
    <div className="onboarding-actions"><button className="marketing-primary onboarding-next" onClick={next}>{t("Weiter")} <ArrowRight size={16}/></button></div>
   </>}

   {step===2&&<>
    <div className="onboarding-icon"><Users/></div>
    <h1>{t("Unternehmen")}</h1>
    <p>{t("Ein paar Angaben für passende Grundeinstellungen.")}</p>
    <div className="form-grid">
     <label><span>{t("Branche")}</span><select value={v.industry} onChange={e=>{setDirty(true);setV(x=>({...x,industry:e.target.value}))}}>{["Dienstleistungen","IT","Beratung","Handwerk","Agentur","Bau","Immobilien","Andere"].map(x=><option key={x}>{t(x)}</option>)}</select></label>
     <label><span>{t("Mitarbeitende")}</span><select value={v.employees} onChange={e=>{setDirty(true);setV(x=>({...x,employees:e.target.value}))}}>{["1–5","6–15","16–50","51+"].map(x=><option key={x}>{x}</option>)}</select></label>
     <label><span>{t("Telefon")}</span><input value={v.phone} onChange={e=>{setDirty(true);setV(x=>({...x,phone:e.target.value}))}}/></label>
    </div>
    <div className="onboarding-actions"><button className="marketing-secondary onboarding-back" onClick={back}><ArrowLeft size={16}/>{t("Zurück")}</button><button className="marketing-primary onboarding-next" onClick={next}>{t("Weiter")} <ArrowRight size={16}/></button></div>
   </>}

   {step===3&&<>
    <div className="onboarding-icon"><Settings2/></div>
    <h1>{t("Bereit zum Start")}</h1>
    <p>{t("Die Grundeinrichtung ist abgeschlossen. Weitere Einstellungen kannst du später anpassen.")}</p>
    <div className="onboarding-checks">{["Kunden und Verkauf","Projekte, Zeit und Spesen","Finanzen und MWST","Personal und Organisation"].map(x=><span key={x}><Check size={17}/>{t(x)}</span>)}</div>
    {error&&<div className="form-error-summary" role="alert">{error}</div>}
    <div className="onboarding-actions"><button className="marketing-secondary onboarding-back" onClick={back} disabled={busy}><ArrowLeft size={16}/>{t("Zurück")}</button><button className="marketing-primary onboarding-next" onClick={finish} disabled={busy}>{busy?t("Bitte warten …"):t("Zum Dashboard")} <ArrowRight size={16}/></button></div>
   </>}
  </main>
 </div>;
}
