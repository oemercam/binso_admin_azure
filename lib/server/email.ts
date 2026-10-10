import "server-only";
import {env} from "@/lib/server/env";
import {log} from "@/lib/server/logger";

type Mail={to:string;subject:string;html:string;text:string;attachments?:Array<{name:string;contentType:string;content:Buffer}>};

type GraphToken={accessToken:string;expiresAt:number};
let graphToken:GraphToken|null=null;

function graphConfigured(){
 return Boolean(env.graphTenantId&&env.graphClientId&&env.graphClientSecret&&env.graphSenderUserId);
}

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
  const detail=(await response.text()).slice(0,300);
  log("error","graph_token_error",{status:response.status,detail});
  throw new Error("Microsoft Graph Authentifizierung für E-Mail ist fehlgeschlagen.");
 }
 const payload=await response.json() as {access_token:string;expires_in?:number};
 graphToken={accessToken:payload.access_token,expiresAt:Date.now()+Math.max(300,Number(payload.expires_in??3600))*1000};
 return graphToken.accessToken;
}

async function sendViaGraph(mail:Mail){
 const token=await getGraphToken();
 const response=await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.graphSenderUserId!)}/sendMail`,{
  method:"POST",
  headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
  body:JSON.stringify({
   message:{
    subject:mail.subject,
    body:{contentType:"HTML",content:mail.html},
    toRecipients:[{emailAddress:{address:mail.to}}],
    attachments:mail.attachments?.map(a=>({"@odata.type":"#microsoft.graph.fileAttachment",name:a.name,contentType:a.contentType,contentBytes:a.content.toString("base64")})),
   },
   saveToSentItems:true,
  }),
  cache:"no-store",
  signal:AbortSignal.timeout(20_000),
 });
 if(!response.ok){
  const detail=(await response.text()).slice(0,300);
  log("error","graph_mail_error",{status:response.status,detail,toDomain:mail.to.split("@")[1]});
  throw new Error("E-Mail konnte nicht über Microsoft Graph versendet werden.");
 }
 return {delivered:true,provider:"microsoft-graph" as const};
}

export async function sendMail(mail:Mail){
 if(!graphConfigured()){
  log("error","graph_mail_not_configured",{toDomain:mail.to.split("@")[1],subject:mail.subject,appMode:env.appMode});
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

export function mailLayout(title:string,body:string,cta?:{label:string;url:string},locale:"de"|"en"|"fr"|"it"|"tr"="de"){
 const button=cta?`<p style="margin:28px 0"><a href="${cta.url}" style="background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">${cta.label}</a></p>`:"";
 return `<!doctype html><html lang="${locale}"><body style="margin:0;background:#fff;font-family:Arial,sans-serif;color:#111;line-height:1.55"><div style="max-width:620px;margin:auto;padding:40px 28px"><div style="font-size:13px;font-weight:800;letter-spacing:.12em;margin-bottom:30px">BINSO ONE</div><h1 style="margin:0 0 16px;font-size:24px;line-height:1.15">${title}</h1>${body}${button}<hr style="border:0;border-top:1px solid #ddd;margin:34px 0 20px"><small style="color:#666">Binso One · Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell · support@binso.ch</small></div></body></html>`;
}
