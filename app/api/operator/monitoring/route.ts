import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";
import { getOperationalIntegrationStatus } from "@/lib/server/integrations";

export async function GET(){
  const started=performance.now();
  try{
    const dbStarted=performance.now();
    const incidents=await operatorList<Record<string,unknown>>("platform_incidents","id,service,title,status,started_at,resolved_at,note,created_at","order=started_at.desc&limit=100");
    const databaseLatencyMs=Math.round(performance.now()-dbStarted);
    const integrations=await getOperationalIntegrationStatus();
    return json({
      checkedAt:new Date().toISOString(),
      latencyMs:{api:Math.round(performance.now()-started),database:databaseLatencyMs},
      services:[
        {name:"Web App",status:"operational",detail:"Next.js Anwendung"},
        {name:"API",status:"operational",detail:"Operator API erreichbar"},
        {name:"Datenbank",status:"operational",detail:`Supabase erreichbar · ${databaseLatencyMs} ms`},
        ...integrations.map(item=>({name:item.label,status:item.status,detail:item.detail,key:item.key})),
      ],
      incidents,
    });
  }catch(error){return apiError(error);}
}
