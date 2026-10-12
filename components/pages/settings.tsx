"use client";
import {companyLogoSource} from "@/lib/image-url";
import {useApiQuery} from "@/lib/client/use-api-query";
import {Avatar} from "../avatar";
import {usePageAccess} from "@/lib/client/page-access";
import {DocumentModal} from "../documents";
import {ActionRow,ActionSheet,FormSheet,ListRow,SelectionRows} from "../binso-ux";

import Link from "next/link";
import {Monitor} from "lucide-react";
import { saveTheme, type ThemeMode } from "@/lib/client/theme";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { plans as subscriptionPlans } from "@/lib/plans";
import { legalConfig } from "@/config/legal";
import {Button, EmptyState, Field, Icon, SectionTitle, Status, Toast, Toggle, Input, FormActions, Select, LoadingState, ErrorState} from "../ui";
import { moneyChf } from "./shared";

export function SettingsPage() {
  return <AppShell title="Einstellungen" active="einstellungen" backHref="/dashboard">
    <SettingsNavigation/>
  </AppShell>;
}

function SettingsNavigation(){
 const access=usePageAccess();
 const groups=[
  {title:"Unternehmen",rows:[["/einstellungen/firma","users","Firma"],["/einstellungen/team","users","Benutzer & Rollen"],["/einstellungen/abonnement","card","Abonnement"]]},
  {title:"Geschäftsprozesse",rows:[["/einstellungen/dokumente","receipt","Rechnungen & Dokumente"],["/einstellungen/zeiterfassung","clock","Zeiterfassung"]]},
  {title:"Weitere Einstellungen",rows:[["/einstellungen/datenschutz","lock","Datenschutz & Cookies"]]},
 ];
 return <>{groups.map(group=><section className="settings-section" key={group.title}><SectionTitle title={group.title}/><div className="settings-list">{group.rows.filter(([href])=>access.canOpen(href)).map(([href,icon,title])=><ActionRow href={href} key={href} icon={icon} title={title}/>)}</div></section>)}</>;
}

