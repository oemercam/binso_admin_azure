"use client";
import {useSetupField} from "../use-setup-field";
import {setupFieldIds} from "@/lib/action-readiness";
import {SetupGuidePreference} from "../setup-guide";
import {SetupProcess} from '../setup-process';
import {PushDeviceSettings} from "../push-device-settings";
import {SettingsNavigation} from "../settings-navigation";
import {FileUpload} from "../file-upload";
import {useBrowserBackGuard,allowDraftNavigation} from "../use-browser-back-guard";
import ConfirmDialog from "../confirm-dialog";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {useLocale} from "@/lib/client/locale";
import {asLocale,localeNames,locales,localeTags} from "@/lib/locales/config";
import {useLanguagePreference} from "@/lib/client/use-language-preference";
import {companyLogoSource} from "@/lib/image-url";
import {useApiQuery} from "@/lib/client/use-api-query";
import {AvatarUpload} from "../avatar-upload";
import type {AvatarCrop} from '@/lib/avatar-crop';
import {Avatar} from "../avatar";
import {usePageAccess} from "@/lib/client/page-access";
import {FormPage,ActionsMenu,ActionRow,ActionSheet,FormSheet,ListRow,SelectionRows,SettingsGroup} from "../binso-ux";

import Link from "next/link";
import {Monitor} from "lucide-react";
import { saveTheme, type ThemeMode } from "@/lib/client/theme";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { apiGet, apiDelete,apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { plans as subscriptionPlans } from "@/lib/plans";
import { legalConfig } from "@/config/legal";
import {Button, EmptyState, Field, Icon, SectionTitle, Status, Toast, Toggle, Input, FormActions, Select, LoadingState, ErrorState} from "../ui";
import {formatCurrency} from "@/lib/financial-status";

export function SettingsPage() {
  return <AppShell title="Einstellungen" active="einstellungen" backHref="/dashboard">
    <SetupGuidePreference/><SettingsNavigation/>
  </AppShell>;
}

export function AccountSettingsPage() {

  const [profileName,setProfileName]=useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [jobTitle,setJobTitle]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const query=useApiQuery<{item?:Record<string,unknown>|null;email?:string|null}>("/api/settings/profile");
  const loading=query.loading,loadError=query.error;
  const [saving,setSaving]=useState(false);
  const saveBusy=useRef(false);
  const [baseline,setBaseline]=useState("");
  const currentValues=JSON.stringify([firstName,lastName,phone,jobTitle]);
  const beginEdit=()=>{setBaseline(currentValues);setEditing(true)};
  const [avatarUrl,setAvatarUrl]=useState("");
  const [avatarUploading,setAvatarUploading]=useState(false);
  const [avatarError,setAvatarError]=useState("");
  const avatarPending=useRef(false);
  const [pendingAvatar,setPendingAvatar]=useState<{id:string;expectedUrl:string}|null>(null);
  const removeAvatar=async()=>{const match=avatarUrl.match(/^\/api\/files\/([0-9a-f-]{36})\/download$/i);if(!match||avatarPending.current||saveBusy.current)return;avatarPending.current=true;setAvatarUploading(true);setAvatarError('');try{await apiDelete('/api/files/'+match[1]);setAvatarUrl('');setPendingAvatar(null);query.refresh();window.dispatchEvent(new Event('binso-profile-changed'));}catch(error){setAvatarError(error instanceof Error?error.message:'Profilbild konnte nicht entfernt werden.');}finally{avatarPending.current=false;setAvatarUploading(false)}};
  const uploadAvatar=async(file:File|undefined,crop?:AvatarCrop)=>{
    if(!file||avatarPending.current||saveBusy.current)return false;avatarPending.current=true;setAvatarUploading(true);setAvatarError("");
    try{
      const form=new FormData();form.append("file",file);form.append("purpose","profile_avatar");
      if(crop)form.append('avatarCrop',JSON.stringify(crop));
      const result=await apiUpload<{item:{id:string;scanStatus:string;available:boolean}}>("/api/files",form);
      if(result.item.available!==true){
        setPendingAvatar({id:result.item.id,expectedUrl:avatarUrl});
        const message="Das Profilbild wartet auf die Sicherheitsprüfung. Das bisherige Bild bleibt erhalten.";setAvatarError(message);setToast(message);return true;
      }
      setPendingAvatar(null);setAvatarUrl("/api/files/"+result.item.id+"/download");query.refresh();window.dispatchEvent(new Event("binso-profile-changed"));setToast("Profilbild gespeichert.");return true;
    }catch(e){const message=e instanceof Error?e.message:"Profilbild konnte nicht gespeichert werden.";setAvatarError(message);setToast(message);return false;}finally{avatarPending.current=false;setAvatarUploading(false)}
  };
  const activatePendingAvatar=async()=>{
    if(!pendingAvatar||avatarPending.current||saveBusy.current)return;avatarPending.current=true;setAvatarUploading(true);setAvatarError('');
    try{
      const result=await apiPatch<{activated:boolean;item:{id:string}}>('/api/files/'+pendingAvatar.id,{action:'activate_profile_avatar',expectedAvatarUrl:pendingAvatar.expectedUrl});
      if(result.activated!==true||result.item.id!==pendingAvatar.id)throw new Error('Profilbild konnte nicht gespeichert werden.');
      setAvatarUrl('/api/files/'+result.item.id+'/download');setPendingAvatar(null);query.refresh();window.dispatchEvent(new Event('binso-profile-changed'));setToast('Profilbild gespeichert.');
    }catch(error){setAvatarError(error instanceof Error?error.message:'Profilbild konnte nicht gespeichert werden.');}finally{avatarPending.current=false;setAvatarUploading(false)}
  };

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
    if(loading||loadError||saveBusy.current||avatarPending.current)return;saveBusy.current=true;setSaving(true);
    try{
      {}
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
  return <AppShell title="Persönliche Daten" active="einstellungen" editing={editing} unsavedChanges={false} backHref="/einstellungen" backLabel="Einstellungen" mobileActions={!editing?<ActionsMenu header label="Weitere Aktionen"><ActionRow requiresWrite disabled={loading||!!loadError} icon="edit" title="Bearbeiten" onClick={beginEdit}/></ActionsMenu>:undefined} actions={!editing?<ActionsMenu header label="Weitere Aktionen"><ActionRow requiresWrite disabled={loading||!!loadError} icon="edit" title="Bearbeiten" onClick={beginEdit}/></ActionsMenu>:undefined}>
    {loading?<LoadingState><LocalizedText>{"Einstellungen werden geladen …"}</LocalizedText></LoadingState>:loadError?<ErrorState onRetry={query.refresh} retryLabel="Erneut versuchen"><LocalizedText>{loadError}</LocalizedText></ErrorState>:<div className="settings-detail-grid">
      <section className="surface settings-profile">
        <Avatar name={displayName==="Benutzer"?"":displayName} identity={email} src={avatarUrl} size="large"/><div><h2>{displayName}</h2><p><LocalizedText verbatim={!!jobTitle}>{jobTitle||"Benutzer"}</LocalizedText></p></div>
      </section>
      {editing?<FormPage label="Persönliche Daten bearbeiten" open onClose={()=>setEditing(false)} busy={saving||avatarUploading} dirty={currentValues!==baseline}><form className="settings-form" onSubmit={event=>{event.preventDefault();void save();}}>
        <AvatarUpload name={displayName} src={avatarUrl} busy={saving||avatarUploading} error={avatarError} onConfirm={uploadAvatar} onRemove={()=>void removeAvatar()}/>
        {pendingAvatar&&<Button variant="secondary" disabled={saving||avatarUploading} onClick={()=>void activatePendingAvatar()}><LocalizedText>Bild übernehmen</LocalizedText></Button>}
        <div className="form-grid two">
          <Field label="Vorname"><Input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
          <Field label="Nachname"><Input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
          <Field label="E-Mail"><Input type="email" value={email} readOnly/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
          <Field label="Funktion"><Input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></Field>
        </div>
        <FormActions sheet><Button variant="secondary" onClick={()=>setEditing(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button requiresWrite disabled={loading||!!loadError||saving||avatarUploading} type="submit"><LocalizedText>{saving?"Wird gespeichert…":"Speichern"}</LocalizedText></Button></FormActions>
      </form></FormPage>:<section className="settings-readonly"><dl className="detail-list settings-master-data"><div><dt><LocalizedText>{"Name"}</LocalizedText></dt><dd>{displayName}</dd></div><div><dt><LocalizedText>{"E-Mail"}</LocalizedText></dt><dd><LocalizedText>{email||"Nicht hinterlegt"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Telefon"}</LocalizedText></dt><dd><LocalizedText>{phone||"Nicht hinterlegt"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Funktion"}</LocalizedText></dt><dd><LocalizedText>{jobTitle||"Nicht hinterlegt"}</LocalizedText></dd></div></dl></section>}
    </div>}
    {toast&&<Toast title={toast} tone={["Persönliche Daten gespeichert.","Firmendaten gespeichert.","Profilbild gespeichert.","Firmenlogo gespeichert."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}

export function CompanySettingsPage(){
 const search=useSearchParams();
 return search.get('setup')==='1'||search.get('onboarding')==='1'||['name','address','bank'].includes(search.get('setupStep')??'')?<SetupProcess/>:<CompanySettingsDetail/>;
}
function CompanySettingsDetail() {

  const router=useRouter(),search=useSearchParams();
  const onboarding=search.get("onboarding")==="1";
  const onboardingOpened=useRef(false);
  const [name,setName]=useState("");
  const [legalName,setLegalName]=useState(""),[countryCode,setCountryCode]=useState("CH");
  const {write}=usePageAccess();
  const [uid,setUid]=useState("");
  const [logoUrl,setLogoUrl]=useState("");
  const [street,setStreet]=useState("");
  const [buildingNumber,setBuildingNumber]=useState("");
  const [postalCode,setPostalCode]=useState("");
  const [city,setCity]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const query=useApiQuery<{item:Record<string,unknown>}>("/api/settings/company");
  const [hydratedItem,setHydratedItem]=useState<Record<string,unknown>|null>(null);
  const loading=query.loading||Boolean(query.data&&query.data.item!==hydratedItem&&!editing),loadError=query.error;
  const [saving,setSaving]=useState(false);
  const saveBusy=useRef(false);
  const [baseline,setBaseline]=useState("");
  const currentValues=JSON.stringify([name,uid,street,buildingNumber,postalCode,city,email,phone,legalName,countryCode]);



  const [pendingLogo,setPendingLogo]=useState<File|null>(null);
  const [removeLogo,setRemoveLogo]=useState(false);
  const [logoPreview,setLogoPreview]=useState("");
  const beginEdit=()=>{setPendingLogo(null);setLogoPreview("");setRemoveLogo(false);setBaseline(currentValues);setEditing(true)};
  const fieldRecovery=useSetupField(["name","legalName","street","postalCode","city","countryCode","logo"],!loading&&!loadError,editing,beginEdit,write&&!onboarding);
  useEffect(()=>()=>{if(logoPreview)URL.revokeObjectURL(logoPreview)},[logoPreview]);
  const uploadLogo=(file:File)=>{setPendingLogo(file);setRemoveLogo(false);setLogoPreview(URL.createObjectURL(file))};

  useEffect(()=>{
    if(editing||!query.data)return;
    const item=query.data.item;let active=true;
    queueMicrotask(()=>{if(!active)return;
      setName(String(item.name??""));setLegalName(String(item.legal_name??""));setCountryCode(String(item.country_code??"CH"));setUid(String(item.uid??""));setLogoUrl(String(item.logo_url??""));setStreet(String(item.street??""));setBuildingNumber(String(item.building_number??""));
      setPostalCode(String(item.postal_code??""));setCity(String(item.city??""));setEmail(String(item.email??""));setPhone(String(item.phone??""));setHydratedItem(item);
      if(onboarding&&!onboardingOpened.current){onboardingOpened.current=true;setBaseline(JSON.stringify([String(item.name??""),String(item.uid??""),String(item.street??""),String(item.building_number??""),String(item.postal_code??""),String(item.city??""),String(item.email??""),String(item.phone??""),String(item.legal_name??""),String(item.country_code??"CH")]));setEditing(true);}
    });
    return()=>{active=false};
  },[editing,query.data,onboarding]);

  const save=async(message="Firmendaten gespeichert.")=>{
    if(loading||loadError||saveBusy.current)return;saveBusy.current=true;setSaving(true);
    try{
      {}
      if(!name.trim()){throw new Error("Firmenname ist erforderlich.")}
      if(pendingLogo){const form=new FormData();form.append("file",pendingLogo);form.append("purpose","company_logo");const result=await apiUpload<{item:{id:string;scanStatus:string;available:boolean}}>("/api/files",form);if(result.item.available!==true)throw new Error("Das Firmenlogo wartet auf die Sicherheitsprüfung. Das bisherige Logo bleibt erhalten.");setLogoUrl("/api/files/"+result.item.id+"/download");setPendingLogo(null);setLogoPreview("");}
      await apiPatch("/api/settings/company",{name,uid,street,buildingNumber,postalCode,city,email,phone,legalName,countryCode,...(removeLogo?{logoUrl:""}:{}),completeOnboarding:onboarding});
      if(removeLogo){setLogoUrl("");setRemoveLogo(false);}
      query.refresh();
      if(onboarding){allowDraftNavigation();router.replace("/dashboard");return;}
      setToast(message);
      setEditing(false);
      if(fieldRecovery.returnTo){allowDraftNavigation();router.push(fieldRecovery.returnTo);}
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmendaten konnten nicht gespeichert werden.");
    }
    finally{saveBusy.current=false;setSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const [setupDiscard,setSetupDiscard]=useState(false),[setupDestination,setSetupDestination]=useState<string|null>(null),[setupBack,setSetupBack]=useState(false);
  const setupDirty=baseline!==""&&(currentValues!==baseline||pendingLogo!==null||removeLogo);
  const leaveSetup=useBrowserBackGuard(onboarding&&(setupDirty||saving),()=>{if(!saving){setSetupDestination(null);setSetupBack(true);setSetupDiscard(true)}},setupDirty||saving,url=>{if(!saving){setSetupDestination(url);setSetupBack(false);setSetupDiscard(true)}});
  const companyForm=<><form id="company-settings-form" className="settings-form" onSubmit={event=>{event.preventDefault();void save();}}>
        <div className="form-grid two"><FileUpload id="company-logo-upload" label="Firmenlogo" className="full" file={pendingLogo} preview={companyLogoSource(removeLogo?"":logoPreview||logoUrl)||undefined} accept={['image/png','image/jpeg','image/webp']} onSelect={uploadLogo} onRemove={()=>{setPendingLogo(null);setLogoPreview("");setRemoveLogo(true);}} busy={saving}/>
          <Field label="Firmenname *"><Input id={setupFieldIds.name} required autoComplete="organization" value={name} onChange={e=>setName(e.target.value)}/></Field>
          <Field label="Rechtlicher Firmenname"><Input id={setupFieldIds.legalName} value={legalName} maxLength={70} onChange={e=>setLegalName(e.target.value)}/></Field><Field label="UID"><Input value={uid} onChange={e=>setUid(e.target.value)}/></Field>
          <Field label="Strasse"><Input id={setupFieldIds.street} value={street} onChange={e=>setStreet(e.target.value)}/></Field><Field label="Hausnummer"><Input maxLength={30} value={buildingNumber} onChange={e=>setBuildingNumber(e.target.value)}/></Field>
          <Field label="PLZ"><Input id={setupFieldIds.postalCode} value={postalCode} onChange={e=>setPostalCode(e.target.value)}/></Field>
          <Field label="Ort"><Input id={setupFieldIds.city} value={city} onChange={e=>setCity(e.target.value)}/></Field>
          <Field label="Ländercode"><Input id={setupFieldIds.countryCode} autoComplete="country" maxLength={2} value={countryCode} onChange={e=>setCountryCode(e.target.value.toUpperCase())}/></Field><Field label="E-Mail"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Telefon"><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        </div>
        </form><FormActions sheet>{onboarding&&<Button variant="secondary" disabled={saving} onClick={()=>{setSetupDestination(null);setSetupBack(false);if(setupDirty)setSetupDiscard(true);else router.replace("/dashboard")}}><LocalizedText>{"Später fortsetzen"}</LocalizedText></Button>}<Button requiresWrite disabled={loading||!!loadError||saving} type="submit" form="company-settings-form"><LocalizedText>{saving?"Wird gespeichert…":onboarding?"Einrichtung abschliessen":"Speichern"}</LocalizedText></Button></FormActions>
 </>;
  return <AppShell title={onboarding?"Unternehmen einrichten":"Firma"} active="einstellungen" editing={editing} unsavedChanges={false} backHref={fieldRecovery.returnTo??"/einstellungen"} backLabel={fieldRecovery.returnTo?"Zurück":"Einstellungen"} mobileActions={!editing&&!onboarding?<ActionsMenu header label="Weitere Aktionen"><ActionRow requiresWrite disabled={loading||!!loadError} icon="edit" title="Bearbeiten" onClick={beginEdit}/></ActionsMenu>:undefined} actions={!editing&&!onboarding?<ActionsMenu header label="Weitere Aktionen"><ActionRow requiresWrite disabled={loading||!!loadError} icon="edit" title="Bearbeiten" onClick={beginEdit}/></ActionsMenu>:undefined}>
    {loading?<LoadingState><LocalizedText>{"Einstellungen werden geladen …"}</LocalizedText></LoadingState>:loadError?<ErrorState onRetry={query.refresh} retryLabel="Erneut versuchen"><LocalizedText>{loadError}</LocalizedText></ErrorState>:<div className="settings-detail-grid">
      {!editing&&<section className="surface company-logo-card">{companyLogoSource(logoPreview||logoUrl)?<LocalizedElement as="img" src={companyLogoSource(logoPreview||logoUrl)} alt="Firmenlogo"/>:<LocalizedElement as="span" className="company-logo-placeholder" role="img" aria-label="Kein Firmenlogo"><Icon name="users"/></LocalizedElement>}<div><b><LocalizedText verbatim={!!name}>{name||"Firma"}</LocalizedText></b><small><LocalizedText>{"Firmenlogo für Angebote, Rechnungen und Dokumente"}</LocalizedText></small></div></section>}
      {editing?(onboarding?<section className="company-setup-page">{companyForm}</section>:<FormPage open={editing} label="Firmendaten bearbeiten" onClose={()=>{setEditing(false);setPendingLogo(null);setLogoPreview("");setRemoveLogo(false);if(fieldRecovery.returnTo){allowDraftNavigation();router.push(fieldRecovery.returnTo)}}} busy={saving} dirty={currentValues!==baseline||pendingLogo!==null||removeLogo}>{companyForm}
      </FormPage>):<section className="settings-readonly"><dl className="detail-list settings-master-data"><div><dt><LocalizedText>{"Firmenname"}</LocalizedText></dt><dd><LocalizedText verbatim={true}>{name||"Nicht hinterlegt"}</LocalizedText></dd></div><div><dt><LocalizedText>{"UID"}</LocalizedText></dt><dd><LocalizedText>{uid||"Nicht hinterlegt"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Adresse"}</LocalizedText></dt><dd><LocalizedText>{[street,buildingNumber].filter(Boolean).join(" ")||"Nicht hinterlegt"}</LocalizedText><br/><LocalizedText>{[postalCode,city].filter(Boolean).join(" ")||"Nicht hinterlegt"}</LocalizedText></dd></div><div><dt><LocalizedText>{"E-Mail"}</LocalizedText></dt><dd><LocalizedText>{email||"Nicht hinterlegt"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Telefon"}</LocalizedText></dt><dd><LocalizedText>{phone||"Nicht hinterlegt"}</LocalizedText></dd></div></dl></section>}
    </div>}
    <ConfirmDialog open={setupDiscard} busy={saving} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." onCancel={()=>{setSetupDiscard(false);setSetupDestination(null);setSetupBack(false)}} confirmLabel="Änderungen verwerfen" onConfirm={()=>{allowDraftNavigation();setSetupDiscard(false);if(setupDestination)window.location.assign(setupDestination);else if(setupBack)leaveSetup();else router.replace("/dashboard")}}/>
    {toast&&<Toast title={toast} tone={["Persönliche Daten gespeichert.","Firmendaten gespeichert.","Profilbild gespeichert.","Firmenlogo gespeichert."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}

export function SubscriptionSettingsPage() {
  const {locale}=useLocale();
  const money=(value:unknown)=>formatCurrency(value,"CHF",localeTags[locale]);

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
  const [referenceNow]=useState(()=>Date.now());

  const prices:Record<string,string>=Object.fromEntries(subscriptionPlans.flatMap(p=>[[p.name,String(p.monthly)],[p.id,String(p.monthly)]]));
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};

  useEffect(()=>{
    {}
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
  },[]);

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

  {}

  if(!subscription) return <AppShell title="Abonnement" active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">{billingError?<div role="alert"><EmptyState  title="Abonnement nicht verfügbar" description={billingError}/></div>:<LoadingState/>}</AppShell>;

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
  const storageLabel=storageLimit>0?(storageLimit/1024/1024/1024).toLocaleString(localeTags[locale],{maximumFractionDigits:1})+" GB":"—";
  const periodEnd=subscription.current_period_ends_at?new Date(String(subscription.current_period_ends_at)).toLocaleDateString(localeTags[locale],{timeZone:"Europe/Zurich"}):"—";
  const trialEndDate=subscription.trial_ends_at?new Date(String(subscription.trial_ends_at)):null;
  const trialEnd=trialEndDate?trialEndDate.toLocaleDateString(localeTags[locale],{timeZone:"Europe/Zurich"}):"—";
  const trialDaysRemaining=trialEndDate?Math.max(0,Math.ceil((trialEndDate.getTime()-referenceNow)/86400000)):0;

  return <AppShell title="Abonnement" subtitle="Plan, Nutzung und Kontostatus." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="plan-hero">
      <div><span className="eyebrow"><LocalizedText>{"AKTUELLER PLAN"}</LocalizedText></span><h2><LocalizedText>{planLabel[planKey]??planKey}</LocalizedText></h2><Status tone={subscriptionStatus==="active"?"success":subscriptionStatus==="trial"?"info":"warning"}><LocalizedText>{statusLabel[subscriptionStatus]??"Unbekannt"}</LocalizedText></Status>{!billingDemo&&<p><LocalizedText>{subscriptionStatus==="trial"?"Die Testphase ist aktiv.":"Der hinterlegte Plan für dein Binso One Konto."}</LocalizedText></p>}</div>
      <div className="plan-price"><strong><LocalizedText>{subscriptionStatus==="trial"?money(0):contractAmount==null?"—":money(contractAmount)}</LocalizedText></strong><span><LocalizedText>{subscriptionStatus==="trial"?`noch ${trialDaysRemaining} ${trialDaysRemaining===1?"Tag":"Tage"}`:subscription.billing_interval==="yearly"?"/ Jahr":"/ Monat"}</LocalizedText></span></div>
      {billingDemo?<Status tone="info"><LocalizedText>{"Demo-Modus"}</LocalizedText></Status>:billingConfigured?(billingConnected?<Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}><LocalizedText>{"Billing verwalten"}</LocalizedText></Button>:<Button onClick={()=>setDialog("plan")}><LocalizedText>{"Plan aktivieren"}</LocalizedText></Button>):<Status tone="warning"><LocalizedText>{"Stripe nicht verfügbar"}</LocalizedText></Status>}
    </section>
    {!stripeLive&&billingConfigured&&<p className="technical-hint"><LocalizedText>{"Stripe-Testmodus · keine echten Zahlungen."}</LocalizedText></p>}
    {subscription.cancel_at_period_end===true&&<p className="technical-hint"><LocalizedText>{"Abonnement endet am "}</LocalizedText>{periodEnd}.</p>}
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span><LocalizedText>{"Benutzerlimit"}</LocalizedText></span><b>{String(subscription.user_limit??"—")}</b></div><div className="usage-row"><span><LocalizedText>{"Dateispeicher"}</LocalizedText></span><b><LocalizedText>{storageLabel}</LocalizedText></b></div><div className="usage-row"><span><LocalizedText>{"Kontostatus"}</LocalizedText></span><b><LocalizedText>{accountLabel[accountStatus]??accountStatus}</LocalizedText></b></div><div className="usage-row"><span><LocalizedText>{subscriptionStatus==="trial"?"Testphase bis":"Aktuelle Periode bis"}</LocalizedText></span><b><LocalizedText>{subscriptionStatus==="trial"?trialEnd:periodEnd}</LocalizedText></b></div></section>
      <section className="surface"><SectionTitle title="Zahlungsabwicklung"/>{billingDemo?<div className="context-block"><Status tone="info"><LocalizedText>{"Demo"}</LocalizedText></Status><b><LocalizedText>{"Zahlungen sind in der Demo deaktiviert"}</LocalizedText></b><span><LocalizedText>{"Die Demo-Umgebung verwendet keine echten Stripe-Zahlungen. Für ein echtes Abo registrierst du ein produktives Konto über die Preis- oder Registrierungsseite."}</LocalizedText></span><Button href="/preise"><LocalizedText>{"Pläne ansehen"}</LocalizedText></Button></div>:billingConnected?<div className="context-block"><Status tone="success"><LocalizedText>{"Verbunden"}</LocalizedText></Status><b><LocalizedText>{"Abonnement aktiv"}</LocalizedText></b><span><LocalizedText>{"Zahlungsmittel und SaaS-Rechnungen bleiben bei Stripe und werden über das sichere Kundenportal verwaltet."}</LocalizedText></span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}><LocalizedText>{"Billing-Portal öffnen"}</LocalizedText></Button></div>:billingConfigured?<div className="context-block"><Status tone="info"><LocalizedText>{"Bereit"}</LocalizedText></Status><b><LocalizedText>{"Abonnement starten"}</LocalizedText></b><span><LocalizedText>{"Wähle deinen Plan. Preis und Laufzeit werden vor dem Abschluss angezeigt."}</LocalizedText></span><Button onClick={()=>setDialog("plan")}><LocalizedText>{"Plan auswählen"}</LocalizedText></Button></div>:<div className="context-block"><Status tone="warning"><LocalizedText>{"Nicht verfügbar"}</LocalizedText></Status><b><LocalizedText>{"Zahlungsabwicklung ist derzeit nicht verfügbar"}</LocalizedText></b><span><LocalizedText>{"Bitte versuche es später erneut oder kontaktiere den Support."}</LocalizedText></span></div>}</section>
    </div>
    {billingConfigured&&!billingDemo&&<p className="technical-hint"><LocalizedText>{automaticTax?"Allfällige Steuern werden vor dem Abschluss angezeigt.":"Steuerangaben und allfällige Steuern werden vor dem Abschluss angezeigt."}</LocalizedText></p>}<section className="surface invoices-panel"><SectionTitle title="Abrechnungen"/>{billingConnected?<div className="context-block"><b><LocalizedText>{"Rechnungen und Zahlungsmittel in Stripe"}</LocalizedText></b><span><LocalizedText>{"Binso One speichert keine vollständigen Kartendaten. Öffne das Billing-Portal für Rechnungsdownloads und Zahlungsmittel."}</LocalizedText></span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}><LocalizedText>{"Billing-Portal"}</LocalizedText></Button></div>:<EmptyState  title="Noch keine Abrechnungen" />}</section>
    <div className="danger-zone"><div><b><LocalizedText>{"Abonnement verwalten"}</LocalizedText></b><p><LocalizedText>{billingConnected?"Planwechsel, Zahlungsmittel und Kündigung werden über Stripe Billing ausgeführt.":"Du hast noch kein kostenpflichtiges Abonnement."}</LocalizedText></p></div><Button variant="secondary" disabled={!billingConnected||billingLoading} onClick={()=>void openPortal()}><LocalizedText>{"Abonnement verwalten"}</LocalizedText></Button></div>

    {dialog==="plan"&&billingConfigured&&!billingConnected&&<FormSheet label={"Plan auswählen"} description={"Checkout und Zahlungsdaten werden sicher bei Stripe verarbeitet."} open={true} onClose={()=>setDialog(null)} busy={billingLoading} className={"subscription-sheet"} layerClassName={""} ariaLabel={dialog==="plan"?"Plan auswählen":dialog==="payment"?"Zahlungsart":"Abonnement"}><div className="sheet-body"><Field label="Zahlungszeitraum"><Select value={billingCycle} onChange={e=>setBillingCycle(e.target.value as "monthly"|"yearly")}><option value="monthly"><LocalizedText>{"Monatlich"}</LocalizedText></option><option value="yearly"><LocalizedText>{"Jährlich"}</LocalizedText></option></Select></Field><div className="plan-choice-list">{(["start","business","pro"] as const).map(name=>{const price=catalog.find(item=>item.plan===name&&item.billing===billingCycle);return <button type="button" disabled={!price?.available} className={selectedPlan===name?"selected":""} onClick={()=>setSelectedPlan(name)} key={name}><div><b>{planLabel[name]}</b><small><LocalizedText>{price?.available?money(price.amount)+(billingCycle==="yearly"?" / Jahr":" / Monat"):"Noch nicht eingerichtet"}</LocalizedText></small></div>{selectedPlan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>})}</div><label className="billing-legal-consent"><Input type="checkbox" checked={acceptedPaidTerms} onChange={e=>setAcceptedPaidTerms(e.target.checked)}/><span><LocalizedText>{"Ich bestätige den kostenpflichtigen Abschluss gemäss "}</LocalizedText><Link prefetch={false} href="/agb" target="_blank"><LocalizedText>{"AGB"}</LocalizedText></Link><LocalizedText>{" und habe "}</LocalizedText><Link prefetch={false} href="/datenschutz" target="_blank"><LocalizedText>{"Datenschutz"}</LocalizedText></Link><LocalizedText>{" sowie "}</LocalizedText><Link prefetch={false} href="/auftragsbearbeitung" target="_blank"><LocalizedText>{"Auftragsbearbeitung"}</LocalizedText></Link><LocalizedText>{" zur Kenntnis genommen."}</LocalizedText></span></label><p className="technical-hint"><LocalizedText>{"Das Abonnement wird erst durch den erfolgreichen Stripe-Checkout aktiviert. Laufzeit und Preis werden vor dem Abschluss nochmals angezeigt."}</LocalizedText></p></div><FormActions sheet><Button variant="secondary" onClick={()=>setDialog(null)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button onClick={()=>void startCheckout()} disabled={billingLoading||!acceptedPaidTerms||!catalog.some(item=>item.plan===selectedPlan&&item.billing===billingCycle&&item.available)}><LocalizedText>{billingLoading?"Checkout wird geöffnet…":"Kostenpflichtig zu Stripe"}</LocalizedText></Button></FormActions></FormSheet>}
    {toast&&<Toast title={toast} tone={toast.startsWith("Stripe Checkout abgeschlossen.")||toast==="Planwechsel abgebrochen."?"info":"danger"}/>}
  </AppShell>;
}

export function NotificationSettingsPage() {
  const labels=useId();
  const [channels,setChannels]=useState({email:true,push:false});
  const rows = [
    ["Rechnungen","Zahlungen, Überfälligkeit und Mahnungen"],
    ["Angebote","Angenommen, abgelehnt oder abgelaufen"],
    ["Support","Neue Antworten und Statusänderungen"],
    ["Zeiterfassung","Erinnerungen und laufende Timer"],
    ["Spesen","Freigaben"],
    ["Sicherheit",""],
    ["Produktupdates","Neue Funktionen und wichtige Hinweise"],
  ] as const;
  const [prefs,setPrefs] = useState<Record<string,{email:boolean;push:boolean}>>({
    Rechnungen:{email:true,push:false}, Angebote:{email:true,push:false}, Support:{email:true,push:false}, Zeiterfassung:{email:false,push:false}, Spesen:{email:false,push:false}, Sicherheit:{email:false,push:false}, Produktupdates:{email:true,push:false}
  });
  const pending=useRef(new Set<string>());
  const [saving,setSaving]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{{}apiGet<{channels:{email:boolean;push:boolean};items:Array<{kind:string;email:boolean;push:boolean}>}>("/api/settings/notifications").then(data=>{setChannels(data.channels);setPrefs(current=>{const next={...current};for(const item of data.items)if(next[item.kind])next[item.kind]={email:item.email,push:item.push};return next})}).then(()=>setReady(true)).catch(()=>setError("Einstellungen konnten nicht geladen werden."));},[]);
  const toggle=async(title:string,channel:"email"|"push")=>{
    const key=title+channel;if(!ready||pending.current.has(key))return;
    const before=prefs[title][channel],enabled=!before;
    if(channel==="push"&&enabled&&(!("Notification" in window)||Notification.permission!=="granted")){
      setError("Push benötigt eine Browserfreigabe. Aktiviere Benachrichtigungen in den Geräteeinstellungen.");return;
    }
    pending.current.add(key);setSaving([...pending.current]);
    try{const result=await apiPatch<{ok?:boolean}>("/api/settings/notifications",{kind:title,channel,enabled});if(result.ok!==true)throw new Error("unconfirmed_preference");setPrefs(current=>({...current,[title]:{...current[title],[channel]:enabled}}));setError("");}
    catch{setPrefs(current=>({...current,[title]:{...current[title],[channel]:before}}));setError("Einstellung konnte nicht gespeichert werden.");}
    finally{pending.current.delete(key);setSaving([...pending.current]);}
  };
  return <AppShell title="Benachrichtigungen" subtitle="Bestimme, wie Binso One dich informiert." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
    {!ready&&!error&&<LoadingState><LocalizedText>{"Einstellungen werden geladen …"}</LocalizedText></LoadingState>}
    {ready&&<><PushDeviceSettings/><SettingsGroup title="Zustellung">{rows.map(([title,text],index)=><Fragment key={title}>{(["email","push"] as const).filter(channel=>channels[channel]).map(channel=><ListRow information key={title+channel} title={<span id={labels+index+channel}><LocalizedText>{title}</LocalizedText> · <LocalizedText>{channel==="email"?"E-Mail":"Push"}</LocalizedText></span>} meta={text} value={<Toggle labelledBy={labels+index+channel} checked={prefs[title][channel]} disabled={!ready} busy={saving.includes(title+channel)} onChange={()=>void toggle(title,channel)} label={title}/>}/>)}</Fragment>)}</SettingsGroup></>}
  </AppShell>;
}

/** Language availability reflects the translated interface, not the database enum. */
function LanguagePreference(){
 const {locale,save,busy,error}=useLanguagePreference("tenant");
 return <><Field label="Sprache" allowReadOnlyInput><Select value={locale} disabled={busy} aria-busy={busy||undefined} onChange={event=>void save(event.target.value)}>{locales.map(code=><option key={code} value={code} lang={code}>{localeNames[code]}</option>)}</Select></Field>{error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}<p className="settings-note"><LocalizedText>{"Die gewählte Sprache gilt für die gesamte Benutzeroberfläche."}</LocalizedText></p></>;
}

export function LanguageSettingsPage(){
 return <AppShell title="Sprache" subtitle="Sprache der Benutzeroberfläche." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen"><LanguagePreference/></AppShell>;
}

const themeOptions=[
 {value:"system",title:"System",description:"Geräteeinstellung übernehmen",icon:<Monitor size={18} aria-hidden="true"/>},
 {value:"light",title:"Hell",description:"Helle Oberfläche",icon:"sun"},
 {value:"dark",title:"Dunkel",description:"Dunkle Oberfläche",icon:"moon"},
] as const;
export function AppearanceSettingsPage(){
 const [theme,setTheme]=useState<ThemeMode>("system"),[error,setError]=useState("");
 useEffect(()=>{
  const sync=()=>{const mode=document.documentElement.dataset.themeMode;setTheme(mode==="light"||mode==="dark"?mode:"system")};
  queueMicrotask(sync);window.addEventListener("binso-theme",sync);
  return()=>window.removeEventListener("binso-theme",sync);
 },[]);
 const choose=(next:ThemeMode)=>{setError("");void saveTheme(next).catch(()=>setError("Darstellung konnte nicht gespeichert werden."))};
 return <AppShell title="Darstellung" subtitle="Binso One passt sich deiner Arbeitsweise an." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
  {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
  <SelectionRows label="Darstellung" value={theme} options={themeOptions} onChange={choose}/>

 </AppShell>;
}
