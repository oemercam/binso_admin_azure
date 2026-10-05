import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { apiError, json } from "@/lib/server/http";
import { withPlatform } from "@/lib/server/db";
import { getOperationalIntegrationStatus } from "@/lib/server/integrations";

function percentile(values:number[],p:number){
  if(!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return Math.round(sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]*100)/100;
}

export async function GET(){
  const started=performance.now();
  try{const session=await requireOperatorSession();authorizeOperator(session,"platform:read");
    const dbStarted=performance.now();
    const {incidents,vitals,billingEvents}=await withPlatform(async c=>{
      const incidents=await c.query("select id,title,status,started_at,resolved_at,public_message note,'Plattform' service from platform_incidents where status<>'resolved' order by started_at desc limit 100");
      const vitals=await c.query<{metric:string;value:number;rating:string;route:string;created_at:string}>("select metric,value,rating,route,created_at from web_vitals where created_at>=now()-interval '7 days' order by created_at desc limit 2000");
      const billing=await c.query("select external_event_id event_id,event_type,status,processed_at from billing_webhook_events order by received_at desc limit 25");
      return {incidents:incidents.rows,vitals:vitals.rows,billingEvents:billing.rows};
    });
    const databaseLatencyMs=Math.round(performance.now()-dbStarted);
    const integrations=await getOperationalIntegrationStatus();
    const webVitals=Object.fromEntries(["LCP","INP","CLS","TTFB","FCP"].map(metric=>{
      const rows=vitals.filter(item=>item.metric===metric);
      return [metric,{p75:percentile(rows.map(item=>Number(item.value)).filter(Number.isFinite),0.75),samples:rows.length,poor:rows.filter(item=>item.rating==="poor").length}];
    }));
    return json({
      checkedAt:new Date().toISOString(),
      build:{sha:process.env.BINSO_BUILD_SHA??null,node:process.version},
      latencyMs:{api:Math.round(performance.now()-started),database:databaseLatencyMs},
      services:[
        {name:"Web App",status:"operational",detail:"Next.js Anwendung"},
        {name:"API",status:"operational",detail:"Operator API erreichbar"},
        {name:"Datenbank",status:"operational",detail:`Azure PostgreSQL erreichbar · ${databaseLatencyMs} ms`},
        ...integrations.filter(item=>item.key!=="database").map(item=>({name:item.label,status:item.status,detail:item.detail,key:item.key,latencyMs:item.latencyMs})),
      ],
      webVitals,
      billingEvents,
      incidents,
    });
  }catch(error){return apiError(error);}
}
