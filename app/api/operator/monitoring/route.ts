import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";
import { getOperationalIntegrationStatus } from "@/lib/server/integrations";

function percentile(values:number[],p:number){
  if(!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return Math.round(sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]*100)/100;
}

export async function GET(){
  const started=performance.now();
  try{
    const dbStarted=performance.now();
    const [incidents,vitals,billingEvents]=await Promise.all([
      operatorList<Record<string,unknown>>("platform_incidents","id,service,title,status,started_at,resolved_at,note,created_at","order=started_at.desc&limit=100"),
      operatorList<{metric:string;value:number;rating:string;route:string;created_at:string}>("web_vitals","metric,value,rating,route,created_at","created_at=gte."+encodeURIComponent(new Date(Date.now()-7*86400000).toISOString())+"&order=created_at.desc&limit=2000"),
      operatorList<Record<string,unknown>>("billing_events","event_id,event_type,subscription_status,processed_at","order=processed_at.desc&limit=25"),
    ]);
    const databaseLatencyMs=Math.round(performance.now()-dbStarted);
    const integrations=await getOperationalIntegrationStatus();
    const webVitals=Object.fromEntries(["LCP","INP","CLS","TTFB","FCP"].map(metric=>{
      const rows=vitals.filter(item=>item.metric===metric);
      return [metric,{p75:percentile(rows.map(item=>Number(item.value)).filter(Number.isFinite),0.75),samples:rows.length,poor:rows.filter(item=>item.rating==="poor").length}];
    }));
    return json({
      checkedAt:new Date().toISOString(),
      build:{sha:process.env.DEPLOY_SHA??process.env.GITHUB_SHA??null,node:process.version},
      latencyMs:{api:Math.round(performance.now()-started),database:databaseLatencyMs},
      services:[
        {name:"Web App",status:"operational",detail:"Next.js Anwendung"},
        {name:"API",status:"operational",detail:"Operator API erreichbar"},
        {name:"Datenbank",status:"operational",detail:`Supabase erreichbar · ${databaseLatencyMs} ms`},
        ...integrations.map(item=>({name:item.label,status:item.status,detail:item.detail,key:item.key,latencyMs:item.latencyMs})),
      ],
      webVitals,
      billingEvents,
      incidents,
    });
  }catch(error){return apiError(error);}
}
