import 'server-only';
import {setTimeout as delay} from 'node:timers/promises';
import {limitsConfig} from '@/config/limits';
import {ApiError,readBoundedBody} from './http';

type JsonRecord=Record<string,unknown>;
const object=(value:unknown):JsonRecord=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as JsonRecord:{};
const text=(value:unknown,max=320)=>typeof value==='string'?value.trim().slice(0,max):'';
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null;
const confidence=(value:unknown)=>{const result=number(value);return result!==null&&result>=0&&result<=1?result:0;};
const invalidResult=()=>new ApiError(502,'receipt_scan_invalid_response','Belegerkennung lieferte eine ungültige Antwort.');
const unavailable=()=>new ApiError(503,'receipt_scan_unavailable','Belegerkennung ist noch nicht konfiguriert.');
const timeout=()=>new ApiError(504,'receipt_scan_timeout','Belegerkennung dauert länger als erwartet. Bitte erneut versuchen.');
const extensions:Record<string,string>={'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg','image/webp':'webp'};

/** The existing public-Azure resource is the sole credential destination. */
export function receiptEndpoint(value:string){
 let url:URL;try{url=new URL(value);}catch{throw unavailable();}
 if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||url.search||url.hash||url.pathname!=='/'||!/(?:\.cognitiveservices\.azure\.com|\.api\.cognitive\.microsoft\.com)$/.test(url.hostname))throw unavailable();
 return url.origin;
}
export function receiptOperation(value:string|null,origin:string){
 let url:URL;try{if(!value)throw Error();url=new URL(value,origin);}catch{throw invalidResult();}
 if(url.origin!==origin||url.username||url.password||url.hash||!/^\/documentintelligence\/documentModels\/prebuilt-receipt\/analyzeResults\/[a-z0-9-]{1,160}$/i.test(url.pathname))throw invalidResult();
 return url.href;
}
async function resultJson(response:Response){
 if(!response.ok)throw new ApiError(502,'receipt_scan_failed','Belegerkennung konnte nicht abgeschlossen werden.');
 if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw invalidResult();
 try{return object(JSON.parse((await readBoundedBody(response,limitsConfig.receiptScanMaxResponseBytes)).toString('utf8')));}catch{throw invalidResult();}
}
function receiptFields(result:JsonRecord,file:File){
 const documents=object(result.analyzeResult).documents;
 if(!Array.isArray(documents)||!documents.length)throw invalidResult();
 const fields=object(object(documents[0]).fields),merchantField=object(fields.MerchantName),dateField=object(fields.TransactionDate),totalField=object(fields.Total),subtotalField=object(fields.Subtotal),taxField=object(fields.TotalTax);
 const merchant=text(merchantField.valueString)||text(merchantField.content),rawDate=text(dateField.valueDate);
 const date=/^\d{4}-\d{2}-\d{2}$/.test(rawDate)&&!Number.isNaN(Date.parse(rawDate))&&new Date(rawDate).toISOString().slice(0,10)===rawDate?rawDate:'';
 const total=number(object(totalField.valueCurrency).amount)??number(object(subtotalField.valueCurrency).amount);
 const rawCurrency=text(object(totalField.valueCurrency).currencyCode),currency=/^[A-Z]{3}$/.test(rawCurrency)?rawCurrency:'CHF';
 const tax=number(object(taxField.valueCurrency).amount);
 const certainty={merchant:merchant?confidence(merchantField.confidence):0,date:date?confidence(dateField.confidence):0,total:total!==null&&/^[A-Z]{3}$/.test(rawCurrency)?confidence(totalField.confidence):0,tax:tax!==null?confidence(taxField.confidence):0};
 const safeMerchant=(merchant||'Beleg').normalize('NFKD').replace(/[^a-zA-Z0-9äöüÄÖÜ_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'Beleg';
 const filename=`${date||new Date().toISOString().slice(0,10)}_${safeMerchant}_${total!==null?total.toFixed(2):'Betrag'}-${currency}.${extensions[file.type]}`;
 return {merchant,date,total,currency,tax,confidence:Math.min(certainty.merchant,certainty.date,certainty.total),filename,fields:certainty};
}
/** Correctable suggestions only; this owner never creates expenses or bookings. */
export async function scanReceipt({file,endpoint,key,signal}:{file:File;endpoint:string;key:string;signal:AbortSignal},dependencies:{fetch?:typeof fetch;sleep?:(ms:number,signal:AbortSignal)=>Promise<unknown>}={}){
 const origin=receiptEndpoint(endpoint);if(!key)throw unavailable();
 if(!extensions[file.type])throw new ApiError(400,'file_type','Dateityp wird für Belegerkennung nicht unterstützt.');
 if(!file.size)throw new ApiError(400,'file_required','Beleg fehlt.');
 if(file.size>limitsConfig.maxFileUploadBytes)throw new ApiError(413,'file_too_large','Beleg ist zu gross.');
 const request=dependencies.fetch??fetch,sleep=dependencies.sleep??((ms,signal)=>delay(ms,undefined,{signal}));
 const bounded=AbortSignal.any([signal,AbortSignal.timeout(limitsConfig.receiptScanTimeoutMs)]);
 const headers={'Ocp-Apim-Subscription-Key':key,Accept:'application/json'};
 try{
  bounded.throwIfAborted();
  const start=await request(origin+'/documentintelligence/documentModels/prebuilt-receipt:analyze?_overload=analyzeDocument&api-version=2024-11-30',{method:'POST',headers:{...headers,'Content-Type':file.type},body:new Uint8Array(await file.arrayBuffer()),signal:bounded,redirect:'error',cache:'no-store'});
  const accepted=start.status===202,location=start.headers.get('operation-location');
  await start.body?.cancel();
  if(!accepted)throw new ApiError(502,'receipt_scan_failed','Beleg konnte nicht analysiert werden.');
  const operation=receiptOperation(location,origin);
  for(let attempt=0;attempt<limitsConfig.receiptScanPollAttempts;attempt++){
   await sleep(limitsConfig.receiptScanPollIntervalMs,bounded);bounded.throwIfAborted();
   const result=await resultJson(await request(operation,{headers,signal:bounded,redirect:'error',cache:'no-store'}));
   if(result.status==='succeeded')return receiptFields(result,file);
   if(!['running','notStarted'].includes(String(result.status)))throw new ApiError(502,'receipt_scan_failed','Belegerkennung ist fehlgeschlagen.');
  }
  throw timeout();
 }catch(error){if(bounded.aborted)throw timeout();if(error instanceof ApiError)throw error;throw new ApiError(502,'receipt_scan_failed','Beleg konnte nicht analysiert werden.');}
}
