"use client";

import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {PasswordInput} from '@/components/password-input';
import {authRequest} from '@/lib/client/auth-request';
import {Button,Field,Input,Select,ErrorState,LoadingState} from "@/components/ui";
import {AuthWorkspace} from "@/components/auth-workspace";
import ConfirmDialog from "@/components/confirm-dialog";
import {DetailDisclosure} from '@/components/binso-ux';

import {allowDraftNavigation,useBrowserBackGuard} from "@/components/use-browser-back-guard";
import {clearClientSession} from "@/lib/client/backend";
import {registrationLocale,registrationText,type RegistrationTextKey} from "@/lib/i18n";
import {safeAppPath} from "@/lib/navigation";

type Context={plan:{id:string;name:string;monthly:number;yearly:number}|null;billingCycle:"monthly"|"yearly";trialDays:number;termsVersion:string;privacyVersion:string;dpaVersion:string};
type Stage="new"|"pending"|"verified";

/** One full-page registration owner. No modal, credential draft storage or second API. */
export function RegistrationPage(){
 const router=useRouter(),search=useSearchParams();
 const locale=registrationLocale(search.get("lang"));
 const t=(key:RegistrationTextKey,values:Record<string,string|number>={})=>registrationText(key,locale,values);
 const planParam=search.get("plan"),billingParam=search.get("billing");
 const [context,setContext]=useState<Context|null>(null),[discard,setDiscard]=useState(false),[backDiscard,setBackDiscard]=useState(false),[destination,setDestination]=useState<string|null>(null),[stage,setStage]=useState<Stage>("new");
 const [contactName,setContactName]=useState("");
 const [company,setCompany]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[accepted,setAccepted]=useState(false),[code,setCode]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState<RegistrationTextKey|null>(null),[retry,setRetry]=useState(0);
 const saving=useRef(false),form=useRef<HTMLFormElement>(null);
 const dirty=stage==='new'&&!!(company||contactName||email||password||accepted);
 useEffect(()=>{
  let active=true;
  const params=new URLSearchParams();if(planParam)params.set('plan',planParam);if(billingParam)params.set('billing',billingParam);
  authRequest('/api/auth/register?'+params,{cache:'no-store'}).then(async response=>{
   const payload=await response.json();if(!response.ok)throw new Error();if(!active)return;
   if(payload.state==='authenticated'&&typeof payload.next==='string'){allowDraftNavigation();window.location.replace(safeAppPath(payload.next));return;}
   setContext(payload.context);setError('');
   if(payload.pending){if(!search.get('lang')&&payload.pending.locale&&payload.pending.locale!=='de'){const restored=new URLSearchParams(search);restored.set('lang',payload.pending.locale);router.replace('/registrieren?'+restored,{scroll:false});}setCompany(payload.pending.company);setEmail(payload.pending.email);setStage(payload.state==='verified'?'verified':'pending');setStatus('deliveryUnconfirmed');}
  }).catch(()=>{if(active)setError('failure')});
  return()=>{active=false};
 },[planParam,billingParam,retry,router,search]);
 const close=()=>{allowDraftNavigation();router.replace('/preise'+(locale==='de'?'':'?lang='+locale));};
 const leaveBack=useBrowserBackGuard(dirty||busy,()=>{if(!busy){setDestination(null);setBackDiscard(true);setDiscard(true)}},dirty||busy,url=>{if(!busy){setDestination(url);setBackDiscard(false);setDiscard(true)}});
 const requestCancel=()=>{if(busy)return;if(dirty){setDestination(null);setBackDiscard(false);setDiscard(true)}else close()};
 const request=async(url:string,body:Record<string,unknown>)=>{
  const response=await authRequest(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(['registration_unavailable','duplicate_record'].includes(payload.error)?'conflict':payload.error==='invalid_or_expired_code'?'invalidCode':'failure');
  return payload;
 };
 const finish=(payload:Record<string,unknown>)=>{
  setPassword('');clearClientSession();allowDraftNavigation();
  if(payload.alreadyVerified){setStage('verified');setStatus('alreadyVerified');return;}
  if(typeof payload.next==='string')window.location.replace(safeAppPath(payload.next));
  else window.location.replace('/login');
 };
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(saving.current||!context)return;
  if(stage==="new"){const invalid=Array.from(form.current?.querySelectorAll<HTMLInputElement>("input")??[]).find(input=>!input.checkValidity());if(invalid){invalid.reportValidity();return;}}
  saving.current=true;setBusy(true);setError('');
  try{
   if(stage==='pending'){finish(await request('/api/auth/verify-email',{email,code}));return;}
   const payload=await request('/api/auth/register',{company,name:contactName.trim(),email,password,plan:context.plan?.id??null,billingCycle:context.billingCycle,locale,acceptedTerms:accepted,acceptedDpa:accepted,termsVersion:context.termsVersion,privacyVersion:context.privacyVersion,dpaVersion:context.dpaVersion});
   clearClientSession();setPassword('');setStage('pending');setStatus(payload.emailSent===false?'deliveryFailed':payload.resumed?'deliveryUnconfirmed':'sent');
  }catch(e){setError(e instanceof Error?e.message:'failure');}
  finally{saving.current=false;setBusy(false);}
 };
 const resend=async()=>{
  if(saving.current)return;saving.current=true;setBusy(true);setError('');
  try{await request('/api/auth/resend-verification',{email});setStatus('deliveryUnconfirmed');}
  catch(e){setError(e instanceof Error?e.message:'failure')}
  finally{saving.current=false;setBusy(false);}
 };
 const planSummary=context&&<><p>{context.plan?.name??t('noPlan')}</p>{context.plan&&<p>{t('futurePrice',{amount:context.billingCycle==='yearly'?context.plan.yearly:context.plan.monthly,interval:t(context.billingCycle)})}</p>}<p>{t('trial',{days:context.trialDays})}</p><p>{t('conditions')}</p></>;
 return <AuthWorkspace lang={locale} showLocaleSwitcher={false}><section className="auth-card registration-page" aria-labelledby="registration-title">
  <h1 id="registration-title">{t('title')}</h1>
  {!context?(error?<><ErrorState>{t('failure')}</ErrorState><Button onClick={()=>setRetry(retry+1)}>{t('open')}</Button></>:<LoadingState/>):stage==='new'?<form ref={form} onSubmit={submit} noValidate>
   <Field label={t('language')}><Select value={locale} onChange={event=>{const params=new URLSearchParams(search);params.set('lang',event.target.value);router.replace('/registrieren?'+params,{scroll:false})}}><option value="de">Deutsch (Schweiz)</option><option value="fr">Français (Suisse)</option><option value="it">Italiano (Svizzera)</option><option value="en">English</option><option value="tr">Türkçe</option></Select></Field>
   <Field label={t('companyName')+' *'}><Input name="company" required minLength={2} maxLength={180} autoComplete="organization" value={company} onChange={event=>setCompany(event.target.value)} placeholder={t('companyExample')}/></Field>
   <Field label={t('contactName')+' *'}><Input name="contactName" required minLength={2} maxLength={180} autoComplete="name" value={contactName} onChange={event=>setContactName(event.target.value)}/></Field>
   <Field label={t('email')+' *'}><Input name="email" required type="email" inputMode="email" autoComplete="email" maxLength={320} value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@firma.ch"/></Field>
   <Field label={t('password')+' *'} hint={t('passwordHelp')}><PasswordInput name="password" required minLength={12} maxLength={256} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} showLabel={t('showPassword')} hideLabel={t('hidePassword')}/></Field>
   <DetailDisclosure label={t('plan')}>{planSummary}</DetailDisclosure>
   <p className="registration-legal-links"><Link href="/agb" target="_blank" rel="noopener noreferrer">{t('terms')}</Link><Link href="/auftragsbearbeitung" target="_blank" rel="noopener noreferrer">{t('dpa')}</Link><Link href="/datenschutz" target="_blank" rel="noopener noreferrer">{t('privacy')}</Link></p>
   <Field label={t('accept')+' *'}><Input name="acceptedTerms" type="checkbox" required checked={accepted} onChange={event=>setAccepted(event.target.checked)}/></Field>
   {error&&<ErrorState>{t(error as RegistrationTextKey)}{error==='conflict'&&<p><Link href="/passwort-vergessen" target="_blank" rel="noopener noreferrer">{t('resetPassword')}</Link></p>}</ErrorState>}
   <Button type="submit" disabled={busy||!accepted}>{busy?t('creating'):t('create')}</Button><Button variant="secondary" disabled={busy} onClick={requestCancel}>{t('cancel')}</Button>
  </form>:stage==='pending'?<form id="registration-verification" ref={form} onSubmit={submit}>
   <h2>{t('verification')}</h2>{status&&<p role="status">{t(status)}</p>}<p>{email}</p><Field label={t('code')+' *'}><Input name="code" required minLength={6} maxLength={6} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000"/></Field>
   {error&&<ErrorState>{t(error as RegistrationTextKey)}</ErrorState>}<Button type="submit" disabled={busy||code.length!==6}>{busy?t('sending'):t('verify')}</Button><Button variant="secondary" disabled={busy} onClick={()=>void resend()}>{t('resend')}</Button>
  </form>:<><h2>{t('verified')}</h2><p>{t('alreadyVerified')}</p></>}
  <p><Link href={'/login?lang='+locale} target="_blank" rel="noopener noreferrer">{t('signIn')}</Link></p>
  <ConfirmDialog open={discard} busy={busy} title={t('leaveTitle')} message={t('leaveHelp')} cancelLabel={t('keep')} confirmLabel={t('discard')} onCancel={()=>{setDiscard(false);setBackDiscard(false)}} onConfirm={()=>{setDiscard(false);allowDraftNavigation();if(destination)window.location.assign(destination);else if(backDiscard)leaveBack();else close()}}/>
 </section></AuthWorkspace>;
}
