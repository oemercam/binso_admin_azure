export type IntegrationStatus = {
  key:"database"|"storage"|"billing"|"email"|"banking"|"swiss_qr";
  label:string;
  configured:boolean;
  status:"operational"|"configured"|"not_connected"|"not_implemented";
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
