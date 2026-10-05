import {env} from "./env";
import {checkGraphMailHealth} from "./email";

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
  const externalBlob=Boolean(env.azureStorageAccount&&(env.azureStorageSas||(process.env.IDENTITY_ENDPOINT&&process.env.IDENTITY_HEADER)));
  const stripe=Boolean(env.stripeSecretKey&&env.stripeWebhookSecret&&Object.values(env.stripePrices).some(cycles=>cycles.monthly||cycles.yearly));
  const email=graphConfigured();

  return [
    {key:"database",label:"Datenbank",configured:database,status:database?"configured":"not_connected",detail:database?"Azure PostgreSQL konfiguriert":"Azure PostgreSQL nicht konfiguriert"},
    {key:"storage",label:"Dateispeicher",configured:database,status:database?"configured":"not_connected",detail:database?(externalBlob?"PostgreSQL-Dateispeicher aktiv · Azure Blob Storage angebunden":"PostgreSQL-Dateispeicher aktiv · Azure Blob Storage optional"):"Dateispeicher benötigt Azure PostgreSQL"},
    {key:"billing",label:"Zahlungsabwicklung",configured:stripe,status:stripe?"configured":"not_connected",detail:stripe?"Stripe Checkout, Portal und Webhook konfiguriert":"Stripe-Umgebungsvariablen fehlen"},
    {key:"email",label:"E-Mail Service",configured:email,status:email?"configured":"not_connected",detail:email?"Microsoft Graph / Microsoft 365 konfiguriert":"Microsoft Graph ist nicht vollständig konfiguriert"},
    {key:"banking",label:"Bankanbindung",configured:false,status:"not_implemented",detail:"Keine Bank-Synchronisation implementiert"},
    {key:"swiss_qr",label:"Swiss QR",configured:true,status:"operational",detail:"Swiss QR-Zahlteil wird lokal mit swissqrbill erzeugt"},
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
      const health=await providerReachable("https://api.stripe.com/v1/account","Bearer "+env.stripeSecretKey);
      return {...item,status:health.ok?"operational" as const:"degraded" as const,detail:health.ok?`Stripe erreichbar · ${health.latencyMs} ms`:"Stripe aktuell nicht erreichbar",latencyMs:health.latencyMs};
    }
    if(item.key==="email"){
      const health=await checkGraphMailHealth();
      if(!health.configured)return {...item,latencyMs:null};
      return {...item,status:health.ok?"operational" as const:"degraded" as const,detail:health.ok?`Microsoft Graph Authentifizierung erfolgreich · ${health.latencyMs} ms`:"Microsoft Graph Authentifizierung fehlgeschlagen",latencyMs:health.latencyMs};
    }
    return {...item,latencyMs:null};
  }));
  return checks;
}
