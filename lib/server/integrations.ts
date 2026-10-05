import {env} from './env';
export type IntegrationStatus = {
  key:"database"|"storage"|"billing"|"email"|"banking"|"swiss_qr";
  label:string;
  configured:boolean;
  status:"operational"|"degraded"|"configured"|"not_connected"|"not_implemented";
  detail:string;
};

export function getIntegrationStatus():IntegrationStatus[] {
  const database=Boolean(process.env.DATABASE_URL);
  const storage=Boolean(process.env.AZURE_STORAGE_ACCOUNT&&(process.env.AZURE_STORAGE_SAS||(process.env.IDENTITY_ENDPOINT&&process.env.IDENTITY_HEADER)));
  const stripe=Boolean(env.stripeSecretKey&&env.stripeWebhookSecret&&Object.values(env.stripePrices).some(cycles=>cycles.monthly||cycles.yearly));
  const email=Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM);
  return [
    {key:"database",label:"Datenbank",configured:database,status:database?"configured":"not_connected",detail:database?"Azure PostgreSQL konfiguriert":"Azure PostgreSQL nicht konfiguriert"},
    {key:"storage",label:"Dateispeicher",configured:storage,status:storage?"configured":"not_connected",detail:storage?"Azure Blob Storage konfiguriert":"Azure Blob Storage nicht konfiguriert"},
    {key:"billing",label:"Zahlungsabwicklung",configured:stripe,status:stripe?"configured":"not_connected",detail:stripe?"Stripe Checkout, Portal und Webhook konfiguriert":"Stripe-Umgebungsvariablen fehlen"},
    {key:"email",label:"E-Mail Service",configured:email,status:email?"configured":"not_connected",detail:email?"Resend ist konfiguriert":"Resend ist nicht konfiguriert"},
    {key:"banking",label:"Bankanbindung",configured:false,status:"not_implemented",detail:"Noch kein Bankprovider verbunden"},
    {key:"swiss_qr",label:"Swiss QR",configured:false,status:"not_implemented",detail:"Normkonforme QR-Erzeugung noch nicht produktiv implementiert"},
  ];
}


async function providerReachable(url:string,authorization:string){
  const started=performance.now();
  try{
    const response=await fetch(url,{headers:{Authorization:authorization},cache:"no-store",signal:AbortSignal.timeout(4000)});
    return {ok:response.ok,latencyMs:Math.round(performance.now()-started)};
  }catch{
    return {ok:false,latencyMs:Math.round(performance.now()-started)};
  }
}

export async function getOperationalIntegrationStatus(){
  const base=getIntegrationStatus();
  const checks=await Promise.all(base.map(async item=>{
    if(item.key==="billing"&&item.configured){
      const health=await providerReachable("https://api.stripe.com/v1/account","Bearer "+process.env.STRIPE_SECRET_KEY);
      return {...item,status:health.ok?"operational" as const:"degraded" as const,detail:health.ok?`Stripe erreichbar · ${health.latencyMs} ms`:"Stripe aktuell nicht erreichbar",latencyMs:health.latencyMs};
    }
    if(item.key==="email"&&item.configured){
      const health=await providerReachable("https://api.resend.com/domains","Bearer "+process.env.RESEND_API_KEY);
      return {...item,status:health.ok?"operational" as const:"degraded" as const,detail:health.ok?`Resend erreichbar · ${health.latencyMs} ms`:"Resend aktuell nicht erreichbar",latencyMs:health.latencyMs};
    }
    return {...item,latencyMs:null};
  }));
  return checks;
}
