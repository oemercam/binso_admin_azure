"use client";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {useLocale} from "@/lib/client/locale";
import {asLocale,localeNames,locales} from "@/lib/locales";
import {companyLogoSource} from "@/lib/image-url";
import {useApiQuery} from "@/lib/client/use-api-query";
import {Avatar} from "../avatar";
import {usePageAccess} from "@/lib/client/page-access";
import {DocumentModal} from "../documents";
import {ActionRow,ActionSheet,FormSheet,ListRow,SelectionRows,SettingsGroup} from "../binso-ux";

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
 const [query,setQuery]=useState("");
 const groups=[
  {title:"Unternehmen",rows:[["/einstellungen/firma","users","Firma"],["/einstellungen/team","users","Benutzer & Rollen"],["/einstellungen/abonnement","card","Abonnement"]]},
  {title:"Geschäftsprozesse",rows:[["/einstellungen/dokumente","receipt","Rechnungen & Dokumente"],["/einstellungen/zeiterfassung","clock","Zeiterfassung"]]},
  {title:"Weitere Einstellungen",rows:[["/einstellungen/datenschutz","lock","Datenschutz & Cookies"]]},
 ];
 const term=query.trim().toLocaleLowerCase("de-CH");
 const visibleGroups=groups.map(group=>({...group,rows:group.rows.filter(([href,,title])=>access.canOpen(href)&&(!term||`${group.title} ${title}`.toLocaleLowerCase("de-CH").includes(term)))})).filter(group=>group.rows.length);
 return <><label className="searchbox settings-navigation-search"><Icon name="search"/><Input type="search" aria-label="Einstellungen suchen" placeholder="Einstellungen suchen" value={query} onChange={event=>setQuery(event.target.value)}/></label>{visibleGroups.map(group=><SettingsGroup title={group.title} key={group.title}><div className="settings-list">{group.rows.map(([href,icon,title])=><ActionRow href={href} key={href} icon={icon} title={title}/>)}</div></SettingsGroup>)}{!visibleGroups.length&&<EmptyState compact title="Keine passenden Einstellungen" text="Versuche einen anderen Suchbegriff."/>}</>;
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
  const uploadAvatar=async(file:File|undefined)=>{if(!file)return;try{const form=new FormData();form.append("file",file);form.append("purpose","profile_avatar");const result=await apiUpload<{item:{id:string;scanStatus:string;available?:boolean}}>("/api/files",form);if(result.item.available!==true&&result.item.scanStatus!=="clean")throw new Error("Das Profilbild wartet auf die Sicherheitsprüfung. Das bisherige Bild bleibt erhalten.");setAvatarUrl("/api/files/"+result.item.id+"/download");window.dispatchEvent(new Event("binso-profile-changed"));setToast("Profilbild gespeichert.");}catch(e){setToast(e instanceof Error?e.message:"Profilbild konnte nicht gespeichert werden.")}};

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
  return <AppShell title="Persönliche Daten" subtitle="Dein Konto und deine Profildaten." active="einstellungen" editing={editing} unsavedChanges={editing&&currentValues!==baseline} backHref="/einstellungen" backLabel="Einstellungen" mobileActions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" className="icon-button" ariaLabel="Bearbeiten" icon="edit" onClick={beginEdit}/>:undefined} actions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" icon="edit" onClick={beginEdit}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>:undefined}>
    {loading?<LoadingState><LocalizedText>{"Einstellungen werden geladen …"}</LocalizedText></LoadingState>:loadError?<ErrorState onRetry={query.refresh} retryLabel="Erneut versuchen"><LocalizedText>{loadError}</LocalizedText></ErrorState>:<div className="settings-detail-grid">
      <section className="surface settings-profile">
        <Avatar name={displayName==="Benutzer"?"":displayName} identity={email} src={avatarUrl} size="large"/><div><h2>{displayName}</h2><p><LocalizedText>{jobTitle||"Benutzer"}</LocalizedText></p></div>{editing&&<><label className="button button-secondary" htmlFor="profile-avatar-upload"><LocalizedText>{"Bild ändern"}</LocalizedText></label><Input id="profile-avatar-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadAvatar(e.target.files?.[0])}/></>}
      </section>
      {editing?<section className="settings-form">
        <div className="form-grid two">
          <Field label="Vorname"><Input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
          <Field label="Nachname"><Input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
          <Field label="E-Mail"><Input type="email" value={email} readOnly/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
          <Field label="Funktion"><Input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></Field>
        </div>
        <FormActions ><Button requiresWrite disabled={loading||!!loadError||saving} onClick={()=>void save()}><LocalizedText>{saving?"Wird gespeichert…":"Speichern"}</LocalizedText></Button></FormActions>
      </section>:<section className="settings-readonly"><dl className="detail-list"><div><dt><LocalizedText>{"Name"}</LocalizedText></dt><dd>{displayName}</dd></div><div><dt><LocalizedText>{"E-Mail"}</LocalizedText></dt><dd><LocalizedText>{email||"—"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Telefon"}</LocalizedText></dt><dd><LocalizedText>{phone||"—"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Funktion"}</LocalizedText></dt><dd><LocalizedText>{jobTitle||"—"}</LocalizedText></dd></div></dl></section>}
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
      if(pendingLogo){const form=new FormData();form.append("file",pendingLogo);form.append("purpose","company_logo");const result=await apiUpload<{item:{id:string;scanStatus:string;available?:boolean}}>("/api/files",form);if(result.item.available!==true&&result.item.scanStatus!=="clean")throw new Error("Das Firmenlogo wartet auf die Sicherheitsprüfung. Das bisherige Logo bleibt erhalten.");setLogoUrl("/api/files/"+result.item.id+"/download");setPendingLogo(null);setLogoPreview("");}
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

  return <AppShell title="Firma" subtitle="Unternehmensdaten für Dokumente und Kommunikation." active="einstellungen" editing={false} unsavedChanges={false} backHref="/einstellungen" backLabel="Einstellungen" mobileActions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" className="icon-button" ariaLabel="Bearbeiten" icon="edit" onClick={beginEdit}/>:undefined} actions={!editing?<Button requiresWrite disabled={loading||!!loadError} variant="secondary" icon="edit" onClick={beginEdit}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>:undefined}>
    {loading?<LoadingState><LocalizedText>{"Einstellungen werden geladen …"}</LocalizedText></LoadingState>:loadError?<ErrorState onRetry={query.refresh} retryLabel="Erneut versuchen"><LocalizedText>{loadError}</LocalizedText></ErrorState>:<div className="settings-detail-grid">
      <section className="surface company-logo-card">{companyLogoSource(logoPreview||logoUrl)?<LocalizedElement as="img" src={companyLogoSource(logoPreview||logoUrl)} alt="Firmenlogo"/>:<LocalizedElement as="span" className="company-logo-placeholder" role="img" aria-label="Kein Firmenlogo"><Icon name="users"/></LocalizedElement>}<div><b><LocalizedText>{name||"Firma"}</LocalizedText></b><small><LocalizedText>{"Firmenlogo für Angebote, Rechnungen und Dokumente"}</LocalizedText></small></div></section>
      {editing?<FormSheet open={editing} label={onboarding?"Unternehmen einrichten":"Firmendaten bearbeiten"} description={onboarding?"Weitere Unternehmensdaten kannst du jetzt oder später ergänzen.":undefined} onClose={()=>setEditing(false)} busy={saving} dirty={currentValues!==baseline||pendingLogo!==null}><section className="settings-form">
        <div className="form-grid two"><Field label="Firmenlogo" className="full"><Input id="company-logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadLogo(e.target.files?.[0])}/></Field>
          <Field label="Firmenname *"><Input required autoComplete="organization" value={name} onChange={e=>setName(e.target.value)}/></Field>
          <Field label="UID"><Input value={uid} onChange={e=>setUid(e.target.value)}/></Field>
          <Field label="Strasse"><Input value={street} onChange={e=>setStreet(e.target.value)}/></Field>
          <Field label="PLZ"><Input value={postalCode} onChange={e=>setPostalCode(e.target.value)}/></Field>
          <Field label="Ort"><Input value={city} onChange={e=>setCity(e.target.value)}/></Field>
          <Field label="E-Mail"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        </div>
        </section><FormActions sheet><Button requiresWrite disabled={loading||!!loadError||saving} onClick={()=>void save()}><LocalizedText>{saving?"Wird gespeichert…":onboarding?"Einrichtung abschliessen":"Speichern"}</LocalizedText></Button></FormActions>
      </FormSheet>:<section className="settings-readonly"><dl className="detail-list"><div><dt><LocalizedText>{"Firmenname"}</LocalizedText></dt><dd><LocalizedText>{name||"—"}</LocalizedText></dd></div><div><dt><LocalizedText>{"UID"}</LocalizedText></dt><dd><LocalizedText>{uid||"—"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Adresse"}</LocalizedText></dt><dd><LocalizedText>{street||"—"}</LocalizedText><br/><LocalizedText>{[postalCode,city].filter(Boolean).join(" ")||"—"}</LocalizedText></dd></div><div><dt><LocalizedText>{"E-Mail"}</LocalizedText></dt><dd><LocalizedText>{email||"—"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Telefon"}</LocalizedText></dt><dd><LocalizedText>{phone||"—"}</LocalizedText></dd></div></dl></section>}
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
      <p className="technical-hint"><LocalizedText>{"Abonnement-Demo mit synthetischen Beispielen. Es werden keine echten Zahlungen oder Kündigungen ausgelöst."}</LocalizedText></p><section className="plan-hero"><div><span className="eyebrow"><LocalizedText>{"AKTUELLER PLAN"}</LocalizedText></span><h2>{plan}</h2><p><LocalizedText>{"Für wachsende Teams mit allen wichtigen Business-Funktionen."}</LocalizedText></p></div><div className="plan-price"><strong><LocalizedText>{"CHF "}</LocalizedText>{prices[plan]}</strong><span><LocalizedText>{"/ Monat"}</LocalizedText></span></div><Button onClick={()=>setDialog("plan")}><LocalizedText>{"Plan ändern"}</LocalizedText></Button></section>
      <div className="subscription-detail-grid"><section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span><LocalizedText>{"Benutzer"}</LocalizedText></span><b><LocalizedText>{"4 von 10"}</LocalizedText></b></div><div className="usage-bar"><i style={{width:"40%"}}/></div><div className="usage-row"><span><LocalizedText>{"Dateispeicher"}</LocalizedText></span><b><LocalizedText>{"2.4 GB von 20 GB"}</LocalizedText></b></div><div className="usage-bar"><i style={{width:"12%"}}/></div></section><section className="surface"><SectionTitle title="Zahlungsmittel"/><div className="payment-method"><Icon name="card"/><div><b><LocalizedText>{"Visa •••• 4242"}</LocalizedText></b><small><LocalizedText>{"Läuft 08/29 ab"}</LocalizedText></small></div><Button variant="secondary" onClick={()=>setDialog("payment")}><LocalizedText>{"Ändern"}</LocalizedText></Button></div></section></div>
      <section className="surface invoices-panel"><SectionTitle title="Rechnungen"/><div>{[{date:"01.10.2026",number:"BO-2026-10"},{date:"01.09.2026",number:"BO-2026-09"}].map(item=><ListRow key={item.number} title={item.number} meta={item.date} value="CHF 49.00" valueLabel="Gesamtbetrag" status="Bezahlt" tone="success" onClick={()=>setBillingInvoice({date:item.date,amount:"CHF 49.00"})}/>)}</div></section>
      <div className="danger-zone"><div><b><LocalizedText>{"Abonnement kündigen"}</LocalizedText></b><p><LocalizedText>{"Dein Zugriff bleibt bis zum Ende der laufenden Periode aktiv."}</LocalizedText></p></div><Button variant="danger" onClick={()=>setDialog("cancel")}><LocalizedText>{"Kündigung starten"}</LocalizedText></Button></div>
      {dialog&&<FormSheet label={dialog==="plan"?"Plan ändern":dialog==="payment"?"Zahlungsmittel ändern":"Abonnement kündigen"} description={"Demo-Aktion ohne produktive Zahlungsabwicklung."} open={true} onClose={()=>setDialog(null)} busy={billingLoading} className={"subscription-sheet"} layerClassName={""} ariaLabel={dialog==="plan"?"Plan auswählen":dialog==="payment"?"Zahlungsart":"Abonnement"}>{dialog==="plan"&&<div className="plan-choice-list">{["Start","Business","Pro"].map(name=><button type="button" className={plan===name?"selected":""} onClick={()=>setPlan(name)} key={name}><div><b>{name}</b><small><LocalizedText>{"CHF "}</LocalizedText>{prices[name]}<LocalizedText>{" / Monat"}</LocalizedText></small></div>{plan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button onClick={()=>confirm("Demo-Aktion gespeichert.")}><LocalizedText>{"Speichern"}</LocalizedText></Button></div></FormSheet>}
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
      <div><span className="eyebrow"><LocalizedText>{"AKTUELLER PLAN"}</LocalizedText></span><h2><LocalizedText>{planLabel[planKey]??planKey}</LocalizedText></h2><Status tone={subscriptionStatus==="active"?"success":subscriptionStatus==="trial"?"info":"warning"}><LocalizedText>{statusLabel[subscriptionStatus]??"Unbekannt"}</LocalizedText></Status>{!billingDemo&&<p><LocalizedText>{subscriptionStatus==="trial"?"Die Testphase ist aktiv.":"Der hinterlegte Plan für dein Binso One Konto."}</LocalizedText></p>}</div>
      <div className="plan-price"><strong><LocalizedText>{subscriptionStatus==="trial"?"CHF 0.00":contractAmount==null?"—":moneyChf(contractAmount)}</LocalizedText></strong><span><LocalizedText>{subscriptionStatus==="trial"?`noch ${trialDaysRemaining} ${trialDaysRemaining===1?"Tag":"Tage"}`:subscription.billing_interval==="yearly"?"/ Jahr":"/ Monat"}</LocalizedText></span></div>
      {billingDemo?<Status tone="info"><LocalizedText>{"Demo-Modus"}</LocalizedText></Status>:billingConfigured?(billingConnected?<Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}><LocalizedText>{"Billing verwalten"}</LocalizedText></Button>:<Button onClick={()=>setDialog("plan")}><LocalizedText>{"Plan aktivieren"}</LocalizedText></Button>):<Status tone="warning"><LocalizedText>{"Stripe nicht verfügbar"}</LocalizedText></Status>}
    </section>
    {!stripeLive&&billingConfigured&&<p className="technical-hint"><LocalizedText>{"Stripe-Testmodus · keine echten Zahlungen."}</LocalizedText></p>}
    {subscription.cancel_at_period_end===true&&<p className="technical-hint"><LocalizedText>{"Abonnement endet am "}</LocalizedText>{periodEnd}.</p>}
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span><LocalizedText>{"Benutzerlimit"}</LocalizedText></span><b>{String(subscription.user_limit??"—")}</b></div><div className="usage-row"><span><LocalizedText>{"Dateispeicher"}</LocalizedText></span><b><LocalizedText>{storageLabel}</LocalizedText></b></div><div className="usage-row"><span><LocalizedText>{"Kontostatus"}</LocalizedText></span><b><LocalizedText>{accountLabel[accountStatus]??accountStatus}</LocalizedText></b></div><div className="usage-row"><span><LocalizedText>{subscriptionStatus==="trial"?"Testphase bis":"Aktuelle Periode bis"}</LocalizedText></span><b><LocalizedText>{subscriptionStatus==="trial"?trialEnd:periodEnd}</LocalizedText></b></div></section>
      <section className="surface"><SectionTitle title="Zahlungsabwicklung"/>{billingDemo?<div className="context-block"><Status tone="info"><LocalizedText>{"Demo"}</LocalizedText></Status><b><LocalizedText>{"Zahlungen sind in der Demo deaktiviert"}</LocalizedText></b><span><LocalizedText>{"Die Demo-Umgebung verwendet keine echten Stripe-Zahlungen. Für ein echtes Abo registrierst du ein produktives Konto über die Preis- oder Registrierungsseite."}</LocalizedText></span><Button href="/preise"><LocalizedText>{"Pläne ansehen"}</LocalizedText></Button></div>:billingConnected?<div className="context-block"><Status tone="success"><LocalizedText>{"Verbunden"}</LocalizedText></Status><b><LocalizedText>{"Stripe Billing verbunden"}</LocalizedText></b><span><LocalizedText>{"Zahlungsmittel und SaaS-Rechnungen bleiben bei Stripe und werden über das sichere Kundenportal verwaltet."}</LocalizedText></span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}><LocalizedText>{"Billing-Portal öffnen"}</LocalizedText></Button></div>:billingConfigured?<div className="context-block"><Status tone="info"><LocalizedText>{"Bereit"}</LocalizedText></Status><b><LocalizedText>{"Stripe ist konfiguriert"}</LocalizedText></b><span><LocalizedText>{"Wähle einen Plan, um das produktive Abonnement über Stripe Checkout zu starten."}</LocalizedText></span><Button onClick={()=>setDialog("plan")}><LocalizedText>{"Plan auswählen"}</LocalizedText></Button></div>:<div className="context-block"><Status tone="warning"><LocalizedText>{"Nicht verfügbar"}</LocalizedText></Status><b><LocalizedText>{"Zahlungsabwicklung ist derzeit nicht verfügbar"}</LocalizedText></b><span><LocalizedText>{"Bitte versuche es später erneut oder kontaktiere den Support."}</LocalizedText></span></div>}</section>
    </div>
    {billingConfigured&&!billingDemo&&<p className="technical-hint"><LocalizedText>{automaticTax?"Stripe Tax ist für den Checkout aktiviert.":"Steuer-ID wird im Checkout erfasst; allfällige Steuern richten sich nach der produktiven Stripe-Steuerkonfiguration."}</LocalizedText></p>}<section className="surface invoices-panel"><SectionTitle title="SaaS-Abrechnungen"/>{billingConnected?<div className="context-block"><b><LocalizedText>{"Rechnungen und Zahlungsmittel in Stripe"}</LocalizedText></b><span><LocalizedText>{"Binso One speichert keine vollständigen Kartendaten. Öffne das Billing-Portal für Rechnungsdownloads und Zahlungsmittel."}</LocalizedText></span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}><LocalizedText>{"Billing-Portal"}</LocalizedText></Button></div>:<EmptyState icon="card" title="Noch keine Billing-Daten" text="Es werden keine erfundenen Zahlungsmittel oder SaaS-Rechnungen angezeigt."/>}</section>
    <div className="danger-zone"><div><b><LocalizedText>{"Abonnement verwalten"}</LocalizedText></b><p><LocalizedText>{billingConnected?"Planwechsel, Zahlungsmittel und Kündigung werden über Stripe Billing ausgeführt.":"Ohne verbundenes Billing gibt es hier keine produktive Kündigungsaktion."}</LocalizedText></p></div><Button variant="secondary" disabled={!billingConnected||billingLoading} onClick={()=>void openPortal()}><LocalizedText>{"Abonnement verwalten"}</LocalizedText></Button></div>

    {dialog==="plan"&&billingConfigured&&!billingConnected&&<FormSheet label={"Plan auswählen"} description={"Checkout und Zahlungsdaten werden sicher bei Stripe verarbeitet."} open={true} onClose={()=>setDialog(null)} busy={billingLoading} className={"subscription-sheet"} layerClassName={""} ariaLabel={dialog==="plan"?"Plan auswählen":dialog==="payment"?"Zahlungsart":"Abonnement"}><div className="sheet-body"><Field label="Zahlungszeitraum"><Select value={billingCycle} onChange={e=>setBillingCycle(e.target.value as "monthly"|"yearly")}><option value="monthly"><LocalizedText>{"Monatlich"}</LocalizedText></option><option value="yearly"><LocalizedText>{"Jährlich"}</LocalizedText></option></Select></Field><div className="plan-choice-list">{(["start","business","pro"] as const).map(name=>{const price=catalog.find(item=>item.plan===name&&item.billing===billingCycle);return <button type="button" disabled={!price?.available} className={selectedPlan===name?"selected":""} onClick={()=>setSelectedPlan(name)} key={name}><div><b>{planLabel[name]}</b><small><LocalizedText>{price?.available?moneyChf(price.amount)+(billingCycle==="yearly"?" / Jahr":" / Monat"):"Noch nicht eingerichtet"}</LocalizedText></small></div>{selectedPlan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>})}</div><label className="billing-legal-consent"><Input type="checkbox" checked={acceptedPaidTerms} onChange={e=>setAcceptedPaidTerms(e.target.checked)}/><span><LocalizedText>{"Ich bestätige den kostenpflichtigen Abschluss gemäss "}</LocalizedText><Link prefetch={false} href="/agb" target="_blank"><LocalizedText>{"AGB"}</LocalizedText></Link><LocalizedText>{" und habe "}</LocalizedText><Link prefetch={false} href="/datenschutz" target="_blank"><LocalizedText>{"Datenschutz"}</LocalizedText></Link><LocalizedText>{" sowie "}</LocalizedText><Link prefetch={false} href="/auftragsbearbeitung" target="_blank"><LocalizedText>{"Auftragsbearbeitung"}</LocalizedText></Link><LocalizedText>{" zur Kenntnis genommen."}</LocalizedText></span></label><p className="technical-hint"><LocalizedText>{"Das Abonnement wird erst durch den erfolgreichen Stripe-Checkout aktiviert. Laufzeit und Preis werden vor dem Abschluss nochmals angezeigt."}</LocalizedText></p></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button onClick={()=>void startCheckout()} disabled={billingLoading||!acceptedPaidTerms||!catalog.some(item=>item.plan===selectedPlan&&item.billing===billingCycle&&item.available)}><LocalizedText>{billingLoading?"Checkout wird geöffnet…":"Kostenpflichtig zu Stripe"}</LocalizedText></Button></div></FormSheet>}
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
    {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
    {!ready&&!error&&<LoadingState><LocalizedText>{"Einstellungen werden geladen …"}</LocalizedText></LoadingState>}
    <SettingsGroup title="Benachrichtigungen"><section className="preference-table">{rows.map(([title,text])=><div className="preference-row" key={title}><div><b><LocalizedText>{title}</LocalizedText></b><small><LocalizedText>{text}</LocalizedText></small></div><div className="preference-channels">{(["email","push"] as const).map(channel=><label key={channel}><span><LocalizedText>{channel==="email"?"E-Mail":"Push"}</LocalizedText></span><Toggle checked={prefs[title][channel]} disabled={!ready||saving.includes(title+channel)} onChange={()=>void toggle(title,channel)} label={`${channel==="email"?"E-Mail":"Push"} ${title}`}/></label>)}</div></div>)}</section></SettingsGroup>
  </AppShell>;
}

/** Language availability reflects the translated interface, not the database enum. */
function LanguagePreference(){
 const production=useBackendMode();const {locale,choose}=useLocale();
 const [error,setError]=useState("");
 const save=async(code:string)=>{const next=asLocale(code);try{if(production)await apiPatch("/api/settings/profile",{language:next});choose(next);setError("");}catch{setError("Sprache konnte nicht gespeichert werden.")}};
 return <><Field label="Sprache" allowReadOnlyInput><Select value={locale} onChange={event=>void save(event.target.value)}>{locales.map(code=><option key={code} value={code} lang={code}>{localeNames[code]}</option>)}</Select></Field>{error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}<p className="settings-note"><LocalizedText>{"Die gewählte Sprache gilt für die gesamte Benutzeroberfläche."}</LocalizedText></p></>;
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
  {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
  <SettingsGroup title="Darstellung"><SelectionRows label="Darstellung" value={theme} options={themeOptions} onChange={choose}/></SettingsGroup>
  <SettingsGroup title="Sprache"><div className="settings-group-fields"><LanguagePreference/></div></SettingsGroup>
 </AppShell>;
}
