export type IntegrationStatus = {
  key:"database"|"storage"|"billing"|"email"|"banking"|"swiss_qr";
  label:string;
  configured:boolean;
  status:"operational"|"degraded"|"configured"|"not_connected"|"not_implemented";
  detail:string;
};

export function getIntegrationStatus():IntegrationStatus[] {
  const supabase=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const stripe=Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.STRIPE_PRICE_START&&process.env.STRIPE_PRICE_BUSINESS&&process.env.STRIPE_PRICE_PRO);
  const email=Boolean(process.env.RESEND_API_KEY&&process.env.BINSO_EMAIL_FROM);
  return [
    {key:"database",label:"Datenbank",configured:supabase,status:supabase?"operational":"not_connected",detail:supabase?"Supabase PostgreSQL konfiguriert":"Supabase nicht konfiguriert"},
    {key:"storage",label:"Dateispeicher",configured:supabase,status:supabase?"configured":"not_connected",detail:supabase?"Private Supabase-Storage-Pfade vorbereitet":"Supabase nicht konfiguriert"},
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
