"use client";

import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {Eye,EyeOff} from "lucide-react";
import {Button,Logo,Field,Input,Select,ErrorState} from "@/components/ui";
import {FormSheet} from "@/components/binso-ux";
import {FormWizard} from "@/components/form-wizard";
import {allowDraftNavigation} from "@/components/use-browser-back-guard";
import {clearDemoClientSession} from "@/lib/client/backend";
import {registrationLocale,registrationText,type RegistrationTextKey} from "@/lib/i18n";
import {safeAppPath} from "@/lib/navigation";

type Context={plan:{id:string;name:string;monthly:number;yearly:number}|null;billingCycle:"monthly"|"yearly";trialDays:number;termsVersion:string;privacyVersion:string;dpaVersion:string};
type Stage="new"|"pending"|"verified";

/** All CTA routes mount this one sheet; only the existing auth API creates identities/tenants. */
export function RegistrationSheet(){
 const router=useRouter(),search=useSearchParams();
 const locale=registrationLocale(search.get("lang"));
 const t=(key:RegistrationTextKey,values:Record<string,string|number>={})=>registrationText(key,locale,values);
 const planParam=search.get("plan"),billingParam=search.get("billing");
 const [context,setContext]=useState<Context|null>(null),[open,setOpen]=useState(false),[step,setStep]=useState(0),[stage,setStage]=useState<Stage>("new");
 const [company,setCompany]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[show,setShow]=useState(false),[accepted,setAccepted]=useState(false),[code,setCode]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState<RegistrationTextKey|null>(null),[retry,setRetry]=useState(0);
 const saving=useRef(false),form=useRef<HTMLFormElement>(null);
 const dirty=stage==='new'&&!!(company||email||password||accepted);
 useEffect(()=>{
  let active=true;
  const params=new URLSearchParams();if(planParam)params.set('plan',planParam);if(billingParam)params.set('billing',billingParam);
  fetch('/api/auth/register?'+params,{cache:'no-store'}).then(async response=>{
   const payload=await response.json();if(!response.ok)throw new Error();if(!active)return;
   if(payload.state==='authenticated'&&typeof payload.next==='string'){allowDraftNavigation();window.location.replace(safeAppPath(payload.next));return;}
   setContext(payload.context);setOpen(true);setError('');
   if(payload.pending){if(!search.get('lang')&&payload.pending.locale&&payload.pending.locale!=='de'){const restored=new URLSearchParams(search);restored.set('lang',payload.pending.locale);router.replace('/registrieren?'+restored,{scroll:false});}setCompany(payload.pending.company);setEmail(payload.pending.email);setStage(payload.state==='verified'?'verified':'pending');setStatus('deliveryUnconfirmed');}
  }).catch(()=>{if(active)setError('failure')});
  return()=>{active=false};
 },[planParam,billingParam,retry,router,search]);
 const close=()=>{allowDraftNavigation();setOpen(false);router.replace('/preise'+(locale==='de'?'':'?lang='+locale));};
 const requestCancel=()=>{form.current?.closest('.bottom-sheet')?.querySelector<HTMLButtonElement>('.sheet-header button')?.click()};
 const request=async(url:string,body:Record<string,unknown>)=>{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(['registration_unavailable','duplicate_record'].includes(payload.error)?'conflict':payload.error==='invalid_or_expired_code'?'invalidCode':'failure');
  return payload;
 };
 const finish=(payload:Record<string,unknown>)=>{
  setPassword('');clearDemoClientSession();allowDraftNavigation();
  if(payload.alreadyVerified){setStage('verified');setStatus('alreadyVerified');return;}
  if(typeof payload.next==='string')window.location.replace(safeAppPath(payload.next));
  else window.location.replace('/login');
 };
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(saving.current||!context)return;
  if(stage==='new'&&step<2){const invalid=Array.from(form.current?.querySelectorAll<HTMLInputElement>('input')??[]).find(input=>input.getClientRects().length&&!input.checkValidity());if(invalid){invalid.reportValidity();return;}setStep(step+1);return;}
  if(stage==='new'){const invalid=Array.from(form.current?.querySelectorAll<HTMLInputElement>('input')??[]).find(input=>!input.checkValidity());if(invalid){setStep(invalid.name==='company'?0:invalid.name==='acceptedTerms'?2:1);requestAnimationFrame(()=>invalid.reportValidity());return;}}
  saving.current=true;setBusy(true);setError('');
  try{
   if(stage==='pending'){finish(await request('/api/auth/verify-email',{email,code}));return;}
   const payload=await request('/api/auth/register',{company,name:company,email,password,plan:context.plan?.id??null,billingCycle:context.billingCycle,locale,acceptedTerms:accepted,acceptedDpa:accepted,termsVersion:context.termsVersion,privacyVersion:context.privacyVersion,dpaVersion:context.dpaVersion});
   clearDemoClientSession();setPassword('');setStage('pending');setStatus(payload.emailSent===false?'deliveryFailed':payload.resumed?'deliveryUnconfirmed':'sent');
  }catch(e){setError(e instanceof Error?e.message:'failure');}
  finally{saving.current=false;setBusy(false);}
 };
 const resend=async()=>{
  if(saving.current)return;saving.current=true;setBusy(true);setError('');
  try{await request('/api/auth/resend-verification',{email});setStatus('deliveryUnconfirmed');}
  catch(e){setError(e instanceof Error?e.message:'failure')}
  finally{saving.current=false;setBusy(false);}
 };
 const labels=[t('company'),t('access'),t('review')];
 const planSummary=context&&<><p>{context.plan?.name??t('noPlan')}</p>{context.plan&&<p>{t('futurePrice',{amount:context.billingCycle==='yearly'?context.plan.yearly:context.plan.monthly,interval:t(context.billingCycle)})}</p>}<p>{t('trial',{days:context.trialDays})}</p><p>{t('conditions')}</p></>;
 return <main className="auth-page" lang={locale==='de'?'de-CH':locale==='fr'?'fr-CH':locale==='it'?'it-CH':locale}>
  <section className="auth-card"><Logo/><h1>{t('title')}</h1>{error&&!context?<><ErrorState>{t('failure')}</ErrorState><Button onClick={()=>setRetry(retry+1)}>{t('open')}</Button></>:<Button onClick={()=>setOpen(true)} disabled={!context}>{context?t('open'):t('loading')}</Button>}<p><Link href={'/login?lang='+locale}>{t('signIn')}</Link></p></section>
  <FormSheet lang={locale} open={open} actions={stage==='pending'?<><Button form="registration-verification" type="submit" disabled={busy||code.length!==6}>{busy?t('sending'):t('verify')}</Button><Button variant="secondary" disabled={busy} onClick={()=>void resend()}>{t('resend')}</Button></>:undefined} label={t('title')} closeLabel={t('close')} onClose={close} busy={busy} dirty={dirty} wizard className="registration-sheet" onBrowserBack={stage==='new'&&step>0?()=>setStep(step-1):undefined} discardText={{title:t('leaveTitle'),message:t('leaveHelp'),cancelLabel:t('keep'),confirmLabel:t('discard')}}>
   {context&&stage==='new'&&<form ref={form} onSubmit={submit} noValidate>
    <FormWizard labels={labels} step={step} onStep={setStep} busy={busy} ariaLabel={t('title')} backLabel={t('back')} nextLabel={t('next')} progressLabel={(step,total,label)=>t('progress',{step,total,label})} cancelAction={<Button variant="secondary" onClick={requestCancel}>{t('cancel')}</Button>} action={<Button type="submit" disabled={busy||!accepted}>{busy?t('creating'):t('create')}</Button>}>
     <div hidden={step!==0}><Field label={t('language')}><Select value={locale} onChange={event=>{const params=new URLSearchParams(search);params.set('lang',event.target.value);router.replace('/registrieren?'+params,{scroll:false});}}><option value="de">Deutsch (Schweiz)</option><option value="fr">Français (Suisse)</option><option value="it">Italiano (Svizzera)</option><option value="en">English</option><option value="tr">Türkçe</option></Select></Field><h3>{t('company')}</h3><p>{t('companyHelp')}</p><Field label={t('companyName')+' *'}><Input name="company" required minLength={2} maxLength={180} autoComplete="organization" value={company} onChange={e=>setCompany(e.target.value)} placeholder={t('companyExample')}/></Field></div>
     <div hidden={step!==1}><h3>{t('access')}</h3><p>{t('accessHelp')}</p><Field label={t('email')+' *'}><Input name="email" required type="email" inputMode="email" autoComplete="email" maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@firma.ch"/></Field><Field label={t('password')+' *'} hint={t('passwordHelp')}><div className="password-field"><Input name="password" required minLength={12} maxLength={256} type={show?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t('passwordHelp')}/><button type="button" className="password-visibility" aria-label={t(show?'hidePassword':'showPassword')} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeOff aria-hidden/>:<Eye aria-hidden/>}</button></div></Field></div>
     <div hidden={step!==2}><h3>{t('review')}</h3><dl className="registration-summary"><dt>{t('companyName')}</dt><dd>{company}</dd><dt>{t('email')}</dt><dd>{email}</dd><dt>{t('plan')}</dt><dd>{planSummary}</dd></dl><p className="registration-legal-links"><Link href="/agb" target="_blank" rel="noopener noreferrer">{t('terms')}</Link><Link href="/auftragsbearbeitung" target="_blank" rel="noopener noreferrer">{t('dpa')}</Link><Link href="/datenschutz" target="_blank" rel="noopener noreferrer">{t('privacy')}</Link></p><Field label={t('accept')+' *'}><Input name="acceptedTerms" type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)}/></Field></div>
     {error&&<ErrorState>{t(error as RegistrationTextKey)}</ErrorState>}<p>{t('required')}</p><Link href={'/login?lang='+locale} target="_blank" rel="noopener noreferrer">{t('signIn')}</Link>
    </FormWizard>
   </form>}
   {stage==='pending'&&<form id="registration-verification" ref={form} onSubmit={submit}><h3>{t('verification')}</h3>{status&&<p role="status">{t(status)}</p>}<p>{email}</p><Field label={t('code')+' *'}><Input name="code" required minLength={6} maxLength={6} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000"/></Field>{error&&<ErrorState>{t(error as RegistrationTextKey)}</ErrorState>}<p><Link href={'/login?lang='+locale}>{t('signIn')}</Link></p></form>}
   {stage==='verified'&&<><h3>{t('verified')}</h3><p>{t('alreadyVerified')}</p><Button href={'/login?lang='+locale}>{t('signIn')}</Button></>}
  </FormSheet>
 </main>;
}
