import {NextResponse} from "next/server";
import {query} from "@/lib/server/db";
import {env} from "@/lib/server/env";

export const dynamic="force-dynamic";

function graphReady(){
  return Boolean(env.graphTenantId&&env.graphClientId&&env.graphClientSecret&&env.graphSenderUserId);
}
function stripeReady(){
  return Boolean(
    env.stripeSecretKey&&
    env.stripeWebhookSecret&&
    env.stripePrices.start.monthly&&
    env.stripePrices.start.yearly&&
    env.stripePrices.business.monthly&&
    env.stripePrices.business.yearly&&
    env.stripePrices.pro.monthly&&
    env.stripePrices.pro.yearly
  );
}

export async function GET(){
  let databaseReady=false;
  try{
    await query("select 1");
    databaseReady=true;
  }catch{
    databaseReady=false;
  }

  const checks={
    database:databaseReady,
    encryption:Boolean(env.appEncryptionKey),
    microsoftGraphMail:graphReady(),
    stripeConfiguration:stripeReady()
  };
  const ready=Object.values(checks).every(Boolean);

  return NextResponse.json(
    env.appMode==="production"?{status:ready?"ready":"not_ready"}:{status:ready?"ready":"not_ready",checks},
    {status:ready?200:503,headers:{"Cache-Control":"no-store"}}
  );
}