export function AccountSettingsPage() {
  const production=useBackendMode();
  const [profileName,setProfileName]=useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [jobTitle,setJobTitle]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const query=useApiQuery<{item?:Record<string,unknown>|null;email?:string|null}>(production?"/api/settings/profile":null);
  const loading=query.loading,loadError=query.error;
  const [saving,setSaving]=useState(false);
  const saveBusy=useRef(false);
  const [baseline,setBaseline]=useState("");
  const currentValues=JSON.stringify([firstName,lastName,phone,jobTitle]);
  const beginEdit=()=>{setBaseline(currentValues);setEditing(true)};
  const [avatarUrl,setAvatarUrl]=useState("");
  const uploadAvatar=async(file:File|undefined)=>{if(!file)return;try{const form=new FormData();form.append("file",file);form.append("purpose","profile_avatar");const result=await apiUpload<{item:{id:string;scanStatus:string}}>("/api/files",form);if(result.item.scanStatus!=="clean")throw new Error("Das Profilbild wartet auf die Sicherheitsprüfung. Das bisherige Bild bleibt erhalten.");setAvatarUrl("/api/files/"+result.item.id+"/download");window.dispatchEvent(new Event("binso-profile-changed"));setToast("Profilbild gespeichert.");}catch(e){setToast(e instanceof Error?e.message:"Profilbild konnte nicht gespeichert werden.")}};

  useEffect(()=>{
    if(editing||!query.data)return;
    const payload=query.data,item=payload.item??{};
    let active=true;
    queueMicrotask(()=>{if(!active)return;
      setProfileName(String(item.display_name??""));setFirstName(String(item.first_name??""));setLastName(String(item.last_name??""));
      setEmail(payload.email??"");setPhone(String(item.phone??""));setAvatarUrl(String(item.avatar_url??""));setJobTitle(String(item.job_title??""));
    });
    return()=>{active=false};
  },[editing,query.data]);

  const save=async(message="Persönliche Daten gespeichert.")=>{
    if(loading||loadError||saveBusy.current)return;saveBusy.current=true;setSaving(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      await apiPatch("/api/settings/profile",{firstName,lastName,phone,jobTitle});
      window.dispatchEvent(new Event("binso-profile-changed"));
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Persönliche Daten konnten nicht gespeichert werden.");
    }
    finally{saveBusy.current=false;setSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const displayName=[firstName,lastName].filter(Boolean).join(" ")||profileName||"Benutzer";
  return <AppShell title="Persönliche Daten" subtitle="Dein Konto und deine Profildaten." active="einstellungen" editing={editing} unsavedChanges={editing&&currentValues!==baseline} backHref="/einstellungen" backLabel="Einstellungen" mobileActions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" className="icon-button" ariaLabel="Bearbeiten" icon="edit" onClick={beginEdit}/>:undefined} actions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" icon="edit" onClick={beginEdit}>Bearbeiten</Button>:undefined}>
    {loading?<LoadingState>Einstellungen werden geladen …</LoadingState>:loadError?<ErrorState onRetry={query.refresh} retryLabel="Erneut versuchen">{loadError}</ErrorState>:<div className="settings-detail-grid">
      <section className="surface settings-profile">
        <Avatar name={displayName==="Benutzer"?"":displayName} identity={email} src={avatarUrl} size="large"/><div><h2>{displayName}</h2><p>{jobTitle||"Benutzer"}</p></div>{editing&&<><label className="button button-secondary" htmlFor="profile-avatar-upload">Bild ändern</label><Input id="profile-avatar-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadAvatar(e.target.files?.[0])}/></>}
      </section>
      {editing?<section className="settings-form">
        <div className="form-grid two">
          <Field label="Vorname"><Input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
          <Field label="Nachname"><Input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
          <Field label="E-Mail"><Input type="email" value={email} readOnly/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
          <Field label="Funktion"><Input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></Field>
        </div>
        <FormActions ><Button requiresWrite disabled={loading||!!loadError||saving} onClick={()=>void save()}>{saving?"Wird gespeichert…":"Speichern"}</Button></FormActions>
      </section>:<section className="settings-readonly"><dl className="detail-list"><div><dt>Name</dt><dd>{displayName}</dd></div><div><dt>E-Mail</dt><dd>{email||"—"}</dd></div><div><dt>Telefon</dt><dd>{phone||"—"}</dd></div><div><dt>Funktion</dt><dd>{jobTitle||"—"}</dd></div></dl></section>}
    </div>}
    {toast&&<Toast title={toast} tone={["Persönliche Daten gespeichert.","Firmendaten gespeichert.","Profilbild gespeichert.","Firmenlogo gespeichert."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}

export function CompanySettingsPage() {
  const production=useBackendMode();
  const router=useRouter(),search=useSearchParams();
  const onboarding=search.get("onboarding")==="1";
  const onboardingOpened=useRef(false);
  const [name,setName]=useState("");
  const [uid,setUid]=useState("");
  const [logoUrl,setLogoUrl]=useState("");
  const [street,setStreet]=useState("");
  const [postalCode,setPostalCode]=useState("");
  const [city,setCity]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const query=useApiQuery<{item:Record<string,unknown>}>(production?"/api/settings/company":null);
  const loading=query.loading,loadError=query.error;
  const [saving,setSaving]=useState(false);
  const saveBusy=useRef(false);
  const [baseline,setBaseline]=useState("");
  const currentValues=JSON.stringify([name,uid,street,postalCode,city,email,phone]);
  const beginEdit=()=>{setBaseline(currentValues);setEditing(true)};

  const [pendingLogo,setPendingLogo]=useState<File|null>(null);
  const [logoPreview,setLogoPreview]=useState("");
  useEffect(()=>()=>{if(logoPreview)URL.revokeObjectURL(logoPreview)},[logoPreview]);
  const uploadLogo=(file:File|undefined)=>{if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setToast("Bitte PNG, JPEG oder WebP auswählen.");return;}setPendingLogo(file);setLogoPreview(URL.createObjectURL(file))};

  useEffect(()=>{
    if(editing||!query.data)return;
    const item=query.data.item;let active=true;
    queueMicrotask(()=>{if(!active)return;
      setName(String(item.name??""));setUid(String(item.uid??""));setLogoUrl(String(item.logo_url??""));setStreet(String(item.street??""));
      setPostalCode(String(item.postal_code??""));setCity(String(item.city??""));setEmail(String(item.email??""));setPhone(String(item.phone??""));
      if(onboarding&&!onboardingOpened.current){onboardingOpened.current=true;setBaseline(JSON.stringify([String(item.name??""),String(item.uid??""),String(item.street??""),String(item.postal_code??""),String(item.city??""),String(item.email??""),String(item.phone??"")]));setEditing(true);}
    });
    return()=>{active=false};
  },[editing,query.data,onboarding]);

  const save=async(message="Firmendaten gespeichert.")=>{
    if(loading||loadError||saveBusy.current)return;saveBusy.current=true;setSaving(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(!name.trim()){throw new Error("Firmenname ist erforderlich.")}
      if(pendingLogo){const form=new FormData();form.append("file",pendingLogo);form.append("purpose","company_logo");const result=await apiUpload<{item:{id:string;scanStatus:string}}>("/api/files",form);if(result.item.scanStatus!=="clean")throw new Error("Das Firmenlogo wartet auf die Sicherheitsprüfung. Das bisherige Logo bleibt erhalten.");setLogoUrl("/api/files/"+result.item.id+"/download");setPendingLogo(null);setLogoPreview("");}
      await apiPatch("/api/settings/company",{name,uid,street,postalCode,city,email,phone,completeOnboarding:onboarding});
      if(onboarding){router.replace("/dashboard");return;}
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmendaten konnten nicht gespeichert werden.");
    }
    finally{saveBusy.current=false;setSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  return <AppShell title="Firma" subtitle="Unternehmensdaten für Dokumente und Kommunikation." active="einstellungen" editing={false} unsavedChanges={false} backHref="/einstellungen" backLabel="Einstellungen" mobileActions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" className="icon-button" ariaLabel="Bearbeiten" icon="edit" onClick={beginEdit}/>:undefined} actions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" icon="edit" onClick={beginEdit}>Bearbeiten</Button>:undefined}>
    {loading?<LoadingState>Einstellungen werden geladen …</LoadingState>:loadError?<ErrorState onRetry={query.refresh} retryLabel="Erneut versuchen">{loadError}</ErrorState>:<div className="settings-detail-grid">
      <section className="surface company-logo-card">{companyLogoSource(logoPreview||logoUrl)?<img src={companyLogoSource(logoPreview||logoUrl)} alt="Firmenlogo"/>:<span className="company-logo-placeholder" role="img" aria-label="Kein Firmenlogo"><Icon name="users"/></span>}<div><b>{name||"Firma"}</b><small>Firmenlogo für Angebote, Rechnungen und Dokumente</small></div></section>
      {editing?<FormSheet open={editing} label={onboarding?"Unternehmen einrichten":"Firmendaten bearbeiten"} description={onboarding?"Weitere Unternehmensdaten kannst du jetzt oder später ergänzen.":undefined} onClose={()=>setEditing(false)} busy={saving} dirty={currentValues!==baseline||pendingLogo!==null}><section className="settings-form">
        <Field label="Firmenlogo"><Input id="company-logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadLogo(e.target.files?.[0])}/></Field><div className="form-grid two">
          <Field label="Firmenname *"><Input required autoComplete="organization" value={name} onChange={e=>setName(e.target.value)}/></Field>
          <Field label="UID"><Input value={uid} onChange={e=>setUid(e.target.value)}/></Field>
          <Field label="Strasse"><Input value={street} onChange={e=>setStreet(e.target.value)}/></Field>
          <Field label="PLZ"><Input value={postalCode} onChange={e=>setPostalCode(e.target.value)}/></Field>
          <Field label="Ort"><Input value={city} onChange={e=>setCity(e.target.value)}/></Field>
          <Field label="E-Mail"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        </div>
        </section><FormActions sheet><Button requiresWrite disabled={loading||!!loadError||saving} onClick={()=>void save()}>{saving?"Wird gespeichert…":onboarding?"Einrichtung abschliessen":"Speichern"}</Button></FormActions>
      </FormSheet>:<section className="settings-readonly"><dl className="detail-list"><div><dt>Firmenname</dt><dd>{name||"—"}</dd></div><div><dt>UID</dt><dd>{uid||"—"}</dd></div><div><dt>Adresse</dt><dd>{street||"—"}<br/>{[postalCode,city].filter(Boolean).join(" ")||"—"}</dd></div><div><dt>E-Mail</dt><dd>{email||"—"}</dd></div><div><dt>Telefon</dt><dd>{phone||"—"}</dd></div></dl></section>}
    </div>}
    {toast&&<Toast title={toast} tone={["Persönliche Daten gespeichert.","Firmendaten gespeichert.","Profilbild gespeichert.","Firmenlogo gespeichert."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}

export function SubscriptionSettingsPage() {
  const production=useBackendMode();
  const searchParams=useSearchParams();
  const requestedPlan=searchParams.get("plan");
  const requestedBilling=searchParams.get("billing");
  const initialPlan=requestedPlan==="start"||requestedPlan==="business"||requestedPlan==="pro"?requestedPlan:"business";
  const initialBilling=requestedBilling==="yearly"?"yearly":"monthly";
  const [dialog,setDialog]=useState<"plan"|"payment"|"cancel"|null>(searchParams.get("activate")==="1"?"plan":null);
  const [plan,setPlan]=useState("Business");
  const [selectedPlan,setSelectedPlan]=useState<"start"|"business"|"pro">(initialPlan);
  const [subscription,setSubscription]=useState<Record<string,unknown>|null>(null);
  const [billingCycle,setBillingCycle]=useState<"monthly"|"yearly">(initialBilling);
  const [catalog,setCatalog]=useState<Array<{plan:string;billing:string;available:boolean;amount?:number}>>([]);
  const [stripeLive,setStripeLive]=useState(false);
  const [billingDemo,setBillingDemo]=useState(false);
  const [automaticTax,setAutomaticTax]=useState(false);
  const [billingError,setBillingError]=useState("");
  const checkoutRequest=useRef<{plan:string;billing:string;key:string}|null>(null);
  const [integrations,setIntegrations]=useState<Array<Record<string,unknown>>>([]);
  const [billingLoading,setBillingLoading]=useState(false);
  const [acceptedPaidTerms,setAcceptedPaidTerms]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [billingInvoice,setBillingInvoice]=useState<{date:string;amount:string}|null>(null);
  const [referenceNow]=useState(()=>Date.now());

  const prices:Record<string,string>=Object.fromEntries(subscriptionPlans.flatMap(p=>[[p.name,String(p.monthly)],[p.id,String(p.monthly)]]));
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};

  useEffect(()=>{
    if(!production) return;
    Promise.all([
      apiGet<{item:Record<string,unknown>}>("/api/settings/subscription"),
      apiGet<{items:Array<Record<string,unknown>>}>("/api/integrations/status"),
      apiGet<{live:boolean;demo:boolean;automaticTax:boolean;items:Array<{plan:string;billing:string;available:boolean;amount?:number}>}>("/api/billing/catalog"),
    ]).then(([subscriptionPayload,integrationPayload,catalogPayload])=>queueMicrotask(()=>{
      setSubscription(subscriptionPayload.item);
      setIntegrations(integrationPayload.items);
      setCatalog(catalogPayload.items);
      setStripeLive(catalogPayload.live);
      setBillingDemo(catalogPayload.demo===true);
      setAutomaticTax(catalogPayload.automaticTax===true);
    })).catch(()=>setBillingError("Abonnement konnte nicht geladen werden. Bitte die Seite erneut laden."));

    let attempts=0;
    let stopped=false;
    let refreshTimer:ReturnType<typeof setTimeout>|undefined;
    const refreshSubscription=async()=>{
      try{const payload=await apiGet<{item:Record<string,unknown>}>("/api/settings/subscription");if(stopped)return;setSubscription(payload.item);if(payload.item.billing_subscription_ref&&payload.item.subscription_status==="active")return;}catch{if(stopped)return;}
      if(++attempts<10)refreshTimer=setTimeout(()=>void refreshSubscription(),3000);
    };
    const result=new URLSearchParams(window.location.search).get("checkout");
    if(result==="success"){
      refreshTimer=setTimeout(()=>void refreshSubscription(),3000);
      queueMicrotask(()=>setToast("Stripe Checkout abgeschlossen. Der Abostatus wird über den signierten Webhook aktualisiert."));
      window.setTimeout(()=>setToast(null),4200);
    }else if(result==="cancelled"){
      queueMicrotask(()=>setToast("Planwechsel abgebrochen."));
      window.setTimeout(()=>setToast(null),2200);
    }
    return ()=>{stopped=true;if(refreshTimer)clearTimeout(refreshTimer);};
  },[production]);

  const startCheckout=async()=>{
    setBillingLoading(true);
    try{
      if(!checkoutRequest.current||checkoutRequest.current.plan!==selectedPlan||checkoutRequest.current.billing!==billingCycle)checkoutRequest.current={plan:selectedPlan,billing:billingCycle,key:crypto.randomUUID()};
      const payload=await apiPost<{url:string}>("/api/billing/checkout",{plan:selectedPlan,billing:billingCycle,requestKey:checkoutRequest.current.key,acceptedTerms:acceptedPaidTerms,termsVersion:legalConfig.termsVersion,privacyVersion:legalConfig.privacyVersion});
      window.open(payload.url,"_self");
    }catch(error){
      setToast(error instanceof Error?error.message:"Stripe Checkout konnte nicht geöffnet werden.");
      setBillingLoading(false);
      window.setTimeout(()=>setToast(null),2800);
    }
  };

  const openPortal=async()=>{
    setBillingLoading(true);
    try{
      const payload=await apiPost<{url:string}>("/api/billing/portal",{});
      window.open(payload.url,"_self");
    }catch(error){
      setToast(error instanceof Error?error.message:"Billing-Portal konnte nicht geöffnet werden.");
      setBillingLoading(false);
      window.setTimeout(()=>setToast(null),2800);
    }
  };

  if(!production){
    return <AppShell title="Abonnement" subtitle="Plan, Nutzung, Zahlungsmittel und Rechnungen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
      <p className="technical-hint">Abonnement-Demo mit synthetischen Beispielen. Es werden keine echten Zahlungen oder Kündigungen ausgelöst.</p><section className="plan-hero"><div><span className="eyebrow">AKTUELLER PLAN</span><h2>{plan}</h2><p>Für wachsende Teams mit allen wichtigen Business-Funktionen.</p></div><div className="plan-price"><strong>CHF {prices[plan]}</strong><span>/ Monat</span></div><Button onClick={()=>setDialog("plan")}>Plan ändern</Button></section>
      <div className="subscription-detail-grid"><section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzer</span><b>4 von 10</b></div><div className="usage-bar"><i style={{width:"40%"}}/></div><div className="usage-row"><span>Dateispeicher</span><b>2.4 GB von 20 GB</b></div><div className="usage-bar"><i style={{width:"12%"}}/></div></section><section className="surface"><SectionTitle title="Zahlungsmittel"/><div className="payment-method"><Icon name="card"/><div><b>Visa •••• 4242</b><small>Läuft 08/29 ab</small></div><Button variant="secondary" onClick={()=>setDialog("payment")}>Ändern</Button></div></section></div>
      <section className="surface invoices-panel"><SectionTitle title="Rechnungen"/><div>{[{date:"01.10.2026",number:"BO-2026-10"},{date:"01.09.2026",number:"BO-2026-09"}].map(item=><ListRow key={item.number} title={item.number} meta={item.date} value="CHF 49.00" valueLabel="Gesamtbetrag" status="Bezahlt" tone="success" onClick={()=>setBillingInvoice({date:item.date,amount:"CHF 49.00"})}/>)}</div></section>
      <div className="danger-zone"><div><b>Abonnement kündigen</b><p>Dein Zugriff bleibt bis zum Ende der laufenden Periode aktiv.</p></div><Button variant="danger" onClick={()=>setDialog("cancel")}>Kündigung starten</Button></div>
      {dialog&&<FormSheet label={dialog==="plan"?"Plan ändern":dialog==="payment"?"Zahlungsmittel ändern":"Abonnement kündigen"} description={"Demo-Aktion ohne produktive Zahlungsabwicklung."} open={true} onClose={()=>setDialog(null)} busy={billingLoading} className={"subscription-sheet"} layerClassName={""} ariaLabel={dialog==="plan"?"Plan auswählen":dialog==="payment"?"Zahlungsart":"Abonnement"}>{dialog==="plan"&&<div className="plan-choice-list">{["Start","Business","Pro"].map(name=><button type="button" className={plan===name?"selected":""} onClick={()=>setPlan(name)} key={name}><div><b>{name}</b><small>CHF {prices[name]} / Monat</small></div>{plan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>confirm("Demo-Aktion gespeichert.")}>Speichern</Button></div></FormSheet>}
      {billingInvoice&&<DocumentModal title="Rechnungsvorschau" pdfNumber={"BO-"+billingInvoice.date.slice(6)+"-"+billingInvoice.date.slice(3,5)} fileUrl={"/demo/billing-"+billingInvoice.date.slice(6)+"-"+billingInvoice.date.slice(3,5)+".pdf"} onClose={()=>setBillingInvoice(null)}/>}
      {toast&&<Toast title={toast} tone={toast.startsWith("Stripe Checkout abgeschlossen.")||toast==="Planwechsel abgebrochen."?"info":"danger"}/>}
    </AppShell>;
  }

  if(!subscription) return <AppShell title="Abonnement" subtitle="Daten werden geladen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen"><EmptyState icon="card" title={billingError?"Abonnement nicht verfügbar":"Abonnement wird geladen"} text={billingError||"Die Kontodaten werden abgerufen."}/></AppShell>;

  const planKey=String(subscription.plan??"trial");
  const planLabel:Record<string,string>={trial:"Testphase",start:"Start",business:"Business",pro:"Pro"};
  const contractAmount=subscription.unit_amount_chf==null?null:Number(subscription.unit_amount_chf);
  const statusLabel:Record<string,string>={trial:"Testphase",active:"Aktiv",past_due:"Überfällig",expired:"Abgelaufen",read_only:"Nur Lesen",suspended:"Pausiert",cancelled:"Gekündigt"};
  const accountLabel:Record<string,string>={trial:"Testphase",read_only:"Nur Lesen",grace_period:"Nachfrist",active:"Aktiv",restricted:"Eingeschränkt",suspended:"Gesperrt",cancelled:"Gekündigt"};
  const subscriptionStatus=String(subscription.subscription_status??"unknown");
  const accountStatus=String(subscription.account_status??"active");
  const billingConnected=Boolean(subscription.billing_customer_ref&&subscription.billing_subscription_ref)&&!["cancelled","expired"].includes(subscriptionStatus);
  const billingIntegration=integrations.find(item=>item.key==="billing");
  const billingConfigured=billingIntegration?.configured===true&&catalog.some(item=>item.available);
  const storageLimit=Number(subscription.storage_limit_bytes??0);
  const storageLabel=storageLimit>0?(storageLimit/1024/1024/1024).toLocaleString("de-CH",{maximumFractionDigits:1})+" GB":"—";
  const periodEnd=subscription.current_period_ends_at?new Date(String(subscription.current_period_ends_at)).toLocaleDateString("de-CH"):"—";
  const trialEndDate=subscription.trial_ends_at?new Date(String(subscription.trial_ends_at)):null;
  const trialEnd=trialEndDate?trialEndDate.toLocaleDateString("de-CH"):"—";
  const trialDaysRemaining=trialEndDate?Math.max(0,Math.ceil((trialEndDate.getTime()-referenceNow)/86400000)):0;

  return <AppShell title="Abonnement" subtitle="Plan, Nutzung und Kontostatus." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="plan-hero">
      <div><span className="eyebrow">AKTUELLER PLAN</span><h2>{planLabel[planKey]??planKey}</h2><Status tone={subscriptionStatus==="active"?"success":subscriptionStatus==="trial"?"info":"warning"}>{statusLabel[subscriptionStatus]??"Unbekannt"}</Status>{!billingDemo&&<p>{subscriptionStatus==="trial"?"Die Testphase ist aktiv.":"Der hinterlegte Plan für dein Binso One Konto."}</p>}</div>
      <div className="plan-price"><strong>{subscriptionStatus==="trial"?"CHF 0.00":contractAmount==null?"—":moneyChf(contractAmount)}</strong><span>{subscriptionStatus==="trial"?`noch ${trialDaysRemaining} ${trialDaysRemaining===1?"Tag":"Tage"}`:subscription.billing_interval==="yearly"?"/ Jahr":"/ Monat"}</span></div>
      {billingDemo?<Status tone="info">Demo-Modus</Status>:billingConfigured?(billingConnected?<Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing verwalten</Button>:<Button onClick={()=>setDialog("plan")}>Plan aktivieren</Button>):<Status tone="warning">Stripe nicht verfügbar</Status>}
    </section>
    {!stripeLive&&billingConfigured&&<p className="technical-hint">Stripe-Testmodus · keine echten Zahlungen.</p>}
    {subscription.cancel_at_period_end===true&&<p className="technical-hint">Abonnement endet am {periodEnd}.</p>}
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzerlimit</span><b>{String(subscription.user_limit??"—")}</b></div><div className="usage-row"><span>Dateispeicher</span><b>{storageLabel}</b></div><div className="usage-row"><span>Kontostatus</span><b>{accountLabel[accountStatus]??accountStatus}</b></div><div className="usage-row"><span>{subscriptionStatus==="trial"?"Testphase bis":"Aktuelle Periode bis"}</span><b>{subscriptionStatus==="trial"?trialEnd:periodEnd}</b></div></section>
      <section className="surface"><SectionTitle title="Zahlungsabwicklung"/>{billingDemo?<div className="context-block"><Status tone="info">Demo</Status><b>Zahlungen sind in der Demo deaktiviert</b><span>Die Demo-Umgebung verwendet keine echten Stripe-Zahlungen. Für ein echtes Abo registrierst du ein produktives Konto über die Preis- oder Registrierungsseite.</span><Button href="/preise">Pläne ansehen</Button></div>:billingConnected?<div className="context-block"><Status tone="success">Verbunden</Status><b>Stripe Billing verbunden</b><span>Zahlungsmittel und SaaS-Rechnungen bleiben bei Stripe und werden über das sichere Kundenportal verwaltet.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal öffnen</Button></div>:billingConfigured?<div className="context-block"><Status tone="info">Bereit</Status><b>Stripe ist konfiguriert</b><span>Wähle einen Plan, um das produktive Abonnement über Stripe Checkout zu starten.</span><Button onClick={()=>setDialog("plan")}>Plan auswählen</Button></div>:<div className="context-block"><Status tone="warning">Nicht verfügbar</Status><b>Zahlungsabwicklung ist derzeit nicht verfügbar</b><span>Bitte versuche es später erneut oder kontaktiere den Support.</span></div>}</section>
    </div>
    {billingConfigured&&!billingDemo&&<p className="technical-hint">{automaticTax?"Stripe Tax ist für den Checkout aktiviert.":"Steuer-ID wird im Checkout erfasst; allfällige Steuern richten sich nach der produktiven Stripe-Steuerkonfiguration."}</p>}<section className="surface invoices-panel"><SectionTitle title="SaaS-Abrechnungen"/>{billingConnected?<div className="context-block"><b>Rechnungen und Zahlungsmittel in Stripe</b><span>Binso One speichert keine vollständigen Kartendaten. Öffne das Billing-Portal für Rechnungsdownloads und Zahlungsmittel.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal</Button></div>:<EmptyState icon="card" title="Noch keine Billing-Daten" text="Es werden keine erfundenen Zahlungsmittel oder SaaS-Rechnungen angezeigt."/>}</section>
    <div className="danger-zone"><div><b>Abonnement verwalten</b><p>{billingConnected?"Planwechsel, Zahlungsmittel und Kündigung werden über Stripe Billing ausgeführt.":"Ohne verbundenes Billing gibt es hier keine produktive Kündigungsaktion."}</p></div><Button variant="secondary" disabled={!billingConnected||billingLoading} onClick={()=>void openPortal()}>Abonnement verwalten</Button></div>

    {dialog==="plan"&&billingConfigured&&!billingConnected&&<FormSheet label={"Plan auswählen"} description={"Checkout und Zahlungsdaten werden sicher bei Stripe verarbeitet."} open={true} onClose={()=>setDialog(null)} busy={billingLoading} className={"subscription-sheet"} layerClassName={""} ariaLabel={dialog==="plan"?"Plan auswählen":dialog==="payment"?"Zahlungsart":"Abonnement"}><div className="sheet-body"><Field label="Zahlungszeitraum"><Select value={billingCycle} onChange={e=>setBillingCycle(e.target.value as "monthly"|"yearly")}><option value="monthly">Monatlich</option><option value="yearly">Jährlich</option></Select></Field><div className="plan-choice-list">{(["start","business","pro"] as const).map(name=>{const price=catalog.find(item=>item.plan===name&&item.billing===billingCycle);return <button type="button" disabled={!price?.available} className={selectedPlan===name?"selected":""} onClick={()=>setSelectedPlan(name)} key={name}><div><b>{planLabel[name]}</b><small>{price?.available?moneyChf(price.amount)+(billingCycle==="yearly"?" / Jahr":" / Monat"):"Noch nicht eingerichtet"}</small></div>{selectedPlan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>})}</div><label className="billing-legal-consent"><Input type="checkbox" checked={acceptedPaidTerms} onChange={e=>setAcceptedPaidTerms(e.target.checked)}/><span>Ich bestätige den kostenpflichtigen Abschluss gemäss <Link prefetch={false} href="/agb" target="_blank">AGB</Link> und habe <Link prefetch={false} href="/datenschutz" target="_blank">Datenschutz</Link> sowie <Link prefetch={false} href="/auftragsbearbeitung" target="_blank">Auftragsbearbeitung</Link> zur Kenntnis genommen.</span></label><p className="technical-hint">Das Abonnement wird erst durch den erfolgreichen Stripe-Checkout aktiviert. Laufzeit und Preis werden vor dem Abschluss nochmals angezeigt.</p></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>void startCheckout()} disabled={billingLoading||!acceptedPaidTerms||!catalog.some(item=>item.plan===selectedPlan&&item.billing===billingCycle&&item.available)}>{billingLoading?"Checkout wird geöffnet…":"Kostenpflichtig zu Stripe"}</Button></div></FormSheet>}
    {toast&&<Toast title={toast} tone={toast.startsWith("Stripe Checkout abgeschlossen.")||toast==="Planwechsel abgebrochen."?"info":"danger"}/>}
  </AppShell>;
}

export function NotificationSettingsPage() {
  const rows = [
    ["Rechnungen","Zahlungen, Überfälligkeit und Mahnungen"],
    ["Angebote","Angenommen, abgelehnt oder abgelaufen"],
    ["Support","Neue Antworten und Statusänderungen"],
    ["Zeiterfassung","Erinnerungen und laufende Timer"],
    ["Produktupdates","Neue Funktionen und wichtige Hinweise"],
  ] as const;
  const [prefs,setPrefs] = useState<Record<string,{email:boolean;push:boolean}>>({
    Rechnungen:{email:true,push:true}, Angebote:{email:true,push:true}, Support:{email:true,push:true}, Zeiterfassung:{email:false,push:true}, Produktupdates:{email:true,push:false}
  });
  const pending=useRef(new Set<string>());
  const [saving,setSaving]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{if(!isProductionBackendEnabled())return;apiGet<{items:Array<{kind:string;email:boolean;push:boolean}>}>("/api/settings/notifications").then(data=>setPrefs(current=>{const next={...current};for(const item of data.items)if(next[item.kind])next[item.kind]={email:item.email,push:item.push};return next})).then(()=>setReady(true)).catch(()=>setError("Einstellungen konnten nicht geladen werden."));},[]);
  const toggle=async(title:string,channel:"email"|"push")=>{
    const key=title+channel;if(!ready||pending.current.has(key))return;
    const before=prefs[title][channel],enabled=!before;
    if(channel==="push"&&enabled&&(!("Notification" in window)||Notification.permission!=="granted")){
      setError("Push benötigt eine Browserfreigabe. Aktiviere Benachrichtigungen in den Geräteeinstellungen.");return;
    }
    pending.current.add(key);setSaving([...pending.current]);setPrefs(current=>({...current,[title]:{...current[title],[channel]:enabled}}));
    try{await apiPatch("/api/settings/notifications",{kind:title,channel,enabled});setError("");}
    catch{setPrefs(current=>({...current,[title]:{...current[title],[channel]:before}}));setError("Einstellung konnte nicht gespeichert werden.");}
    finally{pending.current.delete(key);setSaving([...pending.current]);}
  };
  return <AppShell title="Benachrichtigungen" subtitle="Bestimme, wie Binso One dich informiert." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    {error&&<ErrorState>{error}</ErrorState>}
    {!ready&&!error&&<LoadingState>Einstellungen werden geladen …</LoadingState>}
    <section className="preference-table">{rows.map(([title,text])=><div className="preference-row" key={title}><div><b>{title}</b><small>{text}</small></div><div className="preference-channels">{(["email","push"] as const).map(channel=><label key={channel}><span>{channel==="email"?"E-Mail":"Push"}</span><Toggle checked={prefs[title][channel]} disabled={!ready||saving.includes(title+channel)} onChange={()=>void toggle(title,channel)} label={`${channel==="email"?"E-Mail":"Push"} ${title}`}/></label>)}</div></div>)}</section>
  </AppShell>;
}

/** Language availability reflects the translated interface, not the database enum. */
function LanguagePreference(){
 const production=useBackendMode();
 const [language,setLanguage]=useState("de-CH"),[error,setError]=useState("");
 const query=useApiQuery<{item?:{language?:string}}>(production?"/api/settings/profile":null);
 useEffect(()=>{if(!query.data)return;const value=query.data.item?.language??"de";queueMicrotask(()=>setLanguage(value==="de"?"de-CH":value));},[query.data]);
 const choose=async(code:string)=>{try{await apiPatch("/api/settings/profile",{language:code==="de-CH"?"de":code});setLanguage(code);setError("");}catch{setError("Sprache konnte nicht gespeichert werden.")}};
 return <><Field label="Sprache" allowReadOnlyInput><Select value={language==="de-CH"?language:"de-CH"} onChange={event=>void choose(event.target.value)} disabled={query.loading||!!query.error}><option value="de-CH">Deutsch (Schweiz)</option></Select></Field>{(error||query.error)&&<ErrorState>{error||query.error}</ErrorState>}<p className="settings-note">Die Oberfläche ist derzeit vollständig auf Deutsch verfügbar. Weitere Sprachen werden erst nach vollständiger Übersetzung freigeschaltet.</p></>;
}

export function LanguageSettingsPage(){
 return <AppShell title="Sprache" subtitle="Sprache der Benutzeroberfläche." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen"><LanguagePreference/></AppShell>;
}

const themeOptions=[
 {value:"light",title:"Hell",description:"Helle Oberfläche",icon:"sun"},
 {value:"dark",title:"Dunkel",description:"Dunkle Oberfläche",icon:"moon"},
 {value:"system",title:"System",description:"Geräteeinstellung übernehmen",icon:<Monitor size={18} aria-hidden="true"/>},
] as const;
export function AppearanceSettingsPage(){
 const [theme,setTheme]=useState<ThemeMode>("system"),[error,setError]=useState("");
 useEffect(()=>{
  const sync=()=>{const mode=document.documentElement.dataset.themeMode;setTheme(mode==="light"||mode==="dark"?mode:"system")};
  queueMicrotask(sync);window.addEventListener("binso-theme",sync);
  return()=>window.removeEventListener("binso-theme",sync);
 },[]);
 const choose=(next:ThemeMode)=>{setError("");void saveTheme(next).catch(()=>setError("Darstellung konnte nicht gespeichert werden."))};
 return <AppShell title="Darstellung & Sprache" subtitle="Binso One passt sich deiner Arbeitsweise an." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
  {error&&<ErrorState>{error}</ErrorState>}
  <section className="settings-section"><SectionTitle title="Darstellung"/><SelectionRows label="Darstellung" value={theme} options={themeOptions} onChange={choose}/></section>
  <section className="settings-section"><SectionTitle title="Sprache"/><LanguagePreference/></section>
 </AppShell>;
}
