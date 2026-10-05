import {env} from "./env";

export type IntegrationStatus = {
  key:"database"|"storage"|"billing"|"email"|"banking"|"swiss_qr";
  label:string;
  configured:boolean;
  status:"operational"|"degraded"|"configured"|"not_connected"|"not_implemented";
  detail:string;
};

function graphConfigured(){
  return Boolean(env.graphTenantId&&env.graphClientId&&env.graphClientSecret&&env.graphSenderUserId);
}

export function getIntegrationStatus():IntegrationStatus[] {
  const database=Boolean(env.databaseUrl);
  const storage=Boolean(env.azureStorageAccount&&(env.azureStorageSas||(process.env.IDENTITY_ENDPOINT&&process.env.IDENTITY_HEADER)));
  const stripe=Boolean(env.stripeSecretKey&&env.stripeWebhookSecret&&Object.values(env.stripePrices).some(cycles=>cycles.monthly||cycles.yearly));
  const email=graphConfigured();

  return [
    {key:"database",label:"Datenbank",configured:database,status:database?"configured":"not_connected",detail:database?"Azure PostgreSQL konfiguriert":"Azure PostgreSQL nicht konfiguriert"},
    {key:"storage",label:"Dateispeicher",configured:storage,status:storage?"configured":"not_connected",detail:storage?"Azure Blob Storage konfiguriert":"Azure Blob Storage nicht konfiguriert"},
    {key:"billing",label:"Zahlungsabwicklung",configured:stripe,status:stripe?"configured":"not_connected",detail:stripe?"Stripe Checkout, Portal und Webhook konfiguriert":"Stripe-Konfiguration unvollständig"},
    {key:"email",label:"E-Mail Service",configured:email,status:email?"configured":"not_connected",detail:email?"Microsoft Graph / Microsoft 365 konfiguriert":"Microsoft Graph Mail nicht vollständig konfiguriert"},
    {key:"banking",label:"Bankanbindung",configured:false,status:"not_implemented",detail:"Keine direkte Bankanbindung aktiviert"},
    {key:"swiss_qr",label:"Swiss QR",configured:true,status:"operational",detail:"Swiss QR-Rechnung ist in Binso One integriert"},
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

async function graphAuthenticationReachable(){
  const started=performance.now();
  if(!graphConfigured())return {ok:false,latencyMs:0};
  try{
    const body=new URLSearchParams({
      client_id:env.graphClientId!,
      client_secret:env.graphClientSecret!,
      scope:"https://graph.microsoft.com/.default",
      grant_type:"client_credentials",
    });
    const response=await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(env.graphTenantId!)}/oauth2/v2.0/token`,
      {method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body,cache:"no-store",signal:AbortSignal.timeout(4000)}
    );
    return {ok:response.ok,latencyMs:Math.round(performance.now()-started)};
  }catch{
    return {ok:false,latencyMs:Math.round(performance.now()-started)};
  }
}

export async function getOperationalIntegrationStatus(){
  const base=getIntegrationStatus();
  return Promise.all(base.map(async item=>{
    if(item.key==="billing"&&item.configured){
      const health=await providerReachable("https://api.stripe.com/v1/account","Bearer "+env.stripeSecretKey);
      return {...item,status:health.ok?"operational" as const:"degraded" as const,detail:health.ok?`Stripe erreichbar · ${health.latencyMs} ms`:"Stripe aktuell nicht erreichbar",latencyMs:health.latencyMs};
    }
    if(item.key==="email"&&item.configured){
      const health=await graphAuthenticationReachable();
      return {...item,status:health.ok?"operational" as const:"degraded" as const,detail:health.ok?`Microsoft Graph Authentifizierung erreichbar · ${health.latencyMs} ms`:"Microsoft Graph Authentifizierung aktuell nicht erreichbar",latencyMs:health.latencyMs};
    }
    return {...item,latencyMs:null};
  }));
}
