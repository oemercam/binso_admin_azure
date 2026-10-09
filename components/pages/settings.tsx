"use client";
import {DocumentModal} from "../documents";
import {ActionSheet,FormSheet,ListRow} from "../binso-ux";

import Link from "next/link";
import { loadTheme, saveTheme } from "@/lib/client/theme";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { plans as subscriptionPlans } from "@/lib/plans";
import { legalConfig } from "@/config/legal";
import { Button, EmptyState, Field, Icon, SectionTitle, Status, Toast, Toggle, Input, FormActions, Select } from "../ui";
import { moneyChf } from "./shared";

export function SettingsPage() {
  const rows = [
    ["/einstellungen/konto","user","Persönliche Daten","Name, E-Mail, Telefon und Funktion"],
    ["/einstellungen/firma","users","Firma","Unternehmensdaten, Adresse und Firmenlogo"],
    ["/einstellungen/dokumente","receipt","Rechnungen & Dokumente","MwSt., Zahlungsfrist, IBAN und Standardtexte"],
    ["/einstellungen/zeiterfassung","clock","Zeiterfassung","Freigabe neuer Zeiteinträge"],
    ["/einstellungen/team","users","Benutzer & Rollen","Zugänge, Rollen und Einladungen"],
    ["/einstellungen/abonnement","card","Abonnement","Plan, Nutzung und Zahlungsabwicklung"],
    ["/einstellungen/benachrichtigungen","bell","Benachrichtigungen","E-Mail- und Push-Einstellungen"],
    ["/einstellungen/sprache","settings","Sprache","Oberflächen- und Kommunikationssprache"],
    ["/einstellungen/sicherheit","lock","Sicherheit","Passwort, MFA, Sitzungen und Geräte"],
    ["/einstellungen/darstellung","moon","Darstellung","Hell, Dunkel oder Systemeinstellung"],
    ["/einstellungen/datenschutz","lock","Datenschutz & Cookies","Notwendige Funktionen und Performance-Messung"],
  ];
  return <AppShell title="Einstellungen" subtitle="Firma, Konto, Sicherheit und Abonnement." active="einstellungen">
    <div className="settings-list">
      {rows.map(([href,icon,title,text])=><Link href={href} key={title}><span className="settings-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>)}
    </div>
  </AppShell>;
}

export function AccountSettingsPage() {
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [jobTitle,setJobTitle]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);
  const saveBusy=useRef(false);
  const [avatarUrl,setAvatarUrl]=useState("");
  const uploadAvatar=async(file:File|undefined)=>{if(!file)return;try{const form=new FormData();form.append("file",file);form.append("purpose","profile_avatar");const result=await apiUpload<{item:{id:string}}>("/api/files",form);setAvatarUrl("/api/files/"+result.item.id+"/download");setToast("Profilbild gespeichert.");}catch(e){setToast(e instanceof Error?e.message:"Profilbild konnte nicht gespeichert werden.")}};

  useEffect(()=>{
    if(!isProductionBackendEnabled()){queueMicrotask(()=>setLoading(false));return;}
    apiGet<{item?:Record<string,unknown>|null;email?:string|null}>("/api/settings/profile")
      .then(payload=>{
        const item=payload.item??{};
        queueMicrotask(()=>{
          setFirstName(String(item.first_name??""));
          setLastName(String(item.last_name??""));
          setEmail(payload.email??"");
          setPhone(String(item.phone??""));
          setAvatarUrl(String(item.avatar_url??""));
          setJobTitle(String(item.job_title??""));
        });
      }).catch(e=>setLoadError(e instanceof Error?e.message:"Einstellungen konnten nicht geladen werden.")).finally(()=>setLoading(false));
  },[]);

  const save=async(message="Persönliche Daten gespeichert.")=>{
    if(loading||loadError||saveBusy.current)return;saveBusy.current=true;setSaving(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      await apiPatch("/api/settings/profile",{firstName,lastName,phone,jobTitle});
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Persönliche Daten konnten nicht gespeichert werden.");
    }
    finally{saveBusy.current=false;setSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const initials=((firstName[0]??"")+(lastName[0]??"")).toUpperCase()||"BO";
  const displayName=[firstName,lastName].filter(Boolean).join(" ")||"Benutzer";
  return <AppShell title="Persönliche Daten" subtitle="Dein Konto und deine Profildaten." active="einstellungen" editing={editing} unsavedChanges={editing} backHref="/einstellungen" backLabel="Einstellungen" actions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" icon="edit" onClick={()=>setEditing(true)}>Bearbeiten</Button>:undefined}>
    {loading?<p role="status">Einstellungen werden geladen …</p>:loadError?<div role="alert"><p>{loadError}</p><Button variant="secondary" onClick={()=>window.location.reload()}>Erneut versuchen</Button></div>:<div className="settings-detail-grid">
      <section className="surface settings-profile">
        <div className="profile-avatar">{avatarUrl?<img src={avatarUrl} alt={displayName}/>:initials}</div><div><h2>{displayName}</h2><p>{jobTitle||"Benutzer"}</p></div>{editing&&<><label className="button button-secondary" htmlFor="profile-avatar-upload">Bild ändern</label><Input id="profile-avatar-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadAvatar(e.target.files?.[0])}/></>}
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
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);
  const saveBusy=useRef(false);

  const uploadLogo=async(file:File|undefined)=>{
    if(!file) return;
    if(!isProductionBackendEnabled()){
      setToast("Logo-Upload ist im Demo-Modus nicht dauerhaft.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      const form=new FormData();
      form.append("file",file);
      form.append("purpose","company_logo");
      const result=await apiUpload<{item:{id:string}}>("/api/files",form);
      setLogoUrl("/api/files/"+result.item.id+"/download");
      setToast("Firmenlogo gespeichert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmenlogo konnte nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2600);
  };

  useEffect(()=>{
    if(!isProductionBackendEnabled()){queueMicrotask(()=>setLoading(false));return;}
    apiGet<{item:Record<string,unknown>}>("/api/settings/company").then(payload=>{
      const item=payload.item;
      queueMicrotask(()=>{
        setName(String(item.name??""));
        setUid(String(item.uid??""));
        setLogoUrl(String(item.logo_url??""));
        setStreet(String(item.street??""));
        setPostalCode(String(item.postal_code??""));
        setCity(String(item.city??""));
        setEmail(String(item.email??""));
        setPhone(String(item.phone??""));
      });
    }).catch(e=>setLoadError(e instanceof Error?e.message:"Einstellungen konnten nicht geladen werden.")).finally(()=>setLoading(false));
  },[]);

  const save=async(message="Firmendaten gespeichert.")=>{
    if(loading||loadError||saveBusy.current)return;saveBusy.current=true;setSaving(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      await apiPatch("/api/settings/company",{name,uid,street,postalCode,city,email,phone});
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmendaten konnten nicht gespeichert werden.");
    }
    finally{saveBusy.current=false;setSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  return <AppShell title="Firma" subtitle="Unternehmensdaten für Dokumente und Kommunikation." active="einstellungen" editing={editing} unsavedChanges={editing} backHref="/einstellungen" backLabel="Einstellungen" actions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" icon="edit" onClick={()=>setEditing(true)}>Bearbeiten</Button>:undefined}>
    {loading?<p role="status">Einstellungen werden geladen …</p>:loadError?<div role="alert"><p>{loadError}</p><Button variant="secondary" onClick={()=>window.location.reload()}>Erneut versuchen</Button></div>:<div className="settings-detail-grid">
      <section className="surface company-logo-card"><img src={logoUrl||"/brand/logo-black.svg"} alt="Firmenlogo"/><div><b>{name||"Firma"}</b><small>Firmenlogo für Angebote, Rechnungen und Dokumente</small></div>{editing&&<><label className="button button-secondary" htmlFor="company-logo-upload">Logo ändern</label><Input id="company-logo-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadLogo(e.target.files?.[0])}/></>}</section>
      {editing?<section className="settings-form">
        <div className="form-grid two">
          <Field label="Firmenname"><Input value={name} onChange={e=>setName(e.target.value)}/></Field>
          <Field label="UID"><Input value={uid} onChange={e=>setUid(e.target.value)}/></Field>
          <Field label="Strasse"><Input value={street} onChange={e=>setStreet(e.target.value)}/></Field>
          <Field label="PLZ"><Input value={postalCode} onChange={e=>setPostalCode(e.target.value)}/></Field>
          <Field label="Ort"><Input value={city} onChange={e=>setCity(e.target.value)}/></Field>
          <Field label="E-Mail"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        </div>
        <FormActions ><Button requiresWrite disabled={loading||!!loadError||saving} onClick={()=>void save()}>{saving?"Wird gespeichert…":"Speichern"}</Button></FormActions>
      </section>:<section className="settings-readonly"><dl className="detail-list"><div><dt>Firmenname</dt><dd>{name||"—"}</dd></div><div><dt>UID</dt><dd>{uid||"—"}</dd></div><div><dt>Adresse</dt><dd>{street||"—"}<br/>{[postalCode,city].filter(Boolean).join(" ")||"—"}</dd></div><div><dt>E-Mail</dt><dd>{email||"—"}</dd></div><div><dt>Telefon</dt><dd>{phone||"—"}</dd></div></dl></section>}
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
      <section className="plan-hero"><div><span className="eyebrow">AKTUELLER PLAN</span><h2>{plan}</h2><p>Für wachsende Teams mit allen wichtigen Business-Funktionen.</p></div><div className="plan-price"><strong>CHF {prices[plan]}</strong><span>/ Monat</span></div><Button onClick={()=>setDialog("plan")}>Plan ändern</Button></section>
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
  const subscriptionStatus=String(subscription.subscription_status??"trial");
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
      <div><span className="eyebrow">AKTUELLER PLAN</span><h2>{planLabel[planKey]??planKey}</h2><p>{billingDemo?"Isolierte Demo ohne echte Zahlungen.":subscriptionStatus==="trial"?"Die Testphase ist aktiv.":"Der hinterlegte Plan für dein Binso One Konto."}</p></div>
      <div className="plan-price"><strong>{subscriptionStatus==="trial"?"CHF 0.00":contractAmount==null?"—":moneyChf(contractAmount)}</strong><span>{subscriptionStatus==="trial"?`noch ${trialDaysRemaining} ${trialDaysRemaining===1?"Tag":"Tage"}`:subscription.billing_interval==="yearly"?"/ Jahr":"/ Monat"}</span></div>
      {billingDemo?<Status tone="info">Demo-Modus</Status>:billingConfigured?(billingConnected?<Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing verwalten</Button>:<Button onClick={()=>setDialog("plan")}>Plan aktivieren</Button>):<Status tone="warning">Stripe nicht verfügbar</Status>}
    </section>
    {!stripeLive&&billingConfigured&&<p className="technical-hint">Stripe-Testmodus · keine echten Zahlungen.</p>}
    {subscription.cancel_at_period_end===true&&<p className="technical-hint">Abonnement endet am {periodEnd}.</p>}
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzerlimit</span><b>{String(subscription.user_limit??"—")}</b></div><div className="usage-row"><span>Dateispeicher</span><b>{storageLabel}</b></div><div className="usage-row"><span>Kontostatus</span><b>{accountLabel[accountStatus]??accountStatus}</b></div><div className="usage-row"><span>{subscriptionStatus==="trial"?"Testphase bis":"Aktuelle Periode bis"}</span><b>{subscriptionStatus==="trial"?trialEnd:periodEnd}</b></div></section>
      <section className="surface"><SectionTitle title="Zahlungsabwicklung"/>{billingDemo?<div className="context-block"><Status tone="info">Demo</Status><b>Zahlungen sind in der Demo deaktiviert</b><span>Die Demo-Umgebung verwendet keine echten Stripe-Zahlungen. Für ein echtes Abo registrierst du ein produktives Konto über die Preis- oder Registrierungsseite.</span><Button href="/preise">Pläne ansehen</Button></div>:billingConnected?<div className="context-block"><Status tone="success">Verbunden</Status><b>Stripe Billing verbunden</b><span>Zahlungsmittel und SaaS-Rechnungen bleiben bei Stripe und werden über das sichere Kundenportal verwaltet.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal öffnen</Button></div>:billingConfigured?<div className="context-block"><Status tone="info">Bereit</Status><b>Stripe ist konfiguriert</b><span>Wähle einen Plan, um das produktive Abonnement über Stripe Checkout zu starten.</span><Button onClick={()=>setDialog("plan")}>Plan auswählen</Button></div>:<div className="context-block"><Status tone="warning">Nicht verfügbar</Status><b>Zahlungsabwicklung ist derzeit nicht verfügbar</b><span>Bitte versuche es später erneut oder kontaktiere den Support.</span></div>}</section>
    </div>
    <p className="technical-hint">{automaticTax?"Stripe Tax ist für den Checkout aktiviert.":"Steuer-ID wird im Checkout erfasst; allfällige Steuern richten sich nach der produktiven Stripe-Steuerkonfiguration."}</p><section className="surface invoices-panel"><SectionTitle title="SaaS-Abrechnungen"/>{billingConnected?<div className="context-block"><b>Rechnungen und Zahlungsmittel in Stripe</b><span>Binso One speichert keine vollständigen Kartendaten. Öffne das Billing-Portal für Rechnungsdownloads und Zahlungsmittel.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal</Button></div>:<EmptyState icon="card" title="Noch keine Billing-Daten" text="Es werden keine erfundenen Zahlungsmittel oder SaaS-Rechnungen angezeigt."/>}</section>
    <div className="danger-zone"><div><b>Abonnement verwalten</b><p>{billingConnected?"Planwechsel, Zahlungsmittel und Kündigung werden über Stripe Billing ausgeführt.":"Ohne verbundenes Billing gibt es hier keine produktive Kündigungsaktion."}</p></div><Button variant="secondary" disabled={!billingConnected||billingLoading} onClick={()=>void openPortal()}>Abonnement verwalten</Button></div>

    {dialog==="plan"&&billingConfigured&&!billingConnected&&<FormSheet label={"Plan auswählen"} description={"Checkout und Zahlungsdaten werden sicher bei Stripe verarbeitet."} open={true} onClose={()=>setDialog(null)} busy={billingLoading} className={"subscription-sheet"} layerClassName={""} ariaLabel={dialog==="plan"?"Plan auswählen":dialog==="payment"?"Zahlungsart":"Abonnement"}><div className="sheet-body"><Field label="Zahlungszeitraum"><Select value={billingCycle} onChange={e=>setBillingCycle(e.target.value as "monthly"|"yearly")}><option value="monthly">Monatlich</option><option value="yearly">Jährlich</option></Select></Field><div className="plan-choice-list">{(["start","business","pro"] as const).map(name=>{const price=catalog.find(item=>item.plan===name&&item.billing===billingCycle);return <button type="button" disabled={!price?.available} className={selectedPlan===name?"selected":""} onClick={()=>setSelectedPlan(name)} key={name}><div><b>{planLabel[name]}</b><small>{price?.available?moneyChf(price.amount)+(billingCycle==="yearly"?" / Jahr":" / Monat"):"Noch nicht eingerichtet"}</small></div>{selectedPlan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>})}</div><label className="billing-legal-consent"><Input type="checkbox" checked={acceptedPaidTerms} onChange={e=>setAcceptedPaidTerms(e.target.checked)}/><span>Ich bestätige den kostenpflichtigen Abschluss gemäss <Link href="/agb" target="_blank">AGB</Link> und habe <Link href="/datenschutz" target="_blank">Datenschutz</Link> sowie <Link href="/auftragsbearbeitung" target="_blank">Auftragsbearbeitung</Link> zur Kenntnis genommen.</span></label><p className="technical-hint">Das Abonnement wird erst durch den erfolgreichen Stripe-Checkout aktiviert. Laufzeit und Preis werden vor dem Abschluss nochmals angezeigt.</p></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>void startCheckout()} disabled={billingLoading||!acceptedPaidTerms||!catalog.some(item=>item.plan===selectedPlan&&item.billing===billingCycle&&item.available)}>{billingLoading?"Checkout wird geöffnet…":"Kostenpflichtig zu Stripe"}</Button></div></FormSheet>}
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
  const [error,setError]=useState("");
  useEffect(()=>{if(!isProductionBackendEnabled())return;apiGet<{items:Array<{kind:string;email:boolean;push:boolean}>}>("/api/settings/notifications").then(data=>setPrefs(current=>{const next={...current};for(const item of data.items)if(next[item.kind])next[item.kind]={email:item.email,push:item.push};return next})).catch(()=>setError("Einstellungen konnten nicht geladen werden."));},[]);
  const toggle = async (title:string, channel:"email"|"push") => {const enabled=!prefs[title][channel];try{if(!isProductionBackendEnabled())throw new Error("Schreibgeschützte Vorschau");await apiPatch("/api/settings/notifications",{kind:title,channel,enabled});setPrefs(current=>({...current,[title]:{...current[title],[channel]:enabled}}));setError("");}catch{setError("Einstellung konnte nicht gespeichert werden.")}};
  return <AppShell title="Benachrichtigungen" subtitle="Bestimme, wie Binso One dich informiert." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    {error&&<p role="alert">{error}</p>}
    <section className="preference-table"><div className="preference-head"><span>Benachrichtigung</span><span>E-Mail</span><span>Push</span></div>{rows.map(([title,text])=><div className="preference-row" key={title}><div><b>{title}</b><small>{text}</small></div><Toggle checked={prefs[title].email} onChange={()=>void toggle(title,"email")} label={`E-Mail ${title}`}/><Toggle checked={prefs[title].push} onChange={()=>void toggle(title,"push")} label={`Push ${title}`}/></div>)}</section>
  </AppShell>;
}

export function LanguageSettingsPage() {
  const [language,setLanguage] = useState("de-CH");
  const [error,setError]=useState("");
  useEffect(()=>{if(isProductionBackendEnabled())apiGet<{item?:{language?:string}}>("/api/settings/profile").then(data=>{const value=data.item?.language??"de-CH";setLanguage(value==="de"?"de-CH":value)}).catch(()=>setError("Sprache konnte nicht geladen werden."));},[]);
  const choose=async(code:string)=>{try{if(!isProductionBackendEnabled())throw new Error("Schreibgeschützte Vorschau");await apiPatch("/api/settings/profile",{language:code});setLanguage(code);setError("");}catch{setError("Sprache konnte nicht gespeichert werden.")}};
  const languages=[["Deutsch (Schweiz)","de-CH"],["Français","fr"],["Italiano","it"],["English","en"],["Türkçe","tr"]];
  return <AppShell title="Sprache" subtitle="Sprache für Oberfläche und Kommunikation wählen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <div className="choice-list">{languages.map(([label,code])=><button className={language===code?"selected":""} onClick={()=>void choose(code)} type="button" key={code}><span>{code.toUpperCase()}</span><div><b>{label}</b><small>{language===code?"Aktiv":"Auswählen"}</small></div>{language===code?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>
    {error&&<p role="alert">{error}</p>}
    <p className="settings-note">Die vollständigen Übersetzungen werden mit der produktiven Sprachschicht geladen. Diese Auswahl ist bereits für DE, FR, IT, EN und TR vorbereitet.</p>
  </AppShell>;
}

export function AppearanceSettingsPage() {
  const [theme,setTheme] = useState<"light"|"dark"|"system">("light");

  useEffect(()=>{
    const storedMode=document.documentElement.dataset.themeMode;
    const storedResolved=document.documentElement.dataset.theme;
    const next=storedMode==="system"||storedMode==="dark"||storedMode==="light"
      ? storedMode
      : storedResolved==="dark" ? "dark" : "light";
    queueMicrotask(()=>setTheme(next));
  },[]);

  const [error,setError]=useState("");
  useEffect(()=>{void loadTheme().then(mode=>{if(mode)setTheme(mode)}).catch(()=>setError("Darstellung konnte nicht geladen werden."));},[]);
  const choose=async(next:"light"|"dark"|"system")=>{try{await saveTheme(next);setTheme(next);setError("");}catch{setError("Darstellung konnte nicht gespeichert werden.")}};
  return <AppShell title="Darstellung" subtitle="Binso One passt sich deiner Arbeitsweise an." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    {error&&<p role="alert">{error}</p>}
    <div className="appearance-grid">
      <button className={`appearance-card ${theme==="light"?"selected":""}`} onClick={()=>void choose("light")}><div className="theme-preview light"><i/><i/><i/></div><b>Hell</b><small>Klar und kontrastreich</small></button>
      <button className={`appearance-card ${theme==="dark"?"selected":""}`} onClick={()=>void choose("dark")}><div className="theme-preview dark"><i/><i/><i/></div><b>Dunkel</b><small>Reines Schwarz und Weiss</small></button>
      <button className={`appearance-card ${theme==="system"?"selected":""}`} onClick={()=>void choose("system")}><div className="theme-preview system"><i/><i/><i/></div><b>System</b><small>Geräteeinstellung übernehmen</small></button>
    </div>
  </AppShell>;
}
