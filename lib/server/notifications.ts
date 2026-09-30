import "server-only";
import type {PoolClient} from "pg";

const allowedKinds=new Set(["support","account","approval","billing","system"]);
export async function createNotification(client:PoolClient,input:{organizationId:string;userId?:string|null;kind:string;title:string;message:string;href?:string|null}){
 const kind=allowedKinds.has(input.kind)?input.kind:"system";
 await client.query(
   `insert into in_app_notifications(organization_id,user_id,kind,title,body,href)
    values($1,$2,$3,$4,$5,$6)`,
   [input.organizationId,input.userId||null,kind,input.title,input.message,input.href||null]
 );
}
