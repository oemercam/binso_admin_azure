import "server-only";
import {env} from "@/lib/server/env";
import {log} from "@/lib/server/logger";

type Mail={to:string;subject:string;html:string;text:string};
export async function sendMail(mail:Mail){
 if(!env.resendApiKey){log("info","email_skipped_not_configured",{toDomain:mail.to.split("@")[1],subject:mail.subject});return {delivered:false,provider:"none" as const}}
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${env.resendApiKey}`,"content-type":"application/json"},body:JSON.stringify({from:env.emailFrom,to:[mail.to],subject:mail.subject,html:mail.html,text:mail.text}),cache:"no-store"});
 if(!response.ok){const body=await response.text();log("error","email_provider_error",{status:response.status,body:body.slice(0,300)});throw new Error("E-Mail konnte nicht versendet werden.")}
 return {delivered:true,provider:"resend" as const};
}
export function mailLayout(title:string,body:string,cta?:{label:string;url:string}){
 const button=cta?`<p style="margin:28px 0"><a href="${cta.url}" style="background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">${cta.label}</a></p>`:"";
 return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111;line-height:1.55"><div style="max-width:620px;margin:auto;padding:32px"><h1 style="font-size:24px">${title}</h1>${body}${button}<hr style="border:0;border-top:1px solid #ddd;margin:32px 0"><small>Binso One · Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell</small></div></body></html>`;
}
