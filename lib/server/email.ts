import { ApiError } from "./http";

type SendEmailInput={
  to:string|string[];
  subject:string;
  html:string;
  text?:string;
  replyTo?:string;
  idempotencyKey?:string;
};

export function isEmailConfigured(){
  return Boolean(process.env.RESEND_API_KEY&&process.env.BINSO_EMAIL_FROM);
}

export async function sendEmail(input:SendEmailInput){
  const key=process.env.RESEND_API_KEY;
  const from=process.env.BINSO_EMAIL_FROM;
  if(!key||!from) throw new ApiError(503,"email_not_configured","E-Mail-Versand ist noch nicht konfiguriert.");
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      Authorization:"Bearer "+key,
      "Content-Type":"application/json",
      ...(input.idempotencyKey?{"Idempotency-Key":input.idempotencyKey.slice(0,256)}:{}),
    },
    body:JSON.stringify({
      from,
      to:Array.isArray(input.to)?input.to:[input.to],
      subject:input.subject,
      html:input.html,
      ...(input.text?{text:input.text}:{}),
      ...(input.replyTo?{reply_to:input.replyTo}:{}),
    }),
    cache:"no-store",
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    console.error("Resend request failed",response.status,typeof payload?.name==="string"?payload.name:"unknown");
    throw new ApiError(502,"email_provider_error","E-Mail konnte nicht versendet werden.");
  }
  return payload as {id?:string};
}
