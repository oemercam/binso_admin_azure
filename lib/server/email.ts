import "server-only";
import {env} from "@/lib/server/env";
import {log} from "@/lib/server/logger";
import {renderMailMessage,type Mail} from './mail-message';

type GraphToken={accessToken:string;expiresAt:number};
let graphToken:GraphToken|null=null;

function graphConfigured(){
 return Boolean(env.graphTenantId&&env.graphClientId&&env.graphClientSecret&&env.graphSenderUserId);
}
/** Configuration presence only; does not request a token or send a message. */
export function mailConfigured(){return graphConfigured();}

async function getGraphToken(){
 if(graphToken&&graphToken.expiresAt>Date.now()+60_000)return graphToken.accessToken;
 if(!graphConfigured())throw new Error("Microsoft Graph Mail ist nicht vollständig konfiguriert.");
 const body=new URLSearchParams({
  client_id:env.graphClientId!,
  client_secret:env.graphClientSecret!,
  scope:"https://graph.microsoft.com/.default",
  grant_type:"client_credentials",
 });
 const response=await fetch(`https://login.microsoftonline.com/${encodeURIComponent(env.graphTenantId!)}/oauth2/v2.0/token`,{
  method:"POST",
  headers:{"content-type":"application/x-www-form-urlencoded"},
  body,
  cache:"no-store",
  signal:AbortSignal.timeout(20_000),
 });
 if(!response.ok){
  log("error","graph_token_error",{status:response.status});
  throw new Error("Microsoft Graph Authentifizierung für E-Mail ist fehlgeschlagen.");
 }
 const payload=await response.json() as {access_token:string;expires_in?:number};
 graphToken={accessToken:payload.access_token,expiresAt:Date.now()+Math.max(300,Number(payload.expires_in??3600))*1000};
 return graphToken.accessToken;
}

async function sendViaGraph(mail:Mail){
 const message=await renderMailMessage(mail,env.graphSenderUserId!);
 const token=await getGraphToken();
 const response=await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.graphSenderUserId!)}/sendMail`,{
  method:"POST",
  headers:{authorization:`Bearer ${token}`,"content-type":"text/plain"},
  body:message.toString('base64'),
  cache:"no-store",
  signal:AbortSignal.timeout(20_000),
 });
 if(response.status!==202){
  log("error","graph_mail_error",{status:response.status});
  throw new Error("E-Mail konnte nicht über Microsoft Graph versendet werden.");
 }
 return {delivered:true,provider:"microsoft-graph" as const};
}

export async function sendMail(mail:Mail){
 if(!graphConfigured()){
  log("error","graph_mail_not_configured",{appMode:env.appMode});
  if(env.appMode==="production")throw new Error("Microsoft Graph Mail ist produktiv nicht vollständig konfiguriert.");
  return {delivered:false,provider:"none" as const};
 }
 return sendViaGraph(mail);
}

export async function checkGraphMailHealth(){
 const started=performance.now();
 if(!graphConfigured())return {configured:false,ok:false,latencyMs:null};
 try{
  await getGraphToken();
  return {configured:true,ok:true,latencyMs:Math.round(performance.now()-started)};
 }catch{
  return {configured:true,ok:false,latencyMs:Math.round(performance.now()-started)};
 }
}

export function mailLayout(title:string,body:string,cta?:{label:string;url:string},locale:"de"|"en"|"fr"|"it"|"tr"="de",branding?:{name:string}){
 const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
 if(cta&&!/^https?:\/\//i.test(cta.url))throw new Error('Invalid mail action URL');
 const brandName=escape(branding?.name||'BINSO ONE');
 const logo=env.appUrl?`<img src="${escape(new URL('/brand/pwa-icon-192.png',env.appUrl).href)}" alt="Binso One" width="32" height="32" style="vertical-align:middle;border:0;margin-right:10px">`:'';
 const button=cta?`<p style="margin:24px 0"><a class="mail-cta" href="${escape(cta.url)}" style="display:inline-block;background:#2566bd;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${escape(cta.label)}</a></p>`:"";
 return `<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>@media(prefers-color-scheme:dark){.mail-body,.mail-content{background:#17212e!important;color:#f3f6fa!important}.mail-footer{color:#bbc5d2!important}.mail-divider{border-color:#465568!important}.mail-cta{background:#2566bd!important;color:#fff!important}}</style></head><body class="mail-body" style="margin:0;background:#fff;font-family:Arial,sans-serif;color:#263950;font-size:16px;line-height:1.55"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><table class="mail-content" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;color:#263950"><tr><td style="padding:32px 24px"><div style="font-size:16px;font-weight:700;margin-bottom:24px">${branding?brandName:logo+brandName}</div><h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${escape(title)}</h1>${body}${button}<hr class="mail-divider" style="border:0;border-top:1px solid #edf1f6;margin:28px 0 20px"><p class="mail-footer" style="font-size:13px;color:#647080">Binso One · Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell · support@binso.ch</p></td></tr></table></td></tr></table></body></html>`;
}
