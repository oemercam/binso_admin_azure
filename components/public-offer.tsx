'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {Button,Field,Input,Textarea,ErrorState,LoadingState,SectionTitle,FormActions} from './ui';
import {FormSheet} from './binso-ux';
import {DocumentModal} from './pdf-preview';
import {formatCurrency,formatDate} from '@/lib/financial-status';
import {useTranslation} from '@/lib/client/locale';
import {offerActivityLabel} from '@/lib/offer-activity';

type Offer={number:string;version:number;status:string;recipientHint:string;document:Record<string,unknown>;company:Record<string,unknown>;messages:Array<{kind:string;body:string;actor:string;created_at:string}>};
type Decision='accept'|'decline'|'question';
async function request(token:string,body:Record<string,unknown>){
 const response=await fetch('/api/public/offer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,...body}),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});
 if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(error?.error?.message??error?.message??'Das Angebot konnte nicht geladen werden.');}
 return response;
}
export function PublicOffer(){
 const t=useTranslation();
 const token=useRef(''),pending=useRef(false),key=useRef('');
 const [offer,setOffer]=useState<Offer|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const [decision,setDecision]=useState<Decision|null>(null),[code,setCode]=useState(''),[message,setMessage]=useState(''),[codeSent,setCodeSent]=useState(false),[notice,setNotice]=useState('');
 const [preview,setPreview]=useState(false),[file,setFile]=useState<Blob|null>(null),[confirmed,setConfirmed]=useState(false);
 useEffect(()=>{
  let active=true;token.current=window.location.hash.slice(1);
  if(!/^[A-Za-z0-9_-]{43}$/.test(token.current)){queueMicrotask(()=>{if(active)setError('Bitte den vollständigen Angebotslink aus deiner E-Mail öffnen.');});return;}
  void request(token.current,{action:'read'}).then(response=>response.json()).then(data=>{if(active)setOffer(data);}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Angebot nicht verfügbar.');});
  const report=window.setTimeout(()=>{if(active&&document.visibilityState==="visible")void request(token.current,{action:"view"}).catch(()=>{});},2500);
  return()=>{active=false;window.clearTimeout(report);};
 },[]);
 const act=async(body:Record<string,unknown>)=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError(null);
  try{
   await request(token.current,body);
   if(body.action==='challenge')setCodeSent(true);
   if(body.action==='respond'){
    setDecision(null);setCode('');setMessage('');setCodeSent(false);setNotice(body.decision==='question'?'Deine Frage wurde gespeichert.':'Deine Entscheidung wurde gespeichert.');
    const result=await request(token.current,{action:'read'});setOffer(await result.json());
   }
  }catch(reason){setError(reason instanceof Error?reason.message:'Aktion konnte nicht bestätigt werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 const pdf=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError(null);
  setPreview(true);
  try{const response=await request(token.current,{action:'pdf'});setFile(await response.blob());}catch(reason){setError(reason instanceof Error?reason.message:'PDF konnte nicht geladen werden.');}finally{pending.current=false;setBusy(false);}
 };
 const start=(value:Decision)=>{setError(null);setCode('');setMessage('');setCodeSent(false);setConfirmed(false);key.current=crypto.randomUUID();setDecision(value);};
 if(!offer)return <main className="public-offer"><h1>{t('Angebot')}</h1>{error?<ErrorState>{error}</ErrorState>:<LoadingState/>}</main>;
 const doc=offer.document,currency=String(doc.currency||'CHF'),lines=Array.isArray(doc.items)?doc.items as Array<Record<string,unknown>>:[],terms=doc.document_snapshot&&typeof doc.document_snapshot==='object'?doc.document_snapshot as Record<string,unknown>:{};
 return <main className="public-offer">
  <header>{typeof offer.company.logo_data==="string"&&<Image unoptimized width={180} height={72} className="public-offer-logo" src={offer.company.logo_data} alt={t('Unternehmenslogo')}/>}<p className="eyebrow">{String(offer.company.legal_name||offer.company.name||'')}</p><h1>{t('Angebot')} {offer.number}</h1><p>{t('Version')} {offer.version} · {formatDate(String(doc.issue_date))} · {t('Gültig bis')} {formatDate(String(doc.valid_until||''))}</p></header>
  {error&&<ErrorState>{error}</ErrorState>}{notice&&<p role="status">{t(notice)}</p>}
  <section><SectionTitle title="Leistungen"/>{String(terms.intro||'')&&<p>{String(terms.intro)}</p>}
   <ol className="public-offer-lines">{lines.map((line,index)=><li key={String(line.id||index)}><div><strong>{String(line.description)}</strong><p>{String(line.quantity)} {String(line.unit)} · {formatCurrency(Number(line.unit_price),currency)}</p></div><strong>{formatCurrency(Number(line.line_total),currency)}</strong></li>)}</ol>
   <dl className="detail-list"><div><dt>{t('Zwischentotal')}</dt><dd>{formatCurrency(Number(doc.subtotal),currency)}</dd></div><div><dt>{t('Mehrwertsteuer')}</dt><dd>{formatCurrency(Number(doc.vat_amount),currency)}</dd></div><div><dt>{t('Total')}</dt><dd><strong>{formatCurrency(Number(doc.total),currency)}</strong></dd></div></dl>
   {String(terms.closing||'')&&<p>{String(terms.closing)}</p>}
   <Button variant="secondary" disabled={busy} onClick={()=>void pdf()}>{t('PDF ansehen')}</Button>
  </section>
  <section><SectionTitle title="Antwort"/>{offer.status==='sent'?<FormActions sheet><Button disabled={busy} onClick={()=>start('accept')}>{t('Annehmen')}</Button><Button variant="secondary" disabled={busy} onClick={()=>start('decline')}>{t('Ablehnen')}</Button></FormActions>:<p>{t(offer.status==='accepted'?'Angebot angenommen.':'Angebot abgelehnt.')}</p>}<Button variant="secondary" disabled={busy} onClick={()=>start('question')}>{t('Frage stellen')}</Button></section>
  {offer.messages.length>0&&<section><SectionTitle title="Verlauf"/>{offer.messages.map((item,index)=><article key={index}><strong>{t(offerActivityLabel(item.kind))}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString('de-CH')}</small></article>)}</section>}
  <p className="technical-hint">{t('Dieser Link ist vertraulich.')} {t('Bestätigungscode an')} {offer.recipientHint}. {t('Diese Bestätigung ist keine qualifizierte elektronische Signatur.')}</p>
  <FormSheet open={decision!==null} label={decision==='accept'?'Angebot annehmen':decision==='decline'?'Angebot ablehnen':'Frage stellen'} busy={busy} onClose={()=>setDecision(null)}><div className="sheet-body">
   <p>{offer.number} · Version {offer.version} · {formatCurrency(Number(doc.total),currency)}</p>
   {decision==='accept'&&<p>{t('Mit der Bestätigung nimmst du diese Angebotsversion einschliesslich der oben und im PDF aufgeführten Bedingungen an.')}</p>}
   {decision==='accept'&&<Field label="Ich bestätige Version, Betrag und Bedingungen und bin zur Annahme berechtigt."><Input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/></Field>}
   {decision!=='accept'&&<Field label={decision==='question'?'Frage':'Grund (optional)'}><Textarea value={message} onChange={event=>setMessage(event.target.value)} maxLength={4000}/></Field>}
   {codeSent?<Field label="Bestätigungscode"><Input inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} onChange={event=>setCode(event.target.value.replace(/\D/g,''))}/></Field>:<p>{t('Ein Code wird ausschliesslich an den hinterlegten Empfänger gesendet.')}</p>}
   {error&&<ErrorState>{error}</ErrorState>}
  </div><FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setDecision(null)}>{t('Abbrechen')}</Button><Button disabled={busy||(decision==='question'&&!message.trim())||(decision==='accept'&&!confirmed)||(codeSent&&code.length!==6)} onClick={()=>void act(codeSent?{action:'respond',decision,code,message,requestKey:key.current,confirmed:decision==='accept'?confirmed:true}:{action:'challenge',decision})}>{t(codeSent?(decision==='accept'?'Angebot verbindlich annehmen':decision==='decline'?'Ablehnung bestätigen':'Frage senden'):'Code anfordern')}</Button></FormActions></FormSheet>
  {preview&&file&&<DocumentModal title="Angebots-PDF" fileBlob={file} fileName={offer.number+"-v"+offer.version} onClose={()=>{setPreview(false);setFile(null)}}/>}
 </main>;
}
